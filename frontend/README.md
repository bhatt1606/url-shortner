# URL Shortener — Console (frontend)

A small React + Vite app that consumes every endpoint of the `url-shortner`
backend. It's built as a learning tool as much as a UI: each panel shows the
normal rendered view, and you can click "View raw response" underneath it
to see the exact JSON the backend sent back.

## Pages

- **Create URL** (`/`) → `POST /api/url`
- **Analytics Explorer** (`/explorer`) → `GET /api/analytics/:shortId`,
  `/summary`, `/trends`, `/hourly-trends`
- **System Dashboard** (`/system`) → `GET /api/dashboard`

## Run it

This assumes you've already got the backend running (API + at least the
analytics worker, so click events actually get processed):

```bash
# in backend/
npm install
npm run dev        # starts the API on :8001
npm run worker      # in another terminal — processes analytics events
npm run counter-worker  # optional — flushes Redis click counts into Mongo
```

Then, in this folder:

```bash
npm install
npm run dev
```

Vite will serve it on `http://localhost:5173`. It talks to the backend at
`http://localhost:8001` by default — copy `.env.example` to `.env` and set
`VITE_API_BASE_URL` if yours runs elsewhere.

## Notes

- The backend's `app.js` now has `cors()` enabled — needed for a frontend
  on a different port to call it. Make sure you've pulled that change and
  run `npm install` in the backend too (the `cors` package was added to
  `package.json`).
- The sidebar's "backend reachable" indicator pings `/metrics` on load —
  that's the Prometheus endpoint `app.js` exposes outside the `/api`
  router, so it doesn't depend on Mongo/Redis being connected to respond.
- Redirect testing ("Visit" button after creating a URL) opens the real
  backend redirect endpoint in a new tab, since a 302 redirect can't be
  meaningfully shown inside the app itself.
