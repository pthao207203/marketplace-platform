import type { Request, Response } from 'express';
import { Types, default as mongoose } from 'mongoose';
import { sendSuccess, sendError } from '../../utils/response';
import { findProductById } from '../../services/product.service';
import User from '../../models/user.model';
import OrderModel from '../../models/order.model';
import ShipmentModel from '../../models/shipment.model';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, SHIPMENT_STATUS } from '../../constants/order.constants';

type PreviewItem = { productId: string; qty?: number };

// POST /api/orders/preview
export async function previewOrder(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId))) return sendError(res, 401, 'Unauthorized');

    const body = req.body || {};
    const items: PreviewItem[] = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return sendError(res, 400, 'Missing items to preview');

    // Validate productIds and quantities
    const normalized = items.map((it) => ({ productId: String(it.productId), qty: Math.max(1, Number(it.qty) || 1) }));

    // fetch products in parallel
    const proms = normalized.map((it) => findProductById(it.productId));
    const prods = await Promise.all(proms);

    // collect product DTOs and compute totals; group by shop
    const byShop: Record<string, { shopId: string; shopName?: string; items: any[] }> = {};
    let totalPrice = 0;

    for (let i = 0; i < normalized.length; i++) {
      const it = normalized[i];
      const p = prods[i];
      if (!p) continue; // skip missing product

      const price = typeof p.productPrice === 'number' ? p.productPrice : 0;
      const qty = it.qty || 1;
      const lineTotal = price * qty;
      totalPrice += lineTotal;

      const shopId = String(p.productShopId || '');
      const shopKey = shopId || 'unknown';
      if (!byShop[shopKey]) byShop[shopKey] = { shopId: shopId || '', shopName: undefined, items: [] };

      // take first media as thumbnail when available
      const imageUrl = Array.isArray(p.productMedia) ? (p.productMedia[0] ?? '') : (p.productMedia ?? '');
      byShop[shopKey].items.push({
        productId: String(p._id),
        name: p.productName || '',
        shortDescription: p.productDescription || '',
        imageUrl,
        price,
        qty,
        lineTotal,
      });
    }

    // fetch shop names for known shopIds (if any)
    const shopIds = Object.values(byShop).map((s) => s.shopId).filter((id) => id && Types.ObjectId.isValid(String(id)));
    const uniqueShopIds = Array.from(new Set(shopIds));
    if (uniqueShopIds.length) {
      const shops = await User.find({ _id: { $in: uniqueShopIds.map((s) => new Types.ObjectId(s)) } }).select('userName').lean();
      const mapName: Record<string, string> = {};
      for (const s of shops) mapName[String((s as any)._id)] = (s as any).userName || '';
      for (const k of Object.keys(byShop)) {
        const sid = byShop[k].shopId;
        if (sid && mapName[sid]) byShop[k].shopName = mapName[sid];
      }
    }

    // flatten grouped shops into array
    const shopsList = Object.keys(byShop).map((k) => ({ shopId: byShop[k].shopId, shopName: byShop[k].shopName, items: byShop[k].items }));

    // payment methods: wallet and COD
    const paymentMethods = [
      { code: 'WALLET', label: 'Ví của tôi' },
      { code: 'COD', label: 'Thanh toán khi nhận hàng' },
    ];

    // fetch user's addresses
    const u = await User.findById(String(userId)).select('userAddress userWallet').lean<any>();
    const addresses = Array.isArray(u?.userAddress) ? u.userAddress : [];
    const walletBalance = u?.userWallet?.balance ?? 0;

    const resp = {
      items: shopsList,
      paymentMethods,
      addresses,
      totalPrice,
      walletBalance,
    };

    return sendSuccess(res, resp);
  } catch (err: any) {
    console.error('previewOrder error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

// POST /api/orders/place -> create an order and save to DB
export async function placeOrder(req: Request, res: Response) {
  // grandTotal needs to be visible in the catch block in case the transaction aborts
  let grandTotal = 0;

  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId))) return sendError(res, 401, 'Unauthorized');

    const body = req.body || {};
    const items: { productId: string; qty?: number }[] = Array.isArray(body.items) ? body.items : [];
    const paymentMethod = String(body.paymentMethod || '').toLowerCase();
    const shippingAddressId = body.shippingAddressId;
    const shippingAddressObj = body.shippingAddress;

    if (!items.length) return sendError(res, 400, 'Missing items');
    if (!paymentMethod) return sendError(res, 400, 'Missing paymentMethod');
    if (!Object.values(PAYMENT_METHOD).includes(paymentMethod as any)) return sendError(res, 400, 'Invalid paymentMethod');

    // normalize items
    const normalized = items.map((it) => ({ productId: String(it.productId), qty: Math.max(1, Number(it.qty) || 1) }));

    // fetch products and ensure all exist
    const proms = normalized.map((it) => findProductById(it.productId));
    const prods = await Promise.all(proms);
    const missing = normalized.filter((_, i) => !prods[i]).map((it) => it.productId);
    if (missing.length) return sendError(res, 400, 'Some products not found', { missing });

    // group items by shopId so we can create one order per shop
    const groups: Record<string, { items: any[]; subtotal: number }> = {};
    for (let i = 0; i < normalized.length; i++) {
      const it = normalized[i];
      const p: any = prods[i];
      const price = typeof p.productPrice === 'number' ? p.productPrice : 0;
      const qty = it.qty || 1;
      const lineTotal = price * qty;

      const imageUrl = Array.isArray(p.productMedia) ? (p.productMedia[0] ?? '') : (p.productMedia ?? '');
      const shopId = p.productShopId ? String(p.productShopId) : 'unknown';
      if (!groups[shopId]) groups[shopId] = { items: [], subtotal: 0 };
      groups[shopId].items.push({
        productId: p._id,
        name: p.productName || '',
        imageUrl,
        price,
        qty,
        shopId: shopId === 'unknown' ? null : shopId,
        lineTotal,
      });
      groups[shopId].subtotal += lineTotal;
    }

    // resolve shipping address: either from user's saved addresses or from provided object
    let shippingAddress: any = null;
    if (shippingAddressId) {
      const u = await User.findById(String(userId)).select('userAddress').lean<any>();
      shippingAddress = (u?.userAddress || []).find((a: any) => String(a._id) === String(shippingAddressId)) || null;
      if (!shippingAddress) return sendError(res, 400, 'Shipping address not found');
    } else if (shippingAddressObj && typeof shippingAddressObj === 'object') {
      shippingAddress = shippingAddressObj;
    } else {
      return sendError(res, 400, 'Missing shipping address');
    }

    // shipping fees: allow per-shop shippingFees map or a single total shippingFee
    const shippingFeesMap = body.shippingFees && typeof body.shippingFees === 'object' ? body.shippingFees : null;
    const totalShippingFee = Number(body.shippingFee || 0) || 0;

    const shopKeys = Object.keys(groups);
    const groupCount = shopKeys.length || 1;

    // distribute shipping fee if no per-shop fees provided
    const computedShippingFees: Record<string, number> = {};
    if (shippingFeesMap) {
      for (const k of shopKeys) computedShippingFees[k] = Number(shippingFeesMap[k] || 0) || 0;
    } else if (totalShippingFee > 0) {
      const base = Math.floor(totalShippingFee / groupCount);
      let remainder = totalShippingFee - base * groupCount;
      for (let i = 0; i < shopKeys.length; i++) {
        const k = shopKeys[i];
        computedShippingFees[k] = base + (i === shopKeys.length - 1 ? remainder : 0);
      }
    } else {
      for (const k of shopKeys) computedShippingFees[k] = 0;
    }

    // compute grand total across groups to validate wallet balance
    grandTotal = 0;
    for (const k of shopKeys) {
      grandTotal += (groups[k].subtotal || 0) + (computedShippingFees[k] || 0);
    }

    // if paymentMethod is wallet, check user's wallet balance
    let walletBalance = 0;
    if (paymentMethod === PAYMENT_METHOD.WALLET) {
      const ubal = await User.findById(String(userId)).select('userWallet').lean<any>();
      console.log('ubal', ubal);
      walletBalance = ubal?.userWallet?.balance ?? 0;
      if (walletBalance < grandTotal) {
        return sendError(res, 402, 'Insufficient wallet balance', { walletBalance, required: grandTotal });
      }
    }

    // create one order per shop
    const orderDocs: any[] = [];
    for (const k of shopKeys) {
      const group = groups[k];
      const shopId = k === 'unknown' ? null : k;
      const orderObj: any = {
        orderBuyerId: userId,
        orderSellerIds: shopId ? [new Types.ObjectId(shopId)] : [],
        orderItems: group.items,
        orderSubtotal: group.subtotal,
        orderShippingFee: computedShippingFees[k] || 0,
        orderTotalAmount: (group.subtotal || 0) + (computedShippingFees[k] || 0),
        orderStatus: ORDER_STATUS.PENDING,
        orderPaymentMethod: paymentMethod,
        orderPaymentStatus: PAYMENT_STATUS.PENDING,
        orderShippingAddress: shippingAddress,
        orderNote: body.note,
        orderPaymentReference: body.paymentReference,
      };
      orderDocs.push(orderObj);
    }

    // use a transaction so creating orders + deducting wallet happen atomically
    const session = await mongoose.startSession();
    let inserted: any[] = [];
    try {
      await session.withTransaction(async () => {
        // insert orders within session
        inserted = await OrderModel.insertMany(orderDocs, { session });

        // if wallet payment, deduct grand total once and record a negative topup record
        if (paymentMethod === PAYMENT_METHOD.WALLET) {
          const txId = body.paymentReference || `WALLET-TX-${Date.now()}`;
          const deductionRecord: any = {
            amount: -grandTotal,
            currency: 'VND',
            bank: undefined,
            transactionId: txId,
            status: 'completed',
            createdAt: new Date(),
          };

          // conditional update: only deduct if current balance >= grandTotal
          const res = await User.updateOne(
            { _id: userId, 'userWallet.balance': { $gte: grandTotal } },
            {
              $inc: { 'userWallet.balance': -grandTotal },
              $push: { 'userWallet.topups': deductionRecord },
              $set: { 'userWallet.updatedAt': new Date() },
            },
            { session }
          ).exec();

          if (!res.matchedCount && !res.modifiedCount) {
            // balance is insufficient at commit time (race) -> abort
            throw new Error('Insufficient wallet balance at commit time');
          }
        }
      });
    } finally {
      session.endSession();
    }

    return sendSuccess(res, { orders: inserted.map((d: any) => ({ id: String(d._id), order: d })) }, 201);
  } catch (err: any) {
    console.error('placeOrder error', err);
    // If we threw a known insufficient wallet balance error during the transaction,
    // surface it as HTTP 402 (Payment Required) with a helpful payload instead of a 500.
    if (err && typeof err.message === 'string' && err.message.includes('Insufficient wallet balance')) {
      // We don't have the exact balance at commit time (race), but we can return the required amount (grandTotal)
      // so the client knows how much is needed.
      return sendError(res, 402, 'Insufficient wallet balance at commit time', { walletBalance: null, required: grandTotal });
    }

    return sendError(res, 500, 'Server error', err?.message);
  }
}

