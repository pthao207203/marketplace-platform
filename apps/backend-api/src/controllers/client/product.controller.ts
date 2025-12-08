import { Request, Response } from "express";
import { parsePaging } from "../../utils/pagination";
import { SuggestionDtoSchema } from "../../dto/suggestion.dto";
import type { HomeResponse } from "@acme/shared-types";
import { PRODUCT_STATUS_LABEL } from "../../constants/product.constants";
import type { ProductStatusCode } from "../../constants/product.constants";
import { sendSuccess, sendError } from "../../utils/response";
import { findProducts, countProducts } from "../../services/product.service";
import { findProductById } from "../../services/product.service";
import {
  countAuctions,
  findAuctions,
  findFeaturedAuctionByFlag,
  findNearestEndingAuction,
} from "../../services/auction.service";
import { findCategoriesSorted } from "../../services/category.service";
import { ProductModel, IProduct } from "../../models/product.model"; // Import IProduct
import { BrandModel } from "../../models/brand.model";
import { UserModel } from "../../models/user.model";
import { Types } from "mongoose";
import NegotiationModel from "../../models/negotiation.model";

export async function getHome(req: Request, res: Response) {
  try {
    const { page, pageSize, skip, limit } = parsePaging(req.query);

    // 1) featured auction
    const fByFlag = await findFeaturedAuctionByFlag({});
    const fByEnds = await findNearestEndingAuction({});
    const chosen = fByFlag ?? fByEnds;

    let featuredAuction = null;
    if (chosen) {
      let idToReturn = String(chosen._id);
      try {
        const linked = await ProductModel.findOne({
          "productAuction.auctionId": chosen._id,
        })
          .select("_id")
          .lean<any>();
        if (linked && linked._id) idToReturn = String(linked._id);
      } catch (e) {
        // non-fatal
      }

      featuredAuction = {
        id: idToReturn,
        title: chosen.title,
        imageUrl: chosen.imageUrl ?? "",
        quantity: chosen.quantity ?? 1,
        currentPrice: chosen.currentPrice,
        currency: "VND" as const,
        endsAt: chosen.endsAt
          ? new Date(chosen.endsAt).toISOString()
          : undefined,
        condition: chosen.condition ?? undefined,
        featured: !!chosen.featured,
      };
    }

    // 2) categories
    const categoriesDocs = await findCategoriesSorted();
    const categories = categoriesDocs.map((c: any) => ({
      id: String(c._id),
      name: c.name,
      icon: c.icon,
      order: c.order,
    }));

    // 3) suggestions
    let srcDocs: any[] = [];
    let total = 0;

    const products = await findProducts({}, skip, limit);
    const productsCount = await countProducts({});
    srcDocs = products;
    total = productsCount;

    if (!srcDocs || srcDocs.length === 0) {
      const auctions = await findAuctions({}, skip, limit);
      const auctionsCount = await countAuctions({});
      srcDocs = auctions;
      total = auctionsCount;
    }

    const now = Date.now();
    const items = srcDocs
      .map((doc: any) => {
        const p = doc as any;

        const isProduct =
          !!p.productName ||
          typeof p.productPrice !== "undefined" ||
          p.productAuction;
        let title = "";
        let imageUrl = "";
        let quantity = 1;
        let rating: number | undefined = undefined;
        let endsInSec: number | undefined = undefined;
        let currentPrice = 0;
        let conditionLabel: string | undefined = undefined;

        if (isProduct) {
          title = p.productName ?? "";
          imageUrl = Array.isArray(p.productMedia)
            ? p.productMedia[0] ?? ""
            : p.productMedia ?? "";
          quantity =
            typeof p.productQuantity === "number" &&
            Number.isInteger(p.productQuantity) &&
            p.productQuantity > 0
              ? p.productQuantity
              : 1;
          if (Array.isArray(p.productReview) && p.productReview.length) {
            const sum = p.productReview.reduce(
              (s: number, r: any) =>
                s + (typeof r.rating === "number" ? r.rating : 0),
              0
            );
            rating = Math.round((sum / p.productReview.length) * 10) / 10;
          }
          endsInSec = p.productAuction?.endsAt
            ? Math.max(
                0,
                Math.floor(
                  (new Date(p.productAuction.endsAt).getTime() - now) / 1000
                )
              )
            : undefined;
          currentPrice =
            (typeof p.productPrice === "number" ? p.productPrice : undefined) ??
            0;
          conditionLabel =
            typeof p.productStatus === "number"
              ? PRODUCT_STATUS_LABEL[p.productStatus as ProductStatusCode]
              : undefined;
        } else {
          title = p.title ?? "";
          imageUrl = p.imageUrl ?? "";
          quantity =
            typeof p.quantity === "number" &&
            Number.isInteger(p.quantity) &&
            p.quantity > 0
              ? p.quantity
              : 1;
          currentPrice =
            typeof p.currentPrice === "number" ? p.currentPrice : 0;
          endsInSec = p.endsAt
            ? Math.max(
                0,
                Math.floor((new Date(p.endsAt).getTime() - now) / 1000)
              )
            : undefined;
          conditionLabel = p.condition ?? undefined;
        }

        const dto = {
          id: String(p._id),
          title,
          imageUrl: imageUrl ?? "",
          conditionLabel,
          quantity,
          rating: rating ?? undefined,
          endsInSec: endsInSec ?? undefined,
          currentPrice,
          productPriceType:
            typeof (p as any).productPriceType === "number"
              ? (p as any).productPriceType
              : undefined,
          currency: "VND" as const,
        };

        const parsed = SuggestionDtoSchema.safeParse(dto);
        if (!parsed.success) {
          console.warn("SuggestionDto parse failed", {
            dto,
            errors: parsed.error.format(),
          });
          return null;
        }
        return parsed.data;
      })
      .filter(
        (x): x is import("../../dto/suggestion.dto").SuggestionDto => x !== null
      );

    return sendSuccess(res, {
      featuredAuction,
      categories,
      suggestions: { items, page, pageSize, total },
    });
  } catch (err: any) {
    console.error("getHome error", err);
    return sendError(res, 500, "Internal error");
  }
}

