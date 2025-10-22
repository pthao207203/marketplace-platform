import { Schema, model, Types } from "mongoose";
const BidHistorySchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() }
}, { _id: false });

const AuctionSchema = new Schema({
  title: { type: String, required: true },
  imageUrl: String,
  quantity: { type: Number, default: 1 },
  currentPrice: { type: Number, required: true },
  currency: { type: String, default: "VND" },
  endsAt: { type: Date, required: true },
  bidHistory: { type: [BidHistorySchema], default: [] },
  condition: String,
  featured: { type: Boolean, default: false }
}, { timestamps: true });

export type AuctionDoc = typeof AuctionSchema extends infer T ? any : any;
export const AuctionModel = model("Auction", AuctionSchema);
