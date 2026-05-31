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

async function deleteExpiredUrls() {
  return URL.deleteMany({
    expiresAt: {
      $ne: null,
      $lt: new Date(),
    },
  });
}

module.exports = {
  create,
  findByShortId,
  incrementClicks,
  deleteExpiredUrls,
};
