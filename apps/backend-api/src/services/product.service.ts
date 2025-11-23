import { AuctionModel } from "../models/auction.model";
import { ProductModel } from "../models/product.model";
import { CategoryModel } from "../models/category.model";
import { parsePaging } from "../utils/pagination";
import {
  PRODUCT_DELETED,
  PRODUCT_STATUS,
} from "../constants/product.constants";

const getAvailableFilter = () => ({
  productDeleted: PRODUCT_DELETED.NO,
  productStatus: PRODUCT_STATUS.ACTIVE,
  productQuantity: { $gt: 0 },
});

// --- Product DB helpers -----------------------------------------------------

export async function findProducts(filter: any, skip = 0, limit = 20) {
  const finalFilter = { ...filter, ...getAvailableFilter() };

  return ProductModel.find(finalFilter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function countProducts(filter: any) {
  const finalFilter = { ...filter, ...getAvailableFilter() };
  return ProductModel.countDocuments(finalFilter);
}

export async function findProductById(id: string) {
  return ProductModel.findOne({
    _id: id,
    productDeleted: PRODUCT_DELETED.NO,
  }).lean();
}

export async function createProductDoc(payload: any) {
  const doc = new ProductModel(payload);
  await doc.save();
  return doc.toObject();
}

export async function listProductsDB(query: any) {
  const { page, pageSize, skip, limit } = parsePaging(query);

  const filter: any = { ...getAvailableFilter() };

  const [docs, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);
  return { items: docs, page, pageSize, total };
}
