const urlService = require("../services/url.services");

async function createShortUrl(req, res) {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        message: "URL is required",
      });
    }

    const result = await urlService.createShortUrl(req.body);

    return res.status(201).json({
      shortId: result.shortId,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function redirectUrl(req, res) {
  try {
    const { shortId } = req.params;
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    const redirectUrl = await urlService.redirectToOriginal(shortId, {
      ip,
      userAgent: req.headers["user-agent"],
    });

    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}

async function getAnalytics(req, res) {
  try {
    const { shortId } = req.params;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));

    const analytics = await urlService.getAnalytics(shortId, page, limit);

    return res.json(analytics);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}

async function getAnalyticsSummary(req, res) {
  try {
    const { shortId } = req.params;

    const summary = await urlService.getAnalyticsSummary(shortId);

    return res.json(summary);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}

async function getClickTrends(req, res) {
  try {
    const { shortId } = req.params;

    const trends = await urlService.getClickTrends(shortId);

    return res.json(trends);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}

async function getHourlyTrends(req, res) {
  try {
    const { shortId } = req.params;

    const trends = await urlService.getHourlyTrends(shortId);

    return res.json(trends);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}

async function getDashboard(req, res) {
  try {
    const { shortId } = req.params;

    const dashboard = await urlService.getDashboard(shortId);

    return res.json(dashboard);
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
}

module.exports = {
  createShortUrl,
  redirectUrl,
  getAnalytics,
  getAnalyticsSummary,
  getDashboard,
  getClickTrends,
  getHourlyTrends,
};
