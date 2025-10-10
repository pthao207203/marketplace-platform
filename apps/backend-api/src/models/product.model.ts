//apps/backend-api/src/models/product.model.ts
import {
  Schema,
  model,
  models,
  type Types,
  type InferSchemaType,
} from 'mongoose';

// ===== Product Schema =====
const ProductSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    productCategory: {
      type: String,
      required: true,
      trim: true,
    },

  },
  {
    timestamps: true, 
    collection: 'products',
  }
);

ProductSchema.index({ productName: 'text', productCategory: 1 });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: Types.ObjectId };

export const Product = models.Product || model('Product', ProductSchema);

export default Product;
