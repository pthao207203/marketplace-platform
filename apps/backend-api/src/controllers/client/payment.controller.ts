import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import moment from "moment";
import { Types } from "mongoose";

import { OrderModel, IOrderItem } from "../../models/order.model";
import { ProductModel } from "../../models/product.model";

import { ENV } from "../../config/env";

import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "../../constants/order.constants";

const ZALO_ENDPOINT = "https://sb-openapi.zalopay.vn/v2/create";

//URL THANH TOÁN (ZaloPay)
export const createZaloPayPayment = async (req: Request, res: Response) => {
  try {
    const { items: reqItems, shippingAddress } = req.body;

    const buyerId = res.locals.user?.sub;

    if (!buyerId) {
      return res.status(401).json({
        message: "Lỗi Auth: Không tìm thấy ID người dùng (sub) trong Token!",
      });
    }
    if (!reqItems || reqItems.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // TÍNH TOÁN ĐƠN HÀNG
    let serverTotalAmount = 0;
    const dbOrderItems: IOrderItem[] = [];
    const sellerIds = new Set<string>();

    for (const item of reqItems) {
      const product: any = await ProductModel.findById(item.productId);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Không tìm thấy sản phẩm ${item.productId}` });
      }
      if (product.productQuantity < item.qty) {
        return res.status(400).json({
          message: `Sản phẩm "${product.productName}" đã hết hàng hoặc không đủ số lượng!`,
        });
      }

      const lineTotal = product.productPrice * item.qty;
      serverTotalAmount += lineTotal;
      sellerIds.add(product.productShopId.toString());

      dbOrderItems.push({
        productId: product._id as Types.ObjectId,
        name: product.productName,
        imageUrl: product.productMedia?.[0] || "",
        price: product.productPrice,
        qty: item.qty,
        shopId: product.productShopId,
        lineTotal: lineTotal,
      });
    }

    // TẠO ĐƠN HÀNG MỚI
    const newOrder = new OrderModel({
      orderBuyerId: buyerId,
      orderSellerIds: Array.from(sellerIds),
      orderItems: dbOrderItems,
      orderSubtotal: serverTotalAmount,
      orderShippingFee: 0,
      orderTotalAmount: serverTotalAmount,

      orderPaymentMethod: PAYMENT_METHOD.ZALOPAY,
      orderPaymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING,

      orderShippingAddress: shippingAddress,
    });

    const transID = `${moment().format("YYMMDD")}_${newOrder._id}`;
    const embed_data = JSON.stringify({
      redirecturl: "http://localhost:5173/checkout/result",
    });

    const zaloItems = JSON.stringify(
      dbOrderItems.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.qty,
      }))
    );

    const orderInfo: any = {
      app_id: ENV.ZALO_APP_ID,
      app_trans_id: transID,
      app_user: buyerId.toString(),
      app_time: Date.now(),
      item: zaloItems,
      embed_data: embed_data,
      amount: newOrder.orderTotalAmount,
      description: `SecondChance - Thanh toan don hang #${newOrder._id}`,
      bank_code: "",
      callback_url: ENV.DOMAIN_BE + "/api/client/payment/callback/zalopay",
    };

    // TẠO CHỮ KÝ
    const data = `${orderInfo.app_id}|${orderInfo.app_trans_id}|${orderInfo.app_user}|${orderInfo.amount}|${orderInfo.app_time}|${orderInfo.embed_data}|${orderInfo.item}`;
    orderInfo.mac = crypto
      .createHmac("sha256", ENV.ZALO_KEY1)
      .update(data)
      .digest("hex");

    // GỌI API ZALOPAY
    const response = await axios.post(ZALO_ENDPOINT, null, {
      params: orderInfo,
    });

    if (response.data.return_code === 1) {
      newOrder.appTransId = transID;
      await newOrder.save();

      return res.status(200).json({
        orderId: newOrder._id,
        payUrl: response.data.order_url,
      });
    } else {
      return res.status(400).json({
        message: "Tạo giao dịch ZaloPay thất bại",
        detail: response.data,
      });
    }
  } catch (error: any) {
    console.error("Lỗi createZaloPayPayment:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server nội bộ", error: error.message });
  }
};

// CALLBACK

export const callbackZaloPay = async (req: Request, res: Response) => {
  try {
    const { data: dataStr, mac: reqMac } = req.body;

    const computedMac = crypto
      .createHmac("sha256", ENV.ZALO_KEY2)
      .update(dataStr)
      .digest("hex");

    if (reqMac !== computedMac) {
      console.warn("Giả mạo Callback!");
      return res.json({ return_code: -1, return_message: "mac not equal" });
    }

    const dataJSON = JSON.parse(dataStr);
    const appTransId = dataJSON.app_trans_id;

    const order: any = await OrderModel.findOne({ appTransId: appTransId });

    if (!order) {
      return res.json({ return_code: 0, return_message: "Order not found" });
    }

    if (order.orderPaymentStatus === PAYMENT_STATUS.PENDING) {
      console.log(`Thanh toán thành công: ${order._id}`);

      order.orderPaymentStatus = PAYMENT_STATUS.PAID;
      order.orderPaymentReference = dataJSON.zp_trans_id;
      await order.save();

      for (const item of order.orderItems) {
        await ProductModel.updateOne(
          { _id: item.productId },
          { $inc: { productQuantity: -item.qty } }
        );
      }
    }
    return res.json({ return_code: 1, return_message: "success" });
  } catch (error: any) {
    console.error("Lỗi callbackZaloPay:", error);
    return res.json({ return_code: 0, return_message: error.message });
  }
};
