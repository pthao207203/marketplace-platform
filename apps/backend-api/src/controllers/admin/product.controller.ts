import { Request, Response } from "express";
import {
  listProductsDB,
  createProductDoc,
} from "../../services/product.service";
import { parsePaging } from "../../utils/pagination";
import { USER_ROLE, USER_ROLE_CODE } from "../../constants/user.constants";
import { sendSuccess, sendError } from "../../utils/response";
import {
  listNegotiationsForProduct,
  respondToNegotiation,
} from "../../services/negotiation.service";
import { UserModel } from "../../models/user.model";
import { ProductModel } from "../../models/product.model";
import { AuctionModel } from "../../models/auction.model";
import {
  PRODUCT_STATUS_LABEL,
  ProductStatusCode,
} from "../../constants/product.constants";
import { BrandModel } from "../../models/brand.model";
import { findCategoriesSorted } from "../../services/category.service";

export async function getProducts(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    // determine role from token payload (support userRole or role)
    const rawRole =
      user && typeof user.userRole !== "undefined"
        ? user.userRole
        : user && user.role;
    function resolveRoleCode(role: any): number {
      if (typeof role === "number") return Number(role);
      if (typeof role === "string") {
        const n = Number(role);
        if (!Number.isNaN(n)) return n;
        const key = String(role).toLowerCase();
        // @ts-ignore
        const mapped = USER_ROLE_CODE[key];
        return typeof mapped === "number" ? mapped : NaN;
      }
      return NaN;
    }
    const roleCode = resolveRoleCode(rawRole);

    if (roleCode === USER_ROLE.ADMIN) {
      const data = await listProductsDB(req.query);
      return sendSuccess(res, data);
    }

    // if shop, only list their products
    if (roleCode === USER_ROLE.SHOP) {
      const shopId = user && user.sub ? String(user.sub) : null;
      const { page, pageSize, skip, limit } = parsePaging(req.query);
      const filter: any = { productShopId: shopId };
      // allow shop to filter by priceType and deleted via query params
      try {
        const q: any = req.query || {};
        if (typeof q.priceType !== "undefined" && q.priceType !== null) {
          const s = String(q.priceType);
          if (s.includes(",")) {
            const arr = s
              .split(",")
              .map((x: string) => Number(x))
              .filter((n: number) => !Number.isNaN(n));
            if (arr.length) filter.productPriceType = { $in: arr };
          } else {
            const n = Number(s);
            if (!Number.isNaN(n)) filter.productPriceType = n;
          }
        }
        if (typeof q.deleted !== "undefined" && q.deleted !== null) {
          const d = String(q.deleted).toLowerCase();
          if (d === "true" || d === "1") filter.productDeleted = 1;
          else if (d === "false" || d === "0") filter.productDeleted = 0;
          else {
            const nd = Number(d);
            if (!Number.isNaN(nd)) filter.productDeleted = nd;
          }
        }
      } catch (e) {
        // ignore parse errors
      }
      const [items, total] = await Promise.all([
        ProductModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);
      // Enrich auction products: fetch auctions for items that reference auctions
      const auctionIds = (items || [])
        .map((p: any) => p.productAuction && p.productAuction.auctionId)
        .filter(Boolean);
      const auctionsMap: Record<string, any> = {};
      if (auctionIds.length) {
        const auctions = await AuctionModel.find({
          _id: { $in: auctionIds },
        }).lean();
        for (const a of auctions) auctionsMap[String(a._id)] = a;
      }

      // map to compact DTO
      const mapped = (items || []).map((p: any) => {
        const isAuction =
          typeof p.productPriceType === "number" && p.productPriceType === 3;
        let price =
          typeof p.productPrice === "number"
            ? p.productPrice
            : p.productAuction?.startingPrice ?? 0;
        let auctionEndsAt: string | undefined = undefined;
        if (isAuction && p.productAuction?.auctionId) {
          const a = auctionsMap[String(p.productAuction.auctionId)];
          if (a) {
            if (typeof a.currentPrice === "number") price = a.currentPrice;
            if (a.endsAt) auctionEndsAt = new Date(a.endsAt).toISOString();
          }
        }

        return {
          id: String(p._id),
          name: p.productName ?? p.title ?? "",
          createdAt: p.createdAt
            ? new Date(p.createdAt).toISOString()
            : undefined,
          quantity:
            typeof p.productQuantity === "number"
              ? p.productQuantity
              : p.quantity ?? 1,
          price,
          thumbnail: Array.isArray(p.productMedia)
            ? p.productMedia[0] ?? null
            : p.productMedia ?? null,
          priceType:
            typeof p.productPriceType === "number"
              ? p.productPriceType === 1
                ? "Giá cố định"
                : p.productPriceType === 2
                ? "Thương lượng"
                : p.productPriceType === 3
                ? "Đấu giá"
                : String(p.productPriceType)
              : undefined,
          auctionEndsAt,
        };
      });
      return sendSuccess(res, { items: mapped, page, pageSize, total });
    }

    return sendError(res, 403, "Insufficient privileges");
  } catch (err: any) {
    console.error("getProducts error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

export async function postProduct(req: Request, res: Response) {
  try {
    // If a user token is provided, prefer its subject as the productShopId
    const user = (req as any).user;
    const payload = { ...req.body };
    if (user && user.sub) {
      payload.productShopId = String(user.sub);
    }
    const created = await createProductDoc(payload);
    return sendSuccess(res, created, 201);
  } catch (err: any) {
    console.error("postProduct error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// Return categories and brands for frontend selection (flat lists)
export async function getProductMeta(req: Request, res: Response) {
  try {
    const [categoriesDocs, brandDocs] = await Promise.all([
      findCategoriesSorted(),
      BrandModel.find({}).sort({ order: 1, name: 1 }).lean(),
    ]);

    const categories = categoriesDocs.map((c: any) => ({
      id: String(c._id),
      name: c.name,
      icon: c.icon,
      order: c.order,
      parentId: c.parentId ? String(c.parentId) : null,
    }));

    const brands = brandDocs.map((b: any) => ({
      id: String(b._id),
      name: b.name,
      logo: b.logo ?? undefined,
      order: b.order,
    }));

    return sendSuccess(res, { categories, brands });
  } catch (err: any) {
    console.error("getProductMeta error", err);
    return sendError(res, 500, "Internal error", err?.message);
  }
}

export async function getProductDetail(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return sendError(res, 400, "Missing product id");
    const p: any = await ProductModel.findById(id);
    if (!p) return sendError(res, 404, "Product not found");

    // role-based access: admin can see any product; shop can only see their own
    const user = (req as any).user;
    const rawRole =
      user && typeof user.userRole !== "undefined"
        ? user.userRole
        : user && user.role;
    function resolveRoleCodeLocal(role: any): number {
      if (typeof role === "number") return Number(role);
      if (typeof role === "string") {
        const n = Number(role);
        if (!Number.isNaN(n)) return n;
        const key = String(role).toLowerCase();
        // @ts-ignore
        const mapped = USER_ROLE_CODE[key];
        return typeof mapped === "number" ? mapped : NaN;
      }
      return NaN;
    }
    const roleCode = resolveRoleCodeLocal(rawRole);
    if (roleCode === USER_ROLE.SHOP) {
      const shopId = user && user.sub ? String(user.sub) : null;
      if (!shopId || String(p.productShopId) !== shopId)
        return sendError(res, 403, "Forbidden");
    } else if (roleCode !== USER_ROLE.ADMIN) {
      return sendError(res, 403, "Insufficient privileges");
    }

    const product: any = {
      id: String(p._id),
      name: p.productName ?? p.title ?? "",
      description: p.productDescription ?? p.description ?? "",
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
      quantity:
        typeof p.productQuantity === "number"
          ? p.productQuantity
          : p.quantity ?? 1,
      condition:
        typeof p.productStatus === "number"
          ? PRODUCT_STATUS_LABEL[p.productStatus as ProductStatusCode]
          : undefined,
      sellerId: p.productShopId ? String(p.productShopId) : undefined,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
      originProof:
        p.originProof && Object.keys(p.originProof).length
          ? p.originProof
          : p.productHasOrigin
          ? { images: Array.isArray(p.productMedia) ? p.productMedia : [] }
          : undefined,
      originUrl: Array.isArray(p.productMedia)
        ? p.productMedia[0] ?? null
        : p.productMedia ?? null,
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
      priceTypeLabel:
        typeof p.productPriceType === "number"
          ? p.productPriceType === 1
            ? "Giá cố định"
            : p.productPriceType === 2
            ? "Thương lượng"
            : p.productPriceType === 3
            ? "Đấu giá"
            : String(p.productPriceType)
          : undefined,
    };

    // attach seller basic info (non-fatal)
    try {
      if (product.sellerId) {
        const seller = await UserModel.findById(product.sellerId)
          .select("_id userName userAvatar sellerRegistration.shopName")
          .lean<any>();
        if (seller)
          product.seller = {
            id: String(seller._id),
            userName: seller.userName,
            userAvatar: seller.userAvatar,
            shopName: seller.sellerRegistration?.shopName,
          };
      }
    } catch (err) {
      console.warn("getProductDetail: failed to load seller info", err);
    }

    // include negotiable or auction-specific details
    try {
      const priceType = p.productPriceType;
      if (priceType === 2) {
        // negotiable
        try {
          const negs = await listNegotiationsForProduct(String(p._id));
          product.negotiations = negs.map((n: any) => ({
            id: String(n._id),
            buyerId: String(n.buyerId),
            offeredPrice: n.offeredPrice,
            status: n.status,
            message: n.message,
            createdAt: n.createdAt,
          }));
        } catch (err) {
          console.warn("getProductDetail: failed to load negotiations", err);
        }
      } else if (priceType === 3) {
        // auction
        try {
          const auction = await AuctionModel.findById(
            p.productAution?.auctionId
          ).lean();
          if (auction) {
            const bidders = Array.isArray(auction.bidHistory)
              ? auction.bidHistory
              : [];
            const userIds = [
              ...new Set(
                bidders.map((b: any) => String(b.userId)).filter(Boolean)
              ),
            ];
            const users = userIds.length
              ? await UserModel.find({ _id: { $in: userIds } })
                  .select("_id userName userAvatar")
                  .lean()
              : [];
            const usersMap: Record<string, any> = {};
            users.forEach((u: any) => {
              usersMap[String(u._id)] = u;
            });
            product.auction = {
              id: String(auction._id),
              currentPrice: auction.currentPrice,
              endsAt: auction.endsAt,
              finalState: auction.finalState,
              finalWinnerId: auction.finalWinnerId
                ? String(auction.finalWinnerId)
                : undefined,
              bidHistory: bidders.map((b: any) => ({
                userId: String(b.userId),
                amount: b.amount,
                createdAt: b.createdAt,
                bidder: usersMap[String(b.userId)]
                  ? {
                      id: String(usersMap[String(b.userId)]._id),
                      userName: usersMap[String(b.userId)].userName,
                      userAvatar: usersMap[String(b.userId)].userAvatar,
                    }
                  : undefined,
              })),
            };
          }
        } catch (err) {
          console.warn("getProductDetail: failed to load auction info", err);
        }
      }
    } catch (err) {
      console.warn("getProductDetail: enrichment failed", err);
    }

    return sendSuccess(res, product);
  } catch (err: any) {
    console.error("getProductDetail error", err);
    return sendError(res, 500, "Internal error");
  }
}

export async function respondNegotiationHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");
    const negotiationId = req.params.id;
    const action = String(req.body?.action || "").toLowerCase();
    if (!["accept", "reject"].includes(action))
      return sendError(res, 400, "Invalid action");

    const doc = await respondToNegotiation(
      negotiationId,
      String(user.sub),
      action as any
    );
    return sendSuccess(res, { negotiation: doc });
  } catch (err: any) {
    console.error("respondNegotiation error", err);
    return sendError(res, 400, err?.message || "Error");
  }
}

// PUT /api/admin/products/:id -> update product (admin or shop owner)
export async function updateProduct(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return sendError(res, 400, "Missing product id");

    const user = (req as any).user;
    const rawRole =
      user && typeof user.userRole !== "undefined"
        ? user.userRole
        : user && user.role;
    function resolveRoleCodeLocal(role: any): number {
      if (typeof role === "number") return Number(role);
      if (typeof role === "string") {
        const n = Number(role);
        if (!Number.isNaN(n)) return n;
        const key = String(role).toLowerCase();
        // @ts-ignore
        const mapped = USER_ROLE_CODE[key];
        return typeof mapped === "number" ? mapped : NaN;
      }
      return NaN;
    }
    const roleCode = resolveRoleCodeLocal(rawRole);

    const existing = await ProductModel.findById(id).lean<any>();
    if (!existing) return sendError(res, 404, "Product not found");

    if (roleCode === USER_ROLE.SHOP) {
      const shopId = user && user.sub ? String(user.sub) : null;
      if (!shopId || String(existing.productShopId) !== shopId)
        return sendError(res, 403, "Forbidden");
    } else if (roleCode !== USER_ROLE.ADMIN) {
      return sendError(res, 403, "Insufficient privileges");
    }

    const body = req.body || {};
    const allowed = [
      "productName",
      "productDescription",
      "productMedia",
      "productPrice",
      "productPriceType",
      "productQuantity",
      "productCategory",
      "productBrand",
      "productUsageTime",
      "productNewPercent",
      "productDamagePercent",
      "productWarrantyMonths",
      "productReturnPolicy",
      "productConditionNote",
      "productHasOrigin",
      "productOriginLink",
      "originProof",
      "productStatus",
      "productDeleted",
    ];

    const updates: any = {};
    for (const k of allowed) {
      if (k in body) updates[k] = body[k];
    }

    if (Object.keys(updates).length === 0)
      return sendError(res, 400, "No updatable fields provided");

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean<any>();

    return sendSuccess(res, updated);
  } catch (err: any) {
    console.error("updateProduct error", err);
    return sendError(res, 500, "Internal error", err?.message);
  }
}

// POST /api/admin/products/:id/hide -> set productDeleted flag (admin or shop owner)
export async function setProductDeleted(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return sendError(res, 400, "Missing product id");

    const user = (req as any).user;
    const rawRole =
      user && typeof user.userRole !== "undefined"
        ? user.userRole
        : user && user.role;
    function resolveRoleCodeLocal(role: any): number {
      if (typeof role === "number") return Number(role);
      if (typeof role === "string") {
        const n = Number(role);
        if (!Number.isNaN(n)) return n;
        const key = String(role).toLowerCase();
        // @ts-ignore
        const mapped = USER_ROLE_CODE[key];
        return typeof mapped === "number" ? mapped : NaN;
      }
      return NaN;
    }
    const roleCode = resolveRoleCodeLocal(rawRole);

    const existing = await ProductModel.findById(id).lean<any>();
    if (!existing) return sendError(res, 404, "Product not found");

    if (roleCode === USER_ROLE.SHOP) {
      const shopId = user && user.sub ? String(user.sub) : null;
      if (!shopId || String(existing.productShopId) !== shopId)
        return sendError(res, 403, "Forbidden");
    } else if (roleCode !== USER_ROLE.ADMIN) {
      return sendError(res, 403, "Insufficient privileges");
    }

    const d = req.body?.deleted;
    let val = 1;
    if (typeof d !== "undefined") {
      const n = Number(d);
      val = Number.isNaN(n) ? 1 : n;
    }

    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $set: { productDeleted: val } },
      { new: true }
    ).lean<any>();

    return sendSuccess(res, {
      id: String(id),
      productDeleted: updated?.productDeleted,
    });
  } catch (err: any) {
    console.error("setProductDeleted error", err);
    return sendError(res, 500, "Internal error", err?.message);
  }
}
