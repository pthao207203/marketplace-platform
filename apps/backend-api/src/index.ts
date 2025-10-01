import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import orderRoutes from './routes/admin/order.route';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'] }));

// Initialize MongoDB connection
const database = require("./config/database");
database.connect().then(async () => {
  // Import và chạy seed data nếu cần
  if (process.env.NODE_ENV === 'development') {
    const createSampleOrders = require('./utils/seed-orders').default;
    await createSampleOrders();
  }
});

const routeAdmin = require("./routes/admin/index.route");
routeAdmin(app);
app.use('/api/admin/orders', orderRoutes);
const routeClient = require("./routes/client/index.route");
routeClient(app)

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
