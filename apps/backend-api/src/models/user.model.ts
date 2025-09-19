// src/models/user.model.ts
import {
  Schema,
  model,
  models,
  type Types,
  type InferSchemaType,
} from 'mongoose'

// ===== Enums =====
export const UserStatusValues = ['active', 'inactive', 'banned'] as const
export type UserStatus = (typeof UserStatusValues)[number]

export const UserRoleValues = ['guest', 'customer', 'shop', 'admin'] as const
export type UserRole = (typeof UserRoleValues)[number]

export const UserDeletedValues = ['no', 'yes'] as const
export type UserDeleted = (typeof UserDeletedValues)[number]

// ===== Subdocuments =====
const AddressSchema = new Schema(
  {
    // Array(Object)
    label: { type: String }, // ví dụ: "Nhà", "Cty"
    fullName: { type: String },
    phone: { type: String },
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
    // Object
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    branch: String,
    swiftCode: String,
  },
  { _id: false }
)

const CartItemSchema = new Schema(
  {
    // Array(Object)
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
    // PK: _id (ObjectId) do Mongo tự cấp
    userName: { type: String, required: true, trim: true }, // UserName: String
    userPassword: { type: String, required: true }, // UserPassword: String (hash)
    userMail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    }, // UserMail: String
    userPhone: {
      type: Number, // theo bảng là Number; thực tế nên dùng String để giữ số 0 đầu
      unique: true,
      sparse: true,
      index: true,
    }, // UserPhone: Number
    userStatus: {
      type: String,
      enum: UserStatusValues,
      default: 'active',
    }, // UserStatus: Enum
    userAddress: { type: [AddressSchema], default: [] }, // UserAddress: Array(Object)
    userAvatar: { type: String }, // UserAvatar: String (URL)
    userRole: {
      type: String,
      enum: UserRoleValues,
      default: 'customer',
      index: true,
    }, // UserRole: Enum
    userDeleted: {
      type: String,
      enum: UserDeletedValues,
      default: 'no',
    }, // UserDeleted: Enum
    userCreated: { type: CreatedSchema, default: {} }, // UserCreated: Object
    userBank: { type: BankSchema, default: {} }, // UserBank: Object
    userRate: { type: Number, default: 0 }, // UserRate: Number
    userCart: { type: [CartItemSchema], default: [] }, // UserCart: Array(Object)
  },
  {
    timestamps: true, // createdAt/updatedAt
    collection: 'users',
  }
)

// Tìm kiếm nhanh theo name/mail
UserSchema.index({ userName: 'text', userMail: 'text' })

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId }
export const User = models.User || model('User', UserSchema)
export default User
