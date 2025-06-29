import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import orderRoutes from './order.routes.js';
import customersRoutes from './customers.ts';
import salesRoutes from './sales.js';
import expensesRoutes from './expenses.js';
import suppliersRoutes from './suppliers.js';
import seedRoutes from './seed.js';
import posRoutes from './pos.routes.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', protect, userRoutes);
router.use('/products', protect, productRoutes);
router.use('/categories', protect, categoryRoutes);
router.use('/orders', protect, orderRoutes);
router.use('/customers', protect, customersRoutes);
router.use('/sales', salesRoutes);
router.use('/expenses', protect, expensesRoutes);
router.use('/suppliers', protect, suppliersRoutes);
router.use('/seed', protect, seedRoutes);
router.use('/pos', protect, posRoutes);

export default router; 