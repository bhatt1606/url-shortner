const URL = require("../models/url.model");

async function create(data) {
  return URL.create(data);
}

async function findByShortId(shortId) {
  return URL.findOne({ shortId });
}

async function incrementClicks(shortId, count = 1) {
  return URL.findOneAndUpdate(
    { shortId },
    {
      $inc: {
        totalClicks: count,
      },
    },
    {
      returnDocument: "after",
    },
  );
}

async function getExpiredUrls() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  return URL.find({
    expiresAt: {
      $lte: oneHourAgo,
    },
  });
}

async function deleteExpiredUrls() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  return URL.deleteMany({
    expiresAt: {
      $ne: null,
      $lte: oneHourAgo,
    },
  });
}

async function getDashboardStats() {
  const now = new Date();

  const [totalUrls, activeUrls, expiredUrls, topUrls, totalClicks] =
    await Promise.all([
      URL.countDocuments(),

      URL.countDocuments({
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      }),

      URL.countDocuments({
        expiresAt: {
          $lt: now,
        },
      }),

      URL.find()
        .sort({
          totalClicks: -1,
        })
        .limit(10)
        .select("shortId totalClicks"),

      URL.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalClicks",
            },
          },
        },
      ]),
    ]);

  return {
    totalUrls,
    activeUrls,
    expiredUrls,
    totalClicks: totalClicks[0]?.total || 0,
    topUrls,
  };
}

module.exports = {
  create,
  findByShortId,
  incrementClicks,
  getExpiredUrls,
  deleteExpiredUrls,
  getDashboardStats,
};
