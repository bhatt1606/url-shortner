const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
    },
    ip: String,
    userAgent: String,
    browser: String,
    os: String,
    deviceType: String,
    country: String,
    city: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Analytics", analyticsSchema);
