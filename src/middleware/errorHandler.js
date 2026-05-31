const logger = require("../utils/logger");

function errorHandler(err, req, res) {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    message: "Internal Server Error",
  });
}

module.exports = errorHandler;
