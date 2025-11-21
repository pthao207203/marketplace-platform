import { Request, Response } from "express";
import OrderModel from "../../models/order.model";
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "../../constants/order.constants";

// [GET] /admin/pay
// Lấy danh sách TẤT CẢ giao dịch (COD, Wallet, ZaloPay, ...)
export const index = async (req: Request, res: Response) => {
  try {
    const transactions = await OrderModel.find()
      .select(
        "appTransId orderTotalAmount orderStatus orderPaymentStatus orderPaymentMethod createdAt orderBuyerId"
      )
      .populate("orderBuyerId", "fullName email phone")
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    res.json({
      success: true,
      message: "Lấy danh sách tất cả giao dịch thành công",
      data: transactions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách giao dịch",
      error: error.message,
    });
  }
};

// [GET] /admin/pay/detail/:orderId
export const detail = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const transaction = await OrderModel.findById(orderId)
      .populate("orderBuyerId", "fullName email phone")
      .populate("orderItems.shopId", "fullName shopName");

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giao dịch" });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy chi tiết giao dịch",
      error: error.message,
    });
  }
};
