import { Request, Response } from "express";
import { Types } from "mongoose";
import UserModel from "../../models/user.model";
import { USER_ROLE, USER_STATUS } from "../../constants/user.constants";
import { ORDER_STATUS } from "../../constants/order.constants";
import { sendSuccess, sendError } from "../../utils/response";

// GET LIST CUSTOMERS (Danh sách khách hàng)
export const getListCustomers = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      date,
      spentMin,
      spentMax,
      purchased,
      refund,
      page,
      limit,
    } = req.query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const matchStage: any = {
      userRole: USER_ROLE.CUSTOMER,
    };

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
        $lookup: {
          from: "orders",
          let: {
            userIdObj: "$_id",
            userIdStr: { $toString: "$_id" },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$orderBuyerId", "$$userIdObj"] },
                        { $eq: ["$orderBuyerId", "$$userIdStr"] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "orders",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$userName",
          email: "$userMail",
          avatar: "$userAvatar",
          createdAt: 1,
          status: "$userStatus",
          purchased: { $size: "$orders" },

          spent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "o",
                    cond: { $eq: ["$$o.orderStatus", ORDER_STATUS.DELIVERED] },
                  },
                },
                as: "order",
                in: "$$order.orderTotalAmount",
              },
            },
          },

          refund: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "o",
                    cond: {
                      $in: [
                        "$$o.orderStatus",
                        [ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED],
                      ],
                    },
                  },
                },
                as: "order",
                in: "$$order.orderTotalAmount",
              },
            },
          },
        },
      },
    ];

    const matchStats: any = {};
    if (spentMin)
      matchStats.spent = { ...matchStats.spent, $gte: Number(spentMin) };
    if (spentMax)
      matchStats.spent = { ...matchStats.spent, $lte: Number(spentMax) };
    if (purchased) matchStats.purchased = Number(purchased);
    if (refund) matchStats.refund = { $gte: Number(refund) };

    if (Object.keys(matchStats).length > 0) {
      pipeline.push({ $match: matchStats });
    }

    // 5. Sort & Pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNumber }
    );

    const customers = await UserModel.aggregate(pipeline);

    return sendSuccess(res, customers);
  } catch (error: any) {
    console.error("Get Customers Error:", error);
    return sendError(
      res,
      500,
      "Lỗi server lấy danh sách khách hàng",
      error?.message
    );
  }
};

// GET CUSTOMER DETAIL (Chi tiết khách hàng)

export const getCustomerDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "ID khách hàng không hợp lệ");
    }

    const customer = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: "orders",
          let: { userIdObj: "$_id", userIdStr: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$orderBuyerId", "$$userIdObj"] },
                    { $eq: ["$orderBuyerId", "$$userIdStr"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: -1 } },
          ],
          as: "orders",
        },
      },
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
          orders: 1,

          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "o",
                    cond: { $eq: ["$$o.orderStatus", ORDER_STATUS.DELIVERED] },
                  },
                },
                as: "order",
                in: "$$order.orderTotalAmount",
              },
            },
          },

          totalRefunded: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "o",
                    cond: {
                      $in: [
                        "$$o.orderStatus",
                        [ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED],
                      ],
                    },
                  },
                },
                as: "order",
                in: "$$order.orderTotalAmount",
              },
            },
          },
        },
      },
    ]);

    if (!customer || customer.length === 0) {
      return sendError(res, 404, "Không tìm thấy khách hàng");
    }

    return sendSuccess(res, customer[0]);
  } catch (error: any) {
    console.error("Get Customer Detail Error:", error);
    return sendError(res, 500, "Lỗi server", error?.message);
  }
};
