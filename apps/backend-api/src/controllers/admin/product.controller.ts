import { Request, Response } from 'express';
import { listProductsDB, createProductDoc } from '../../services/product.service';
import { sendSuccess, sendError } from '../../utils/response';

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
