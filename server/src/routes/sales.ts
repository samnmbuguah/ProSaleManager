import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createSale, getSales } from '../controllers/sales.controller.js';

const router = express.Router();

// Apply authentication middleware to all sales routes
router.use(authenticate);

// Get all sales with pagination
router.get('/', getSales);

// Create a new sale
router.post('/', createSale);

export default router; 