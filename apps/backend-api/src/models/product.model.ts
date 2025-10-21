import { Schema, model, Types } from "mongoose";
import { PRODUCT_STATUS, PRODUCT_DELETED } from "../constants/product.constants";

// Product schema following the provided diagram
const ReviewSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: false },
  rating: { type: Number, min: 0, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: () => new Date() }
}, { _id: false });

const AuctionSubSchema = new Schema({
  auctionId: { type: Types.ObjectId, ref: 'Auction' },
  startsAt: Date,
  endsAt: Date,
  startingPrice: Number
}, { _id: false });

const ProductSchema = new Schema({
  // ProductName
  productName: { type: String, required: true },
  // ProductDescription
  productDescription: { type: String },
  // ProductPrice
  productPrice: { type: Number, required: true },
  // ProductUsageTime (in months)
  productUsageTime: { type: Number },
  // ProductMedia: array of media URLs (images/videos)
  productMedia: { type: [String], default: [] },
  // ProductStatus: numeric enum (follow user.model pattern)
  productStatus: { type: Number, enum: Object.values(PRODUCT_STATUS), default: PRODUCT_STATUS.ACTIVE, index: true },
  // ProductQuantity
  productQuantity: { type: Number, default: 0 },
  // ProductShopId (foreign key)
  productShopId: { type: Types.ObjectId, ref: 'User' },
  // ProductCategory (reference to hierarchical category)
  productCategory: { type: Types.ObjectId, ref: 'Category', required: false, index: true },
  // ProductBrand: reference to Brand (e.g., Samsung, iPhone)
  productBrand: { type: Types.ObjectId, ref: 'Brand', required: false, index: true },
  // ProductReview: array of review objects
  productReview: { type: [ReviewSchema], default: [] },
  // ProductDeleted: numeric enum flag (no/yes)
  productDeleted: { type: Number, enum: Object.values(PRODUCT_DELETED), default: PRODUCT_DELETED.NO, index: true },
  // ProductAution: auction related info (optional)
  productAution: { type: AuctionSubSchema, default: null }
}, { timestamps: true });

export const ProductModel = model('Product', ProductSchema);
