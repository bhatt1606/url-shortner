const redis = require("./cache");

async function incrementClick(shortId) {
  return redis.incr(`clicks:${shortId}`);
}

async function getClickCount(shortId) {
  return redis.get(`clicks:${shortId}`);
}

module.exports = {
  incrementClick,
  getClickCount,
};
