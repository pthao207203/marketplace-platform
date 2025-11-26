import "dotenv/config";

export const ENV = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  MONGO_URI:
    process.env.MONGO_URI ||
    "mongodb+srv://NT118:password@cluster0.xugiqbr.mongodb.net/NT118?retryWrites=true&w=majority&appName=Cluster0",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev-secret",
  PRECHECK_SECRET: process.env.PRECHECK_SECRET || "precheck-dev-secret",
  JWT_ACCESS_EXPIRES: parseInt(process.env.JWT_ACCESS_EXPIRES || "3600", 10),

  DOMAIN_BE: process.env.DOMAIN_BE || "http://localhost:3000",
  ZALO_APP_ID: parseInt(process.env.ZALO_APP_ID || "2554", 10),
  ZALO_KEY1: process.env.ZALO_KEY1 || "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  ZALO_KEY2: process.env.ZALO_KEY2 || "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  GOOGLE_CLIENT_IDS: process.env.GOOGLE_CLIENT_IDS || "",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
