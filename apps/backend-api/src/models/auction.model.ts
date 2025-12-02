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
  featured: { type: Boolean, default: false },
  
  // Finalization tracking
  finalState: { 
    type: String, 
    enum: [
      'pending',           // Not finalized yet
      'processing',        // Being processed by finalizer
      'awaiting_confirmation', // Winner determined, waiting for address confirmation
      'paid',              // Order created and paid
      'payment_failed',    // Payment failed
      'no_bids'            // Auction ended with no bids
    ], 
    default: 'pending' 
  },
  finalWinnerId: { type: Types.ObjectId, ref: 'User', required: false },
  finalPrice: { type: Number, required: false },
  finalizedAt: { type: Date, required: false },
  
  // NEW: Link to created order (after winner confirms)
  orderId: { type: Types.ObjectId, ref: 'Order', required: false },
}, { timestamps: true });

export type AuctionDoc = typeof AuctionSchema extends infer T ? any : any;
export const AuctionModel = model("Auction", AuctionSchema);
