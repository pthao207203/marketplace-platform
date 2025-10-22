
import { Router } from 'express';
import { listCategoriesTree, createCategory } from '../../controllers/admin/category.controller';

const router = Router();

// GET /admin/categories/ -> nested category tree
router.get('/', listCategoriesTree);

// POST /admin/categories/ -> create category (body: { name, icon, order?, parentId? })
router.post('/', createCategory);

export default router;

