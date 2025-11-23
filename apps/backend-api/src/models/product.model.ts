import { Schema, model, models, Types, Document } from "mongoose";
import {
  PRODUCT_STATUS,
  PRODUCT_DELETED,
  PRODUCT_PRICE_TYPE,
} from "../constants/product.constants";

export interface IReview {
  userId?: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface IAuctionSub {
  auctionId?: Types.ObjectId;
  startsAt?: Date;
  endsAt?: Date;
  startingPrice?: number;
}

export interface IOriginProof {
  description?: string;
  images: string[];
}

export interface IProduct extends Document {
  productName: string;
  productDescription?: string;
  productPrice: number;
  productPriceType: number;
  productUsageTime?: number;
  productMedia: string[];
  productStatus: number;
  productQuantity: number;
  productShopId: Types.ObjectId;
  productCategory?: Types.ObjectId;
  productBrand?: Types.ObjectId;
  productReview: IReview[];
  productDeleted: number;
  productAuction?: IAuctionSub;
  productConditionNote?: string;
  productNewPercent?: number;
  productDamagePercent?: number;
  productWarrantyMonths?: number;
  productReturnPolicy?: boolean;
  productHasOrigin?: boolean;
  productOriginLink?: {
    description?: string;
    url?: string;
  };
  originProof?: IOriginProof;

  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    rating: { type: Number, min: 0, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false } // Không tạo _id cho sub-document
);

const AuctionSubSchema = new Schema<IAuctionSub>(
  {
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction" },
    startsAt: Date,
    endsAt: Date,
    startingPrice: Number,
  },
  { _id: false }
);

const OriginProofSchema = new Schema<IOriginProof>(
  {
    description: { type: String },
    images: { type: [String], default: [] },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true },
    productDescription: { type: String },
    productPrice: { type: Number, required: true },
    productPriceType: {
      type: Number,
      enum: Object.values(PRODUCT_PRICE_TYPE),
      default: PRODUCT_PRICE_TYPE.FIXED,
    },
    productUsageTime: { type: Number },
    productMedia: { type: [String], default: [] },
    productStatus: {
      type: Number,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
      index: true,
    },
    productQuantity: { type: Number, default: 0 },

    productShopId: { type: Schema.Types.ObjectId, ref: "User" },
    productCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
      index: true,
    },
    productBrand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: false,
      index: true,
    },
    productReview: { type: [ReviewSchema], default: [] },
    productDeleted: {
      type: Number,
      enum: Object.values(PRODUCT_DELETED),
      default: PRODUCT_DELETED.NO,
      index: true,
    },
    productAuction: { type: AuctionSubSchema, default: null },
    productConditionNote: { type: String, default: "" },
    productNewPercent: { type: Number, min: 0, max: 100, default: 100 },
    productDamagePercent: { type: Number, min: 0, max: 100, default: 0 },
    productWarrantyMonths: { type: Number, min: 0, default: 0 },
    productReturnPolicy: { type: Boolean, default: false },
    productHasOrigin: { type: Boolean, default: false, index: true },

    productOriginLink: {
      description: { type: String },
      url: { type: String },
    },

    originProof: { type: OriginProofSchema, default: undefined },
  },
  {
    timestamps: true,
  }
);

export const ProductModel =
  models.Product || model<IProduct>("Product", ProductSchema);

export default ProductModel;
