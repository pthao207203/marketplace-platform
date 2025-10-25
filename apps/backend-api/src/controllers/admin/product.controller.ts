import { Request, Response } from 'express';
import { listProductsDB, createProductDoc } from '../../services/product.service';
import { sendSuccess, sendError } from '../../utils/response';
import { respondToNegotiation } from '../../services/negotiation.service';

export async function getProducts(req: Request, res: Response) {
  try {
    const data = await listProductsDB(req.query);
    return sendSuccess(res, data);
  } catch (err: any) {
    console.error('getProducts error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

export async function postProduct(req: Request, res: Response) {
  try {
    const created = await createProductDoc(req.body);
    return sendSuccess(res, created, 201);
  } catch (err: any) {
    console.error('postProduct error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

export async function respondNegotiationHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) return sendError(res, 401, 'Unauthorized');
    const negotiationId = req.params.id;
    const action = String(req.body?.action || '').toLowerCase();
    if (!['accept','reject'].includes(action)) return sendError(res, 400, 'Invalid action');

    const doc = await respondToNegotiation(negotiationId, String(user.sub), action as any);
    return sendSuccess(res, { negotiation: doc });
  } catch (err: any) {
    console.error('respondNegotiation error', err);
    return sendError(res, 400, err?.message || 'Error');
  }
}
