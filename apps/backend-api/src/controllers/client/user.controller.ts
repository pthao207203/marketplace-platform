import type { Request, Response } from "express";
import { UserModel } from "../../models/user.model";
import { sendSuccess, sendError } from "../../utils/response";
import { Types } from "mongoose";
import { toStatusLabel } from "../../utils/user-mapper";
import OrderModel from "../../models/order.model";
import { ProductModel } from "../../models/product.model";
import { hashPassword, verifyPassword } from "../../utils/password";
import { getSystemSettings } from "../../models/systemSettings.model";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/me/profile
export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    type LeanUser = {
      userName?: string;
      userAvatar?: string;
      userMail?: string;
      userPhone?: string;
      userAddress?: { label?: string; [key: string]: any }[];
      userStatus?: string;
      userWallet?: { balance?: number } | null;
    };

    const user = await UserModel.findById(String(userId))
      .select(
        "userName userAvatar userMail userPhone userAddress userStatus userWallet"
      )
      .lean<LeanUser>();

    if (!user) return sendError(res, 404, "User not found");

    // prefer address marked as default; otherwise find label 'Nhà' (case-insensitive); otherwise pick first
    let homeAddress: {
      label?: string;
      isDefault?: boolean;
      [key: string]: any;
    } | null = null;
    if (Array.isArray(user.userAddress) && user.userAddress.length > 0) {
      // 1) default address
      homeAddress =
        user.userAddress.find((a) => Boolean((a as any).isDefault)) || null;
      // 2) label 'Nhà'
      if (!homeAddress) {
        homeAddress =
          user.userAddress.find(
            (a) => (a.label || "").toLowerCase() === "nhà"
          ) || null;
      }
      // 3) first address
      if (!homeAddress) {
        homeAddress = user.userAddress[0] || null;
      }
    }

    const profile = {
      name: user.userName,
      avatar: user.userAvatar,
      mail: user.userMail,
      phone: user.userPhone,
      address: homeAddress,
      status:
        typeof user.userStatus !== "undefined"
          ? toStatusLabel(user.userStatus as any)
          : undefined,
      walletBalance: user.userWallet?.balance ?? 0,
    };

    return sendSuccess(res, profile);
  } catch (err: any) {
    console.error("getMyProfile error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/profile/edit -> profile payload for edit form: name, mail, phone, banks, default address
export async function getProfileForEdit(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const u = await UserModel.findById(String(userId))
      .select("userName userMail userPhone userAddress userBanks")
      .lean<any>();
    if (!u) return sendError(res, 404, "User not found");

    // pick default address same as getMyProfile
    let homeAddress: any = null;
    if (Array.isArray(u.userAddress) && u.userAddress.length > 0) {
      homeAddress =
        u.userAddress.find((a: any) => Boolean(a.isDefault)) ||
        u.userAddress.find(
          (a: any) => (a.label || "").toLowerCase() === "nhà"
        ) ||
        u.userAddress[0] ||
        null;
    }

    // include default bank if any
    const defaultBank = Array.isArray((u as any).userBanks)
      ? (u as any).userBanks.find((b: any) => Boolean(b.isDefault)) || null
      : null;

    const payload = {
      name: u.userName,
      mail: u.userMail,
      phone: u.userPhone,
      banks: defaultBank,
      address: homeAddress,
    };

    return sendSuccess(res, payload);
  } catch (err: any) {
    console.error("getProfileForEdit error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// PATCH /api/me/password/ -> change password (and optionally username)
export async function patchPassword(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const body = req.body || {};
    const { oldPassword, newPassword } = body as {
      oldPassword?: string;
      newPassword?: string;
    };
    if (!oldPassword || !newPassword)
      return sendError(res, 400, "Missing oldPassword or newPassword");

    const user = await UserModel.findById(String(userId))
      .select("userPassword")
      .exec();
    if (!user) return sendError(res, 404, "User not found");

    // verify old password
    const ok = await verifyPassword(
      String(oldPassword),
      String((user as any).userPassword)
    );
    if (!ok) return sendError(res, 401, "Old password is incorrect");

    const updates: any = {};

    // set new password hash
    updates.userPassword = hashPassword(String(newPassword));

    const updated = await UserModel.findByIdAndUpdate(
      String(userId),
      { $set: updates },
      { new: true }
    )
      .select("userName")
      .lean<{ userName?: string } | null>();
    if (!updated) return sendError(res, 500, "Unable to update user");

    return sendSuccess(res, { name: updated.userName });
  } catch (err: any) {
    console.error("patchPassword error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// PATCH /api/me -> update profile fields: name, phone, mail
export async function patchProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const body = req.body || {};
    const { name, phone, mail } = body;
    if (
      typeof name === "undefined" &&
      typeof phone === "undefined" &&
      typeof mail === "undefined"
    ) {
      return sendError(res, 400, "No fields to update");
    }

    const updates: any = {};
    if (typeof name !== "undefined") updates.userName = String(name).trim();
    if (typeof phone !== "undefined") updates.userPhone = String(phone).trim();
    if (typeof mail !== "undefined")
      updates.userMail = String(mail).toLowerCase().trim();

    // uniqueness checks
    if (updates.userMail) {
      const exists = await UserModel.findOne({
        userMail: updates.userMail,
        _id: { $ne: userId },
      }).lean();
      if (exists)
        return sendError(res, 409, "Email already in use", {
          code: "EMAIL_TAKEN",
        });
    }
    if (updates.userPhone) {
      const existsP = await UserModel.findOne({
        userPhone: updates.userPhone,
        _id: { $ne: userId },
      }).lean();
      if (existsP)
        return sendError(res, 409, "Phone already in use", {
          code: "PHONE_TAKEN",
        });
    }

    const updated = await UserModel.findByIdAndUpdate(
      String(userId),
      { $set: updates },
      { new: true }
    )
      .select("userName userMail userPhone")
      .lean<{
        userName?: string;
        userMail?: string;
        userPhone?: string;
      } | null>();
    if (!updated) return sendError(res, 404, "User not found");

    return sendSuccess(res, {
      name: updated.userName,
      mail: updated.userMail,
      phone: updated.userPhone,
    });
  } catch (err: any) {
    console.error("patchProfile error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/addresses
export async function listAddresses(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const u = await UserModel.findById(String(userId))
      .select("userAddress")
      .lean<{ userAddress?: any[] } | null>();
    return sendSuccess(res, { items: u?.userAddress ?? [] });
  } catch (err: any) {
    console.error("listAddresses error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/addresses/:id
export async function getAddress(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    if (
      !userId ||
      !Types.ObjectId.isValid(String(userId)) ||
      !Types.ObjectId.isValid(String(id))
    )
      return sendError(res, 401, "Unauthorized");

    const u = await UserModel.findById(String(userId))
      .select("userAddress")
      .lean<{ userAddress?: any[] } | null>();
    const addr =
      u?.userAddress?.find((a) => String((a as any)._id) === String(id)) ||
      null;
    if (!addr) return sendError(res, 404, "Address not found");
    return sendSuccess(res, addr);
  } catch (err: any) {
    console.error("getAddress error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/me/addresses -> create
export async function createAddress(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const body = req.body || {};
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    // if isDefault true, unset other defaults
    if (body.isDefault) {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { "userAddress.$[].isDefault": false } }
      ).exec();
    }

    const update = await UserModel.findByIdAndUpdate(
      String(userId),
      { $push: { userAddress: body } },
      { new: true }
    ).select("userAddress");

    const added = update?.userAddress?.slice(-1)[0] || null;
    return sendSuccess(res, added, 201);
  } catch (err: any) {
    console.error("createAddress error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// PUT /api/me/addresses/:id -> update
export async function updateAddress(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    const body = req.body || {};
    if (
      !userId ||
      !Types.ObjectId.isValid(String(userId)) ||
      !Types.ObjectId.isValid(String(id))
    )
      return sendError(res, 401, "Unauthorized");
    // PUT semantics: replace entire subdocument with provided payload (only allowed fields)
    const allowed = [
      "name",
      "phone",
      "label",
      "country",
      "province",
      "ward",
      "street",
      "postalCode",
      "isDefault",
      "location",
    ];
    const newAddr: any = {};
    for (const k of allowed) {
      if (k in body) newAddr[k] = body[k];
    }

    // ensure _id is the requested id
    try {
      newAddr._id = new Types.ObjectId(id);
    } catch {
      newAddr._id = id;
    }

    // if setting isDefault true, unset others first
    if (newAddr.isDefault) {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { "userAddress.$[].isDefault": false } }
      ).exec();
    }

    const updated = await UserModel.findOneAndUpdate(
      { _id: userId, "userAddress._id": id } as any,
      { $set: { "userAddress.$[elem]": newAddr } },
      { arrayFilters: [{ "elem._id": new Types.ObjectId(id) }], new: true }
    ).select("userAddress");

    const addr =
      updated?.userAddress?.find((a: any) => String(a._id) === String(id)) ||
      null;
    if (!addr) return sendError(res, 404, "Address not found");
    return sendSuccess(res, addr);
  } catch (err: any) {
    console.error("updateAddress error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// DELETE /api/me/addresses/:id -> remove an address
export async function deleteAddress(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    if (
      !userId ||
      !Types.ObjectId.isValid(String(userId)) ||
      !Types.ObjectId.isValid(String(id))
    )
      return sendError(res, 401, "Unauthorized");

    // Pull the address subdocument by _id
    const result = await UserModel.findByIdAndUpdate(
      String(userId),
      { $pull: { userAddress: { _id: new Types.ObjectId(id) } } },
      { new: true }
    ).select("userAddress");
    const remaining = result?.userAddress ?? [];
    return sendSuccess(res, { items: remaining });
  } catch (err: any) {
    console.error("deleteAddress error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/banks -> list user's bank accounts
export async function listBanks(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");
    const u = await UserModel.findById(String(userId))
      .select("userBanks")
      .lean<{ userBanks?: any[] } | null>();
    return sendSuccess(res, { items: u?.userBanks ?? [] });
  } catch (err: any) {
    console.error("listBanks error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/banks/:id -> get single bank by _id or by bankName (case-insensitive)
export async function getBank(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");
    if (!id || !String(id).trim())
      return sendError(res, 400, "Missing bank id or name");

    const u = await UserModel.findById(String(userId))
      .select("userBanks")
      .lean<{ userBanks?: any[] } | null>();
    const banks = u?.userBanks ?? [];

    // attempt to match by ObjectId first
    let found: any = null;
    if (Types.ObjectId.isValid(String(id))) {
      found = banks.find(
        (b) =>
          String((b as any)._id || b.bankId || "").toLowerCase() ===
          String(id).toLowerCase()
      );
    }

    // fallback: match by bankName (case-insensitive)
    if (!found) {
      found = banks.find(
        (b) =>
          String(b.bankName || b.bankNameSnapshot || "").toLowerCase() ===
          String(id).toLowerCase()
      );
    }

    if (!found) return sendError(res, 404, "Bank account not found");
    return sendSuccess(res, found);
  } catch (err: any) {
    console.error("getBank error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/me/banks -> create bank account
export async function createBank(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const body = req.body || {};
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    // Resolve partner bank from system settings
    const system = (await getSystemSettings()) as any;
    const partnerBanks: any[] = system?.partnerBanks ?? [];

    // find partner by code or name
    let partner: any = null;
    if (body.bankCode)
      partner = partnerBanks.find(
        (p) =>
          String(p.code || "").toLowerCase() ===
          String(body.bankCode).toLowerCase()
      );
    if (!partner && body.bankName)
      partner = partnerBanks.find(
        (p) =>
          String(p.name || "").toLowerCase() ===
          String(body.bankName).toLowerCase()
      );
    if (!partner)
      return sendError(
        res,
        400,
        "Bank provider not recognized. Please provide bankCode or bankName.",
        { code: "BANK_PROVIDER_UNKNOWN" }
      );

    const partnerName = partner.name;

    // Prevent adding more than one account for the same partner bank
    const u = await UserModel.findById(String(userId))
      .select("userBanks")
      .lean<{ userBanks?: any[] } | null>();
    const exists = (u?.userBanks ?? []).some((b) => {
      // match by bankName (current schema) or snapshot fields
      if (
        b.bankName &&
        String(b.bankName).toLowerCase() === String(partnerName).toLowerCase()
      )
        return true;
      if (
        b.bankNameSnapshot &&
        String(b.bankNameSnapshot).toLowerCase() ===
          String(partnerName).toLowerCase()
      )
        return true;
      return false;
    });
    if (exists) {
      return sendError(
        res,
        409,
        "Đã tồn tại tài khoản cho ngân hàng này. Vui lòng xóa tài khoản cũ trước khi thêm.",
        { code: "BANK_DUPLICATE" }
      );
    }

    // Build stored bank doc using bankName (string) schema
    const pushObj: any = {
      bankName: partnerName,
      accountNumber: body.accountNumber,
      accountHolder: body.accountHolder,
      swiftCode: body.swiftCode,
      bankNameSnapshot: partnerName,
      isDefault: Boolean(body.isDefault),
    };

    // if this new bank is default, unset other defaults first
    if (pushObj.isDefault) {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { "userBanks.$[].isDefault": false } }
      ).exec();
    }

    const update = await UserModel.findByIdAndUpdate(
      String(userId),
      { $push: { userBanks: pushObj } },
      { new: true }
    ).select("userBanks");
    const added = update?.userBanks?.slice(-1)[0] || null;
    return sendSuccess(res, added, 201);
  } catch (err: any) {
    console.error("createBank error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// PUT /api/me/banks/:name -> replace bank account matching bankName (case-insensitive)
export async function updateBankByName(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { name } = req.params;
    const body = req.body || {};
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");
    if (!name || !name.trim()) return sendError(res, 400, "Missing bank name");

    // find user's bank by name (case-insensitive)
    const u = await UserModel.findById(String(userId))
      .select("userBanks")
      .lean<{ userBanks?: any[] } | null>();
    const banks = u?.userBanks ?? [];
    const found = banks.find(
      (b) =>
        String(b.bankName || "").toLowerCase() === String(name).toLowerCase()
    );
    if (!found) return sendError(res, 404, "Bank account not found");

    // BankSchema doesn't include an _id (subdocuments only), update by array index instead.
    const allowed = [
      "bankName",
      "accountNumber",
      "accountHolder",
      "swiftCode",
      "isDefault",
    ];
    const newBank: any = {};
    for (const k of allowed) {
      if (k in body) newBank[k] = body[k];
    }

    // if setting this bank to default, unset other defaults first
    if (newBank.isDefault) {
      await UserModel.updateOne(
        { _id: userId },
        { $set: { "userBanks.$[].isDefault": false } }
      ).exec();
    }

    // find index of the matched subdocument
    const idx = banks.findIndex(
      (b) =>
        String(b.bankName || "").toLowerCase() === String(name).toLowerCase()
    );
    if (idx === -1) return sendError(res, 404, "Bank account not found");

    // perform replacement by array index path
    const path = `userBanks.${idx}`;
    const updated = await UserModel.findOneAndUpdate(
      { _id: userId } as any,
      { $set: { [path]: newBank } },
      { new: true }
    ).select("userBanks");

    const bank = updated?.userBanks?.[idx] || null;
    if (!bank) return sendError(res, 404, "Bank account not found");
    return sendSuccess(res, bank);
  } catch (err: any) {
    console.error("updateBankByName error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/wallet/topups -> list bank->wallet topup history
export async function getTopupHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");

    const u = await UserModel.findById(String(userId))
      .select("userWallet.topups")
      .lean<any>();
    const allTopups = Array.isArray(u?.userWallet?.topups)
      ? u.userWallet.topups
      : [];

    // Heuristic: topups from bank have a transactionId or a bank field
    const bankTopups = allTopups
      .filter(
        (t: any) =>
          t &&
          (t.transactionId ||
            t.bank ||
            t.type === "TOPUP" ||
            t.source === "BANK")
      )
      .map((t: any) => ({
        amount: t.amount,
        currency: t.currency ?? "VND",
        time: t.createdAt ?? t.at ?? null,
      }));

    return sendSuccess(res, { items: bankTopups });
  } catch (err: any) {
    console.error("getTopupHistory error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/orders/purchases -> purchase history for buyer
export async function getPurchaseHistory(req: Request, res: Response) {
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

    const filter: any = { orderBuyerId: String(userId) };
    const [orders, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      OrderModel.countDocuments(filter),
    ]);

    const items = (orders || []).map((o: any) => {
      const first =
        Array.isArray(o.orderItems) && o.orderItems.length
          ? o.orderItems[0]
          : null;
      const amount =
        o.orderTotalAmount ??
        o.orderTotal ??
        o.totalAmount ??
        (first ? (first.price ?? 0) * (first.qty ?? 1) : 0);
      return {
        orderId: String(o._id),
        time: o.createdAt ?? null,
        amount,
        firstProduct: first
          ? {
              id: first.productId ? String(first.productId) : undefined,
              name: first.name ?? undefined,
              qty: first.qty ?? 1,
              price: first.price ?? undefined,
              // image will be filled below if missing from embedded item
              image:
                (first.productMedia &&
                  (Array.isArray(first.productMedia)
                    ? first.productMedia[0]
                    : first.productMedia)) ||
                first.media ||
                first.image ||
                first.thumbnail ||
                null,
            }
          : null,
      };
    });

    // find missing product images in batch
    const neededIds = new Set<string>();
    for (const it of items) {
      if (it.firstProduct && !it.firstProduct.image && it.firstProduct.id)
        neededIds.add(it.firstProduct.id);
    }

    if (neededIds.size) {
      const prods = await ProductModel.find({
        _id: { $in: Array.from(neededIds) },
      })
        .select(
          "productMedia productImages productImage media thumbnail productName"
        )
        .lean<any>();
      const map: Record<string, any> = {};
      for (const p of prods) map[String(p._id)] = p;

      for (const it of items) {
        if (it.firstProduct && !it.firstProduct.image && it.firstProduct.id) {
          const p = map[it.firstProduct.id];
          if (p) {
            it.firstProduct.image =
              (Array.isArray(p.productMedia) && p.productMedia[0]) ||
              (Array.isArray(p.productImages) && p.productImages[0]) ||
              p.productImage ||
              (Array.isArray(p.media) && p.media[0]) ||
              p.thumbnail ||
              null;
            // fill name when missing
            if (!it.firstProduct.name && p.productName)
              it.firstProduct.name = p.productName;
          }
        }
      }
    }

    return sendSuccess(res, { page, pageSize, total, items });
  } catch (err: any) {
    console.error("getPurchaseHistory error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// GET /api/me/wallet/received -> money received: refunds credited + order payments for shop
export async function getReceivedHistory(req: Request, res: Response) {
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

    // refunds from wallet topups
    const u = await UserModel.findById(String(userId))
      .select("userWallet.topups")
      .lean<any>();
    const allTopups = Array.isArray(u?.userWallet?.topups)
      ? u.userWallet.topups
      : [];
    const refundTopups = allTopups
      .filter(
        (t: any) =>
          t &&
          (t.type === "REFUND" ||
            t.source === "REFUND" ||
            String(t.transactionId || "")
              .toLowerCase()
              .includes("refund"))
      )
      .map((t: any) => {
        // detect common places where an order id might be stored on a refund/topup record
        const possibleOrderId =
          t.orderId ||
          t.relatedOrderId ||
          t.refOrderId ||
          (t.meta && (t.meta.orderId || t.meta.relatedOrderId)) ||
          null;
        return {
          type: "refund",
          ref: t.transactionId ?? null,
          orderId: possibleOrderId ? String(possibleOrderId) : null,
          amount: t.amount,
          currency: t.currency ?? "VND",
          time: t.createdAt ?? t.at ?? null,
          // will attach firstProduct.image below when possible
          firstProduct: null as any,
        } as any;
      });

    // orders where this user is seller and payment is completed
    const sellerFilter: any = { orderSellerIds: String(userId) };
    // approximate paid status: orderPaymentStatus or orderPaymentMethod
    const [sellerOrders, totalOrders] = await Promise.all([
      OrderModel.find(sellerFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      OrderModel.countDocuments(sellerFilter),
    ]);

    const orderEntries = (sellerOrders || []).map((o: any) => {
      const first =
        Array.isArray(o.orderItems) && o.orderItems.length
          ? o.orderItems[0]
          : null;
      const amount =
        o.orderTotalAmount ??
        o.orderTotal ??
        o.totalAmount ??
        (first ? (first.price ?? 0) * (first.qty ?? 1) : 0);
      return {
        type: "order_payment",
        orderId: String(o._id),
        time: o.createdAt ?? null,
        amount,
        firstProduct: first
          ? {
              id: first.productId ? String(first.productId) : undefined,
              name: first.name ?? undefined,
              image:
                (first.productMedia &&
                  (Array.isArray(first.productMedia)
                    ? first.productMedia[0]
                    : first.productMedia)) ||
                first.media ||
                first.image ||
                first.thumbnail ||
                null,
            }
          : null,
      };
    });

    // For refunds that reference an orderId, fetch that order's first product id to resolve image
    const refundOrderIds = refundTopups
      .map((r: any) => (r.orderId ? String(r.orderId) : null))
      .filter((x: any) => x);

    const productIdsToFetch = new Set<string>();

    // collect product ids from seller order entries
    for (const e of orderEntries) {
      if (e.firstProduct && e.firstProduct.id)
        productIdsToFetch.add(e.firstProduct.id);
    }

    // map orderId -> first product id for refunds
    const orderFirstProductMap: Record<string, { id?: string; name?: string }> =
      {};
    if (refundOrderIds.length) {
      const ords = await OrderModel.find({ _id: { $in: refundOrderIds } })
        .select("orderItems")
        .lean<any>();
      for (const o of ords) {
        const first =
          Array.isArray(o.orderItems) && o.orderItems.length
            ? o.orderItems[0]
            : null;
        if (first && first.productId) {
          const pid = String(first.productId);
          orderFirstProductMap[String(o._id)] = {
            id: pid,
            name: first.name ?? undefined,
          };
          productIdsToFetch.add(pid);
        }
      }
    }

    // fetch products for all collected ids
    const prodIdsArr = Array.from(productIdsToFetch);
    const prodMap: Record<string, any> = {};
    if (prodIdsArr.length) {
      const prods = await ProductModel.find({ _id: { $in: prodIdsArr } })
        .select(
          "productMedia productImages productImage media thumbnail productName"
        )
        .lean<any>();
      for (const p of prods) prodMap[String(p._id)] = p;
    }

    // attach images to orderEntries
    for (const e of orderEntries) {
      if (e.firstProduct && e.firstProduct.id && !e.firstProduct.image) {
        const p = prodMap[e.firstProduct.id];
        if (p) {
          e.firstProduct.image =
            (Array.isArray(p.productMedia) && p.productMedia[0]) ||
            (Array.isArray(p.productImages) && p.productImages[0]) ||
            p.productImage ||
            (Array.isArray(p.media) && p.media[0]) ||
            p.thumbnail ||
            null;
          if (!e.firstProduct.name && p.productName)
            e.firstProduct.name = p.productName;
        }
      }
    }

    // attach images to refundTopups based on their referenced order
    for (const r of refundTopups) {
      if (r.orderId && orderFirstProductMap[r.orderId]) {
        const info = orderFirstProductMap[r.orderId];
        const pid = info.id as string | undefined;
        if (pid && prodMap[pid]) {
          r.firstProduct = {
            id: pid,
            name: info.name ?? prodMap[pid].productName ?? undefined,
            image:
              (Array.isArray(prodMap[pid].productMedia) &&
                prodMap[pid].productMedia[0]) ||
              (Array.isArray(prodMap[pid].productImages) &&
                prodMap[pid].productImages[0]) ||
              prodMap[pid].productImage ||
              (Array.isArray(prodMap[pid].media) && prodMap[pid].media[0]) ||
              prodMap[pid].thumbnail ||
              null,
          };
        }
      }
    }

    const combined = [...refundTopups, ...orderEntries].sort(
      (a: any, b: any) =>
        (new Date(b.time).getTime() || 0) - (new Date(a.time).getTime() || 0)
    );

    return sendSuccess(res, {
      page,
      pageSize,
      total: totalOrders,
      items: combined,
    });
  } catch (err: any) {
    console.error("getReceivedHistory error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// DELETE /api/me/banks/:name -> delete a bank account by partner bank name (case-insensitive)
export async function deleteBankByName(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    const { name } = req.params;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 401, "Unauthorized");
    if (!name || !name.trim()) return sendError(res, 400, "Missing bank name");

    const system = (await getSystemSettings()) as any;
    const partnerBanks: any[] = system?.partnerBanks ?? [];
    const match = partnerBanks.find(
      (p) => String(p.name || "").toLowerCase() === String(name).toLowerCase()
    );
    if (!match) return sendError(res, 404, "Bank provider not found");

    // remove any userBanks that reference this partner by name (case-insensitive)
    const regex = new RegExp(
      "^" + escapeRegExp(String(name).trim()) + "$",
      "i"
    );
    const result = await UserModel.findByIdAndUpdate(
      String(userId),
      { $pull: { userBanks: { bankName: { $regex: regex } } } },
      { new: true }
    ).select("userBanks");
    const remaining = result?.userBanks ?? [];
    return sendSuccess(res, { items: remaining });
  } catch (err: any) {
    console.error("deleteBankByName error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}

// POST /api/me/become-seller -> submit seller registration application
export async function submitSellerApplication(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, "Unauthorized");

    const body = req.body || {};
    const { fullName, idNumber, idFrontUrl, idBackUrl, pickupAddress } = body;
    if (!fullName || !idNumber || !idFrontUrl || !idBackUrl || !pickupAddress) {
      return sendError(res, 400, "Missing required fields");
    }

    // pickupAddress must be an object
    if (
      typeof pickupAddress !== "object" ||
      Array.isArray(pickupAddress) ||
      pickupAddress === null
    ) {
      return sendError(res, 400, "pickupAddress must be an object");
    }

    // Use atomic update to avoid validating unrelated subdocuments (e.g., userWallet.topups)
    const update = {
      sellerRegistration: {
        status: "pending",
        fullName: String(fullName),
        idNumber: String(idNumber),
        idFrontUrl: String(idFrontUrl),
        idBackUrl: String(idBackUrl),
        pickupAddress: pickupAddress,
        submittedAt: new Date(),
      },
      // do not modify userRole here; remain CUSTOMER until admin approves
    } as any;

    const resUpdate = await UserModel.findByIdAndUpdate(
      String(user.sub),
      { $set: update },
      { new: true }
    )
      .select("_id")
      .lean();
    if (!resUpdate) return sendError(res, 404, "User not found");
    return sendSuccess(res, { ok: true });
  } catch (err: any) {
    console.error("submitSellerApplication error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
}
