const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      ip: req.ip,
      duration: `${duration}ms`,
    });
  });

  next();
}

module.exports = requestLogger;
