import { Request, Response } from "express";
import UserModel from "../../models/user.model";
import { USER_ROLE } from "../../constants/user.constants";
import { ORDER_STATUS } from "../../constants/order.constants";
import { sendSuccess, sendError } from "../../utils/response";

// GET /admin/customers
export const getListCustomers = async (req: Request, res: Response) => {
  try {
    const { search, status, date, spentMin, spentMax, purchased, refund } =
      req.query;

    // 1. Filter cơ bản cho Role Customer
    const matchStage: any = { userRole: USER_ROLE.CUSTOMER };

    if (search) {
      matchStage.name = { $regex: search, $options: "i" };
    }
    if (status && status !== "all") {
      matchStage.status = status;
    }
    if (date) {
      const start = new Date(date as string);
      const end = new Date(date as string);
      end.setDate(end.getDate() + 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const pipeline: any[] = [
      { $match: matchStage },
      // 2. Lookup Orders
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },
      // 3. Tính toán chỉ số
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          avatar: 1,
          createdAt: 1,
          status: 1,
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

    // 4. Filter nâng cao trên số liệu đã tính
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

    pipeline.push({ $sort: { createdAt: -1 } });

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
