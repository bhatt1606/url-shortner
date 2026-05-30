const express = require("express");

const router = express.Router();

const urlController = require("../controllers/url.controllers");
const urlRateLimiter = require("../middleware/urlRateLimiter");

router.post("/url", urlController.createShortUrl);

router.get("/analytics/:shortId", urlController.getAnalytics);

router.get("/:shortId", urlRateLimiter, urlController.redirectUrl);

router.get("/analytics/:shortId/summary", urlController.getAnalyticsSummary);

router.get("/analytics/:shortId/trends", urlController.getClickTrends);

router.get("/analytics/:shortId/hourly-trends", urlController.getHourlyTrends);

module.exports = router;
