import { Request, Response } from "express";
import { Types } from "mongoose";
import UserModel from "../../models/user.model";
import { USER_ROLE } from "../../constants/user.constants";
import { sendSuccess, sendError } from "../../utils/response";

// 1. GET LIST ADMINS (Danh sách)
export const getListAdmins = async (req: Request, res: Response) => {
  try {
    const { search, status, date, page, limit } = req.query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const matchStage: any = { userRole: USER_ROLE.ADMIN };

    if (search) {
      matchStage.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userMail: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      const numericStatus = Number(status);
      if (!isNaN(numericStatus)) {
        matchStage.userStatus = numericStatus;
      }
    }

    if (date) {
      const start = new Date(date as string);
      const end = new Date(date as string);
      end.setDate(end.getDate() + 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          name: "$userName",
          email: "$userMail",
          phone: "$userPhone",
          avatar: "$userAvatar",
          createdAt: 1,
          status: "$userStatus",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNumber },
    ];

    const admins = await UserModel.aggregate(pipeline);
    return sendSuccess(res, admins);
  } catch (error: any) {
    console.error("Get Admins Error:", error);
    return sendError(res, 500, "Lỗi server", error?.message);
  }
};

// 2. GET ADMIN DETAIL (Chi tiết Admin )
export const getAdminDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "ID không hợp lệ");
    }

    const admin = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(id), userRole: USER_ROLE.ADMIN } },

      {
        $project: {
          _id: 1,
          name: "$userName",
          email: "$userMail",
          phone: "$userPhone",
          avatar: "$userAvatar",
          address: "$userAddress",
          bankAccounts: "$userBanks",
          joinedDate: "$createdAt",
          status: "$userStatus",
        },
      },
    ]);

    if (!admin || admin.length === 0) {
      return sendError(res, 404, "Không tìm thấy quản trị viên");
    }

    return sendSuccess(res, admin[0]);
  } catch (error: any) {
    console.error("Get Admin Detail Error:", error);
    return sendError(res, 500, "Lỗi server", error?.message);
  }
};
