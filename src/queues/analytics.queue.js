const { Queue } = require("bullmq");

const analyticsQueue = new Queue("analytics", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

module.exports = analyticsQueue;
