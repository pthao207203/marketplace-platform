import 'dotenv/config';

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
    // connection string (string)
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/marketplace',
  // CORS origin(s) as string, comma-separated if multiple
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-secret',
  // token lifetime in seconds
  JWT_ACCESS_EXPIRES: parseInt(process.env.JWT_ACCESS_EXPIRES || '3600', 10),
  PRECHECK_SECRET: process.env.PRECHECK_SECRET || 'precheck-dev-secret',
  // comma-separated allowed Google client IDs (Android/iOS/web) for verifying Google OAuth id_tokens
  GOOGLE_CLIENT_IDS: process.env.GOOGLE_CLIENT_IDS || '',
};
