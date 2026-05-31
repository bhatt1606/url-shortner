require("dotenv").config();

const connectDB = require("../config/mongodb");
const urlRepository = require("../repositories/url.repository");

async function runCleanup() {
  await connectDB();

  console.log("Cleanup Worker Started...");

  setInterval(
    async () => {
      try {
        const result = await urlRepository.deleteExpiredUrls();

        console.log(`Deleted ${result.deletedCount} expired URLs`);
      } catch (error) {
        console.error(error);
      }
    },
    60 * 60 * 1000,
  );
}

runCleanup();
