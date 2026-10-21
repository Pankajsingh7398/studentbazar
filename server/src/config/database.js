import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentbazaar';
    const connectionInstance = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected successfully! Host: ${connectionInstance.connection.host}, DB: ${connectionInstance.connection.name}`);
    return connectionInstance;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error.message);
    process.exit(1);
  }
};
