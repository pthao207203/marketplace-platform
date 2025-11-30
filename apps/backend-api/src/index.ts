import "dotenv/config";
import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import * as database from "./config/database";

import routeAdmin from "./routes/admin/index.route";
import routeClient from "./routes/client/index.route";

import trackingWebhook from "./routes/webhook/trackingmore.route";

import * as finalizer from "./services/auction.finalizer.service";

const app: Application = express();

app.use(helmet());
app.use(express.json());

const whitelist = [
  "http://localhost:3000", // Frontend React Local
  "http://localhost:5173", // Frontend Vite Local
  "https://nt118.hius.io.vn", // Domain Production (Cloudflare/AWS)
];

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(",").forEach((origin) => {
    whitelist.push(origin.trim());
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Kết nối Database
// @ts-ignore
database.connect();

console.log("--- System Initializing ---");

// Đăng ký Routes
routeAdmin(app);
routeClient(app);

// Webhook Route
app.use("/trackingmore", trackingWebhook);

try {
  // @ts-ignore: Handle ES Module vs CommonJS export differences
  const finalizeEndedAuctions =
    finalizer.default || finalizer.finalizeEndedAuctions;

  if (typeof finalizeEndedAuctions === "function") {
    const intervalSec = Number(
      process.env.AUCTION_FINALIZER_INTERVAL_SEC || 60
    );
    console.log(`> Auction Finalizer started (Interval: ${intervalSec}s)`);

    setInterval(() => {
      finalizeEndedAuctions().catch((err: any) =>
        console.error("Auction Finalizer Error:", err)
      );
    }, Math.max(5, intervalSec) * 1000);
  }

  // @ts-ignore
  const startScheduler = finalizer.startScheduler;
  if (typeof startScheduler === "function") {
    const windowSec = Number(process.env.AUCTION_SCHEDULE_WINDOW_SEC || 3600);
    console.log(`> Auction Scheduler started (Window: ${windowSec}s)`);

    startScheduler(windowSec).catch((err: any) =>
      console.error("Scheduler Error:", err)
    );
  }
} catch (err) {
  console.error("Failed to start Auction Services:", err);
}

// Start Server
const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Allowed CORS Origins:`, whitelist);
});
