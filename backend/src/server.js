require("dotenv").config();

const app = require("./app");
const config = require("./config/index");

const connectDB = require("./config/mongodb");
const { connectRedis } = require("./config/redis");
const createGlobalRateLimiter = require("./middleware/globalRateLimiter");

const PORT = config.port;

async function startServer() {
  try {
    await connectDB();

    await connectRedis();

    const globalRateLimiter = createGlobalRateLimiter();
    app.use(globalRateLimiter);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

startServer();
