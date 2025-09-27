import 'dotenv/config';

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGO_URI: parseInt(process.env.MONGO_URI || 'mongodb+srv://NT118:password@cluster0.xugiqbr.mongodb.net/NT118?retryWrites=true&w=majority&appName=Cluster0', 10),
  CORS_ORIGIN: parseInt(process.env.CORS_ORIGIN || 'http://localhost:5173', 10),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-secret',
  JWT_ACCESS_EXPIRES: parseInt(process.env.JWT_ACCESS_EXPIRES || '3600', 10),
  PRECHECK_SECRET: process.env.PRECHECK_SECRET || 'precheck-dev-secret',
};
