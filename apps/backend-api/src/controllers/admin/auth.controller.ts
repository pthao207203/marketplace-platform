// src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { UserModel, type UserDoc } from '../../models/user.model';
import { verifyPassword } from '../../utils/password';        // scrypt/bcrypt tuỳ bạn
import { signAccessToken } from '../../utils/jwt';
import { USER_STATUS, USER_DELETED } from '../../constants/user.constants';
import {
  roleIsShopOrAdmin,
  toRoleLabel,
  toStatusLabel,
  toDeletedLabel,
} from '../../utils/user-mapper';
import { sendSuccess, sendError } from '../../utils/response';

type LoginUserLean = Pick<
  UserDoc,
  '_id' | 'userPassword' | 'userStatus' | 'userDeleted' | 'userRole' | 'userName' | 'userMail'
>;

// using shared response helpers

export async function loginShopAdmin(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;

  try {
    const { userMail, userName, password } = (req.body ?? {}) as {
      userMail?: string;
      userName?: string;
      password?: string;
    };

    if (!password || (!userMail && !userName)) {
      return sendError(res, 400, 'Thiếu thông tin đăng nhập.', { code: 'AUTH_MISSING_CREDENTIALS', required: ['password', 'userMail | userName'], hint: 'Gửi JSON body: {"userMail":"...","password":"..."} và Content-Type: application/json.', traceId });
    }

    const query: Record<string, unknown> = {};
    if (userMail) query.userMail = userMail.toLowerCase().trim();
    if (userName) query.userName = userName.trim();

    const user = await UserModel.findOne(query)
      .select('_id userPassword userStatus userDeleted userRole userName userMail')
      .lean<LoginUserLean>();

    if (!user) {
      return sendError(res, 401, 'Email/Tên đăng nhập không tồn tại hoặc không đúng.', { code: 'AUTH_USER_NOT_FOUND', identity: userMail ?? userName, hint: 'Kiểm tra lại userMail/userName hoặc tạo user seed.', traceId });
    }

    if (user.userStatus !== USER_STATUS.ACTIVE || user.userDeleted !== USER_DELETED.NO) {
      return sendError(res, 403, 'Tài khoản đang bị khóa hoặc đã bị xoá.', { code: 'AUTH_ACCOUNT_BLOCKED', userStatus: toStatusLabel(user.userStatus), userDeleted: toDeletedLabel(user.userDeleted), hint: 'Liên hệ quản trị viên để kích hoạt tài khoản.', traceId });
    }

    if (!roleIsShopOrAdmin(user.userRole)) {
      return sendError(res, 403, 'Tài khoản không có quyền truy cập (không phải shop/admin).', { code: 'AUTH_ROLE_FORBIDDEN', userRole: toRoleLabel(user.userRole), hint: 'Đăng nhập bằng tài khoản có role shop hoặc admin.', traceId });
    }

    const okPass = await verifyPassword(password, user.userPassword);
    if (!okPass) {
      return sendError(res, 401, 'Mật khẩu không đúng.', { code: 'AUTH_PASSWORD_INVALID', hint: 'Nhập lại mật khẩu hoặc dùng chức năng quên mật khẩu.', traceId });
    }

    const token = signAccessToken({
      sub: String(user._id),
      role: toRoleLabel(user.userRole),
      status: toStatusLabel(user.userStatus),
      deleted: toDeletedLabel(user.userDeleted),
    });

    return sendSuccess(res, {
      user: {
        id: String(user._id),
        userName: user.userName,
        userMail: user.userMail,
        userRole: toRoleLabel(user.userRole),      
        userStatus: toStatusLabel(user.userStatus),
      },
      token,
    });
  } catch (err: any) {
    // log nội bộ, response chuẩn ra ngoài
    console.error('login error', { traceId, err });
    return sendError(res, 500, 'Lỗi hệ thống.', { code: 'INTERNAL_ERROR', reason: err?.message ?? String(err), traceId });
  }
}
