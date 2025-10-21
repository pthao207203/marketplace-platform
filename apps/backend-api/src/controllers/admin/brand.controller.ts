import { Request, Response } from 'express';
import { BrandModel } from '../../models/brand.model';

export async function listBrands(req: Request, res: Response) {
  const docs = await BrandModel.find({}).sort({ order: 1, name: 1 }).lean();
  const items = docs.map(d => ({ id: String(d._id), name: d.name, logo: d.logo, order: d.order }));
  res.json({ items });
}

export async function createBrand(req: Request, res: Response) {
  const { name, logo, order } = req.body;
  if (!name) return res.status(400).json({ message: 'name required' });
  const doc = new BrandModel({ name, logo: logo ?? undefined, order: order ?? 0 });
  await doc.save();
  res.status(201).json({ id: String(doc._id), name: doc.name, logo: doc.logo, order: doc.order });
}
