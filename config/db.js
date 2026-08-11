const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // If MONGO_DB_NAME is set, it overrides whatever database name is in the
    // connection string path (handy since Atlas connection strings often
    // default to no db name, or you want a different name than the URI shows).
    const options = process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {};
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`✅ MongoDB connected: ${conn.connection.host} / db: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
