import { Request, Response } from "express";
import OrderModel from "../../models/order.model";
import ProductModel from "../../models/product.model";
import UserModel from "../../models/user.model";
import { USER_ROLE } from "../../constants/user.constants";
import { ORDER_STATUS } from "../../constants/order.constants";
import { sendSuccess, sendError } from "../../utils/response";

const getDateRange = (query: any) => {
  const { type, year, month, startDate, endDate } = query;

  const now = new Date();
  let currentStart = new Date();
  let currentEnd = new Date();
  let previousStart = new Date();
  let previousEnd = new Date();

  const y = year ? parseInt(year) : now.getFullYear();

  if (type === "year") {
    // Năm hiện tại: 1/1/YYYY - 31/12/YYYY
    currentStart = new Date(y, 0, 1);
    currentEnd = new Date(y, 11, 31, 23, 59, 59, 999);

    // Năm trước: 1/1/(YYYY-1)
    previousStart = new Date(y - 1, 0, 1);
    previousEnd = new Date(y - 1, 11, 31, 23, 59, 59, 999);
  } else if (type === "month") {
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const monthIndex = m - 1;

    // Tháng hiện tại
    currentStart = new Date(y, monthIndex, 1);
    currentEnd = new Date(y, monthIndex + 1, 0, 23, 59, 59, 999); // Ngày cuối tháng

    // Tháng trước (Xử lý lùi năm nếu là tháng 1)
    if (monthIndex === 0) {
      previousStart = new Date(y - 1, 11, 1);
      previousEnd = new Date(y - 1, 12, 0, 23, 59, 59, 999);
    } else {
      previousStart = new Date(y, monthIndex - 1, 1);
      previousEnd = new Date(y, monthIndex, 0, 23, 59, 59, 999);
    }
  } else if (type === "day") {
    if (startDate && endDate) {
      currentStart = new Date(startDate);
      currentStart.setHours(0, 0, 0, 0);

      currentEnd = new Date(endDate);
      currentEnd.setHours(23, 59, 59, 999);

      // Tính khoảng cách ngày để lấy previous range tương ứng
      const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime());
      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(previousEnd.getTime() - diffTime);
    }
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
};

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

export async function index(req: Request, res: Response) {
  return sendSuccess(res, { page: "admin-dashboard" });
}

export async function stats(req: Request, res: Response) {
  return sendSuccess(res, { page: "admin-dashboard" });
}

// API: GET METRICS
export const getMetrics = async (req: Request, res: Response) => {
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      getDateRange(req.query);

    const TOTAL_FIELD = "$orderTotalAmount";

    const [
      // Revenue (Doanh thu)
      revenueTotalData,
      revenueCurrentData,
      revenuePreviousData,

      // Products (Sản phẩm)
      productsTotal,
      productsNew,

      // Users (Người dùng)
      usersTotal,
      usersNew,
      usersPrev,

      // Orders (Đơn hàng)
      ordersTotal,
      ordersNew,
      ordersPrev,
    ] = await Promise.all([
      // 1. Revenue Queries
      OrderModel.aggregate([
        { $match: { orderStatus: ORDER_STATUS.DELIVERED } },
        { $group: { _id: null, total: { $sum: TOTAL_FIELD } } },
      ]),
      OrderModel.aggregate([
        {
          $match: {
            orderStatus: ORDER_STATUS.DELIVERED,
            createdAt: { $gte: currentStart, $lte: currentEnd },
          },
        },
        { $group: { _id: null, total: { $sum: TOTAL_FIELD } } },
      ]),
      OrderModel.aggregate([
        {
          $match: {
            orderStatus: ORDER_STATUS.DELIVERED,
            createdAt: { $gte: previousStart, $lte: previousEnd },
          },
        },
        { $group: { _id: null, total: { $sum: TOTAL_FIELD } } },
      ]),

      // 2. Product Queries
      ProductModel.countDocuments(),
      ProductModel.countDocuments({
        createdAt: { $gte: currentStart, $lte: currentEnd },
      }),

      // 3. User Queries
      UserModel.countDocuments({ userRole: USER_ROLE.CUSTOMER }),
      UserModel.countDocuments({
        userRole: USER_ROLE.CUSTOMER,
        createdAt: { $gte: currentStart, $lte: currentEnd },
      }),
      UserModel.countDocuments({
        userRole: USER_ROLE.CUSTOMER,
        createdAt: { $gte: previousStart, $lte: previousEnd },
      }),

      // 4. Order Queries
      OrderModel.countDocuments(),
      OrderModel.countDocuments({
        createdAt: { $gte: currentStart, $lte: currentEnd },
      }),
      OrderModel.countDocuments({
        createdAt: { $gte: previousStart, $lte: previousEnd },
      }),
    ]);

    // Xử lý số liệu Doanh thu
    const revTotal = revenueTotalData[0]?.total || 0;
    const revCur = revenueCurrentData[0]?.total || 0;
    const revPrev = revenuePreviousData[0]?.total || 0;
    const revenueGrowth = calculateGrowth(revCur, revPrev);

    // Xử lý số liệu Tăng trưởng
    const userGrowth = calculateGrowth(usersNew, usersPrev);
    const orderGrowth = calculateGrowth(ordersNew, ordersPrev);

    const metricsData = [
      {
        key: "revenue",
        title: "Doanh thu",
        value: revCur, // Số to: Doanh thu trong kỳ đã chọn
        increment: revCur - revPrev, // Số nhỏ: Chênh lệch so với kỳ trước
        percentage: Math.abs(revenueGrowth),
        trend: revenueGrowth >= 0 ? "up" : "down",
        isPrimary: true,
      },
      {
        key: "products",
        title: "Sản phẩm mới",
        value: productsNew, // Số to: Sản phẩm mới tạo trong kỳ
        increment: 0, // Không so sánh kỳ trước
        percentage: 0,
        trend: "up",
      },
      {
        key: "users",
        title: "Khách hàng mới",
        value: usersNew, // Số to: User đăng ký trong kỳ
        increment: usersNew - usersPrev, // Số nhỏ: Chênh lệch
        percentage: Math.abs(userGrowth),
        trend: userGrowth >= 0 ? "up" : "down",
      },
      {
        key: "orders",
        title: "Đơn hàng",
        value: ordersNew, // Số to: Đơn hàng trong kỳ
        increment: ordersNew - ordersPrev, // Số nhỏ: Chênh lệch
        percentage: Math.abs(orderGrowth),
        trend: orderGrowth >= 0 ? "up" : "down",
      },
    ];

    return sendSuccess(res, metricsData);
  } catch (error: any) {
    console.error("Dashboard Metrics Error:", error);
    return sendError(res, 500, "Lỗi server lấy metrics", error?.message);
  }
};

