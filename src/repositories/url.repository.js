const URL = require("../models/url.model");

async function create(data) {
  return URL.create(data);
}

async function findByShortId(shortId) {
  return URL.findOne({ shortId });
}

async function incrementClicks(shortId) {
  return URL.findOneAndUpdate(
    { shortId },
    {
      $inc: {
        totalClicks: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );
}

module.exports = {
  create,
  findByShortId,
  incrementClicks,
};
