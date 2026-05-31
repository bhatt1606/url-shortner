const { nanoid } = require("nanoid");
const SUMMARY_CACHE_TTL = 300;

const urlRepository = require("../repositories/url.repository");
const analyticsRepository = require("../repositories/analytics.repository");
const analyticsQueue = require("../queues/analytics.queue");
const counter = require("../utils/counter");
const { redirectsCounter } = require("../utils/metrics");

const cache = require("../utils/cache");

async function createShortUrl(data) {
  const { url, customAlias, expiresInDays } = data;

  const shortId = customAlias || nanoid(8);

  const existingUrl = await urlRepository.findByShortId(shortId);

  if (existingUrl) {
    throw new Error("Alias already exists");
  }

  let expiresAt = null;

  if (expiresInDays) {
    expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
  }

  const createdUrl = await urlRepository.create({
    shortId,
    redirectUrl: url,
    expiresAt,
  });

  await cache.set(shortId, {
    redirectUrl: createdUrl.redirectUrl,
    expiresAt: createdUrl.expiresAt,
  });

  return createdUrl;
}

async function publishAnalyticsEvent(shortId, analyticsData) {
  const job = await analyticsQueue.add(
    "track-click",
    {
      shortId,
      ip: analyticsData.ip,
      userAgent: analyticsData.userAgent,
    },
    {
      jobId: `${shortId}-${analyticsData.ip}-${Date.now()}`,
      attempts: 5,
      removeOnComplete: 100,
      removeOnFail: 50,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  );

  console.log("Created Job:", job.id);

  return job;
}

async function redirectToOriginal(shortId, analyticsData) {
  const cachedUrl = await cache.get(shortId);

  let urlData;

  if (cachedUrl) {
    urlData = JSON.parse(cachedUrl);
  } else {
    const url = await urlRepository.findByShortId(shortId);

    if (!url) throw new Error("Short URL not found");

    urlData = url;

    await cache.set(shortId, urlData);
  }

  if (urlData.expiresAt && new Date(urlData.expiresAt) < new Date()) {
    throw new Error("URL expired");
  }

  await counter.incrementClick(shortId);

  publishAnalyticsEvent(shortId, analyticsData).catch(console.error);

  redirectsCounter.inc();

  return urlData.redirectUrl;
}

async function getAnalytics(shortId, page = 1, limit = 50) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
  }

  const analytics = await analyticsRepository.findByShortId(
    shortId,
    page,
    limit,
  );

  const redisClicks = await counter.getClickCount(shortId);

  return {
    shortId: url.shortId,
    redirectUrl: url.redirectUrl,

    totalClicks: Number(redisClicks || 0) + Number(url.totalClicks || 0),

    page: analytics.page,
    limit: analytics.limit,
    totalRecords: analytics.total,
    totalPages: analytics.totalPages,

    analytics: analytics.analytics,
  };
}

async function getAnalyticsSummary(shortId) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
  }

  const cacheKey = `summary:${shortId}`;
  const cached = await cache.getJSON(cacheKey);

  if (cached) {
    console.log("Analytics Summary Cache HIT");

    return cached;
  }

  const summary = await analyticsRepository.getAnalyticsSummary(shortId);

  const uniqueCountries = summary.countryStats.filter(
    (item) => item.country && item.country !== "Unknown",
  ).length;

  const uniqueBrowsers = summary.browserStats.filter(
    (item) => item.browser && item.browser !== "Unknown",
  ).length;

  const uniqueDevices = summary.deviceStats.filter(
    (item) => item.deviceType && item.deviceType !== "Unknown",
  ).length;

  const redisClicks = await counter.getClickCount(shortId);

  const response = {
    shortId,
    totalClicks: Number(redisClicks || 0) + Number(url.totalClicks || 0),

    uniqueCountries,
    uniqueBrowsers,
    uniqueDevices,

    mostPopularCountry: summary.countryStats[0]?.country || null,
    mostPopularBrowser: summary.browserStats[0]?.browser || null,
    mostPopularDevice: summary.deviceStats[0]?.deviceType || null,

    topCountries: summary.countryStats,
    topBrowsers: summary.browserStats,
    topDevices: summary.deviceStats,
  };

  await cache.setJSON(cacheKey, response, SUMMARY_CACHE_TTL);

  return response;
}

async function getClickTrends(shortId) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
  }

  const cacheKey = `summary:${shortId}`;
  const cached = await cache.getJSON(cacheKey);

  if (cached) {
    console.log("Analytics Summary Cache HIT");

    return cached;
  }

  const trends = await analyticsRepository.getDailyClickTrends(shortId);

  const redisClicks = await counter.getClickCount(shortId);

  const response = {
    shortId,
    totalClicks: Number(redisClicks || 0) + Number(url.totalClicks || 0),
    dailyClicks: trends,
  };

  await cache.setJSON(cacheKey, response, SUMMARY_CACHE_TTL);

  return response;
}

async function getHourlyTrends(shortId) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
  }

  const cacheKey = `summary:${shortId}`;
  const cached = await cache.getJSON(cacheKey);

  if (cached) {
    console.log("Analytics Summary Cache HIT");

    return cached;
  }

  const hourlyClicks = await analyticsRepository.getHourlyClickTrends(shortId);

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    clicks: 0,
  }));

  hourlyClicks.forEach((item) => {
    hours[item.hour].clicks = item.clicks;
  });

  const redisClicks = await counter.getClickCount(shortId);

  const response = {
    shortId,
    totalClicks: Number(redisClicks || 0) + Number(url.totalClicks || 0),
    hourlyClicks: hours,
  };

  await cache.setJSON(cacheKey, response, SUMMARY_CACHE_TTL);

  return response;
}

async function getDashboard(shortId) {
  const [summary, trends, hourly] = await Promise.all([
    getAnalyticsSummary(shortId),
    getClickTrends(shortId),
    getHourlyTrends(shortId),
  ]);

  return {
    shortId,
    totalClicks: summary.totalClicks,
    uniqueCountries: summary.uniqueCountries,
    uniqueBrowsers: summary.uniqueBrowsers,
    uniqueDevices: summary.uniqueDevices,
    topCountries: summary.topCountries,
    topBrowsers: summary.topBrowsers,
    topDevices: summary.topDevices,
    dailyClicks: trends.dailyClicks,
    hourlyClicks: hourly.hourlyClicks,
  };
}

module.exports = {
  createShortUrl,
  redirectToOriginal,
  getAnalytics,
  getAnalyticsSummary,
  getClickTrends,
  getHourlyTrends,
  getDashboard,
};
