import mongoose from 'mongoose';

import { isProd } from './env.config.js';
import logger from '../utils/logger.util.js';

/** Ignore fiels that is not in schema */
mongoose.set('strictQuery', true);

const connectDb = async (uri) => {
  try {
    await mongoose.connect(uri, {
      autoIndex: !isProd /** auto-indexing in development */,
      maxPoolSize: 10 /** max 10 concurrent connections in pool */,
      retryWrites: true /** improve reliability by retrying safe writes */,
      socketTimeoutMS: 45000 /** don't let query hang forever -> kill after 45sec */,
      serverSelectionTimeoutMS: 10000 /** don't wait forever to connect to db -> kill after 10sec */,
    });

    logger.info('✅ MongoDB Connected');
  } catch (error) {
    logger.error('❌ MongoDB connection error', error);
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB Disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.warn('MongoDB Reconnected');
  });
};

export default connectDb;