// API: ORDER STATS
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const { currentStart, currentEnd } = getDateRange(req.query);

    const stats = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: currentStart, $lte: currentEnd },
        },
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const map: Record<number, number> = {};
    stats.forEach((s) => {
      if (s._id !== null && s._id !== undefined) {
        map[s._id] = s.count;
      }
    });

    const pending = map[ORDER_STATUS.PENDING] || 0;
    const shipping = map[ORDER_STATUS.SHIPPING] || 0;
    const delivered = map[ORDER_STATUS.DELIVERED] || 0;
    const cancelled = map[ORDER_STATUS.CANCELLED] || 0;
    const returned = map[ORDER_STATUS.RETURNED] || 0;

    const totalProcessing = pending + shipping;
    const totalFailed = cancelled + returned;

    const data = {
      overviewChart: {
        series: [delivered, totalProcessing, totalFailed],
        labels: ["Thành công", "Đang xử lý", "Thất bại"],
      },

      processChart: {
        series: [pending, shipping],
        labels: ["Chờ xác nhận", "Đang giao"],
      },

      failedChart: {
        series: [cancelled, returned],
        labels: ["Đã hủy", "Trả hàng/Hoàn tiền"],
      },
    };

    return sendSuccess(res, data);
  } catch (error: any) {
    console.error("Get Order Stats Error:", error);
    return sendError(
      res,
      500,
      "Lỗi server lấy thống kê đơn hàng",
      error?.message
    );
  }
};

// API: USER STATS
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { currentEnd, previousEnd } = getDateRange(req.query);

    const customerNow = await UserModel.countDocuments({
      userRole: USER_ROLE.CUSTOMER,
      createdAt: { $lte: currentEnd },
    });
    const shopNow = await UserModel.countDocuments({
      userRole: USER_ROLE.SHOP,
      createdAt: { $lte: currentEnd },
    });

    const customerBefore = await UserModel.countDocuments({
      userRole: USER_ROLE.CUSTOMER,
      createdAt: { $lte: previousEnd },
    });
    const shopBefore = await UserModel.countDocuments({
      userRole: USER_ROLE.SHOP,
      createdAt: { $lte: previousEnd },
    });

    return sendSuccess(res, {
      now: { customer: customerNow, shop: shopNow },
      before: { customer: customerBefore, shop: shopBefore },
    });
  } catch (error: any) {
    console.error("Get User Stats Error:", error);
    return sendError(
      res,
      500,
      "Lỗi server lấy thống kê người dùng",
      error?.message
    );
  }
};

// API: MONTHLY SALES
export const getMonthlySales = async (req: Request, res: Response) => {
  try {
    const yearQuery = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();

    const monthlyStats = await OrderModel.aggregate([
      {
        $match: {
          orderStatus: ORDER_STATUS.DELIVERED,
          createdAt: {
            $gte: new Date(`${yearQuery}-01-01`),
            $lte: new Date(`${yearQuery}-12-31T23:59:59.999Z`),
          },
        },
      },
      {
        $group: {
          _id: { $month: { date: "$createdAt", timezone: "+07:00" } },
          total: { $sum: "$orderTotalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const salesData = Array(12).fill(0);

    monthlyStats.forEach((item) => {
      const monthIndex = item._id - 1;
      salesData[monthIndex] = Number((item.total / 1000000).toFixed(2));
    });

    return sendSuccess(res, { year: yearQuery, sales: salesData });
  } catch (error: any) {
    console.error("Get Monthly Sales Error:", error);
    return sendError(
      res,
      500,
      "Lỗi server lấy doanh thu tháng",
      error?.message
    );
  }
};
