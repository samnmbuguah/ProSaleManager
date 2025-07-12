import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getProducts, searchProducts } from '../controllers/pos.controller.js';

const router = Router();

// Authenticate all POS routes
router.use(requireAuth);

// Get all products for POS
router.get('/products', getProducts);

// Search products for POS
router.get('/products/search', searchProducts);

export default router; 