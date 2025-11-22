import { Schema, model, Types } from "mongoose";
import {
  PRODUCT_STATUS,
  PRODUCT_DELETED,
  PRODUCT_PRICE_TYPE,
} from "../constants/product.constants";

// ----- Sub-schemas -----
const ReviewSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: false },
    rating: { type: Number, min: 0, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const AuctionSubSchema = new Schema(
  {
    auctionId: { type: Types.ObjectId, ref: "Auction" },
    startsAt: Date,
    endsAt: Date,
    startingPrice: Number,
  },
  { _id: false }
);

// Minh chứng nguồn gốc
const OriginProofSchema = new Schema(
  {
    description: { type: String }, // mô tả minh chứng
    images: { type: [String], default: [] }, // danh sách link ảnh
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    // ProductName
    productName: { type: String, required: true },
    // ProductDescription
    productDescription: { type: String },
    // ProductPrice
    productPrice: { type: Number, required: true },
    // ProductPriceType: fixed(1) | negotiable(2) | auction(3)
    productPriceType: {
      type: Number,
      enum: Object.values(PRODUCT_PRICE_TYPE),
      default: PRODUCT_PRICE_TYPE.FIXED,
    },
    // ProductUsageTime (in months)
    productUsageTime: { type: Number },
    // ProductMedia: array of media URLs (images/videos)
    productMedia: { type: [String], default: [] },
    // ProductStatus
    productStatus: {
      type: Number,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
      index: true,
    },
    // ProductQuantity
    productQuantity: { type: Number, default: 0 },
    // ProductShopId (foreign key)
    productShopId: { type: Types.ObjectId, ref: "User" },
    // ProductCategory
    productCategory: {
      type: Types.ObjectId,
      ref: "Category",
      required: false,
      index: true,
    },
    // ProductBrand
    productBrand: {
      type: Types.ObjectId,
      ref: "Brand",
      required: false,
      index: true,
    },
    // ProductReview
    productReview: { type: [ReviewSchema], default: [] },
    // ProductDeleted
    productDeleted: {
      type: Number,
      enum: Object.values(PRODUCT_DELETED),
      default: PRODUCT_DELETED.NO,
      index: true,
    },
    // ProductAuction (giữ nguyên trường cũ để tương thích)
    productAuction: { type: AuctionSubSchema, default: null },

    // Tình trạng sản phẩm (ghi chú tổng quát)
    productConditionNote: { type: String, default: "" },

    // Tình trạng mới (%)
    productNewPercent: { type: Number, min: 0, max: 100, default: 100 },

    // Tình trạng hư hỏng (%)
    productDamagePercent: { type: Number, min: 0, max: 100, default: 0 },

    // Chính sách bảo hành (tháng)
    productWarrantyMonths: { type: Number, min: 0, default: 0 },

    // Chính sách đổi trả (true/false)
    productReturnPolicy: { type: Boolean, default: false },

    // Nguồn gốc sản phẩm (true/false)
    productHasOrigin: { type: Boolean, default: false, index: true },

    // Nếu có nguồn gốc: (origin link removed — data will be taken from productMedia)

    // Nếu có nguồn gốc: Minh chứng (mô tả + danh sách link ảnh)
    originProof: { type: OriginProofSchema, default: undefined },
  },
  { timestamps: true }
);

export const ProductModel = model("Product", ProductSchema);
