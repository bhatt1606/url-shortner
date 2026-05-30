const { nanoid } = require("nanoid");

const urlRepository = require("../repositories/url.repository");
const analyticsRepository = require("../repositories/analytics.repository");
const analyticsQueue = require("../queues/analytics.queue");
const counter = require("../utils/counter");

const cache = require("../utils/cache");

async function createShortUrl(data) {
  const { url, customAlias, expiresInDays } = data;

  const shortId = customAlias || nanoid(8);

  const existingUrl = await urlRepository.findByShortId(shortId);

  if (existingUrl) {
    throw new Error("Alias already exists");
  }

  console.log('helllooooooo');

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

  console.log('helllooouuuuuuuuuu');

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

  // 🚀 FAST PATH (IMPORTANT CHANGE)
  await counter.incrementClick(shortId);

  // background analytics still async
  publishAnalyticsEvent(shortId, analyticsData).catch(console.error);

  return urlData.redirectUrl;
}

async function getAnalytics(shortId) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
  }

  const analytics = await analyticsRepository.findByShortId(shortId);

  const redisClicks = await counter.getClickCount(shortId);

  return {
    shortId: url.shortId,
    redirectUrl: url.redirectUrl,
    totalClicks: Number(redisClicks || url.totalClicks || 0),
    analytics,
  };
}

async function getAnalyticsSummary(shortId) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
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

  return {
    shortId,
    totalClicks: url.totalClicks,

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
}

async function getClickTrends(shortId) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
  }

  const trends = await analyticsRepository.getDailyClickTrends(shortId);

  return {
    shortId,
    totalClicks: url.totalClicks,
    dailyClicks: trends,
  };
}

async function getHourlyTrends(shortId) {
  const url = await urlRepository.findByShortId(shortId);

  if (!url) {
    throw new Error("Short URL not found");
  }

  const hourlyClicks = await analyticsRepository.getHourlyClickTrends(shortId);

  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    clicks: 0,
  }));

  hourlyClicks.forEach((item) => {
    hours[item.hour].clicks = item.clicks;
  });

  return {
    shortId,
    totalClicks: url.totalClicks,
    hourlyClicks: hours,
  };
}

module.exports = {
  createShortUrl,
  redirectToOriginal,
  getAnalytics,
  getAnalyticsSummary,
  getClickTrends,
  getHourlyTrends,
};
