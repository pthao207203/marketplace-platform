// src/config/database.ts
import mongoose from 'mongoose';
import { ENV } from './env'; // hoặc đường dẫn đúng đến file env config

export const connect = async () => {
  const uri = ENV.MONGO_URI; // Đảm bảo đọc từ ENV.MONGO_URI
  
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};
