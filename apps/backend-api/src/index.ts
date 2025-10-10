// apps/backend-api/src/index.ts
import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { connect } from './config/database';

// 💡 BƯỚC KHẮC PHỤC CHÍNH: IMPORT TẤT CẢ CÁC MODEL CẦN THIẾT
// Việc này đảm bảo các Model được đăng ký với Mongoose trước khi code khác sử dụng chúng
import './models/user.model';     
import './models/product.model';   // Nếu bạn có Product Model
import './models/order.model';     // Nếu bạn có Order Model

import orderRoutes from './routes/admin/order.route';

const app = express();

// Middleware
// ... (giữ nguyên)
app.use(cors({ origin: ENV.CORS_ORIGIN }));
app.use(express.json());

// Health check
// ... (giữ nguyên)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
// ... (giữ nguyên)
app.use('/api/admin/orders', orderRoutes);

// 404 handler
// ... (giữ nguyên)
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: { 
      code: 'NOT_FOUND', 
      message: `Route ${req.method} ${req.path} not found` 
    } 
  });
});

// Start server
// ... (giữ nguyên)
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
