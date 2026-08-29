const { createClient } = require("redis");
const config = require("./index");

const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on("error", (err) => {
  console.log("Redis Error:", err);
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis Connected...");
  }
}

module.exports = {
  redisClient,
  connectRedis,
};