// GET /api/product?page=&pageSize=&name=&city=&rating=&priceMin=&priceMax=&priceType=&categoryId=
export async function getProducts(req: Request, res: Response) {
  try {
    const { page, pageSize, skip, limit } = parsePaging(req.query);

    const q: any = req.query || {};
    const name = q.name ? String(q.name).trim() : undefined;
    // helper to parse multi-valued query params: repeated or comma-separated
    const parseMulti = (val: any): string[] => {
      if (typeof val === "undefined" || val === null) return [];
      if (Array.isArray(val))
        return val
          .flatMap((v) => String(v).split(","))
          .map((s) => s.trim())
          .filter(Boolean);
      return String(val)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const cities = parseMulti(q.city);
    const ratingsRaw = parseMulti(q.rating)
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));
    const priceMin =
      typeof q.priceMin !== "undefined" ? Number(q.priceMin) : undefined;
    const priceMax =
      typeof q.priceMax !== "undefined" ? Number(q.priceMax) : undefined;
    const priceTypes = parseMulti(q.priceType)
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n));
    const categoryIds = parseMulti(q.categoryId);
    const brandIds = parseMulti(q.brandId);
    // support newPercent filter: single values, comma-separated, or ranges like 60-80
    const newPercentRaw = parseMulti(q.newPercent);
    const newPercentRanges: Array<{ min: number; max: number }> = [];
    for (const np of newPercentRaw) {
      if (!np) continue;
      const rangeMatch = String(np).match(/^(\d+)(-(\d+))?$/);
      if (rangeMatch) {
        const min = Number(rangeMatch[1]);
        const max = rangeMatch[3] ? Number(rangeMatch[3]) : 100;
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
          const mn = Math.max(0, Math.min(100, min));
          const mx = Math.max(0, Math.min(100, max));
          newPercentRanges.push({
            min: Math.min(mn, mx),
            max: Math.max(mn, mx),
          });
        }
      } else {
        const v = Number(np);
        if (!Number.isNaN(v))
          newPercentRanges.push({
            min: Math.max(0, Math.min(100, v)),
            max: 100,
          });
      }
    }

    // build aggregation pipeline
    const match: any = {
      productDeleted: { $ne: 1 },
      productStatus: { $ne: 0 },
      productQuantity: { $gt: 0 },
    };

    if (name) {
      match.productName = { $regex: new RegExp(name, "i") };
    }
    if (priceTypes && priceTypes.length) {
      match.productPriceType = { $in: priceTypes };
    }
    if (categoryIds && categoryIds.length) {
      const objIds: any[] = [];
      for (const cid of categoryIds) {
        try {
          objIds.push(new Types.ObjectId(cid));
        } catch (e) {
          // ignore invalid id
        }
      }
      if (objIds.length) match.productCategory = { $in: objIds };
    }

    if (newPercentRanges.length) {
      const orClauses: any[] = newPercentRanges.map((r) => ({
        productNewPercent: { $gte: r.min, $lte: r.max },
      }));
      if (orClauses.length) {
        if (match.$or) match.$or = match.$or.concat(orClauses);
        else match.$or = orClauses;
      }
    }

    // price range handled via $or after lookup (to include auction startingPrice)

    const pipeline: any[] = [{ $match: match }];

    // lookup seller
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "productShopId",
        foreignField: "_id",
        as: "seller",
      },
    });
    pipeline.push({
      $unwind: { path: "$seller", preserveNullAndEmptyArrays: true },
    });

    if (cities && cities.length) {
      pipeline.push({
        $match: {
          "seller.sellerRegistration.pickupAddress.city": { $in: cities },
        },
      });
    }

    if (ratingsRaw && ratingsRaw.length) {
      if (ratingsRaw.length === 1) {
        const r = ratingsRaw[0];
        const lower = Math.max(0, r - 0.5);
        const upper = Math.min(5, r + 0.5);
        pipeline.push({
          $match: { "seller.userRate": { $gte: lower, $lte: upper } },
        });
      } else {
        const orClauses: any[] = [];
        for (const r of ratingsRaw) {
          const lower = Math.max(0, r - 0.5);
          const upper = Math.min(5, r + 0.5);
          orClauses.push({ "seller.userRate": { $gte: lower, $lte: upper } });
        }
        pipeline.push({ $match: { $or: orClauses } });
      }
    }

    // brand filter (supports multiple values)
    if (brandIds && brandIds.length) {
      const bIds: any[] = [];
      for (const bid of brandIds) {
        try {
          bIds.push(new Types.ObjectId(bid));
        } catch (e) {}
      }
      if (bIds.length) match.productBrand = { $in: bIds };
    }

    // name already applied; price range: match either productPrice or productAuction.startingPrice
    if (typeof priceMin === "number" || typeof priceMax === "number") {
      const priceCond: any = { $or: [] };
      const min = typeof priceMin === "number" ? priceMin : 0;
      const max =
        typeof priceMax === "number" ? priceMax : Number.MAX_SAFE_INTEGER;
      priceCond.$or.push({ productPrice: { $gte: min, $lte: max } });
      priceCond.$or.push({
        "productAuction.startingPrice": { $gte: min, $lte: max },
      });
      pipeline.push({ $match: priceCond });
    }

    // project useful fields and compute price/thumbnail
    pipeline.push({
      $project: {
        productName: 1,
        productPrice: 1,
        productPriceType: 1,
        productMedia: 1,
        productCategory: 1,
        productBrand: 1,
        productQuantity: 1,
        productAuction: 1,
        seller: {
          _id: "$seller._id",
          userAvatar: "$seller.userAvatar",
          sellerRegistration: "$seller.sellerRegistration",
          userRate: "$seller.userRate",
        },
        avgRating: {
          $cond: [
            { $gt: [{ $size: "$productReview" }, 0] },
            { $avg: "$productReview.rating" },
            null,
          ],
        },
      },
    });

    // apply name regex again post-lookup for safety if needed (already matched earlier)

    // sort, paginate and facet to get total
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const aggRes = await ProductModel.aggregate(pipeline).exec();
    const itemsRaw =
      aggRes && aggRes[0] && aggRes[0].items ? aggRes[0].items : [];
    const total =
      aggRes && aggRes[0] && aggRes[0].totalCount && aggRes[0].totalCount[0]
        ? aggRes[0].totalCount[0].count
        : 0;

    console.log("Mapped items:", itemsRaw);
    // map to response DTO
    const items = itemsRaw.map((p: any) => {
      const price =
        typeof p.productPrice === "number"
          ? p.productPrice
          : p.productAuction?.startingPrice ?? 0;
      const thumbnail = Array.isArray(p.productMedia)
        ? p.productMedia[0] ?? null
        : p.productMedia ?? null;
      const pickup = p.seller?.sellerRegistration?.pickupAddress;
      const pickupCity = pickup?.city ?? undefined;
      const avgRating =
        typeof p.avgRating === "number"
          ? Math.round(p.avgRating * 10) / 10
          : undefined;
      return {
        id: String(p._id),
        name: p.productName ?? "",
        price,
        priceType: p.productPriceType,
        thumbnail,
        quantity: typeof p.productQuantity === "number" ? p.productQuantity : 1,
        categoryId: p.productCategory ? String(p.productCategory) : undefined,
        brandId: p.productBrand ? String(p.productBrand) : undefined,
        seller: p.seller
          ? {
              id: p.seller._id ? String(p.seller._id) : undefined,
              pickupCity,
              userRate:
                typeof p.seller.userRate === "number"
                  ? p.seller.userRate
                  : undefined,
            }
          : undefined,
        averageRating: avgRating,
      };
    });

    // also return categories for filtering
    const categoriesDocs = await findCategoriesSorted();
    const categories = categoriesDocs.map((c: any) => ({
      id: String(c._id),
      name: c.name,
      icon: c.icon,
    }));

    return sendSuccess(res, { items, page, pageSize, total, categories });
  } catch (err: any) {
    console.error("getProducts error", err);
    return sendError(res, 500, "Internal error");
  }
}

