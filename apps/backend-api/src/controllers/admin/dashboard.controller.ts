import { Request, Response } from "express";
import Order from "../../models/order.model";
import Product from "../../models/product.model";
import User from "../../models/user.model";
import { USER_ROLE } from "../../constants/user.constants";

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

export async function index(req: Request, res: Response) {
  return res.json({ ok: true, page: "admin-dashboard" });
}

export async function stats(req: Request, res: Response) {
  return res.json({ ok: true, page: "admin-dashboard" });
}

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const TOTAL_FIELD = "$totalAmount";
    const [
      totalRevenueData,
      revenueThisMonthData,
      revenueLastMonthData,
      totalProducts,
      productsThisMonth,
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: TOTAL_FIELD } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: TOTAL_FIELD } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: TOTAL_FIELD } } },
      ]),
      Product.countDocuments(),
      Product.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      User.countDocuments({ userRole: USER_ROLE.CUSTOMER }),
      User.countDocuments({
        userRole: USER_ROLE.CUSTOMER,
        createdAt: { $gte: startOfThisMonth },
      }),
      User.countDocuments({
        userRole: USER_ROLE.CUSTOMER,
        createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
      }),

      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
      Order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
      }),
    ]);

    const revenueTotal = totalRevenueData[0]?.total || 0;
    const revenueNow = revenueThisMonthData[0]?.total || 0;
    const revenueLast = revenueLastMonthData[0]?.total || 0;
    const revenueGrowth = calculateGrowth(revenueNow, revenueLast);
    const userGrowth = calculateGrowth(usersThisMonth, usersLastMonth);
    const orderGrowth = calculateGrowth(ordersThisMonth, ordersLastMonth);
    const metricsData = [
      {
        key: "revenue",
        title: "Tổng tiền",
        value: revenueTotal,
        increment: revenueNow,
        percentage: Math.abs(revenueGrowth),
        trend: revenueGrowth >= 0 ? "up" : "down",
        isPrimary: true,
      },
      {
        key: "products",
        title: "Sản phẩm",
        value: totalProducts,
        increment: productsThisMonth,
        percentage: 0,
        trend: "up",
      },
      {
        key: "users",
        title: "Người dùng",
        value: totalUsers,
        increment: usersThisMonth,
        percentage: Math.abs(userGrowth),
        trend: userGrowth >= 0 ? "up" : "down",
      },
      {
        key: "orders",
        title: "Đơn hàng",
        value: totalOrders,
        increment: ordersThisMonth,
        percentage: Math.abs(orderGrowth),
        trend: orderGrowth >= 0 ? "up" : "down",
      },
    ];

    return res.status(200).json({
      success: true,
      data: metricsData,
    });
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
