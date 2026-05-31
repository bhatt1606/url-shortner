# 🚀 URL Shortener & Analytics Platform

A production-grade URL Shortener built with Node.js, MongoDB, Redis, BullMQ, and Docker.

This project goes beyond simple URL shortening and demonstrates scalable backend architecture, asynchronous event processing, distributed caching, analytics aggregation, and cloud-ready deployment patterns.

---

# Features

## Core Features

- Generate short URLs
- Custom aliases
- URL expiration support
- Redirect handling
- Click tracking

---

## Analytics Platform

- Device Analytics
- Browser Analytics
- OS Analytics
- Geo Analytics
- Daily Click Trends
- Top Countries
- Top Browsers
- Top Devices
- Analytics Summary Dashboard

---

## Scalability Features

- Redis Caching
- Redis Distributed Counters
- BullMQ Queue Processing
- Background Analytics Workers
- Rate Limiting
- Async Event Processing
- Aggregation Pipelines
- Dockerized Services

---

# Tech Stack

## Backend

- Node.js
- Express.js

## Database

- MongoDB

## Cache Layer

- Redis

## Queue Processing

- BullMQ

## Containerization

- Docker
- Docker Compose

## Documentation

- Swagger

---

# System Architecture

```text
                ┌───────────────┐
                │    Client     │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ Express API   │
                └───────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        │                               │
        ▼                               ▼

 ┌───────────────┐              ┌───────────────┐
 │ Redis Cache   │              │   MongoDB     │
 └───────────────┘              └───────────────┘

                        │
                        ▼

               Analytics Event

                        │
                        ▼

                ┌───────────────┐
                │    BullMQ     │
                └───────┬───────┘
                        │
                        ▼

                ┌───────────────┐
                │ Background    │
                │ Worker        │
                └───────┬───────┘
                        │
                        ▼

                ┌───────────────┐
                │ Analytics DB  │
                └───────────────┘
```

---

# Why Redis?

Without caching:

```text
Request
 ↓
MongoDB Query
 ↓
Redirect
```

Every request hits MongoDB.

With Redis:

```text
Request
 ↓
Redis
 ↓
Redirect
```

Benefits:

- Lower latency
- Reduced database load
- Better scalability

---

# Why BullMQ?

Naive approach:

```text
Redirect
 ↓
Save Analytics
 ↓
Increment Clicks
 ↓
Return Response
```

Problem:

User waits for analytics processing.

Implemented approach:

```text
Redirect
 ↓
Publish Event
 ↓
Immediate Response

Worker
 ↓
Save Analytics
 ↓
Update Counters
```

Benefits:

- Faster redirects
- Better scalability
- Fault tolerance
- Retry support

---

# Distributed Click Counter

Instead of updating MongoDB on every click:

```text
Click
 ↓
MongoDB Write
```

Implemented:

```text
Click
 ↓
Redis INCR
 ↓
Background Sync
 ↓
MongoDB
```

Benefits:

- Reduces database writes
- Supports high traffic workloads
- Better horizontal scalability

---

# Analytics Pipeline

Every redirect creates an event:

```json
{
  "shortId": "abc123",
  "ip": "127.0.0.1",
  "userAgent": "Chrome"
}
```

Worker enriches analytics:

```json
{
  "country": "India",
  "city": "Delhi",
  "browser": "Chrome",
  "os": "Mac OS",
  "deviceType": "Desktop"
}
```

Stored asynchronously.

---

# API Documentation

Swagger UI:

```http
GET /api-docs
```

---

# Core APIs

## Create Short URL

```http
POST /url
```

Request

```json
{
  "url": "https://google.com",
  "customAlias": "google",
  "expiresInDays": 7
}
```

Response

```json
{
  "shortId": "google"
}
```

---

## Redirect URL

```http
GET /google
```

Redirects to:

```text
https://google.com
```

---

## Analytics

```http
GET /analytics/:shortId
```

---

## Analytics Summary

```http
GET /analytics/:shortId/summary
```

Example:

```json
{
  "totalClicks": 542,
  "uniqueCountries": 5,
  "uniqueBrowsers": 4,
  "uniqueDevices": 2,
  "mostPopularCountry": "India",
  "mostPopularBrowser": "Chrome"
}
```

---

## Daily Click Trends

```http
GET /analytics/:shortId/trends
```

Example:

```json
{
  "dailyClicks": [
    {
      "date": "2025-08-01",
      "clicks": 120
    },
    {
      "date": "2025-08-02",
      "clicks": 180
    }
  ]
}
```

---

# Queue Dashboard

Bull Board:

```http
GET /admin/queues
```

Features:

- Waiting Jobs
- Active Jobs
- Completed Jobs
- Failed Jobs
- Retry Failed Jobs

---

# Local Setup

## Clone

```bash
git clone https://github.com/bhatt1606/url-shortner.git
```

## Install

```bash
npm install
```

## Environment Variables

```env
PORT=8001

MONGO_URI=mongodb://localhost:27017/url-shortener

REDIS_HOST=localhost

REDIS_PORT=6379
```

---

## Run Application

```bash
npm run dev
```

---

## Run Worker

```bash
npm run worker
```

---

# Docker Setup

Start complete stack:

```bash
docker-compose up --build
```

Services:

- API
- Worker
- MongoDB
- Redis

---

# Performance Optimizations

### Redis Caching

Reduced redirect lookup latency by avoiding repeated MongoDB reads.

### Async Analytics Processing

Moved analytics ingestion to BullMQ workers so redirects are not blocked by database writes.

### Distributed Counters

Implemented Redis-based distributed click counter architecture, reducing MongoDB write pressure by batching click synchronization through background workers.

### Aggregation Pipelines

Implemented MongoDB aggregation pipelines for analytics summaries and trend analysis.

---

# Engineering Highlights

- Clean Architecture (Controller → Service → Repository)
- Background Job Processing
- Distributed Cache Layer
- Event-Driven Analytics
- Aggregation Pipelines
- Rate Limiting
- Dockerized Infrastructure
- Queue Monitoring Dashboard
- Production-Oriented Backend Design

---

# Future Improvements

- Kafka-based Event Streaming
- Click Fraud Detection
- Multi-region Redis
- Horizontal Worker Scaling
- Kubernetes Deployment
- Prometheus Metrics
- Grafana Dashboards

---

# Author

Ankur Bhatt

Backend-Focused Full Stack Engineer

- Node.js
- MongoDB
- Redis
- BullMQ
- AWS

GitHub:
https://github.com/bhatt1606

LinkedIn:
https://www.linkedin.com/in/ankur-bhatt-b992031ab/
