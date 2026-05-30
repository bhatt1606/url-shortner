require("dotenv").config();

console.log("🚀 Analytics Worker Starting...");

const { Worker } = require("bullmq");

const connectDB = require("../config/mongodb");

const analyticsRepository = require("../repositories/analytics.repository");
const urlRepository = require("../repositories/url.repository");
const { parseUserAgent } = require("../utils/deviceParser");
const { getLocation } = require("../utils/geoParser");

async function startWorker() {
  try {
    // Connect MongoDB
    await connectDB();

    console.log("✅ Mongodb Connected");

    // Create Worker
    const worker = new Worker(
      "analytics",
      async (job) => {
        try {
          console.log("📥 Received Job:", job.data);

          const { shortId, ip, userAgent } = job.data;

          // Save Analytics Record
          const deviceInfo = parseUserAgent(userAgent);
          const location = getLocation(ip);

          await analyticsRepository.create({
            shortId,
            ip,
            userAgent,
            browser: deviceInfo.browser || null,
            os: deviceInfo.os || null,
            deviceType: deviceInfo.deviceType || null,
            country: location.country || null,
            city: location.city || null,
          });

          // Increment Click Count
          await urlRepository.incrementClicks(shortId);

          console.log(`✅ Analytics Saved For ${shortId}`);
        } catch (error) {
          console.error("❌ Worker Processing Error:", error);

          throw error;
        }
      },
      {
        connection: {
          host: "localhost",
          port: 6379,
        },
      },
    );

    worker.on("ready", () => {
      console.log("✅ Worker Ready");
    });

    worker.on("active", (job) => {
      console.log(`⚡ Processing Job ${job.id}`);
    });

    worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} Completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`❌ Job ${job?.id} Failed`, err);
    });

    worker.on("error", (err) => {
      console.error("❌ Worker Error:", err);
    });

    // Graceful Shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting Down Worker...");

      await worker.close();

      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Shutting Down Worker...");

      await worker.close();

      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed To Start Worker:", error);

    process.exit(1);
  }
}

startWorker();
