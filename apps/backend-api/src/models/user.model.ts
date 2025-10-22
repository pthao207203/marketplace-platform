import {
  Schema,
  model,
  models,
  type Types,
  type InferSchemaType,
} from 'mongoose'
import {
  USER_STATUS,
  USER_ROLE,
  USER_DELETED,
} from '../constants/user.constants';

// ===== Subdocuments =====
const AddressSchema = new Schema(
  {
    label: { type: String }, // ví dụ: "Nhà", "Cty"
    country: { type: String },
    province: { type: String }, // Tỉnh/TP
    district: { type: String },
    ward: { type: String },
    street: { type: String },
    postalCode: { type: String },
    isDefault: { type: Boolean, default: false },
    location: {
      lat: Number,
      lng: Number,
    },
  },
  { _id: true, timestamps: false }
)

const BankSchema = new Schema(
  {
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    branch: String,
    swiftCode: String,
  },
  { _id: false }
)

// A single wallet top-up record (user deposited from bank into app)
const WalletTopUpSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'VND' },
    // snapshot of bank details used for this top-up (optional)
    bank: { type: BankSchema, default: undefined },
    transactionId: { type: String }, // optional external bank transfer id / reference
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false }
)

// Wallet container: balance and list of top-ups
const WalletSchema = new Schema(
  {
    balance: { type: Number, default: 0 },
    topups: { type: [WalletTopUpSchema], default: [] },
    // optional: last time wallet changed (top-up / deduction)
    updatedAt: { type: Date },
  },
  { _id: false }
)

const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const CreatedSchema = new Schema(
  {
    // Object
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
)

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
    userBank: { type: BankSchema, default: {} },
    userWallet: { type: WalletSchema, default: {} },
    userRate: { type: Number, default: 0 },
    userCart: { type: [CartItemSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Tìm kiếm nhanh theo name/mail
UserSchema.index({ userName: 'text', userMail: 'text' })

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId }
export const User = models.User || model('User', UserSchema)
export default User
