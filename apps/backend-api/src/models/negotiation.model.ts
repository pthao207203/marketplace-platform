import { Schema, model, Types } from 'mongoose';
import { NEGOTIATION_STATUS } from '../constants/product.constants';

const NegotiationSchema = new Schema({
  productId: { type: Types.ObjectId, ref: 'Product', required: true },
  buyerId: { type: Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: Types.ObjectId, ref: 'User', required: true },
  offeredPrice: { type: Number, required: true },
  status: { type: Number, enum: Object.values(NEGOTIATION_STATUS), default: NEGOTIATION_STATUS.PENDING },
  message: { type: String },
}, { timestamps: true });

export const NegotiationModel = model('Negotiation', NegotiationSchema);

export default NegotiationModel;
