import {
  Schema,
  model,
  models,
  type Types,
  type InferSchemaType,
} from 'mongoose';

export enum ORDER_DELETED {
  NO = 0,
  YES = 1,
}

const OrderSchema = new Schema(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true,
      index: true 
    },
    shopId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',  // assuming shop is also a user with role SHOP
      required: true,
      index: true 
    },
    totalPrice: { 
      type: Number, 
      required: true 
    },
    timePurchase: { 
      type: Date, 
      default: Date.now,
      index: true 
    },
    orderDeleted: {
      type: Number,
      enum: Object.values(ORDER_DELETED),
      default: ORDER_DELETED.NO,
      index: true,
    }
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: Types.ObjectId };
export const Order = models.Order || model('Order', OrderSchema);
export default Order;
