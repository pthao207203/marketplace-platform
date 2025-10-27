import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }));

const database = require("./config/database");
database.connect();

const routeAdmin = require("./routes/admin/index.route");
routeAdmin(app);

const routeClient = require("./routes/client/index.route");
routeClient(app)

// webhook endpoints (public)
const trackingWebhook = require('./routes/webhook/trackingmore.route').default;
app.use('/trackingmore', trackingWebhook);

// Auction finalizer: run periodically to finalize ended auctions (deduct winner wallets and create orders)
try {
  // require here to match project's CommonJS pattern
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const finalizer = require('./services/auction.finalizer.service');
  const finalizeEndedAuctions = finalizer.default || finalizer.finalizeEndedAuctions;
  if (typeof finalizeEndedAuctions === 'function') {
    const intervalSec = Number(process.env.AUCTION_FINALIZER_INTERVAL_SEC || 60);
    setInterval(() => {
      finalizeEndedAuctions().catch((err: any) => console.error('auction finalizer error', err));
    }, Math.max(5, intervalSec) * 1000);
  }
  // start scheduler to schedule auctions at exact end times
  const startScheduler = finalizer.startScheduler;
  const stopScheduler = finalizer.stopScheduler;
  if (typeof startScheduler === 'function') {
    // schedule near-term auctions on boot
    startScheduler(Number(process.env.AUCTION_SCHEDULE_WINDOW_SEC || 3600)).catch((err: any) => console.error('startScheduler error', err));
    // refresh schedule periodically to pick up new auctions
    const refreshSec = Number(process.env.AUCTION_SCHEDULE_REFRESH_SEC || 60);
    setInterval(() => {
      startScheduler(Number(process.env.AUCTION_SCHEDULE_WINDOW_SEC || 3600)).catch((err: any) => console.error('startScheduler error', err));
    }, Math.max(30, refreshSec) * 1000);
    // on shutdown, we could call stopScheduler() (not wired here)
  }
} catch (err) {
  console.error('failed to start auction finalizer', err);
}

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
