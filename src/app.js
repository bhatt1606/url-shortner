const express = require("express");

const urlRoutes = require("./routes/url.routes");

const abuseProtection = require("./middleware/abuseProtection");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.use(abuseProtection);

app.use(requestLogger);

app.use("/", urlRoutes);

app.use(errorHandler);

module.exports = app;
