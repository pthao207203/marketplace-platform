// src/controllers/admin/order.controller.ts
import type { Request, Response } from 'express';
import { getOrders } from '../../services/order.service';

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

export async function listOrders(req: Request, res: Response) {
  const traceId = (req.headers['x-request-id'] as string) || undefined;

  try {
    const { page = '1', limit = '10' } = req.query;
    const orders = await getOrders({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    return ok(res, orders, traceId);
  } catch (err: any) {
    console.error('list orders error', { traceId, err });
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
