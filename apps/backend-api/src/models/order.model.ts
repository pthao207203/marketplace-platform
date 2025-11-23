import { Schema, model, models, Types, Document } from "mongoose";
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "../constants/order.constants";

export interface IOrderItem {
  productId: Types.ObjectId;
  name?: string;
  imageUrl?: string;
  price: number;
  qty: number;
  shopId?: Types.ObjectId;
  lineTotal: number;
}

export interface IShippingAddress {
  name?: string;
  phone?: string;
  label?: string;
  country?: string;
  province?: string;
  ward?: string;
  street?: string;
  postalCode?: string;
  location?: { lat: number; lng: number };
}

export interface IOrder extends Document {
  orderBuyerId: Types.ObjectId;
  orderSellerIds: Types.ObjectId[];
  orderItems: IOrderItem[];
  orderSubtotal: number;
  orderShippingFee: number;
  orderTotalAmount: number;

  // Enum status
  orderStatus: number;
  orderPaymentMethod: string;
  orderPaymentStatus: string;

  orderShippingAddress: IShippingAddress;
  orderNote?: string;

  appTransId?: string; // Mã giao dịch của ZaloPay/MoMo
  orderPaymentReference?: string; // Mã tham chiếu

  orderLocked: boolean;
  returnRequest?: {
    status: "pending" | "approved" | "rejected" | "completed";
    media: string[];
    description?: string;
    createdAt?: Date;
    reviewedAt?: Date;
    reviewerId?: Types.ObjectId;
    rejectionReason?: string;
    refundProcessed: boolean;
    refundAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String },
    imageUrl: { type: String },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    shopId: { type: Schema.Types.ObjectId, ref: "User" },
    lineTotal: { type: Number, required: true },
  },
  { _id: true, timestamps: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
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

const OrderSchema = new Schema<IOrder>(
  {
    orderBuyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderSellerIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    orderItems: { type: [OrderItemSchema], default: [] },
    orderSubtotal: { type: Number, required: true },
    orderShippingFee: { type: Number, default: 0 },
    orderTotalAmount: { type: Number, required: true, index: true },

    orderStatus: {
      type: Number,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },

    // Payment Method
    orderPaymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },

    orderPaymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    orderShippingAddress: { type: ShippingAddressSchema, required: true },
    orderNote: { type: String },

    //ZaloPay
    appTransId: { type: String, index: true },

    orderPaymentReference: { type: String },
    orderLocked: { type: Boolean, default: false },

    // return/ refund request subdocument
    returnRequest: {
      type: {
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "completed"],
          default: "pending",
        },
        media: { type: [String], default: [] },
        description: { type: String },
        createdAt: { type: Date },
        reviewedAt: { type: Date },
        reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
        rejectionReason: { type: String },
        refundProcessed: { type: Boolean, default: false },
        refundAmount: { type: Number, default: 0 },
      },
      default: undefined,
    },
  },
  { timestamps: true, collection: "orders" }
);

OrderSchema.index({ orderBuyerId: 1, orderTotalAmount: -1 });

export const OrderModel = models.Order || model<IOrder>("Order", OrderSchema);
export default OrderModel;
