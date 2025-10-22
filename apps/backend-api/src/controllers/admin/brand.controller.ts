import { Request, Response } from 'express';
import { BrandModel } from '../../models/brand.model';
import { sendSuccess, sendError } from '../../utils/response';

export async function listBrands(req: Request, res: Response) {
  try {
    const docs = await BrandModel.find({}).sort({ order: 1, name: 1 }).lean();
    const items = docs.map(d => ({ id: String(d._id), name: d.name, logo: d.logo, order: d.order }));
    return sendSuccess(res, { items });
  } catch (err: any) {
    console.error('listBrands error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

export async function createBrand(req: Request, res: Response) {
  try {
    const { name, logo, order } = req.body;
    if (!name) return sendError(res, 400, 'name required');
    const doc = new BrandModel({ name, logo: logo ?? undefined, order: order ?? 0 });
    await doc.save();
    return sendSuccess(res, { id: String(doc._id), name: doc.name, logo: doc.logo, order: doc.order }, 201);
  } catch (err: any) {
    console.error('createBrand error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}
