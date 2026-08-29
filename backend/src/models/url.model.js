const mongoose = require("mongoose");
const config = require("../config/index");

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },
    redirectUrl: {
      type: String,
      required: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: config.urlExpiryGraceMs });

const URL = mongoose.model("URL", urlSchema);

module.exports = URL;
