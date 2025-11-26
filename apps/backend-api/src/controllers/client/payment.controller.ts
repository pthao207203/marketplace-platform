import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import moment from "moment";
import { ENV } from "../../config/env";

import { OrderModel } from "../../models/order.model";
import { ProductModel } from "../../models/product.model";
import { UserModel } from "../../models/user.model";

import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "../../constants/order.constants";

const ZALO_ENDPOINT = "https://sb-openapi.zalopay.vn/v2/create";

// TẠO GIAO DỊCH ZALOPAY
export const createZaloPayPayment = async (req: Request, res: Response) => {
  try {
    const { items: reqItems, shippingAddress, shippingFee = 15000 } = req.body;
    const buyerId = res.locals.user?.sub;

    if (!buyerId)
      return res
        .status(401)
        .json({ message: "Lỗi Auth: Không tìm thấy User ID" });
    if (!reqItems || reqItems.length === 0)
      return res.status(400).json({ message: "Giỏ hàng trống" });

    // TÍNH TOÁN TỔNG TIỀN
    const groups: Record<string, any> = {};
    let grandTotal = 0;

    for (const item of reqItems) {
      const product: any = await ProductModel.findById(item.productId);
      if (!product)
        return res
          .status(404)
          .json({ message: `Sản phẩm ${item.productId} không tồn tại` });

      const price = product.productPrice || 0;
      const lineTotal = price * item.qty;
      grandTotal += lineTotal;

      const shopId = product.productShopId
        ? String(product.productShopId)
        : "unknown";
      if (!groups[shopId]) groups[shopId] = { items: [], subtotal: 0 };

      groups[shopId].items.push({
        productId: product._id,
        name: product.productName,
        imageUrl: product.productMedia?.[0] || "",
        price: price,
        qty: item.qty,
        shopId: product.productShopId,
        lineTotal: lineTotal,
      });
      groups[shopId].subtotal += lineTotal;
    }

    const shopKeys = Object.keys(groups);
    grandTotal += shopKeys.length * shippingFee;

    // Làm tròn tiền
    grandTotal = Math.round(grandTotal);

    if (isNaN(grandTotal) || grandTotal <= 0) {
      console.error("Lỗi tính tiền: grandTotal không hợp lệ", grandTotal);
      return res
        .status(400)
        .json({ message: "Lỗi dữ liệu giá sản phẩm (Amount Invalid)" });
    }

    // CHUẨN BỊ DỮ LIỆU GỬI ZALOPAY
    const transID = `${moment().format("YYMMDD")}_${Math.floor(
      Math.random() * 1000000
    )}`;

    const itemsForZalo = "[]";

    let baseUrl = ENV.DOMAIN_BE || "";
    if (baseUrl.startsWith("http://")) {
      baseUrl = baseUrl.replace("http://", "https://");
    }
    if (!baseUrl) baseUrl = "http://localhost:3000";

    const redirectUrl = `${baseUrl}/api/client/payment/result`;
    const callbackUrl = `${baseUrl}/api/client/payment/callback/zalopay`;

    const embed_data = JSON.stringify({ redirecturl: redirectUrl });

    const appIdNumber = Number(ENV.ZALO_APP_ID);

    const orderInfo: any = {
      app_id: appIdNumber,
      app_trans_id: transID,
      app_user: "user123",
      app_time: Date.now(),
      item: itemsForZalo,
      embed_data: embed_data,
      amount: grandTotal,
      description: `Thanh toan don hang #${transID}`,
      bank_code: "",
      callback_url: callbackUrl,
    };

    // Tạo chữ ký MAC
    const data = `${orderInfo.app_id}|${orderInfo.app_trans_id}|${orderInfo.app_user}|${orderInfo.amount}|${orderInfo.app_time}|${orderInfo.embed_data}|${orderInfo.item}`;

    orderInfo.mac = crypto
      .createHmac("sha256", ENV.ZALO_KEY1)
      .update(data)
      .digest("hex");

    console.log("================================================");
    console.log(" DEBUG MAC ZALOPAY:");
    console.log("1. Key1 dùng để tính:", `"${ENV.ZALO_KEY1}"`);
    console.log(
      "2. App ID:",
      orderInfo.app_id,
      `(Type: ${typeof orderInfo.app_id})`
    );
    console.log("3. Amount:", orderInfo.amount);
    console.log("4. Chuỗi Data thô (Raw String):");
    console.log(data);
    console.log("5. MAC tính ra:", orderInfo.mac);
    console.log("================================================");

    // Gọi API ZaloPay
    const response = await axios.post(
      ZALO_ENDPOINT,
      new URLSearchParams(orderInfo).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("ZaloPay Response:", response.data);

    if (response.data.return_code === 1) {
      const orderDocs: any[] = [];
      for (const shopId of shopKeys) {
        const group = groups[shopId];
        orderDocs.push({
          orderBuyerId: buyerId,
          orderSellerIds: shopId !== "unknown" ? [shopId] : [],
          orderItems: group.items,
          orderSubtotal: group.subtotal,
          orderShippingFee: shippingFee,
          orderTotalAmount: group.subtotal + shippingFee,
          orderPaymentMethod: PAYMENT_METHOD.ZALOPAY,
          orderPaymentStatus: PAYMENT_STATUS.PENDING,
          orderStatus: ORDER_STATUS.PENDING,
          orderShippingAddress: shippingAddress,
          appTransId: transID,
        });
      }

      await OrderModel.insertMany(orderDocs);

      const allProductIds = orderDocs.flatMap((o) =>
        o.orderItems.map((i: any) => i.productId)
      );
      await UserModel.updateOne(
        { _id: buyerId },
        { $pull: { cart: { productId: { $in: allProductIds } } } }
      );

      return res.status(200).json({
        appTransId: transID,
        payUrl: response.data.order_url,
      });
    } else {
      return res.status(400).json({
        message: "Tạo giao dịch ZaloPay thất bại",
        detail: response.data,
      });
    }
  } catch (error: any) {
    console.error("Create ZaloPay Error:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server nội bộ", error: error.message });
  }
};

