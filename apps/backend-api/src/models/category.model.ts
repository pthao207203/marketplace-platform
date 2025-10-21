import { Schema, model, Types } from "mongoose";

// Hierarchical Category schema: categories can have an optional parent to form trees
const CategorySchema = new Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  order: { type: Number, default: 0 },
  parentId: { type: Types.ObjectId, ref: 'Category', required: false, default: null }
}, { timestamps: true });

export const CategoryModel = model("Category", CategorySchema);
