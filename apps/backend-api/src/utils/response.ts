import type { Response } from 'express';

export function sendSuccess(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function sendError(res: Response, status: number, message: string, details?: any) {
  const payload: any = { success: false, error: { message } };
  if (typeof details !== 'undefined') payload.error.details = details;
  return res.status(status).json(payload);
}
