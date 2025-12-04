import { Request, Response } from "express";
import UserModel from "../../models/user.model";
import { USER_ROLE } from "../../constants/user.constants";
import { ORDER_STATUS } from "../../constants/order.constants";
import { sendSuccess, sendError } from "../../utils/response";

// GET /admin/customers
export const getListCustomers = async (req: Request, res: Response) => {
  try {
    const { search, status, date, spentMin, spentMax, purchased, refund } =
      req.query; // 1. Filter cơ bản cho Role Customer & Trạng thái hoạt động

    const matchStage: any = { userRole: USER_ROLE.CUSTOMER }; // SỬA: Dùng 'userName' thay vì 'name' để tìm kiếm
    if (search) {
      matchStage.userName = { $regex: search, $options: "i" };
    } // SỬA: Dùng 'userStatus' thay vì 'status' để lọc
    if (status && status !== "all") {
      // Lưu ý: Schema dùng USER_STATUS là Number, nên ta cần chắc chắn giá trị status là Number
      // Nếu Frontend gửi status dạng string ("active", "deleted"), cần mapping lại thành Number tại đây.
      // Tạm thời để status dưới dạng String nếu không rõ giá trị USER_STATUS là gì.
      matchStage.userStatus = status;
    } // SỬA: 'createdAt' là trường mặc định từ timestamps: true

    if (date) {
      const start = new Date(date as string);
      const end = new Date(date as string);
      end.setDate(end.getDate() + 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const pipeline: any[] = [
      { $match: matchStage }, // 2. Lookup Orders (Đảm bảo _id và userId cùng type) // Nếu userId trong Order là String, hãy thêm $addFields: { userIdString: { $toString: "$_id" } } trước bước này
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      }, // 3. Tính toán chỉ số & Mapping tên field
      {
        $project: {
          _id: 1, // SỬA: Mapping 'userName' thành 'name' cho Frontend
          name: "$userName", // SỬA: Mapping 'userMail' thành 'email' cho Frontend
          email: "$userMail", // Dùng đúng tên fields từ Schema

          avatar: "$userAvatar",
          createdAt: 1, // SỬA: Mapping 'userStatus' thành 'status' cho Frontend // LƯU Ý: Frontend của bạn đang mong đợi status là string ("active", "deleted"), // nhưng ở đây ta chỉ trả về Number. Cần chuyển đổi ở Frontend hoặc BE.
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
    ]; // 4. Filter nâng cao trên số liệu đã tính

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
