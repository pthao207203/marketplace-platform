import { Types } from 'mongoose';
import Order from '../models/order.model';
import User from '../models/user.model';
import { USER_ROLE } from '../constants/user.constants';

async function createSampleOrders() {
  try {
    // Tạo user mẫu (customer)
    const customer = await User.create({
      userName: 'customer1',
      userPassword: 'hashed_password_here',
      userMail: 'customer1@example.com',
      userRole: USER_ROLE.CUSTOMER
    });

    // Tạo shop mẫu
    const shop = await User.create({
      userName: 'shop1',
      userPassword: 'hashed_password_here',
      userMail: 'shop1@example.com',
      userRole: USER_ROLE.SHOP
    });

    // Tạo một số đơn hàng mẫu
    const sampleOrders = [
      {
        userId: customer._id,
        productId: new Types.ObjectId(), // Giả lập product ID
        shopId: shop._id,
        totalPrice: 100000,
        timePurchase: new Date('2025-09-29')
      },
      {
        userId: customer._id,
        productId: new Types.ObjectId(), // Giả lập product ID
        shopId: shop._id,
        totalPrice: 250000,
        timePurchase: new Date('2025-09-30')
      }
    ];

    await Order.insertMany(sampleOrders);
    console.log('Sample orders created successfully');
  } catch (error) {
    console.error('Error creating sample orders:', error);
  }
}

export default createSampleOrders;
