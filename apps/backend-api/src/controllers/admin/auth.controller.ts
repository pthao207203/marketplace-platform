// src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import User, { type UserDoc } from '../../models/user.model';
import { verifyPassword } from '../../utils/password';        // scrypt/bcrypt tuỳ bạn
import { signAccessToken } from '../../utils/jwt';
import { USER_STATUS, USER_DELETED } from '../../constants/user.constants';
import {
  roleIsShopOrAdmin,
  toRoleLabel,
  toStatusLabel,
  toDeletedLabel,
} from '../../utils/user-mapper';

type LoginUserLean = Pick<
  UserDoc,
  '_id' | 'userPassword' | 'userStatus' | 'userDeleted' | 'userRole' | 'userName' | 'userMail'
>;

// ---------- helpers: response shape ----------
function ok<T>(res: Response, data: T, traceId?: string) {
  return res.json({ success: true, data, meta: { traceId } });
}
function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  hint?: string,
  traceId?: string
) {
  return res.status(status).json({
    success: false,
    error: { code, message, details, hint },
    meta: { traceId },
  });
}

export async function loginShopAdmin(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;

  try {
    const { userMail, userName, password } = (req.body ?? {}) as {
      userMail?: string;
      userName?: string;
      password?: string;
    };

    if (!password || (!userMail && !userName)) {
      return fail(
        res,
        400,
        'AUTH_MISSING_CREDENTIALS',
        'Thiếu thông tin đăng nhập.',
        { required: ['password', 'userMail | userName'] },
        'Gửi JSON body: {"userMail":"...","password":"..."} và Content-Type: application/json.',
        traceId
      );
    }

    const query: Record<string, unknown> = {};
    if (userMail) query.userMail = userMail.toLowerCase().trim();
    if (userName) query.userName = userName.trim();

    const user = await User.findOne(query)
      .select('_id userPassword userStatus userDeleted userRole userName userMail')
      .lean<LoginUserLean>();

    if (!user) {
      return fail(
        res,
        401,
        'AUTH_USER_NOT_FOUND',
        'Email/Tên đăng nhập không tồn tại hoặc không đúng.',
        { identity: userMail ?? userName },
        'Kiểm tra lại userMail/userName hoặc tạo user seed.',
        traceId
      );
    }

    if (user.userStatus !== USER_STATUS.ACTIVE || user.userDeleted !== USER_DELETED.NO) {
      return fail(
        res,
        403,
        'AUTH_ACCOUNT_BLOCKED',
        'Tài khoản đang bị khóa hoặc đã bị xoá.',
        {
          userStatus: toStatusLabel(user.userStatus),
          userDeleted: toDeletedLabel(user.userDeleted),
        },
        'Liên hệ quản trị viên để kích hoạt tài khoản.',
        traceId
      );
    }

    if (!roleIsShopOrAdmin(user.userRole)) {
      return fail(
        res,
        403,
        'AUTH_ROLE_FORBIDDEN',
        'Tài khoản không có quyền truy cập (không phải shop/admin).',
        { userRole: toRoleLabel(user.userRole) },
        'Đăng nhập bằng tài khoản có role shop hoặc admin.',
        traceId
      );
    }

    const okPass = await verifyPassword(password, user.userPassword);
    if (!okPass) {
      return fail(
        res,
        401,
        'AUTH_PASSWORD_INVALID',
        'Mật khẩu không đúng.',
        undefined,
        'Nhập lại mật khẩu hoặc dùng chức năng quên mật khẩu.',
        traceId
      );
    }

    const token = signAccessToken({
      sub: String(user._id),
      role: toRoleLabel(user.userRole),
      status: toStatusLabel(user.userStatus),
      deleted: toDeletedLabel(user.userDeleted),
    });

    return ok(
      res,
      {
        user: {
          id: String(user._id),
          userName: user.userName,
          userMail: user.userMail,
          userRole: toRoleLabel(user.userRole),      
          userStatus: toStatusLabel(user.userStatus),
        },
        token,
      },
      traceId
    );
  } catch (err: any) {
    // log nội bộ, response chuẩn ra ngoài
    console.error('login error', { traceId, err });
    return fail(
      res,
      500,
      'INTERNAL_ERROR',
      'Lỗi hệ thống.',
      { reason: err?.message ?? String(err) },
      'Kiểm tra server logs với traceId (nếu có) để biết thêm chi tiết.',
      traceId
    );
  }
}
