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

analyticsSchema.index({
  shortId: 1,
  createdAt: -1,
});

analyticsSchema.index({
  shortId: 1,
  country: 1,
});

analyticsSchema.index({
  shortId: 1,
  browser: 1,
});

analyticsSchema.index({
  shortId: 1,
  deviceType: 1,
});

module.exports = mongoose.model("Analytics", analyticsSchema);
