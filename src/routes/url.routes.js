const express = require("express");

const router = express.Router();

const urlController = require("../controllers/url.controllers");
const urlRateLimiter = require("../middleware/urlRateLimiter");

const {
  createShortUrl,
  getAnalytics,
  redirectUrl,
  getAnalyticsSummary,
  getClickTrends,
  getHourlyTrends,
} = require("../controllers/url.controllers");

router.post("/url", createShortUrl);

router.get("/analytics/:shortId", getAnalytics);

router.get("/:shortId", urlRateLimiter, redirectUrl);

router.get("/analytics/:shortId/summary", getAnalyticsSummary);

router.get("/analytics/:shortId/trends", getClickTrends);

router.get("/analytics/:shortId/hourly-trends", getHourlyTrends);

module.exports = router;
