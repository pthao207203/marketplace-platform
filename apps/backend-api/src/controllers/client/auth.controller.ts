// src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { UserModel, type UserDoc } from '../../models/user.model';
import { hashPassword, verifyPassword } from '../../utils/password';        // scrypt/bcrypt tuỳ bạn
import { randomBytes } from 'node:crypto';
import { signAccessToken } from '../../utils/jwt';
import { USER_STATUS, USER_DELETED, USER_ROLE } from '../../constants/user.constants';
import {
  toRoleLabel,
  toStatusLabel,
  toDeletedLabel,
} from '../../utils/user-mapper';
import { signPrecheckToken, verifyPrecheckToken } from '../../utils/precheck';
import { signSocialToken, verifySocialToken } from '../../utils/social';
import { adminAuth } from '../../lib/firebase-admin';
import { verifyGoogleIdToken } from '../../utils/google';
import https from 'node:https';

type LoginUserLean = Pick<
  UserDoc,
  '_id' | 'userPassword' | 'userStatus' | 'userDeleted' | 'userRole' | 'userName' | 'userMail' | 'userPhone'
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

    const user = await UserModel.findOne(query)
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

export async function googleSignIn(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;
  try {
    const { idToken } = (req.body ?? {}) as { idToken?: string };
    if (!idToken) {
      return fail(res, 400, 'MISSING_ID_TOKEN', 'Thiếu idToken.', undefined, undefined, traceId);
    }

    let decoded: any;
    // try Firebase Admin verification first (if service account configured)
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (e: any) {
      // fallback: try verifying as plain Google OAuth id_token
      try {
        const googlePayload = await verifyGoogleIdToken(idToken);
        // normalize shape to match Firebase's fields used later
        decoded = {
          uid: googlePayload.sub,
          email: googlePayload.email,
          name: googlePayload.name,
          picture: googlePayload.picture,
          email_verified: googlePayload.email_verified,
          // phone_number unlikely in Google ID tokens
        };
      } catch (gErr: any) {
        console.error('googleSignIn verifyIdToken error', e, 'and google fallback error', gErr);
        return fail(res, 401, 'INVALID_ID_TOKEN', 'idToken không hợp lệ hoặc đã hết hạn.', { reason: e?.message ?? gErr?.message }, undefined, traceId);
      }
    }

    const email: string | undefined = decoded.email;
    const name: string | undefined = decoded.name || (email ? email.split('@')[0] : undefined);

    if (!email) {
      return fail(res, 400, 'NO_EMAIL', 'idToken không chứa email.', undefined, undefined, traceId);
    }

    const emailNorm = email.toLowerCase().trim();

    // prefer phone supplied by decoded token; allow client to pass `phone` to this endpoint too
    const phoneFromToken: string | undefined = decoded.phone_number;
    const phoneFromBody: string | undefined = (req.body ?? {}).phone;
    const resolvedPhone = phoneFromToken || phoneFromBody;

    // Find existing user by email
    let user = await UserModel.findOne({ userMail: emailNorm, userDeleted: USER_DELETED.NO })
      .select('_id userPassword userStatus userDeleted userRole userName userMail userPhone')
      .lean<LoginUserLean>();

    if (user) {
      if (user.userStatus !== USER_STATUS.ACTIVE || user.userDeleted !== USER_DELETED.NO) {
        return fail(res, 403, 'AUTH_ACCOUNT_BLOCKED', 'Tài khoản đang bị khóa hoặc đã bị xoá.', {
          userStatus: toStatusLabel(user.userStatus),
          userDeleted: toDeletedLabel(user.userDeleted),
        }, 'Liên hệ quản trị viên để kích hoạt tài khoản.', traceId);
      }
    } else {
      // If phone is not yet provided, ask client to supply it to complete registration
      if (!resolvedPhone) {
        const socialNonce = signSocialToken({ provider: 'google', uid: decoded.uid, email: emailNorm, name }, 600);
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PHONE', message: 'Số điện thoại cần được cung cấp để hoàn tất đăng ký.' },
          data: { profile: { email: emailNorm, name }, missing: ['phone'], socialNonce },
        });
      }

      // create user with provided phone
      // ensure phone is not already used
      const phoneInUse = await UserModel.findOne({ userPhone: resolvedPhone, userDeleted: USER_DELETED.NO }).select('_id').lean();
      if (phoneInUse) {
        return fail(res, 409, 'PHONE_ALREADY_USED', 'Số điện thoại đã được sử dụng.');
      }

      const rnd = randomBytes(16).toString('hex');
      const passHash = await hashPassword(rnd);
      const newUser = await UserModel.create({
        userName: name || emailNorm.split('@')[0],
        userPassword: passHash,
        userMail: emailNorm,
        userPhone: resolvedPhone,
        userRole: USER_ROLE.CUSTOMER,
        userStatus: USER_STATUS.ACTIVE,
        userDeleted: USER_DELETED.NO,
        userCreated: { at: new Date() },
        authProviders: [{ provider: 'google', uid: decoded.uid }],
      });

      user = {
        _id: newUser._id,
        userPassword: newUser.userPassword,
        userStatus: newUser.userStatus,
        userDeleted: newUser.userDeleted,
        userRole: newUser.userRole,
        userName: newUser.userName,
        userMail: newUser.userMail,
        userPhone: newUser.userPhone,
      } as LoginUserLean;
    }
      // if existing user but doesn't have this provider recorded, add it
      if (user) {
        try {
          const existing = await UserModel.findById(user._id).select('authProviders').lean() as any;
          const hasProvider = (existing?.authProviders || []).some((p: any) => p.provider === 'google' && String(p.uid) === String(decoded.uid));
          if (!hasProvider) {
            await UserModel.updateOne({ _id: user._id }, { $push: { authProviders: { provider: 'google', uid: decoded.uid } } });
          }
        } catch (e) {
          // non-fatal
          console.warn('failed to ensure authProviders for user', e);
        }
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
          userPhone: (user as any).userPhone,
          userRole: toRoleLabel(user.userRole),
          userStatus: toStatusLabel(user.userStatus),
        },
        token,
      },
      traceId
    );
  } catch (err: any) {
    console.error('googleSignIn error', err);
    return fail(res, 500, 'INTERNAL_ERROR', 'Lỗi hệ thống.', { reason: err?.message }, undefined, traceId);
  }
}

