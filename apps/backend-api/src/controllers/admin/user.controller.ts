import type { Request, Response } from 'express';
import { UserModel } from '../../models/user.model';
import { USER_ROLE } from '../../constants/user.constants';
import { sendError, sendSuccess } from '../../utils/response';
import { Types } from 'mongoose';

// GET /admin/sellers/pending
export async function listSellerApplications(req: Request, res: Response) {
  try {
    const apps = await UserModel.find({ 'sellerRegistration.status': 'pending' }).select('userName userMail sellerRegistration').lean();
    return sendSuccess(res, { items: apps });
  } catch (err: any) {
    console.error('listSellerApplications error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

// POST /admin/sellers/:id/review  body: { action: 'approve'|'reject', reason?: string }
export async function reviewSellerApplication(req: Request, res: Response) {
  try {
    const admin = (req as any).user;
    if (!admin || !admin.sub) return sendError(res, 401, 'Unauthorized');

    const userId = req.params.id;
    if (!userId || !Types.ObjectId.isValid(String(userId))) return sendError(res, 400, 'Invalid user id');

    const body = req.body || {};
    const action = String(body.action || '').toLowerCase();
    const reason = body.reason || null;
    if (!['approve', 'reject'].includes(action)) return sendError(res, 400, 'Invalid action');

    // read sellerRegistration status with lean to avoid full mongoose document validation
    const existing = await UserModel.findById(userId).select('sellerRegistration').lean<any>();
    if (!existing) return sendError(res, 404, 'User not found');
    if (!existing.sellerRegistration || existing.sellerRegistration.status !== 'pending') return sendError(res, 400, 'No pending application');

    const update: any = {};
    update['sellerRegistration.status'] = action === 'approve' ? 'approved' : 'rejected';
    update['sellerRegistration.reviewedAt'] = new Date();
    update['sellerRegistration.reviewerId'] = new Types.ObjectId(admin.sub);
    if (action === 'reject') update['sellerRegistration.rejectionReason'] = String(reason || '');

    // set userRole to SHOP when approved, otherwise set back to CUSTOMER
    update['userRole'] = action === 'approve' ? USER_ROLE.SHOP : USER_ROLE.CUSTOMER;

    const updated = await UserModel.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('_id userRole sellerRegistration').lean();
    if (!updated) return sendError(res, 500, 'Unable to update user');
    return sendSuccess(res, { ok: true, action });
  } catch (err: any) {
    console.error('reviewSellerApplication error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

export default { listSellerApplications, reviewSellerApplication };
