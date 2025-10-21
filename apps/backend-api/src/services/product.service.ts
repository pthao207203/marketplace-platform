import { AuctionModel } from "../models/auction.model";
import { ProductModel } from "../models/product.model";
import { CategoryModel } from "../models/category.model";
import { SuggestionDtoSchema } from "../dto/suggestion.dto";
import { parsePaging } from "../utils/pagination";
import type { HomeResponse } from "@acme/shared-types";
import { PRODUCT_DELETED, PRODUCT_STATUS_LABEL } from "../constants/product.constants";
import type { ProductStatusCode } from "../constants/product.constants";

export async function getHomeData(query: any): Promise<HomeResponse> {
  const { page, pageSize, skip, limit } = parsePaging(query);

  // 1) Đấu giá nổi bật: ưu tiên flag featured; nếu không có → gần kết thúc nhất
  const fByFlag = await AuctionModel.findOne({ featured: true }).sort({ endsAt: 1 }).lean();
  const fByEnds = await AuctionModel.findOne({}).sort({ endsAt: 1 }).lean();
  const featuredAuction = (fByFlag ?? fByEnds) ? {
    id: String((fByFlag ?? fByEnds)!._id),
    title: (fByFlag ?? fByEnds)!.title,
    imageUrl: (fByFlag ?? fByEnds)!.imageUrl ?? "",
    quantity: (fByFlag ?? fByEnds)!.quantity ?? 1,
    currentPrice: (fByFlag ?? fByEnds)!.currentPrice,
    currency: "VND" as const,
    endsAt: (fByFlag ?? fByEnds)!.endsAt.toISOString(),
    condition: (fByFlag ?? fByEnds)!.condition ?? undefined,
    featured: !!(fByFlag ?? fByEnds)!.featured
  } : null;

  // 2) Categories – sắp xếp theo order
  const categoriesDocs = await CategoryModel.find({}).sort({ order: 1, createdAt: 1 }).lean();
  const categories = categoriesDocs.map(c => ({
    id: String(c._id), name: c.name, icon: c.icon, order: c.order
  }));

  // 3) Suggestions – derive from auctions collection and validate using SuggestionDtoSchema (zod)
  // Prefer products for suggestions; fallback to auctions if products empty
  let srcDocs: any[] = [];
  let total: number = 0;
  {
    const res = await Promise.all([
      ProductModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments({})
    ]);
    srcDocs = res[0] as any[];
    total = res[1] as number;
  }
  if (!srcDocs || srcDocs.length === 0) {
    const res = await Promise.all([
      AuctionModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuctionModel.countDocuments({})
    ]);
    srcDocs = res[0] as any[];
    total = res[1] as number;
  }

  // Map product docs to Suggestion DTO shape and validate with zod schema
  const now = Date.now();
  const items = srcDocs.map((p: any) => {
    // productMedia may be an array; use first item as image
    const imageUrl = Array.isArray(p.productMedia) ? (p.productMedia[0] ?? "") : (p.productMedia ?? "");
    // compute average rating from reviews if present
    let rating: number | undefined = undefined;
    if (Array.isArray(p.productReview) && p.productReview.length) {
      const sum = p.productReview.reduce((s: number, r: any) => s + (typeof r.rating === 'number' ? r.rating : 0), 0);
      rating = Math.round((sum / p.productReview.length) * 10) / 10; // one decimal
    }

    const endsInSec = p.productAution?.endsAt ? Math.max(0, Math.floor((new Date(p.productAution.endsAt).getTime() - now) / 1000)) : undefined;

    const dto = {
      id: String(p._id),
      title: p.productName,
      imageUrl: imageUrl ?? "",
  // productStatus is stored as a numeric code; map to human label expected by DTO
  conditionLabel: (typeof p.productStatus === 'number') ? PRODUCT_STATUS_LABEL[p.productStatus as ProductStatusCode] : undefined,
      // ensure quantity is a positive integer; default to 1 when missing/invalid
      quantity: (typeof p.productQuantity === 'number' && Number.isInteger(p.productQuantity) && p.productQuantity > 0) ? p.productQuantity : 1,
      rating: rating ?? undefined,
      endsInSec: endsInSec ?? undefined,
      currentPrice: (typeof p.productPrice === 'number' ? p.productPrice : undefined) ?? 0,
      currency: "VND" as const
    };
    const parsed = SuggestionDtoSchema.safeParse(dto);
    if (!parsed.success) {
      console.warn('SuggestionDto parse failed', { dto, errors: parsed.error.format() });
      return null;
    }
    return parsed.data;
  }).filter((x): x is import("../dto/suggestion.dto").SuggestionDto => x !== null);

  // total count for pagination comes from auctions collection
  console.log(items)
  return {
    featuredAuction,
    categories,
    suggestions: { items, page, pageSize, total }
  };
}

// Helper: given a category id, return array of ids including the category and all descendants
async function collectCategoryAndDescendants(rootId: string) {
  const ids = new Set<string>();
  const queue: string[] = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (ids.has(cur)) continue;
    ids.add(cur);
    // find direct children of cur
    const children = await CategoryModel.find({ parentId: cur }).select('_id').lean();
    for (const c of children) queue.push(String(c._id));
  }
  return Array.from(ids);
}

// --- Admin-like product helpers -------------------------------------------------
export async function listProducts(query: any) {
  const { page, pageSize, skip, limit } = parsePaging(query);
  const filter: any = { productDeleted: PRODUCT_DELETED.NO };

  // If a categoryId is provided, include that category and all its descendants
  if (query && query.categoryId) {
    const rootId = query.categoryId;
    const ids = await collectCategoryAndDescendants(rootId);
    filter.productCategory = { $in: ids };
  }
  const [docs, total] = await Promise.all([
    ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ProductModel.countDocuments(filter)
  ]);

  return { items: docs, page, pageSize, total };
}

export async function createProduct(payload: any) {
  // basic sanitation / defaults
  const doc = new ProductModel({
    productName: payload.productName,
    productDescription: payload.productDescription ?? "",
    productPrice: payload.productPrice ?? 0,
    productUsageTime: payload.productUsageTime ?? null,
    productMedia: Array.isArray(payload.productMedia) ? payload.productMedia : (payload.productMedia ? [payload.productMedia] : []),
    productStatus: payload.productStatus ?? undefined,
    productBrand: payload.productBrand ?? undefined,
    productQuantity: typeof payload.productQuantity === 'number' ? payload.productQuantity : (payload.productQuantity ? Number(payload.productQuantity) : 0),
    productShopId: payload.productShopId ? payload.productShopId : undefined,
    productAution: payload.productAution ?? null,
    productCategory: payload.productCategory ?? undefined
  });

  await doc.save();
  return doc.toObject();
}