export async function completeSocialSign(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;
  try {
    const { socialNonce, phone } = (req.body ?? {}) as { socialNonce?: string; phone?: string };
    if (!socialNonce || !phone) {
      return fail(res, 400, 'MISSING_FIELDS', 'Thiếu socialNonce hoặc phone.');
    }

    let payload: any;
    try {
      payload = verifySocialToken(socialNonce);
    } catch (e: any) {
      return fail(res, 401, 'INVALID_SOCIAL_NONCE', 'socialNonce không hợp lệ hoặc đã hết hạn.');
    }

    const { provider, uid, email, name } = payload as { provider: string; uid: string; email: string; name?: string };
    if (!provider || !uid || !email) {
      return fail(res, 400, 'INVALID_SOCIAL_PAYLOAD', 'socialNonce payload không đầy đủ.');
    }

    const emailNorm = String(email).toLowerCase().trim();

    // validate phone not used
    const phoneInUse = (await UserModel.findOne({ userPhone: phone, userDeleted: USER_DELETED.NO }).select('_id userMail').lean()) as any;
    if (phoneInUse) {
      // if the phone belongs to the same email, allow linking; otherwise reject
      if (String(phoneInUse.userMail).toLowerCase().trim() !== emailNorm) {
        return fail(res, 409, 'PHONE_ALREADY_USED', 'Số điện thoại đã được sử dụng bởi tài khoản khác.');
      }
    }

    // find existing user by email
    let user = await UserModel.findOne({ userMail: emailNorm, userDeleted: USER_DELETED.NO })
      .select('_id userPassword userStatus userDeleted userRole userName userMail userPhone')
      .lean<LoginUserLean>();

    if (user) {
      // update phone if missing
      if (!user.userPhone) {
        await UserModel.updateOne({ _id: user._id }, { $set: { userPhone: phone } });
        user.userPhone = phone as any;
      }
    } else {
      // create new user with provided phone
      const rnd = randomBytes(16).toString('hex');
      const passHash = await hashPassword(rnd);
      const newUser = await UserModel.create({
        userName: name || emailNorm.split('@')[0],
        userPassword: passHash,
        userMail: emailNorm,
        userPhone: phone,
        userRole: USER_ROLE.CUSTOMER,
        userStatus: USER_STATUS.ACTIVE,
        userDeleted: USER_DELETED.NO,
        userCreated: { at: new Date() },
        authProviders: [{ provider: 'google', uid }],
      });

      user = {
        _id: newUser._id,
        userPassword: newUser.userPassword,
        userStatus: newUser.userStatus,
        userDeleted: newUser.userDeleted,
        userRole: newUser.userRole,
        userName: newUser.userName,
        userMail: newUser.userMail,
        userPhone: newUser.userPhone,
      } as LoginUserLean;
    }

    if (user.userStatus !== USER_STATUS.ACTIVE || user.userDeleted !== USER_DELETED.NO) {
      return fail(res, 403, 'AUTH_ACCOUNT_BLOCKED', 'Tài khoản đang bị khóa hoặc đã bị xoá.', {
        userStatus: toStatusLabel(user.userStatus),
        userDeleted: toDeletedLabel(user.userDeleted),
      }, 'Liên hệ quản trị viên để kích hoạt tài khoản.', traceId);
    }

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
        userMail: user.userMail,
        userPhone: (user as any).userPhone,
        userRole: toRoleLabel(user.userRole),
        userStatus: toStatusLabel(user.userStatus),
      },
      token,
    }, traceId);
  } catch (err: any) {
    console.error('completeSocialSign error', err);
    return fail(res, 500, 'INTERNAL_ERROR', 'Lỗi hệ thống.', { reason: err?.message }, undefined, traceId);
  }
}

export async function precheckPhone(req: Request, res: Response) {
  try {
    const { phone } = (req.body ?? {}) as { phone?: string };
    if (!phone) return fail(res, 400, 'MISSING_PHONE', 'Thiếu số điện thoại.');

    // (tuỳ chọn) Chuẩn hoá phone sang E.164 ở đây
    const existed = await UserModel.findOne({ userPhone: phone, userDeleted: USER_DELETED.NO })
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
    const existed = await UserModel.findOne({ userPhone: pre.phone, userDeleted: USER_DELETED.NO })
      .select('_id').lean();
    if (existed) {
      return fail(res, 409, 'PHONE_ALREADY_USED', 'Số điện thoại đã được sử dụng.');
    }

    // 5) Tạo user
    const passHash = await hashPassword(password);
    const user = await UserModel.create({
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
