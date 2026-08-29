require("dotenv").config();

const connectDB = require("../config/mongodb");
const { connectRedis } = require("../config/redis");
const redis = require("../utils/cache");
const urlRepository = require("../repositories/url.repository");

async function flushCounters() {
  const keys = await redis.scan("clicks:*");

  for (const key of keys) {
    const shortId = key.split(":")[1];
    const count = await redis.get(key);

    if (count) {
      const updated = await urlRepository.incrementClicks(
        shortId,
        Number(count),
      );

      if (updated) {
        await redis.del(key);
      }
    }
  }
}

async function startCounterWorker() {
  try {
    await connectDB();
    await connectRedis();

    console.log("Counter Worker Started...");

    const run = async () => {
      try {
        await flushCounters();
      } catch (error) {
        console.error("Failed to flush counters:", error);
      }

      setTimeout(run, 30000);
    };

    await run();
  } catch (error) {
    console.error("Failed To Start Counter Worker:", error);
    process.exit(1);
  }
}

startCounterWorker();
