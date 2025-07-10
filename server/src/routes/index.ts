import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import customersRoutes from './customers';
import salesRoutes from './sales';
import expensesRoutes from './expenses';
import suppliersRoutes from './suppliers';
import seedRoutes from './seed';
import posRoutes from './pos.routes';
import purchaseOrdersRoutes from './purchase-orders';
import productSuppliersRoutes from './product-suppliers';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Test route to verify API router is working
router.get('/test', (req, res) => res.send('API router is working!'));

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