import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
} from '../controllers/product.controller.js';
import Product from '../models/Product.js';
import { Op } from 'sequelize';
import { uploadCsv } from '../middleware/upload.js';

const router = Router();

// Search products endpoint
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    console.log("Received search query:", query);
    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.json({ success: true, data: [] });
    }

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { sku: { [Op.iLike]: `%${query}%` } },
          { barcode: { [Op.iLike]: `%${query}%` } },
        ],
      },
      order: [["name", "ASC"]],
    });
    console.log("Products found:", products.length);
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error searching products:", error);
    return res.status(500).json({
      message: "Error searching products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// All authenticated users can view products
router.get('/', getProducts);
router.get('/:id', getProduct);

// Only admin and manager can modify products
router.use(requireAuth);
router.use(requireRole(['admin', 'manager']));

// Bulk upload products via CSV
router.post('/bulk-upload', uploadCsv.single('file'), bulkUploadProducts);

router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router; 