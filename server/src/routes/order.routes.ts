import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
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
router.use(requireAuth);
router.use(requireRole(['admin', 'manager']));
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router; 