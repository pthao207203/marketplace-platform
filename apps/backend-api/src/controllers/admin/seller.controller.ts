import { Request, Response } from "express";
import { Types } from "mongoose"; // Import thêm Types
import UserModel from "../../models/user.model";
import { USER_ROLE, USER_STATUS } from "../../constants/user.constants";
import { ORDER_STATUS } from "../../constants/order.constants";
import { sendSuccess, sendError } from "../../utils/response";

// GET LIST SELLERS (Danh sách người bán)

export const getListSellers = async (req: Request, res: Response) => {
  try {
    const { search, status, date, revenueMin, revenueMax, page, limit } =
      req.query;

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const matchStage: any = {
      userRole: USER_ROLE.SHOP,
    };

    if (search) {
      matchStage.userName = { $regex: search, $options: "i" };
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
                        { $in: ["$$userIdObj", "$orderSellerIds"] },
                        { $in: ["$$userIdStr", "$orderSellerIds"] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "sales",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$userName",
          email: "$userMail",
          phone: "$userPhone",
          avatar: "$userAvatar",
          createdAt: 1,
          status: "$userStatus",
          totalOrders: { $size: "$sales" },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$sales",
                    as: "s",
                    cond: { $eq: ["$$s.orderStatus", ORDER_STATUS.DELIVERED] },
                  },
                },
                as: "sale",
                in: "$$sale.orderTotalAmount",
              },
            },
          },
        },
      },
    ];

    const matchStats: any = {};
    if (revenueMin)
      matchStats.revenue = { ...matchStats.revenue, $gte: Number(revenueMin) };
    if (revenueMax)
      matchStats.revenue = { ...matchStats.revenue, $lte: Number(revenueMax) };

    if (Object.keys(matchStats).length > 0) {
      pipeline.push({ $match: matchStats });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNumber }
    );

    const sellers = await UserModel.aggregate(pipeline);

    return sendSuccess(res, sellers);
  } catch (error: any) {
    console.error("Get Sellers Error:", error);
    return sendError(
      res,
      500,
      "Lỗi server lấy danh sách người bán",
      error?.message
    );
  }
};

// GET SELLER DETAIL (Chi tiết Shop + Sản phẩm)

export const getSellerDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "ID người bán không hợp lệ");
    }

    const seller = await UserModel.aggregate([
      { $match: { _id: new Types.ObjectId(id), userRole: USER_ROLE.SHOP } },

      {
        $lookup: {
          from: "orders",
          let: { userIdObj: "$_id", userIdStr: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ["$$userIdObj", "$orderSellerIds"] },
                    { $in: ["$$userIdStr", "$orderSellerIds"] },
                  ],
                },
              },
            },
          ],
          as: "sales",
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "productShopId",
          as: "products",
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

          products: {
            $map: {
              input: "$products",
              as: "p",
              in: {
                _id: "$$p._id",
                name: "$$p.productName",
                price: "$$p.productPrice",
                quantity: "$$p.productQuantity",
                type: "$$p.productType",
                createdAt: "$$p.createdAt",
                status: "$$p.productStatus",
              },
            },
          },

          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$sales",
                    as: "s",
                    cond: { $eq: ["$$s.orderStatus", ORDER_STATUS.DELIVERED] },
                  },
                },
                as: "sale",
                in: "$$sale.orderTotalAmount",
              },
            },
          },

          totalOrders: { $size: "$sales" },
        },
      },
    ]);

    if (!seller || seller.length === 0) {
      return sendError(res, 404, "Không tìm thấy cửa hàng");
    }

    return sendSuccess(res, seller[0]);
  } catch (error: any) {
    console.error("Get Seller Detail Error:", error);
    return sendError(res, 500, "Lỗi server", error?.message);
  }
};
