# 🚀 URL Shortener + Distributed Analytics Platform

A scalable, production-style URL Shortener system built with **Node.js, Express, MongoDB, Redis, and BullMQ**, featuring real-time analytics, background processing, caching, and rate-limiting.

---

## 📌 Live Architecture

```
Client
   ↓
Express API Layer
   ↓
Redis Cache + Rate Limiter + Logging
   ↓
Business Logic Layer (URL + Analytics Services)
   ↓
MongoDB (Source of Truth)
   ↓
BullMQ Queue (Event Streaming)
   ↓
Background Workers (Analytics Processing)
```

---

## ⚙️ Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)

### Performance & Scaling

* Redis (Caching + Rate Limiting + Counters)
* BullMQ (Background Job Processing)

### Analytics

* Device detection (`ua-parser-js`)
* Geo location (`geoip-lite`)
* Aggregation pipelines (MongoDB)

### Dev Tools

* Nodemon
* Postman
* dotenv

---

## ✨ Features

### 🔗 URL Shortener

* Generate short URLs using `nanoid`
* Custom alias support
* Expiry-based URLs
* Redirect to original URL

---

### ⚡ High Performance Layer

* Redis caching for fast redirects
* Distributed click counter using Redis INCR
* Cache hit/miss optimization

---

### 📊 Advanced Analytics System

* Total clicks tracking
* Device analytics (browser, OS, device type)
* Geo analytics (country, city)
* Real-time analytics ingestion via BullMQ
* Aggregated analytics dashboard API

---

### 📈 Analytics APIs

* Raw click analytics
* Summary analytics
* Daily click trends
* Top countries, browsers, devices

---

### 🚦 Rate Limiting & Anti-Abuse System

* Global API rate limiting (Redis-backed)
* Per-short URL rate limiting
* IP-based abuse detection
* Temporary IP blocking on suspicious activity

---

### 🧠 Background Processing (BullMQ)

* Async analytics processing
* Non-blocking request flow
* Retry + backoff strategies
* Worker-based architecture

---

## 📡 API Endpoints

### 🔗 URL APIs

#### Create Short URL

```http
POST /url
```

**Body:**

```json
{
  "url": "https://google.com",
  "customAlias": "google",
  "expiresInDays": 7
}
```

---

#### Redirect URL

```http
GET /:shortId
```

Redirects to original URL (with analytics tracking)

---

## 📊 Analytics APIs

### Get Full Analytics

```http
GET /analytics/:shortId
```

---

### Get Analytics Summary

```http
GET /analytics/:shortId/summary
```

Returns:

```json
{
  "shortId": "abc123",
  "totalClicks": 120,
  "uniqueCountries": 5,
  "uniqueBrowsers": 3,
  "uniqueDevices": 2,
  "topCountries": [],
  "topBrowsers": [],
  "topDevices": []
}
```

---

### Get Daily Trends

```http
GET /analytics/:shortId/trends
```

---

## 🧠 System Design Highlights

### 🔴 Caching Strategy

* Redis stores hot URLs
* Reduces DB reads significantly
* Cache-aside pattern

### 🔴 Queue-Based Analytics

* Click events pushed to BullMQ
* Worker processes asynchronously
* Prevents request blocking

### 🔴 Rate Limiting Strategy

* Global API protection
* Per-URL abuse prevention
* IP-based blocking system

### 🔴 Data Modeling Strategy

* MongoDB as source of truth
* Analytics stored as event logs
* Aggregation used for dashboards

---

## 📦 Project Structure

```
src/
├── config/
├── controllers/
├── services/
├── repositories/
├── models/
├── routes/
├── middleware/
├── utils/
├── workers/
├── queues/
├── app.js
└── server.js
```

---

## 🚀 How to Run Locally

### 1. Clone Repo

```bash
git clone <repo-url>
cd url-shortener
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Redis

```bash
redis-server
```

### 4. Start MongoDB

```bash
mongod
```

### 5. Run Server

```bash
npm run dev
```

### 6. Run Worker

```bash
npm run worker
```

---

## 🔥 Environment Variables

```env
PORT=8001
MONGO_URI=mongodb://localhost:27017/short-url
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📊 What This Project Demonstrates

This project showcases:

* Scalable backend architecture
* Event-driven systems
* Distributed caching
* Queue-based processing
* Real-time analytics pipeline
* Rate limiting and abuse prevention
* Clean architecture design (Controller → Service → Repository)

---

## 🧠 Future Improvements

* Docker Compose setup
* Kubernetes deployment
* Prometheus + Grafana monitoring
* JWT authentication layer
* Multi-region Redis clustering
* Clickstream real-time dashboard (WebSockets)

---

                   ┌──────────────┐
                   │   Client     │
                   └──────┬───────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Express API    │
                 └──────┬──────────┘
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
 ┌────────────┐  ┌────────────┐  ┌──────────────┐
 │ Redis Cache│  │ Rate Limit │  │ Logging      │
 └────┬───────┘  └────┬───────┘  └────┬─────────┘
      │               │               │
      ▼               ▼               ▼

 ┌──────────────────────────────┐
 │       Business Logic         │
 │ (URL + Analytics Service)    │
 └────────────┬─────────────────┘
              ▼
     ┌───────────────────┐
     │    MongoDB        │
     │ (Source of Truth) │
     └────────┬──────────┘
              ▼
     ┌───────────────────┐
     │   BullMQ Queue    │
     └────────┬──────────┘
              ▼
     ┌───────────────────┐
     │ Background Worker │
     │ Analytics System  │
     └───────────────────┘

---

## 👨‍💻 Author

**Backend Engineer (MERN + System Design Focus)**
Built as a production-grade system design project.

---
