# URL Shortener & Analytics Platform

A URL shortener that doesn't just redirect — it tracks every click,
enriches it with device/browser/geo data in the background, and exposes
that as queryable analytics. This repo is two things:

1. **`backend/`** — the Express/MongoDB/Redis/BullMQ API and workers.
2. **`frontend/`** — a React console that consumes every backend endpoint,
   built specifically to make the API's behavior visible (each panel can
   show you the raw JSON alongside the rendered view).

This README explains what the platform actually does and _how_, end to
end. It's written from having gone through the code, not just the
feature list — where something is a stated goal but isn't wired up yet,
or where there's a real limitation, that's called out rather than glossed
over.

---

## What it does

- Turns a long URL into a short one, with an optional custom alias and an
  optional expiry (in days).
- Redirects short links to their destination, fast — reads come from
  Redis, not Mongo, on the hot path.
- Records every redirect as a click event and processes it **off the
  request path**, so the person clicking the link never waits on
  analytics work.
- Enriches each click with browser, OS, device type (from the
  `User-Agent` header) and country/city (from the IP, via a local GeoIP
  database — no external API call).
- Serves analytics per short URL: a paginated raw event log, a
  summary (top countries/browsers/devices, unique counts), daily click
  trends (last 7 days), and hourly click trends (0–23, all-time).
- Serves a platform-wide dashboard: total/active/expired URL counts,
  total clicks, and a top-10 leaderboard.
- Rate-limits redirects per IP per short URL, rate-limits the whole API
  globally, and temporarily blocks IPs that hammer the API.
- Automatically deletes expired URLs on a schedule.
- Exposes Prometheus-format metrics at `/metrics`.

## What it's _not_ (yet)

Being upfront about gaps, since this matters if you're using this repo to
practice explaining system design trade-offs:

- **No auth.** Anyone can create, and anyone can read any short URL's
  analytics — there's no user/account model or ownership check anywhere
  in the code.
- **Bull Board isn't actually mounted.** `@bull-board/express` is a
  dependency and gets referenced in feature lists, but nothing in
  `app.js` wires it up — there's no `/admin/queues` route in the code as
  it stands.
- **Redis connections for BullMQ are hardcoded** to `localhost:6379` in
  `queues/analytics.queue.js` and `workers/analytics.worker.js`, while
  the rest of the app reads `REDIS_URL` from the environment. This works
  fine locally but will silently fail to connect in Docker/production
  unless you patch it to use the same config.
- **No horizontal scaling story yet** — one API process, one worker
  process, no leader election or partitioning if you ran multiple
  instances of either.

---

## Architecture

```
                        ┌────────────┐
                        │  Frontend  │  (React console, Vite dev server)
                        └─────┬──────┘
                              │ HTTP (CORS-enabled)
                              ▼
                        ┌────────────┐
                        │ Express API│  :8001
                        └──┬──────┬──┘
              cache/lookup │      │ publish click event
                            ▼      ▼
                    ┌──────────┐ ┌────────────┐
                    │  Redis   │ │   BullMQ    │
                    │ (cache + │ │  "analytics"│
                    │ counters)│ │    queue    │
                    └────┬─────┘ └──────┬──────┘
                         │              │
                         │              ▼
                         │      ┌───────────────┐
                         │      │ Analytics      │
                         │      │ Worker process │
                         │      └───────┬────────┘
                         ▼              ▼
                    ┌──────────────────────┐
                    │       MongoDB         │
                    │  URL / Analytics      │
                    └──────────────────────┘

     Also running in the background, independently:
     - Counter worker: flushes Redis click counts → MongoDB, every 30s
     - Cleanup worker: deletes expired URLs from Mongo + cache, hourly
```

---

## How each part works

### 1. Creating a short URL

`POST /api/url` → `url.controllers.js` → `url.services.js`.

- If you didn't pass `customAlias`, the service generates an 8-character
  id with `nanoid`.
- It checks Mongo for a collision on that id/alias and rejects the
  request if it's taken.
- If `expiresInDays` was given, it computes an absolute `expiresAt` date
  now, rather than storing the raw day count — so nothing needs to
  recompute expiry later.
- It writes the `URL` document to MongoDB, **then immediately writes the
  same data into Redis** as `{ redirectUrl, expiresAt }`, keyed by
  `shortId`. This means the very first redirect for a brand-new link is
  already a cache hit — there's no "cold" first request that has to hit
  Mongo.

### 2. Redirecting

`GET /api/:shortId` (behind `urlRateLimiter`) → `redirectToOriginal`.

- Look up `shortId` in Redis first. Cache miss → read Mongo, then backfill
  the cache so the _next_ request is fast.
- If `expiresAt` is set and in the past, respond with an error instead of
  redirecting (the actual deletion happens later, via the cleanup
  worker — expiry is checked on read, not enforced by deleting eagerly).
- On a successful hit: increment a Prometheus counter, `INCR` a Redis key
  `clicks:{shortId}` (this is the fast, durable-enough click count used
  everywhere in analytics responses), and **fire-and-forget** a BullMQ
  job with the raw `{ shortId, ip, userAgent }` — the redirect response
  is sent without waiting for that job to be picked up.

