import { Schema, model } from 'mongoose';

const BrandSchema = new Schema({
  name: { type: String, required: true },
  logo: { type: String },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export const BrandModel = model('Brand', BrandSchema);