// POST /api/orders/:id/confirm-delivery
export async function confirmDelivery(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId))) return sendError(res, 401, 'Unauthorized');

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId)) return sendError(res, 400, 'Invalid order id');

    const order: any = await OrderModel.findById(orderId);
    if (!order) return sendError(res, 404, 'Order not found');

    // Only buyer can confirm
    if (String(order.orderBuyerId) !== String(userId)) return sendError(res, 403, 'Forbidden');

    // find shipment linked to order (if any)
    const shipment: any = await ShipmentModel.findOne({ orderId: order._id });
    if (!shipment) return sendError(res, 400, 'No shipment found for this order');

    // ensure shipment is delivered
    if (shipment.currentStatus !== undefined && shipment.currentStatus !== null && shipment.currentStatus !== SHIPMENT_STATUS.DELIVERED) {
      return sendError(res, 400, 'Shipment not delivered yet');
    }
    
    // mark order as delivered
    await OrderModel.updateOne({ _id: order._id }, { $set: { orderStatus: ORDER_STATUS.DELIVERED } });

    return sendSuccess(res, { ok: true });
  } catch (err: any) {
    console.error('confirmDelivery error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

// POST /api/orders/:id/rate -> buyer rates the shop after delivery
export async function rateShop(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId))) return sendError(res, 401, 'Unauthorized');

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(String(orderId))) return sendError(res, 400, 'Invalid order id');

    const body = req.body || {};
    const rate = Number(body.rate || 0);
    const description = String(body.description || '').trim();
    const media = Array.isArray(body.media) ? body.media.filter((m: any) => typeof m === 'string') : [];

    if (!rate || rate < 1 || rate > 5) return sendError(res, 400, 'Invalid rate value');

    // fetch order and verify buyer and status
    const order = await OrderModel.findById(orderId).exec();
    if (!order) return sendError(res, 404, 'Order not found');
    if (String(order.orderBuyerId) !== String(userId)) return sendError(res, 403, 'Not the buyer of this order');
    if (order.orderStatus !== ORDER_STATUS.DELIVERED) return sendError(res, 400, 'Order not delivered yet');

    // determine seller(s) for this order - we only support one seller per order in current model
    const sellerIds = Array.isArray(order.orderSellerIds) ? order.orderSellerIds : [];
    if (!sellerIds.length) return sendError(res, 400, 'No seller associated with this order');

    const sellerId = String(sellerIds[0]);

    // append review to seller userComment and recompute userRate
    const comment = { by: new Types.ObjectId(userId), rate, description, media, createdAt: new Date() } as any;

    const seller = await User.findById(sellerId).exec();
    if (!seller) return sendError(res, 404, 'Seller not found');

    seller.userComment = Array.isArray(seller.userComment) ? seller.userComment : [];
    seller.userComment.push(comment);

    // recompute average
    const sum = (seller.userComment || []).reduce((acc: number, c: any) => acc + (Number(c.rate) || 0), 0);
    const avg = (seller.userComment.length && sum > 0) ? sum / seller.userComment.length : 0;
    seller.userRate = Math.round((avg + Number.EPSILON) * 100) / 100; // round to 2 decimals

    await seller.save();

    return sendSuccess(res, { ok: true });
  } catch (err: any) {
    console.error('rateShop error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}
