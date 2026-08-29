const geoip = require("geoip-lite");

function getLocation(ip) {
  const geo = geoip.lookup(ip);

  if (!geo) {
    return {
      country: "India",
      city: "Delhi",
    };
  }

  return {
    country: geo.country,
    city: geo.city || "Delhi",
  };
}

module.exports = {
  getLocation,
};
