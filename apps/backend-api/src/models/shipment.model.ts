import { Schema, model, models, Types } from 'mongoose';
import { SHIPMENT_STATUS, SHIPMENT_EVENT_CODE } from '../constants/order.constants';

const LocationSchema = new Schema(
  {
    address: { type: String },
    city: { type: String },
    province: { type: String },
    country: { type: String },
    postalCode: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const ShipmentEventSchema = new Schema(
  {
    // store eventCode as Number in DB
    eventCode: { type: Number, enum: Object.values(SHIPMENT_EVENT_CODE) },
    description: { type: String },
    location: { type: LocationSchema, default: undefined },
    eventTime: { type: Date },
    raw: { type: Schema.Types.Mixed },
    hash: { type: String, unique: true }
  },
  { _id: true, timestamps: false }
);

const ShipmentSchema = new Schema(
  {
    courierCode: { type: String, required: true },
    trackingNumber: { type: String },
    currentStatus: { type: Number, enum: Object.values(SHIPMENT_STATUS), default: SHIPMENT_STATUS.UNKNOWN, index: true },
    rawStatus: { type: String },
    providerId: { type: String },
  events: { type: [ShipmentEventSchema], default: [] },
    // optional: raw payload returned by carrier's API for this tracking id
    raw: { type: Schema.Types.Mixed },
    // optional reference: link to an order id (if needed)
    orderId: { type: Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true, collection: 'shipments' }
);

ShipmentSchema.set('toJSON', {
  transform(doc: any, ret: any) {
    // lazy import helpers to avoid cycles
    const { eventCodeValueToName, statusValueToName } = require('../constants/order.constants');
    if (ret.currentStatus !== undefined && ret.currentStatus !== null) {
      ret.currentStatus = statusValueToName(ret.currentStatus);
    }
    if (Array.isArray(ret.events)) {
      ret.events = ret.events.map((e: any) => ({
        ...e,
        eventCode: e.eventCode != null ? eventCodeValueToName(e.eventCode) : null
      }));
    }
    return ret;
  }
});

// compound unique index; sparse so missing trackingNumber doesn't violate uniqueness
ShipmentSchema.index({ courierCode: 1, trackingNumber: 1 }, { unique: true, sparse: true });

export const ShipmentModel = models.Shipment || model('Shipment', ShipmentSchema);
export default ShipmentModel;
