const mongoose = require("mongoose");
const config = require("./index");

async function connectDB() {
  await mongoose.connect(config.mongoUri);

  console.log("MongoDB Connected...");
}

module.exports = connectDB;
