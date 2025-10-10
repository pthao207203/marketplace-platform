import mongoose from 'mongoose';
import { connect } from '../config/database';
import Order from '../models/order.model';

async function seedOrders() {
  await connect();

  // Tạo dữ liệu mẫu
  const sampleOrders = [
    {
      userId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      shopId: new mongoose.Types.ObjectId(),
      totalPrice: 150000,
      timePurchase: new Date('2024-01-15'),
      orderDeleted: 0,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      shopId: new mongoose.Types.ObjectId(),
      totalPrice: 250000,
      timePurchase: new Date('2024-01-20'),
      orderDeleted: 0,
    },
    {
      userId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      shopId: new mongoose.Types.ObjectId(),
      totalPrice: 350000,
      timePurchase: new Date('2024-01-25'),
      orderDeleted: 0,
    },
  ];

  await Order.insertMany(sampleOrders);
  console.log('✅ Seeded', sampleOrders.length, 'orders');
  
  process.exit(0);
}

seedOrders().catch(console.error);
