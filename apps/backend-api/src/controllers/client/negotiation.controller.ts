import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { createNegotiation, listNegotiationsForProduct } from '../../services/negotiation.service';

export async function createNegotiationHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, 'Unauthorized');
    const productId = req.params.id;
    const offeredPrice = Number(req.body.offeredPrice);
    const message = req.body.message;
    if (!productId || !offeredPrice || isNaN(offeredPrice)) return sendError(res, 400, 'Invalid product or price');

    const doc = await createNegotiation(productId, String(user.sub), offeredPrice, message);
    return sendSuccess(res, { negotiation: doc }, 201);
  } catch (err: any) {
    console.error('createNegotiation error', err);
    return sendError(res, 400, err?.message || 'Error');
  }
}

export async function listNegotiationsHandler(req: Request, res: Response) {
  try {
    const productId = req.params.id;
    if (!productId) return sendError(res, 400, 'Missing product id');
    const docs = await listNegotiationsForProduct(productId);
    return sendSuccess(res, { negotiations: docs });
  } catch (err: any) {
    console.error('listNegotiations error', err);
    return sendError(res, 500, 'Server error');
  }
}

