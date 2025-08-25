import mongoose from 'mongoose';

import { isProd } from './secret-keys.js';
import logger from '../utils/logger.js';

/** ignore query fields that is not in schema (safer, cleaner) */
mongoose.set('strictQuery', true);
const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri, {
      // true: Build indexes automatically only in development; in prod create them during deploy
      autoIndex: !isProd,
      // upto  10 concurrent mongo connection in pool
      maxPoolSize: 10,

      // Don’t let queries hang forever → kill after 45s.
      retryWrites: true,

      serverSelectionTimeoutMS: 10000,
      // Don’t wait forever to connect → fail fast (10s).
      socketTimeoutMS: 45000, // Improves reliability by retrying safe writes automatically.
    });
    logger.info('✅ MongoDB Connected');
  } catch (error) {
    logger.error('❌ MongoDB connection error', error);
    throw error;
  }

  mongoose.connection.on('disconnected', () =>
    logger.warn('MongoDB Disconnected'),
  );

  mongoose.connection.on('reconnected', () =>
    logger.warn('MongoDB Reconnected'),
  );
};

export default connectDB;
