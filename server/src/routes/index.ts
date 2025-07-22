import express from 'express'
import authRoutes from './auth.routes.js'
import productRoutes from './product.routes.js'
import customerRoutes from './customers.js'
import supplierRoutes from './suppliers.js'
import salesRoutes from './sales.js'
import purchaseOrderRoutes from './purchase-orders.js'
import reportRoutes from './reports.js'
import expenseRoutes from './expenses.js'
import userRoutes from './user.routes.js'
import categoryRoutes from './category.routes.js'
import productSupplierRoutes from './product-suppliers.js'
import seedRoutes from './seed.js'
import orderRoutes from './order.routes.js'
import storesRoutes from './stores.js';
import { ApiError } from '../utils/api-error.js';

const router = express.Router()

router.get('/test-error', () => {
  throw new ApiError(418, 'Test error handler');
});

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/customers', customerRoutes)
router.use('/suppliers', supplierRoutes)
router.use('/sales', salesRoutes)
router.use('/purchase-orders', purchaseOrderRoutes)
router.use('/reports', reportRoutes)
router.use('/expenses', expenseRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/product-suppliers', productSupplierRoutes)
router.use('/seed', seedRoutes)
router.use('/orders', orderRoutes)
router.use('/stores', storesRoutes);

export default router 