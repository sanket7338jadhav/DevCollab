const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

const connectDB = async () => {
  mongoose.connection.on('connected', () => {
    metrics.dbConnectedGauge.set(1);
    logger.info('MongoDB connection established');
  });

  mongoose.connection.on('disconnected', () => {
    metrics.dbConnectedGauge.set(0);
    logger.warn('MongoDB connection lost');
  });

  mongoose.connection.on('error', (err) => {
    metrics.dbConnectedGauge.set(0);
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('<username>')) {
    logger.warn('⚠️ MONGO_URI is not set or contains placeholder credentials. Running with disconnected database state.');
    metrics.dbConnectedGauge.set(0);
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    metrics.dbConnectedGauge.set(1);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    metrics.dbConnectedGauge.set(0);
    logger.error(`❌ MongoDB Connection Error: ${error.message}. Backend will continue running in degraded mode.`);
  }
};

module.exports = connectDB;