export async function getProductDetail(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return sendError(res, 400, "Missing product id");

    const p = (await findProductById(id)) as any;

    if (!p) return sendError(res, 404, "Product not found");

    const product: any = {
      id: String(p._id),
      name: p.productName ?? "",
      description: p.productDescription ?? "",
      media: Array.isArray(p.productMedia)
        ? p.productMedia
        : p.productMedia
        ? [p.productMedia]
        : [],
      price:
        typeof p.productPrice === "number"
          ? p.productPrice
          : p.productAuction?.startingPrice ?? 0,
      currency: "VND" as const,
      auctionEndsAt:
        typeof p.productPriceType === "number" && p.productPriceType === 3
          ? p.productAuction?.endsAt
            ? new Date(p.productAuction.endsAt).toISOString()
            : undefined
          : undefined,
      quantity: typeof p.productQuantity === "number" ? p.productQuantity : 1,
      condition:
        typeof p.productStatus === "number"
          ? PRODUCT_STATUS_LABEL[p.productStatus as ProductStatusCode]
          : undefined,
      sellerId: (p as any).productShopId
        ? String((p as any).productShopId)
        : undefined,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
      priceType:
        typeof p.productPriceType === "number" ? p.productPriceType : undefined,
      usageTimeMonths:
        typeof p.productUsageTime === "number" ? p.productUsageTime : undefined,
      categoryId: p.productCategory ? String(p.productCategory) : undefined,
      brandId: p.productBrand ? String(p.productBrand) : undefined,
      reviewCount: Array.isArray(p.productReview) ? p.productReview.length : 0,
      averageRating:
        Array.isArray(p.productReview) && p.productReview.length
          ? Math.round(
              (p.productReview.reduce(
                (s: number, r: any) =>
                  s + (typeof r.rating === "number" ? r.rating : 0),
                0
              ) /
                p.productReview.length) *
                10
            ) / 10
          : undefined,
      conditionNote: p.productConditionNote ?? undefined,
      newPercent:
        typeof p.productNewPercent === "number"
          ? p.productNewPercent
          : undefined,
      damagePercent:
        typeof p.productDamagePercent === "number"
          ? p.productDamagePercent
          : undefined,
      warrantyMonths:
        typeof p.productWarrantyMonths === "number"
          ? p.productWarrantyMonths
          : undefined,
      returnPolicy:
        typeof p.productReturnPolicy === "boolean"
          ? p.productReturnPolicy
          : undefined,
      hasOrigin:
        typeof p.productHasOrigin === "boolean"
          ? p.productHasOrigin
          : undefined,
      originLink: (() => {
        // description from stored origin link (if any)
        const description = p.productOriginLink?.description ?? undefined;
        // always return url as array (may be empty)
        let urls: string[] = [];
        if (Array.isArray(p.productMedia) && p.productMedia.length) {
          urls = p.productMedia;
        } else if (typeof p.productMedia === "string" && p.productMedia) {
          urls = [p.productMedia];
        } else if (p.productOriginLink && p.productOriginLink.url) {
          urls = [p.productOriginLink.url];
        }
        return { description, url: urls };
      })(),
      originProof:
        p.originProof && Object.keys(p.originProof).length
          ? p.originProof
          : p.productHasOrigin
          ? { images: Array.isArray(p.productMedia) ? p.productMedia : [] }
          : undefined,
      thumbnail: Array.isArray(p.productMedia)
        ? p.productMedia[0] ?? null
        : p.productMedia ?? null,
    };

    try {
      const sellerId = (p as any).productShopId
        ? String((p as any).productShopId)
        : null;
      if (sellerId) {
        const seller = await UserModel.findById(sellerId)
          .select(
            "_id userAvatar sellerRegistration.shopName sellerRegistration.pickupAddress userComment userRate"
          )
          .lean<any>();
        if (seller) {
          let pickupAddressStr: string | undefined = undefined;
          const pickup = seller.sellerRegistration?.pickupAddress;
          if (pickup) {
            const parts = [pickup.province, pickup.city].filter((x) => !!x);
            if (parts.length) pickupAddressStr = parts.join(", ");
          }

          product.seller = {
            id: String(seller._id),
            userAvatar: seller.userAvatar ?? undefined,
            shopName: seller.sellerRegistration?.shopName ?? undefined,
            userRate:
              typeof seller.userRate === "number" ? seller.userRate : undefined,
            pickupAddress: pickupAddressStr,
          };

          try {
            const comments = Array.isArray(seller.userComment)
              ? seller.userComment
              : [];
            if (comments.length) {
              const first = comments[0];
              const commentObj: any = {
                rate: typeof first.rate === "number" ? first.rate : undefined,
                description: first.description ?? undefined,
                media: Array.isArray(first.media) ? first.media : [],
                createdAt: first.createdAt
                  ? new Date(first.createdAt).toISOString()
                  : undefined,
                by: first.by ? String(first.by) : undefined,
              };

              if (first.by) {
                try {
                  const commenter = await UserModel.findById(String(first.by))
                    .select("userName userAvatar")
                    .lean<any>();
                  if (commenter) {
                    commentObj.byUser = {
                      id: String(commenter._id),
                      name: commenter.userName ?? undefined,
                      avatar: commenter.userAvatar ?? undefined,
                    };
                  }
                } catch (e) {}
              }

              product.seller.firstComment = commentObj;
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("getProductDetail: failed to load seller info", err);
    }
    return sendSuccess(res, product);
  } catch (err: any) {
    console.error("getProductDetail error", err);
    return sendError(res, 500, "Internal error");
  }
}
// GET /api/me/negotiations?status=sent,accepted,rejected,cancelled&page=&pageSize=
export async function listMyNegotiations(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(req.query.pageSize ?? 20))
    );
    const skip = (page - 1) * pageSize;

    const parseMulti = (val: any): string[] => {
      if (typeof val === "undefined" || val === null) return [];
      if (Array.isArray(val))
        return val
          .flatMap((v) => String(v).split(","))
          .map((s) => s.trim())
          .filter(Boolean);
      return String(val)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const rawStatuses = parseMulti(req.query.status);
    const statusMap: Record<string, number> = {
      sent: 1, // pending
      pending: 1,
      accepted: 2,
      rejected: 3,
      cancelled: 4,
      purchased: 5,
    };
    const statuses: number[] = [];
    for (const s of rawStatuses) {
      const key = String(s).toLowerCase();
      if (statusMap[key]) statuses.push(statusMap[key]);
      else {
        const n = Number(s);
        if (!Number.isNaN(n)) statuses.push(n);
      }
    }

    const filter: any = {
      $or: [{ buyerId: String(userId) }, { sellerId: String(userId) }],
    };
    if (statuses.length) filter.status = { $in: statuses };

    const [itemsRaw, total] = await Promise.all([
      NegotiationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      NegotiationModel.countDocuments(filter),
    ]);

    const productIds = Array.from(
      new Set(
        (itemsRaw || []).map((n: any) => String(n.productId)).filter(Boolean)
      )
    );
    const userIds = Array.from(
      new Set(
        (itemsRaw || [])
          .flatMap((n: any) => [String(n.buyerId), String(n.sellerId)])
          .filter(Boolean)
      )
    );

    const [products, users] = await Promise.all([
      productIds.length
        ? ProductModel.find({ _id: { $in: productIds } })
            .select("productName productMedia")
            .lean()
        : Promise.resolve([]),
      userIds.length
        ? UserModel.find({ _id: { $in: userIds } })
            .select("_id userName userAvatar")
            .lean()
        : Promise.resolve([]),
    ]);

    const prodMap: Record<string, any> = {};
    for (const p of products) prodMap[String(p._id)] = p;
    const userMap: Record<string, any> = {};
    for (const u of users) userMap[String(u._id)] = u;

    // fetch current user basic info so we can include it in each item
    let currentUser: any = null;
    try {
      const cu = await UserModel.findById(String(userId))
        .select("userName userAvatar")
        .lean<any>();
      if (cu)
        currentUser = {
          id: String(cu._id),
          name: cu.userName,
          avatar: cu.userAvatar,
        };
    } catch (e) {
      // non-fatal
    }

    const items = await Promise.all(
      (itemsRaw || []).map(async (n: any) => {
        // prefer stored attemptNumber if available, otherwise compute fallback
        let attemptNumber: number;
        if (typeof n.attemptNumber === "number") {
          attemptNumber = Number(n.attemptNumber);
        } else {
          const attempt = await NegotiationModel.countDocuments({
            productId: n.productId,
            buyerId: n.buyerId,
            createdAt: { $lt: n.createdAt },
          });
          attemptNumber = Number(attempt) + 1;
        }

        return {
          id: String(n._id),
          productId: n.productId ? String(n.productId) : undefined,
          productName: n.productId
            ? prodMap[String(n.productId)]?.productName
            : undefined,
          productImage: n.productId
            ? prodMap[String(n.productId)] &&
              Array.isArray(prodMap[String(n.productId)].productMedia)
              ? prodMap[String(n.productId)].productMedia[0]
              : undefined
            : undefined,
          offeredPrice: n.offeredPrice,
          quantity: typeof n.quantity === "number" ? n.quantity : undefined,
          status: n.status,
          createdAt: n.createdAt
            ? new Date(n.createdAt).toISOString()
            : undefined,
          acceptedAt: n.acceptedAt
            ? new Date(n.acceptedAt).toISOString()
            : undefined,
          rejectedAt: n.rejectedAt
            ? new Date(n.rejectedAt).toISOString()
            : undefined,
          attemptNumber,
          isBuyer: String(n.buyerId) === String(userId),
          currentUser,
          counterpart:
            String(n.buyerId) === String(userId)
              ? userMap[String(n.sellerId)]
                ? {
                    id: String(n.sellerId),
                    name: userMap[String(n.sellerId)].userName,
                    avatar: userMap[String(n.sellerId)].userAvatar,
                  }
                : { id: String(n.sellerId) }
              : userMap[String(n.buyerId)]
              ? {
                  id: String(n.buyerId),
                  name: userMap[String(n.buyerId)].userName,
                  avatar: userMap[String(n.buyerId)].userAvatar,
                }
              : { id: String(n.buyerId) },
        };
      })
    );

    return sendSuccess(res, { page, pageSize, total, items });
  } catch (err: any) {
    console.error("listMyNegotiations error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}
