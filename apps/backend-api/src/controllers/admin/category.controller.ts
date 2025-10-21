import { Request, Response } from 'express';
import { CategoryModel } from '../../models/category.model';

// Return categories as a nested tree
export async function listCategoriesTree(req: Request, res: Response) {
  const docs = await CategoryModel.find({}).sort({ order: 1, createdAt: 1 }).lean();

  // build id -> node map
  const map: Record<string, any> = {};
  for (const c of docs) {
    map[String(c._id)] = { id: String(c._id), name: c.name, icon: c.icon, order: c.order, children: [] };
  }

  const roots: any[] = [];
  for (const c of docs) {
    const id = String(c._id);
    const parentId = c.parentId ? String(c.parentId) : null;
    if (parentId && map[parentId]) {
      map[parentId].children.push(map[id]);
    } else {
      roots.push(map[id]);
    }
  }

  res.json({ items: roots });
}

// Create a category; optional parentId to place it under a parent
export async function createCategory(req: Request, res: Response) {
  const { name, icon, order, parentId } = req.body;
  if (!name || !icon) return res.status(400).json({ message: 'name and icon are required' });

  // Optional: verify parent exists
  if (parentId) {
    const parent = await CategoryModel.findById(parentId).lean();
    if (!parent) return res.status(400).json({ message: 'parentId not found' });
  }

  const doc = new CategoryModel({ name, icon, order: order ?? 0, parentId: parentId ?? null });
  await doc.save();
  res.status(201).json({ id: String(doc._id), name: doc.name, icon: doc.icon, order: doc.order, parentId: doc.parentId });
}
