import { Schema, model, models } from 'mongoose';

const PendingSignupSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },   // số điện thoại
    name:  { type: String, required: true },
    passwordHash: { type: String, required: true },         // hash sẵn
    otpCode: { type: String, required: true },               // 6 số
    attemptCount: { type: Number, default: 0 },              // số lần nhập sai
    lastSentAt: { type: Date, default: Date.now },           // rate limit resend
    expireAt: { type: Date, default: () => new Date(Date.now() + 10 * 60_000) }, // 10 phút
  },
  { timestamps: true, collection: 'pending_signups' }
);

// TTL: tự xoá khi hết hạn
PendingSignupSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
// Optional: không cho 1 phone có nhiều pending cùng lúc (tùy chọn unique)
PendingSignupSchema.index({ phone: 1 }, { unique: true });

export const PendingSignup = models.PendingSignup || model('PendingSignup', PendingSignupSchema);
export default PendingSignup;