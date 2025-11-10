import {
  Schema,
  model,
  models,
  type Types,
  type InferSchemaType,
} from "mongoose";
import {
  USER_STATUS,
  USER_ROLE,
  USER_DELETED,
} from "../constants/user.constants";

// ===== Subdocuments =====
const AddressSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    label: { type: String },
    country: { type: String },
    province: { type: String },
    ward: { type: String },
    street: { type: String },
    isDefault: { type: Boolean, default: false },
    location: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: true, timestamps: false }
);

const BankSchema = new Schema(
  {
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    swiftCode: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

// A single wallet top-up record (user deposited from bank into app)
const WalletTopUpSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: "VND" },
    // snapshot of bank details used for this top-up (optional)
    bank: { type: BankSchema, default: undefined },
    transactionId: { type: String }, // optional external bank transfer id / reference
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false }
);

// Wallet container: balance and list of top-ups
const WalletSchema = new Schema(
  {
    balance: { type: Number, default: 0 },
    topups: { type: [WalletTopUpSchema], default: [] },
    // optional: last time wallet changed (top-up / deduction)
    updatedAt: { type: Date },
  },
  { _id: false }
);

const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CreatedSchema = new Schema(
  {
    // Object
    by: { type: Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SellerRegistrationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    fullName: { type: String },
    shopName: { type: String },
    idNumber: { type: String },
    idFrontUrl: { type: String },
    idBackUrl: { type: String },
    pickupAddress: {
      address: { type: String },
      city: { type: String },
      province: { type: String },
      postalCode: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { _id: false, timestamps: false }
);

// ===== User Schema =====
const UserSchema = new Schema(
  {
    userName: { type: String, required: true, trim: true },
    userPassword: { type: String, required: true },
    userMail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    userPhone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    userStatus: {
      type: Number,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    userRole: {
      type: Number,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.CUSTOMER,
      index: true,
    },
    userDeleted: {
      type: Number,
      enum: Object.values(USER_DELETED),
      default: USER_DELETED.NO,
      index: true,
    },

    userAddress: { type: [AddressSchema], default: [] },
    userAvatar: { type: String },
    userCreated: { type: CreatedSchema, default: {} },
    // user may have multiple bank accounts
    userBanks: { type: [BankSchema], default: [] },
    userWallet: { type: WalletSchema, default: {} },
    userRate: { type: Number, default: 0 },
    // user comments (reviews) left by buyers for this shop/user
    userComment: {
      type: [
        new Schema(
          {
            by: { type: Schema.Types.ObjectId, ref: "User", required: true },
            rate: { type: Number, required: true, min: 1, max: 5 },
            description: { type: String },
            media: { type: [String], default: [] },
            // optional reference to the order this review is about
            orderId: { type: Schema.Types.ObjectId, ref: "Order" },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true, timestamps: false }
        ),
      ],
      default: [],
    },
    // seller registration (client submits, admin reviews)
    sellerRegistration: {
      type: SellerRegistrationSchema,
      default: { status: "none" },
    },
    userCart: { type: [CartItemSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Tìm kiếm nhanh theo name/mail
UserSchema.index({ userName: "text", userMail: "text" });

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: Types.ObjectId;
};
export const UserModel = models.User || model("User", UserSchema);
