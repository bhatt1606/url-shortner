const geoip = require("geoip-lite");

function getLocation(ip) {
  const geo = geoip.lookup(ip);

  if (!geo) {
    return {
      country: "Unknown",
      city: "Unknown",
    };
  }

  return {
    country: geo.country,
    city: geo.city || "Unknown",
  };
}

module.exports = {
  getLocation,
};
