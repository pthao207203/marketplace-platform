// src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import User, { type UserDoc } from '../../models/user.model';
import PendingSignup from '../../models/pendingregister.model';
import { hashPassword, verifyPassword } from '../../utils/password';        // scrypt/bcrypt tuỳ bạn
import { signAccessToken } from '../../utils/jwt';
import { USER_STATUS, USER_DELETED, USER_ROLE } from '../../constants/user.constants';
import {
  roleIsShopOrAdmin,
  toRoleLabel,
  toStatusLabel,
  toDeletedLabel,
} from '../../utils/user-mapper';
import { signPrecheckToken, verifyPrecheckToken } from '../../utils/precheck';
import { adminAuth } from '../../lib/firebase-admin';
import https from 'node:https';

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

export async function loginClient(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;

  try {
    const { userMail, userPhone, userName, password } = (req.body ?? {}) as {
      userPhone?: string;
      userMail?: string;
      userName?: string;
      password?: string;
    };

    if (!password || (!userMail && !userName && !userPhone)) {
      return fail(
        res,
        400,
        'AUTH_MISSING_CREDENTIALS',
        'Thiếu thông tin đăng nhập.',
        { required: ['password', 'userMail | userName | userPhone'] },
        'Gửi JSON body: {"userMail":"...","password":"..."} và Content-Type: application/json.',
        traceId
      );
    }

    const query: Record<string, unknown> = {};
    if (userMail) query.userMail = userMail.toLowerCase().trim();
    if (userName) query.userName = userName.trim();
    if (userPhone) query.userPhone = userPhone;

    const user = await User.findOne(query)
      .select('_id userPassword userStatus userDeleted userRole userName userMail')
      .lean<LoginUserLean>();

    if (!user) {
      return fail(
        res,
        401,
        'AUTH_USER_NOT_FOUND',
        'Email/Tên đăng nhập/Số điện thoại không tồn tại hoặc không đúng.',
        { identity: userMail ?? userName },
        'Kiểm tra lại userMail/userName/userPhone hoặc đăng ký mới.',
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

export async function precheckPhone(req: Request, res: Response) {
  try {
    const { phone } = (req.body ?? {}) as { phone?: string };
    if (!phone) return fail(res, 400, 'MISSING_PHONE', 'Thiếu số điện thoại.');

    // (tuỳ chọn) Chuẩn hoá phone sang E.164 ở đây
    const existed = await User.findOne({ userPhone: phone, userDeleted: USER_DELETED.NO })
      .select('_id').lean();
    if (existed) {
      return fail(res, 409, 'PHONE_ALREADY_USED', 'Số điện thoại đã được sử dụng.');
    }

    const nonce = signPrecheckToken({ phone, purpose: 'register' }, 600);
    console.log("Gửi OTP thành công")
    return ok(res, { allowed: true, nonce, expiresInSec: 600 });
  } catch (err: any) {
    console.error('precheckPhone error', err);
    return fail(res, 500, 'INTERNAL', 'Lỗi hệ thống.', { reason: err?.message });
  }
}

function b64urlJson(s: string) {
  return JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
}

export async function register(req: Request, res: Response) {
  try {
    const { idToken, name, password, nonce } = (req.body ?? {}) as {
      idToken?: string; name?: string; password?: string; nonce?: string;
    };
    if (!idToken || !name || !password || !nonce) {
      return fail(res, 400, 'MISSING_FIELDS', 'Thiếu idToken/name/password/nonce.');
    }
    const parts = idToken.split('.');
    console.log('[DBG] tokenParts=', parts.length);
    const hdr = b64urlJson(parts[0]);
    const pl  = b64urlJson(parts[1]);

    console.log('[DBG] token.alg=', hdr.alg, 'kid=', (hdr.kid||''));
    console.log('[DBG] token.aud=', pl.aud, 'iss=', pl.iss);

  https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    (resp) => {
      let data = '';
      resp.on('data', c => data += c);
      resp.on('end', () => {
        const keys = JSON.parse(data); // { kid1: certPEM, kid2: certPEM, ... }
        console.log('[DBG] keys count=', Object.keys(keys).length);
        console.log('[DBG] has kid?', !!keys['e81f052aef040a97c39d265381de6cb434bc35f3']); // điền đúng kid log ra
      });
    }).on('error', err => console.error('keys fetch error', err));
    // 1) Verify nonce của backend
    let pre;
    try {
      pre = verifyPrecheckToken(nonce); // { phone, purpose }
    } catch (e: any) {
      return fail(res, 401, 'INVALID_NONCE', 'Nonce không hợp lệ hoặc đã hết hạn.');
    }
    if (pre.purpose !== 'register') {
      return fail(res, 400, 'NONCE_PURPOSE_MISMATCH', 'Sai mục đích nonce.');
    }

    // 2) Verify idToken từ Firebase
    const decoded = await adminAuth.verifyIdToken(idToken);
    const phoneFromFirebase = decoded.phone_number;
    if (!phoneFromFirebase) {
      return fail(res, 400, 'NO_PHONE_IN_TOKEN', 'idToken không chứa phone_number.');
    }

    // 3) Phone trong idToken phải trùng phone trong nonce
    if (phoneFromFirebase !== pre.phone) {
      return fail(res, 400, 'PHONE_MISMATCH', 'Số điện thoại xác thực không khớp precheck.', {
        precheckPhone: pre.phone, tokenPhone: phoneFromFirebase,
      });
    }

    // 4) Double-check: phone chưa dùng
    const existed = await User.findOne({ userPhone: pre.phone, userDeleted: USER_DELETED.NO })
      .select('_id').lean();
    if (existed) {
      return fail(res, 409, 'PHONE_ALREADY_USED', 'Số điện thoại đã được sử dụng.');
    }

    // 5) Tạo user
    const passHash = await hashPassword(password);
    const user = await User.create({
      userName: name,
      userPassword: passHash,
      userMail: `${pre.phone}@placeholder.local`, // hoặc nới lỏng schema nếu không cần email
      userPhone: pre.phone,
      userRole: USER_ROLE.CUSTOMER,
      userStatus: USER_STATUS.ACTIVE,
      userDeleted: USER_DELETED.NO,
      userCreated: { at: new Date() },
    });

    const token = signAccessToken({
      sub: String(user._id),
      role: toRoleLabel(user.userRole),
      status: toStatusLabel(user.userStatus),
      deleted: toDeletedLabel(user.userDeleted),
    });

    return ok(res, {
      user: {
        id: String(user._id),
        userName: user.userName,
        userPhone: user.userPhone,
        userRole: toRoleLabel(user.userRole),
        userStatus: toStatusLabel(user.userStatus),
      },
      token,
    });
  } catch (err: any) {
    console.error('registerWithFirebasePhone error', err);
    return fail(res, 401, 'INVALID_ID_TOKEN', 'idToken không hợp lệ hoặc đã hết hạn.', { reason: err?.message });
  }
}
