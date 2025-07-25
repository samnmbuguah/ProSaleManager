import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
} from "../controllers/product.controller.js";
import Product from "../models/Product.js";
import { Op } from "sequelize";
import { uploadCsv } from "../middleware/upload.js";
import upload from "../middleware/upload.js";
import { Sequelize } from "sequelize";
import { requireStoreContext } from "../middleware/store-context.middleware.js";

const router = Router();

// Search products endpoint
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    console.log("Received search query:", query);
    if (!query || typeof query !== "string" || query.trim() === "") {
      // Return all products if search is empty
      const products = await Product.findAll({ order: [["name", "ASC"]] });
      return res.json({ success: true, data: products });
    }
    const search = query.toLowerCase();
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          Sequelize.where(Sequelize.fn("lower", Sequelize.col("name")), "LIKE", `%${search}%`),
          Sequelize.where(Sequelize.fn("lower", Sequelize.col("sku")), "LIKE", `%${search}%`),
          Sequelize.where(Sequelize.fn("lower", Sequelize.col("barcode")), "LIKE", `%${search}%`),
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
router.get("/", requireAuth, requireStoreContext, getProducts);
router.get("/:id", requireAuth, requireStoreContext, getProduct);

// Only admin and manager can modify products
router.use(requireAuth);
router.use(requireRole(["admin", "manager"]));
router.use(requireStoreContext);

// Bulk upload products via CSV
router.post("/bulk-upload", uploadCsv.single("file"), bulkUploadProducts);

// Use upload.array for multiple images, allow up to 5
router.post("/", upload.array("images", 5), createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
