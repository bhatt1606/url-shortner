const Analytics = require("../models/analytics.model");

async function create(data) {
  return Analytics.create(data);
}

async function findByShortId(shortId) {
  return Analytics.find({
    shortId,
  }).sort({
    createdAt: -1,
  });
}

async function getAnalyticsSummary(shortId) {
  const [countryStats, browserStats, deviceStats] = await Promise.all([
    Analytics.aggregate([
      {
        $match: {
          shortId,
          country: {
            $exists: true,
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$country",
          clicks: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          clicks: -1,
        },
      },
    ]),

    Analytics.aggregate([
      {
        $match: {
          shortId,
          browser: {
            $exists: true,
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$browser",
          clicks: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          browser: "$_id",
          clicks: 1,
        },
      },
      {
        $sort: {
          clicks: -1,
        },
      },
    ]),

    Analytics.aggregate([
      {
        $match: {
          shortId,
          deviceType: {
            $exists: true,
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$deviceType",
          clicks: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          clicks: -1,
        },
      },
    ]),
  ]);

  return {
    countryStats,
    browserStats,
    deviceStats,
  };
}

async function getDailyClickTrends(shortId) {
  return Analytics.aggregate([
    {
      $match: {
        shortId,
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        clicks: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        clicks: 1,
      },
    },
    {
      $sort: {
        date: 1,
      },
    },
  ]);
}

async function getHourlyClickTrends(shortId) {
  return Analytics.aggregate([
    {
      $match: {
        shortId,
      },
    },
    {
      $group: {
        _id: {
          $hour: "$createdAt",
        },
        clicks: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
        hour: "$_id",
        clicks: 1,
      },
    },
    {
      $sort: {
        hour: 1,
      },
    },
  ]);
}

module.exports = {
  create,
  findByShortId,
  getAnalyticsSummary,
  getDailyClickTrends,
  getHourlyClickTrends,
};
