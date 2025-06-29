import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';

const router = Router();

// All authenticated users can view categories
router.get('/', getCategories);
router.get('/:id', getCategory);

// Only admin and manager can modify categories
router.use(protect);
router.use(restrictTo('admin', 'manager'));
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router; 