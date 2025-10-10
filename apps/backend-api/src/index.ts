import 'dotenv/config';
import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env';
import { connect } from './config/database';

const adminRouteIndex = require('./routes/admin/index.route');
const clientRouteIndex = require('./routes/client/index.route');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: ENV.CORS_ORIGIN }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount /api prefix ở đây
app.use('/api', (req, res, next) => {
  adminRouteIndex(req.app);
  clientRouteIndex(req.app);
  next();
});

// Hoặc cách khác (sạch hơn):
const apiRouter = express.Router();
adminRouteIndex(apiRouter);
clientRouteIndex(apiRouter);
app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

const startServer = async () => {
  try {
    await connect();
    app.listen(ENV.PORT, () => {
      console.log(`✅ API running at http://localhost:${ENV.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
