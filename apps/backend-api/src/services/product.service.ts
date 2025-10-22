import { AuctionModel } from "../models/auction.model";
import { ProductModel } from "../models/product.model";
import { CategoryModel } from "../models/category.model";
import { parsePaging } from "../utils/pagination";

// --- Product DB helpers -----------------------------------------------------
export async function findProducts(filter: any, skip = 0, limit = 20) {
  return ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
}

export async function countProducts(filter: any) {
  return ProductModel.countDocuments(filter);
}

export async function findProductById(id: string) {
  return ProductModel.findById(id).lean();
}

export async function createProductDoc(payload: any) {
  const doc = new ProductModel(payload);
  await doc.save();
  return doc.toObject();
}

export async function listProductsDB(query: any) {
  const { page, pageSize, skip, limit } = parsePaging(query);
  const filter: any = {};
  const [docs, total] = await Promise.all([
    ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ProductModel.countDocuments(filter)
  ]);
  return { items: docs, page, pageSize, total };
}

