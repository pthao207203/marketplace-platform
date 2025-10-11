// apps/backend-api/src/services/order.service.ts
import Order from '../models/order.model';

interface GetOrdersParams {
  page?: number;
  limit?: number;
}

export async function getOrders({ page = 1, limit = 10 }: GetOrdersParams) {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ orderDeleted: 0 })
      .sort({ timePurchase: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'userName userMail')
      .populate('shopId', 'userName userMail')
      .lean(),
    Order.countDocuments({ orderDeleted: 0 }),
  ]);

  return {
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getOrderById(id: string) {
  return Order.findById(id)
    .populate('userId', 'userName userMail')
    .populate('shopId', 'userName userMail')
    .lean();
}

export async function createOrder(data: any) {
  const order = new Order(data);
  return order.save();
}
