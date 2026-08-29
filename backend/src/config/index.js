require("dotenv").config();

const { URL: NodeURL } = require("url");

/**
 * BullMQ wants a { host, port, password? } object, not a connection string — this pulls one out of REDIS_URL so every place that talks to
 * Redis (the app's own client, and BullMQ's queue/worker) reads from the same source instead of hardcoding host/port separately.
 */
function parseRedisUrl(redisUrl) {
  try {
    const parsed = new NodeURL(redisUrl);

    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      password: parsed.password || undefined,
    };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

const REDIS_URL = process.env.REDIS_URL;

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8001,

  mongoUri: process.env.MONGO_URI,

  redisUrl: REDIS_URL,
  redisConnection: parseRedisUrl(REDIS_URL || "redis://localhost:6379"),

  // Grace period before an expired URL is eligible for cleanup, in ms.
  // Defaults to 1 week — see repositories/url.repository.js.
  urlExpiryGraceMs:
    Number(process.env.URL_EXPIRY_GRACE_MS) || 7 * 24 * 60 * 60 * 1000,

  workerCleanupIntervalMs:
    Number(process.env.WORKER_CLEANUP_INTERVAL) || 60 * 60 * 1000,
};

// Fail fast on missing required config instead of a confusing crash later (e.g. Mongoose hanging on connect() with an undefined URI).
// PORT and URL_EXPIRY_GRACE_MS have safe defaults above and are deliberately excluded here — only vars with no sane default belong in this list.
const required = ["mongoUri", "redisUrl"];
const missing = required.filter((key) => !config[key]);

if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}

module.exports = config;
