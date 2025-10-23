import type { Request, Response } from 'express';
import { requireClientAuth } from '../../middlewares/auth';
import { roleIsShopOrAdmin, toRoleLabel } from '../../utils/user-mapper';
import { USER_ROLE_CODE } from '../../constants/user.constants';
import { sendSuccess, sendError } from '../../utils/response';
import { getSystemSettings, updateSystemSettings } from '../../models/systemSettings.model';

// Note: this controller functions expect an authenticated user attached by requireClientAuth.
// We also require the user to have shop/admin role to access these endpoints.

export async function getSystem(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;
  try {
    // auth guard: requireClientAuth should have set req.user
    const user = (req as any).user;
    if (!user) return sendError(res, 401, 'Unauthorized', { code: 'AUTH_MISSING', traceId });
    
    // req.user.role may be a numeric code or a string label ('admin').
    const rawRole = (user.role as any) ?? user.userRole;
    // normalize: if it's a string label, map to numeric code
    const roleCode = typeof rawRole === 'string' ? (USER_ROLE_CODE[rawRole as keyof typeof USER_ROLE_CODE] ?? rawRole) : rawRole;

    if (!roleIsShopOrAdmin(roleCode)) {
      return sendError(res, 403, 'Forbidden: requires shop/admin role', { code: 'AUTH_ROLE_FORBIDDEN', role: toRoleLabel(roleCode as any), traceId });
    }

    const settings = await getSystemSettings();
    return sendSuccess(res, { system: settings ?? null });
  } catch (err: any) {
    console.error('getSystem error', { traceId, err });
    return sendError(res, 500, 'Internal error', { code: 'INTERNAL_ERROR', reason: err?.message ?? String(err), traceId });
  }
}

export async function putSystem(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;
  try {
    const user = (req as any).user;
    if (!user) return sendError(res, 401, 'Unauthorized', { code: 'AUTH_MISSING', traceId });
    const rawRole2 = (user.role as any) ?? user.userRole;
    const roleCode2 = typeof rawRole2 === 'string' ? (USER_ROLE_CODE[rawRole2 as keyof typeof USER_ROLE_CODE] ?? rawRole2) : rawRole2;
    if (!roleIsShopOrAdmin(roleCode2)) {
      return sendError(res, 403, 'Forbidden: requires shop/admin role', { code: 'AUTH_ROLE_FORBIDDEN', role: toRoleLabel(roleCode2 as any), traceId });
    }

    const payload = req.body ?? {};
    // We allow partial updates but use updateSystemSettings which performs upsert
    const updated = await updateSystemSettings(payload as any);
    return sendSuccess(res, { system: updated });
  } catch (err: any) {
    console.error('putSystem error', { traceId, err });
    return sendError(res, 500, 'Internal error', { code: 'INTERNAL_ERROR', reason: err?.message ?? String(err), traceId });
  }
}

// Export a helper to be used in the route where requireClientAuth is applied
export const adminSystemHandlers = {
  requireClientAuth,
  getSystem,
  putSystem,
};
