import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';

const router = Router();

// All authenticated users can view products
router.get('/', getProducts);
router.get('/:id', getProduct);

// Only admin and manager can modify products
router.use(protect);
router.use(restrictTo('admin', 'manager'));
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router; 