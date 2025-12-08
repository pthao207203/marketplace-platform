import { Request, Response } from "express";
import { Types } from "mongoose";
import UserModel from "../../models/user.model";
import { USER_ROLE, USER_STATUS } from "../../constants/user.constants";
import { sendSuccess, sendError } from "../../utils/response";

// LOGIC DUYỆT NGƯỜI BÁN (SELLER REGISTRATION)
// GET /admin/users/sellers/pending
export const listSellerApplications = async (req: Request, res: Response) => {
  try {
    const apps = await UserModel.find({
      "sellerRegistration.status": "pending",
    })
      .select("userName userMail sellerRegistration")
      .lean();
    return sendSuccess(res, { items: apps });
  } catch (err: any) {
    console.error("listSellerApplications error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
};

// POST /admin/users/sellers/:id/review
// body: { action: 'approve'|'reject', reason?: string }
export const reviewSellerApplication = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    if (!admin || !admin.sub) return sendError(res, 401, "Unauthorized");

    const userId = req.params.id;
    if (!userId || !Types.ObjectId.isValid(String(userId)))
      return sendError(res, 400, "Invalid user id");

    const body = req.body || {};
    const action = String(body.action || "").toLowerCase();
    const reason = body.reason || null;

    if (!["approve", "reject"].includes(action))
      return sendError(res, 400, "Invalid action");

    const existing = await UserModel.findById(userId)
      .select("sellerRegistration")
      .lean<any>();
    if (!existing) return sendError(res, 404, "User not found");

    if (
      !existing.sellerRegistration ||
      existing.sellerRegistration.status !== "pending"
    ) {
      return sendError(res, 400, "No pending application");
    }

    const update: any = {};
    update["sellerRegistration.status"] =
      action === "approve" ? "approved" : "rejected";
    update["sellerRegistration.reviewedAt"] = new Date();
    update["sellerRegistration.reviewerId"] = new Types.ObjectId(admin.sub);

    if (action === "reject")
      update["sellerRegistration.rejectionReason"] = String(reason || "");

    if (action === "approve") {
      update["userRole"] = USER_ROLE.SHOP;
    } else {
      update["userRole"] = USER_ROLE.CUSTOMER;
    }

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    )
      .select("_id userRole sellerRegistration")
      .lean();

    if (!updated) return sendError(res, 500, "Unable to update user");

    return sendSuccess(res, { ok: true, action });
  } catch (err: any) {
    console.error("reviewSellerApplication error", err);
    return sendError(res, 500, "Server error", err?.message);
  }
};

// LOGIC QUẢN LÝ TRẠNG THÁI (BLOCK/UNBLOCK) - Mới

// PATCH /admin/users/:id/status
// body: { status: 1 | 3 }
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "ID người dùng không hợp lệ");
    }

    if (!Object.values(USER_STATUS).includes(status)) {
      return sendError(res, 400, "Trạng thái không hợp lệ");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { userStatus: status },
      { new: true }
    ).select("_id userStatus userName userMail");

    if (!updatedUser) {
      return sendError(res, 404, "Không tìm thấy người dùng");
    }

    return sendSuccess(res, updatedUser);
  } catch (error: any) {
    console.error("Update User Status Error:", error);
    return sendError(
      res,
      500,
      "Lỗi server cập nhật trạng thái",
      error?.message
    );
  }
};

export default {
  listSellerApplications,
  reviewSellerApplication,
  updateUserStatus,
};
