import type { Request, Response } from 'express';
import User from '../../models/user.model';
import { sendSuccess, sendError } from '../../utils/response';
import { Types } from 'mongoose';
import { toStatusLabel } from '../../utils/user-mapper';

// GET /api/me/profile
export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(String(userId))) return sendError(res, 401, 'Unauthorized');

    type LeanUser = {
      userName?: string;
      userAvatar?: string;
      userMail?: string;
      userPhone?: string;
      userAddress?: { label?: string; [key: string]: any }[];
      userStatus?: string;
      userWallet?: { balance?: number } | null;
    };

    const user = await User.findById(String(userId))
      .select('userName userAvatar userMail userPhone userAddress userStatus userWallet')
      .lean<LeanUser>();

    if (!user) return sendError(res, 404, 'User not found');

    // find address with label 'Nhà' (case-insensitive)
    let homeAddress: { label?: string; [key: string]: any } | null = null;
    if (Array.isArray(user.userAddress)) {
      homeAddress = user.userAddress.find((a) => (a.label || '').toLowerCase() === 'nhà') || null;
    }

    const profile = {
      name: user.userName,
      avatar: user.userAvatar,
      mail: user.userMail,
      phone: user.userPhone,
      address: homeAddress,
      status: typeof user.userStatus !== 'undefined' ? toStatusLabel(user.userStatus as any) : undefined,
      walletBalance: user.userWallet?.balance ?? 0,
    };

    return sendSuccess(res, profile);
  } catch (err: any) {
    console.error('getMyProfile error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}
