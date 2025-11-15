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
  ZALO_APP_ID: process.env.ZALO_APP_ID || "2554",
  ZALO_KEY1: process.env.ZALO_KEY1 || "sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn",
  ZALO_KEY2: process.env.ZALO_KEY2 || "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",

  // export const MoMoConfig = {
  //   partnerCode: process.env.MOMO_PARTNER_CODE || "",
  //   accessKey: process.env.MOMO_ACCESS_KEY || "",
  //   secretKey: process.env.MOMO_SECRET_KEY || "",
  //   endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
  //   ipnUrl: process.env.Domain_BE + "/api/client/payment/callback/momo",
  //   redirectUrl: process.env.Domain_FE + "/checkout/result",
  // };
};
