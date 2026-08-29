require("dotenv").config();

const connectDB = require("../config/mongodb");
const { connectRedis } = require("../config/redis");
const config = require("../config/index");

const urlRepository = require("../repositories/url.repository");

const cache = require("../utils/cache");

async function cleanup() {
  try {
    console.log("Running cleanup...");

    // Fetch expired URLs first
    const expiredUrls = await urlRepository.getExpiredUrls();

    console.log(`Found ${expiredUrls.length} expired URLs`);

    // Remove cache entries
    for (const url of expiredUrls) {
      await cache.del(url.shortId);
    }

    // Remove from Mongo
    const result = await urlRepository.deleteExpiredUrls();

    console.log(`Deleted ${result.deletedCount} expired URLs`);
  } catch (error) {
    console.error("Cleanup Worker Error:", error);
  }
}

async function runCleanupWorker() {
  try {
    await connectDB();
    await connectRedis();

    console.log("Cleanup Worker Started...");

    // Run immediately on startup
    await cleanup();

    // Run every hour
    setInterval(cleanup, config.workerCleanupIntervalMs);

    console.log("Cleanup Scheduler Active");
  } catch (error) {
    console.error("Failed To Start Cleanup Worker", error);

    process.exit(1);
  }
}

runCleanupWorker();
