import { CategoryModel } from "../models/category.model";

// --- Category DB helpers ----------------------------------------------------
export async function findCategoriesSorted() {
  return CategoryModel.find({}).sort({ order: 1, createdAt: 1 }).lean();
}

export async function collectCategoryAndDescendants(rootId: string) {
  const ids = new Set<string>();
  const queue: string[] = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (ids.has(cur)) continue;
    ids.add(cur);
    const children = await CategoryModel.find({ parentId: cur }).select('_id').lean();
    for (const c of children) queue.push(String(c._id));
  }
  return Array.from(ids);
}
