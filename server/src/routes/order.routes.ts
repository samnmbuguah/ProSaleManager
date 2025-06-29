import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/order.controller';

const router = Router();

// All authenticated users can view their own orders
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);

// Only admin and manager can modify orders
router.use(protect);
router.use(restrictTo('admin', 'manager'));
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router; 