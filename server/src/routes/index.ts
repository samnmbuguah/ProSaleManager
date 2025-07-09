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
import purchaseOrdersRoutes from './purchase-orders.js';
import productSuppliersRoutes from './product-suppliers.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', protect, userRoutes);
router.use('/products', protect, productRoutes);
router.use('/product-suppliers', protect, productSuppliersRoutes);
router.use('/suppliers', protect, suppliersRoutes);
router.use('/customers', protect, customersRoutes);
router.use('/expenses', protect, expensesRoutes);
router.use('/pos', protect, posRoutes);
router.use('/purchase-orders', protect, purchaseOrdersRoutes);
router.use('/sales', protect, salesRoutes);
router.use('/categories', protect, categoryRoutes);
router.use('/seed', seedRoutes);

export default router; 