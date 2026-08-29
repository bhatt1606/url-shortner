const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

const redirectsCounter = new client.Counter({
  name: "url_redirects_total",
  help: "Total URL redirects",
});

register.registerMetric(redirectsCounter);

module.exports = {
  register,
  redirectsCounter,
};
