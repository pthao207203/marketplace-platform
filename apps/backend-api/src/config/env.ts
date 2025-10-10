// src/config/env.ts
import 'dotenv/config';

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGO_URI: process.env.MONGO_URI || '', 
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173', 
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-secret',
  JWT_ACCESS_EXPIRES: parseInt(process.env.JWT_ACCESS_EXPIRES || '3600', 10),
  PRECHECK_SECRET: process.env.PRECHECK_SECRET || 'precheck-dev-secret',
};
