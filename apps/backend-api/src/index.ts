import "dotenv/config";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import * as database from "./config/database";

import routeAdmin from "./routes/admin/index.route";
import routeClient from "./routes/client/index.route";

import * as finalizer from "./services/auction.finalizer.service";
const trackingWebhook = require("./routes/webhook/trackingmore.route").default;

const app: Application = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
    credentials: true,
  })
);

// @ts-ignore
database.connect();

console.log("Check Admin Route:", routeAdmin);

routeAdmin(app);
routeClient(app);

app.use("/trackingmore", trackingWebhook);

try {
  // @ts-ignore
  const finalizeEndedAuctions =
    finalizer.default || finalizer.finalizeEndedAuctions;
  if (typeof finalizeEndedAuctions === "function") {
    const intervalSec = Number(
      process.env.AUCTION_FINALIZER_INTERVAL_SEC || 60
    );
    setInterval(() => {
      finalizeEndedAuctions().catch((err: any) =>
        console.error("Auction Error", err)
      );
    }, Math.max(5, intervalSec) * 1000);
  }
  // @ts-ignore
  const startScheduler = finalizer.startScheduler;
  if (typeof startScheduler === "function") {
    const windowSec = Number(process.env.AUCTION_SCHEDULE_WINDOW_SEC || 3600);
    startScheduler(windowSec).catch((err: any) =>
      console.error("Scheduler Error", err)
    );
  }
} catch (err) {
  console.error(err);
}

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
