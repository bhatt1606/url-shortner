const express = require("express");

const router = express.Router();

const urlRateLimiter = require("../middleware/urlRateLimiter");

const {
  createShortUrl,
  getAnalytics,
  redirectUrl,
  getAnalyticsSummary,
  getClickTrends,
  getHourlyTrends,
  getDashboard,
} = require("../controllers/url.controllers");

router.post("/url", createShortUrl);

router.get("/analytics/:shortId", getAnalytics);

router.get("/analytics/:shortId/dashboard", getDashboard);

router.get("/analytics/:shortId/summary", getAnalyticsSummary);

router.get("/analytics/:shortId/trends", getClickTrends);

router.get("/analytics/:shortId/hourly-trends", getHourlyTrends);

router.get("/:shortId", urlRateLimiter, redirectUrl);

module.exports = router;
