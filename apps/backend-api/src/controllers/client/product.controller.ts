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
import { UserModel } from "../../models/user.model";

export async function getHome(req: Request, res: Response) {
  try {
    const { page, pageSize, skip, limit } = parsePaging(req.query);

    // 1) featured auction: prefer featured flag; else nearest ending
    const fByFlag = await findFeaturedAuctionByFlag({});
    const fByEnds = await findNearestEndingAuction({});
    const chosen = fByFlag ?? fByEnds;
    const featuredAuction = chosen
      ? {
          id: String(chosen._id),
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
        }
      : null;

    // 2) categories
    const categoriesDocs = await findCategoriesSorted();
    const categories = categoriesDocs.map((c: any) => ({
      id: String(c._id),
      name: c.name,
      icon: c.icon,
      order: c.order,
    }));

    // 3) suggestions - prefer products else auctions
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
      .map((p: any) => {
        const isProduct =
          !!p.productName ||
          typeof p.productPrice !== "undefined" ||
          p.productAution;

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
          endsInSec = p.productAution?.endsAt
            ? Math.max(
                0,
                Math.floor(
                  (new Date(p.productAution.endsAt).getTime() - now) / 1000
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

export async function getProductDetail(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return sendError(res, 400, "Missing product id");

    const p = await findProductById(id);
    if (!p) return sendError(res, 404, "Product not found");

    // normalize product shape for client
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
          : p.productAution?.startingPrice ?? 0,
      currency: "VND" as const,
      quantity: typeof p.productQuantity === "number" ? p.productQuantity : 1,
      condition:
        typeof p.productStatus === "number"
          ? PRODUCT_STATUS_LABEL[p.productStatus as ProductStatusCode]
          : undefined,
      sellerId: (p as any).productShopId
        ? String((p as any).productShopId)
        : undefined,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    };

    // include basic seller info when available
    try {
      const sellerId = (p as any).productShopId
        ? String((p as any).productShopId)
        : null;
      if (sellerId) {
        const seller = await UserModel.findById(sellerId)
          .select("_id userAvatar sellerRegistration.shopName")
          .lean<any>();
        if (seller) {
          product.seller = {
            id: String(seller._id),
            userAvatar: seller.userAvatar ?? undefined,
            shopName: seller.sellerRegistration?.shopName ?? undefined,
          };
        }
      }
    } catch (err) {
      // non-fatal: just log and continue without seller info
      console.warn("getProductDetail: failed to load seller info", err);
    }
    return sendSuccess(res, product);
  } catch (err: any) {
    console.error("getProductDetail error", err);
    return sendError(res, 500, "Internal error");
  }
}