### 3. Turning a click into analytics

A separate Node process, `workers/analytics.worker.js`, run via
`npm run worker`, subscribes to the `analytics` queue.

- For each job: parses the `User-Agent` string into browser/OS/device
  type (`ua-parser-js`), and looks up the IP in a local MaxMind-derived
  GeoIP database (`geoip-lite`) for country/city — no network call, no
  external rate limits, but also no IPv6/precision guarantees you'd get
  from a hosted geo API.
- Writes one `Analytics` document per click to MongoDB.
- Invalidates the three Redis analytics caches for that `shortId`
  (`summary:`, `trends:`, `hourly:`) so the next analytics read
  recomputes fresh data instead of serving something stale from before
  this click.
- Jobs retry up to 5 times with exponential backoff if they throw
  (configured when the job is queued, in `url.services.js`).

### 4. Why clicks don't hit MongoDB directly

Redis `INCR` is cheap and atomic; a MongoDB `$inc` write on every single
click is not, at scale. So:

- Every redirect does a Redis `INCR` on `clicks:{shortId}` — O(1), no
  disk write, no lock contention.
- `workers/counter.worker.js` runs a `setInterval` every 30 seconds,
  scans Redis for `clicks:*` keys, and does one batched `$inc` write to
  MongoDB per key, then deletes the Redis key once the Mongo write
  succeeds.
- Every place that reports `totalClicks` (analytics summary, trends,
  dashboard) **adds the live Redis count to Mongo's stored count** — so
  the number you see is always current, even in the up-to-30-second
  window before the counter worker has flushed.

### 5. Cleanup

`workers/cleanup.worker.js` runs once on startup and then every hour: it
finds URLs whose `expiresAt` is more than an hour in the past, deletes
their Redis cache entry, then deletes them from Mongo. There's also a
MongoDB TTL index (`expireAfterSeconds: 3600`) on `expiresAt` as a second,
independent safety net — either mechanism alone would eventually clean up
expired links.

### 6. Rate limiting & abuse protection

Three separate layers, each doing a different job:

| Layer               | Scope          | Limit                                                          | Where                                                |
| ------------------- | -------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| `globalRateLimiter` | every request  | 100 req/min, per IP (via `express-rate-limit` + a Redis store) | applied in `server.js`, after DB connections succeed |
| `abuseProtection`   | every request  | 100 req/min triggers a 10-minute IP block                      | applied first, in `app.js`                           |
| `urlRateLimiter`    | redirects only | 20 req/min per IP _per short URL_                              | applied only on the `GET /:shortId` route            |

### 7. The frontend console

The `frontend/` app is a plain Vite + React SPA, no server-side rendering
— it's a client that calls the same `/api` routes you would from
Postman. Three pages: create a URL, explore one short URL's analytics
across all four analytics endpoints (with charts via Recharts), and a
platform-wide dashboard. Every panel has a collapsible "raw response"
drawer showing exactly what JSON the backend returned for that panel —
the intent is that using the tool also teaches you the API's shape.

---

## API reference

Base path for everything except `/metrics` is `/api`.

| Method | Path                                | Purpose                                               |
| ------ | ----------------------------------- | ----------------------------------------------------- |
| `POST` | `/url`                              | Create a short URL                                    |
| `GET`  | `/:shortId`                         | Redirect to the original URL (rate-limited)           |
| `GET`  | `/analytics/:shortId`               | Paginated raw click records                           |
| `GET`  | `/analytics/:shortId/summary`       | Top countries/browsers/devices + unique counts        |
| `GET`  | `/analytics/:shortId/trends`        | Daily click counts, last 7 days                       |
| `GET`  | `/analytics/:shortId/hourly-trends` | Click counts by hour-of-day, all-time                 |
| `GET`  | `/analytics/:shortId/dashboard`     | Summary + trends + hourly, combined into one response |
| `GET`  | `/dashboard`                        | Platform-wide stats (all URLs)                        |
| `GET`  | `/metrics` _(not under `/api`)_     | Prometheus metrics                                    |

---

## Running it locally

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=8001
MONGO_URI=mongodb://localhost:27017/url-shortener
REDIS_URL=redis://localhost:6379
```

You need MongoDB and Redis running locally (or via
`docker-compose up mongo redis`). Then, in separate terminals:

```bash
npm run dev              # API server on :8001
npm run worker           # processes analytics events — clicks won't get
                          # enriched without this running
npm run counter-worker   # optional: flushes Redis click counts into Mongo
npm run cleanup           # optional: deletes expired URLs
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

It calls `http://localhost:8001` by default. Copy `.env.example` to
`.env` and set `VITE_API_BASE_URL` if your backend runs elsewhere.

---

## Tech stack

**Backend:** Node.js, Express, MongoDB (Mongoose), Redis, BullMQ,
`ua-parser-js`, `geoip-lite`, `express-rate-limit`, `prom-client`,
Winston, Docker.

**Frontend:** React, Vite, React Router, Axios, Recharts.
