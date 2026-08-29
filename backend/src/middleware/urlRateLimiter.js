const redis = require("../utils/cache");

const WINDOW = 60; // seconds
const LIMIT = 20; // clicks per minute per IP per URL

async function urlRateLimiter(req, res, next) {
  const shortId = req.params.shortId;
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip;

  const key = `rl:${shortId}:${ip}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, WINDOW);
  }

  if (current > LIMIT) {
    return res.status(429).json({
      message: "Too many requests for this short URL. Try later.",
    });
  }

  next();
}

module.exports = urlRateLimiter;
