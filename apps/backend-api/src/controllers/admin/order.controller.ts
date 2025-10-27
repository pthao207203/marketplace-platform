import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import OrderModel from '../../models/order.model';
import ShipmentModel from '../../models/shipment.model';
import { startSimulation } from '../../services/shipment.simulator.service';
import { Types } from 'mongoose';
import axios from 'axios';
import { upsertFromProvider } from '../../utils/shipment-service';
import { ORDER_STATUS } from '../../constants/order.constants';

export async function confirmOrderHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, 'Unauthorized');

    const orderId = req.params.id;
    if (!orderId || !Types.ObjectId.isValid(orderId)) return sendError(res, 400, 'Invalid order id');

    const order: any = await OrderModel.findById(orderId).lean();
    if (!order) return sendError(res, 404, 'Order not found');

    // check that the caller is one of the orderSellerIds
    const sellerId = String(user.sub);
    const isSeller = (order.orderSellerIds || []).some((id: any) => {
      // If id is a Mongo ObjectId, use toHexString() when available, otherwise fallback to String()
      const idHex = id && typeof id.toHexString === 'function' ? id.toHexString() : String(id);
      return idHex === sellerId || String(id) === sellerId;
    });
    if (!isSeller) return sendError(res, 403, 'Forbidden');

    // lock order and mark as SHIPPING
    await OrderModel.updateOne({ _id: orderId }, { $set: { orderStatus: ORDER_STATUS.SHIPPING, orderLocked: true } });

    // create shipment record
    const courierName = process.env.TRACKING_PROVIDER === 'trackingmore' ? 'TRACKINGMORE' : 'SIMULATOR';
    const shipment = await ShipmentModel.create({
      courierCode: courierName,
      currentStatus: 1,
      rawStatus: 'LABEL_CREATED',
      events: [],
      orderId: orderId,
    });

    // If an external tracking service is configured, ask it to create a tracking number
    try {
      const trackingServiceUrl = process.env.TRACKING_SERVICE_URL;
      if (trackingServiceUrl) {
        const callbackUrl = `${process.env.MAIN_APP_URL || 'http://localhost:3000'}/trackingmore`;
        const resp = await axios.post(`${trackingServiceUrl.replace(/\/$/, '')}/create`, {
          orderId,
          carrier: shipment.carrier,
          callbackUrl
        });

        const body = resp.data || {};
        if (body.trackingNumber) {
          shipment.trackingNumber = body.trackingNumber;
          shipment.courierCode = body.courierCode || shipment.carrier;
          await shipment.save();

          if (body.trackingData) {
            try {
              await upsertFromProvider(String(shipment._id), body.trackingData);
            } catch (e) {
              console.error('upsertFromProvider error', e);
            }
          }
        } else {
          console.warn('tracking service did not return trackingNumber', body);
        }
      } else {
        // Fallback: no external service configured — keep existing local behaviour
        // startSimulation below will handle simulation for local provider
      }
    } catch (err: any) {
      console.error('call to tracking service failed', err?.message || err);
    }

    // start local simulation only when not using the real provider
    if (process.env.TRACKING_PROVIDER !== 'trackingmore') {
      startSimulation(String(shipment._id));
    }

    return sendSuccess(res, { shipment, orderId }, 201);
  } catch (err: any) {
    console.error('confirmOrder error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

export default { confirmOrderHandler };