export const callbackZaloPay = async (req: Request, res: Response) => {
  try {
    const { data: dataStr, mac: reqMac } = req.body;
    const computedMac = crypto
      .createHmac("sha256", ENV.ZALO_KEY2)
      .update(dataStr)
      .digest("hex");

    if (reqMac !== computedMac) {
      console.warn("Callback: Invalid MAC");
      return res.json({ return_code: -1, return_message: "mac not equal" });
    }

    const dataJSON = JSON.parse(dataStr);
    const appTransId = dataJSON.app_trans_id;
    console.log(`Callback Success: ${appTransId}`);

    const orders: any[] = await OrderModel.find({ appTransId: appTransId });
    if (!orders || orders.length === 0) {
      return res.json({ return_code: 0, return_message: "Orders not found" });
    }

    for (const order of orders) {
      if (order.orderPaymentStatus === PAYMENT_STATUS.PENDING) {
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
    }
    return res.json({ return_code: 1, return_message: "success" });
  } catch (error: any) {
    console.error("Callback Error:", error);
    return res.json({ return_code: 0, return_message: error.message });
  }
};

export const renderPaymentSuccess = (req: Request, res: Response) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Thanh toán thành công</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    text-align: center; 
                    padding: 40px 20px; 
                    background-color: #f0f2f5; 
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0; 
                }
                .container { 
                    background: white; 
                    padding: 40px 30px; 
                    border-radius: 16px; 
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
                    max-width: 400px; 
                    width: 100%;
                }
                .icon-circle {
                    width: 80px;
                    height: 80px;
                    background-color: #ffead1; 
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                }
                .check-icon {
                    color: #FF9800; 
                    font-size: 40px;
                }
                h1 { 
                    color: #1c1e21; 
                    margin-bottom: 30px; 
                    font-size: 24px;
                }
                .btn { 
                    background-color: #FF9800; 
                    color: white; 
                    padding: 14px 28px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: 600; 
                    display: block; 
                    width: 100%;
                    box-sizing: border-box;
                    transition: background-color 0.2s;
                }
                .btn:active { 
                    background-color: #e58600; 
                    transform: scale(0.98);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon-circle">
                    <span class="check-icon">✓</span>
                </div>
                <h1>Thanh toán thành công!</h1>
                
                <a href="secondchance://" class="btn">QUAY LẠI ỨNG DỤNG</a>
                
            </div>
        </body>
        </html>
    `);
};
