import { Schema, model, Types } from "mongoose";
import { NEGOTIATION_STATUS } from "../constants/product.constants";

const NegotiationSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    buyerId: { type: Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Types.ObjectId, ref: "User", required: true },
    offeredPrice: { type: Number, required: true },
    quantity: { type: Number, required: false, default: 1 },
    attemptNumber: { type: Number, required: false, default: 1 },
    status: {
      type: Number,
      enum: Object.values(NEGOTIATION_STATUS),
      default: NEGOTIATION_STATUS.PENDING,
    },
    message: { type: String },
    purchasedAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

export const NegotiationModel = model("Negotiation", NegotiationSchema);

export default NegotiationModel;
