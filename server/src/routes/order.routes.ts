import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/order.controller.js';

const router = Router();

// Require authentication for all order routes (fixes req.user issue)
router.use(requireAuth);

// All authenticated users can view their own orders
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);

// Only admin and manager can modify orders
router.use(requireRole(['admin', 'manager']));
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router; 