const express = require("express");

const urlRoutes = require("./routes/url.routes");

const abuseProtection = require("./middleware/abuseProtection");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { register } = require("./utils/metrics");

const app = express();

app.use(express.json());

app.use(abuseProtection);

app.use(requestLogger);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);

  res.end(await register.metrics());
});

app.use("/api", urlRoutes);

// Always must be at last
app.use(errorHandler);

module.exports = app;
