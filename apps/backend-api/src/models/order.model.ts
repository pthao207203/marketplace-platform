import { Schema, model, models, Types } from 'mongoose';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/order.constants';

// Sub-schemas
const OrderItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: 'Product', required: true },
    name: { type: String },
    imageUrl: { type: String },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    shopId: { type: Types.ObjectId, ref: 'User' },
    lineTotal: { type: Number, required: true },
  },
  { _id: true, timestamps: false }
);

const ShippingAddressSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    label: { type: String },
    country: { type: String },
    province: { type: String },
    ward: { type: String },
    street: { type: String },
    postalCode: { type: String },
    location: { lat: Number, lng: Number },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderBuyerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    orderSellerIds: { type: [Types.ObjectId], ref: 'User', default: [] },
    orderItems: { type: [OrderItemSchema], default: [] },
    orderSubtotal: { type: Number, required: true },
    orderShippingFee: { type: Number, default: 0 },
    orderTotalAmount: { type: Number, required: true, index: true },
    orderStatus: { type: Number, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    orderPaymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    orderPaymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
    orderShippingAddress: { type: ShippingAddressSchema, required: true },
    orderNote: { type: String },
    orderPaymentReference: { type: String },
    orderLocked: { type: Boolean, default: false },
    // return/ refund request subdocument
    returnRequest: {
      type: {
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  // media: list of video/image URLs provided by buyer as evidence
  media: { type: [String], default: [] },
        description: { type: String },
        createdAt: { type: Date },
        reviewedAt: { type: Date },
        reviewerId: { type: Types.ObjectId, ref: 'User' },
        rejectionReason: { type: String },
        refundProcessed: { type: Boolean, default: false },
        refundAmount: { type: Number, default: 0 }
      },
      default: undefined
    },
  },
  { timestamps: true, collection: 'orders' }
);

OrderSchema.index({ orderBuyerId: 1, orderTotalAmount: -1 });

export const OrderModel = models.Order || model('Order', OrderSchema);
export default OrderModel;
