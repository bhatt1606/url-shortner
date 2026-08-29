const redis = require("../utils/cache");

const LIMIT = 100;
const WINDOW = 60;
const BLOCK_TIME = 600; // 10 min

async function abuseProtection(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip;

  const key = `abuse:${ip}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, WINDOW);
  }

  if (count > LIMIT) {
    await redis.set(`blocked:${ip}`, "1", "EX", BLOCK_TIME);

    return res.status(403).json({
      message: "IP temporarily blocked due to abuse",
    });
  }

  const blocked = await redis.get(`blocked:${ip}`);

  if (blocked) {
    return res.status(403).json({
      message: "You are blocked temporarily",
    });
  }

  next();
}

module.exports = abuseProtection;
