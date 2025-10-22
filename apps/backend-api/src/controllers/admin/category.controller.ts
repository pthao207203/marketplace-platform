import { Request, Response } from 'express';
import { CategoryModel } from '../../models/category.model';
import { sendSuccess, sendError } from '../../utils/response';

// Return categories as a nested tree
export async function listCategoriesTree(req: Request, res: Response) {
  try {
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

    return sendSuccess(res, { items: roots });
  } catch (err: any) {
    console.error('listCategoriesTree error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}

// Create a category; optional parentId to place it under a parent
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, icon, order, parentId } = req.body;
    if (!name || !icon) return sendError(res, 400, 'name and icon are required');

    // Optional: verify parent exists
    if (parentId) {
      const parent = await CategoryModel.findById(parentId).lean();
      if (!parent) return sendError(res, 400, 'parentId not found');
    }

    const doc = new CategoryModel({ name, icon, order: order ?? 0, parentId: parentId ?? null });
    await doc.save();
    return sendSuccess(res, { id: String(doc._id), name: doc.name, icon: doc.icon, order: doc.order, parentId: doc.parentId }, 201);
  } catch (err: any) {
    console.error('createCategory error', err);
    return sendError(res, 500, 'Server error', err?.message);
  }
}
