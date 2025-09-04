import { Router } from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { Op, Sequelize } from "sequelize";
import upload, { getImageUrl } from "../middleware/upload.js";
// Cloudinary import commented out for testing
// import cloudinary from "../config/cloudinary.js";
import PurchaseOrderItem from "../models/PurchaseOrderItem.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  // For testing, just return a placeholder URL
  return `https://example.com/products/${file.originalname}`;
}

// Get all products with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      is_active,
      low_stock,
      search
    } = req.query;

    const where: Record<string, unknown> = {};

    // Add filters
    if (category_id) where.category_id = Number(category_id);
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (low_stock === 'true') {
      where.quantity = { [Op.lte]: { [Op.col]: 'min_quantity' } };
    }
    if (search) {
      (where as any)[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Add store filtering for non-super-admin users
    if (req.user && req.user.role !== 'super_admin' && req.user.store_id) {
      where.store_id = req.user.store_id;
    }

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: "Category",
          attributes: ["id", "name"]
        }
      ],
      order: [["name", "ASC"]],
      limit: limitNum,
      offset: offset
    });

    const totalPages = Math.ceil(count / limitNum);

    const responseData = {
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Search products endpoint - must come before /:id routes
router.get("/search", async (req, res) => {
  try {
    const { q: query, category_id } = req.query;
    console.log("Received search query:", query);

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.json({ success: true, data: [] });
    }

    const where: Record<string, unknown> = {
      [Op.or]: [
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), 'LIKE', `%${query.toLowerCase()}%`),
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('sku')), 'LIKE', `%${query.toLowerCase()}%`)
      ]
    };

    // Add category filter if provided
    if (category_id) {
      where.category_id = Number(category_id);
    }

    // Add store filtering for non-super-admin users
    if (req.user && req.user.role !== 'super_admin' && req.user.store_id) {
      where.store_id = req.user.store_id;
    }

    const products = await Product.findAll({
      where,
      include: [
        {
          model: Category,
          as: "Category",
          attributes: ["id", "name"]
        }
      ],
      order: [["name", "ASC"]],
    });

    console.log("Products found:", products.length);
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error searching products:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Bulk price update - must come before /:id routes
router.put("/bulk-price-update", requireAuth, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { category_id, price_increase_percent } = req.body;

    if (!category_id || !price_increase_percent) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "category_id and price_increase_percent are required"
      });
    }

    // Validate category exists
    const Category = (await import("../models/Category.js")).default;
    const category = await Category.findByPk(Number(category_id));
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
        error: "Category not found"
      });
    }

    const products = await Product.findAll({
      where: { category_id: Number(category_id) }
    });

    let updatedCount = 0;
    for (const product of products) {
      // Check if user has access to this product's store
      if (req.user && req.user.role !== 'super_admin' && product.store_id !== req.user.store_id) {
        continue;
      }

      const increaseMultiplier = 1 + (Number(price_increase_percent) / 100);

      const updateData: Record<string, unknown> = {
        piece_selling_price: Math.round(product.piece_selling_price * increaseMultiplier * 100) / 100
      };

      if (product.pack_selling_price) {
        updateData.pack_selling_price = Math.round(product.pack_selling_price * increaseMultiplier * 100) / 100;
      }

      if (product.dozen_selling_price) {
        updateData.dozen_selling_price = Math.round(product.dozen_selling_price * increaseMultiplier * 100) / 100;
      }

      await product.update(updateData);

      updatedCount++;
    }

    res.json({
      success: true,
      data: {
        updated_count: updatedCount,
        message: `Updated ${updatedCount} products`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating prices",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});



// Create a new product
router.post("/", requireAuth, requireRole(["admin", "manager"]), upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;

    // Log the raw body for debugging
    console.log("[ProductRoute] Received req.body:", req.body);

    // Coerce all fields to correct types and only keep model fields
    const toNumber = (v: string | number | null | undefined): number | null =>
      v === undefined || v === null || v === "" ? null : Number(v);
    const toBool = (v: string | boolean | undefined): boolean => v === "true" || v === true;

    const cleanProduct: Record<string, string | number | boolean | null | undefined> = {
      name: productData.name,
      description: productData.description || undefined,
      sku: productData.sku || undefined,
      barcode: productData.barcode || undefined,
      category_id: toNumber(productData.category_id),
      piece_buying_price: toNumber(productData.piece_buying_price),
      piece_selling_price: toNumber(productData.piece_selling_price),
      pack_buying_price: toNumber(productData.pack_buying_price),
      pack_selling_price: toNumber(productData.pack_selling_price),
      dozen_buying_price: toNumber(productData.dozen_buying_price),
      dozen_selling_price: toNumber(productData.dozen_selling_price),
      quantity: toNumber(productData.quantity),
      min_quantity: toNumber(productData.min_quantity),
      is_active: toBool(productData.is_active),
      store_id: req.user?.store_id || 1,
      stock_unit: productData.stock_unit || "piece",
      // image_url will be added below
    };

    // Log the cleaned and coerced data
    console.log("[ProductRoute] Cleaned product data:", cleanProduct);

    // Upload image if provided
    let image_url = null;
    if (req.file) {
      if (process.env.CLOUDINARY_URL) {
        try {
          image_url = await uploadToCloudinary(req.file);
        } catch (cloudErr) {
          return res.status(400).json({
            success: false,
            message: "Image upload failed",
            error: cloudErr instanceof Error ? cloudErr.message : cloudErr,
          });
        }
      } else {
        image_url = getImageUrl(req.file);
      }
    }
    (cleanProduct as Record<string, string | number | boolean | null | undefined>).image_url =
      image_url;

    // Validate required fields
    if (!cleanProduct.name || !cleanProduct.sku || !cleanProduct.category_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "name, sku, and category_id are required"
      });
    }

    // Validate name length
    if (cleanProduct.name && String(cleanProduct.name).length > 255) {
      return res.status(400).json({
        success: false,
        message: "Product name too long",
        error: "Product name must be 255 characters or less"
      });
    }

    // Validate quantities are non-negative
    if (cleanProduct.quantity !== null && cleanProduct.quantity !== undefined && Number(cleanProduct.quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
        error: "Quantity cannot be negative"
      });
    }

    if (cleanProduct.min_quantity !== null && cleanProduct.min_quantity !== undefined && Number(cleanProduct.min_quantity) < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid minimum quantity",
        error: "Minimum quantity cannot be negative"
      });
    }

    // Create the product
    const safeProduct = {
      ...cleanProduct,
      name: String(cleanProduct.name || ""),
      sku: String(cleanProduct.sku || ""),
      category_id: Number(cleanProduct.category_id || 1),
      piece_buying_price: Number(cleanProduct.piece_buying_price || 0),
      piece_selling_price: Number(cleanProduct.piece_selling_price || 0),
      pack_buying_price: Number(cleanProduct.pack_buying_price || 0),
      pack_selling_price: Number(cleanProduct.pack_selling_price || 0),
      dozen_buying_price: Number(cleanProduct.dozen_buying_price || 0),
      dozen_selling_price: Number(cleanProduct.dozen_selling_price || 0),
      quantity: Number(cleanProduct.quantity || 0),
      min_quantity: Number(cleanProduct.min_quantity || 0),
      is_active: typeof cleanProduct.is_active === "boolean" ? cleanProduct.is_active : true,
      stock_unit: productData.stock_unit || "piece",
    };

    // Check for duplicate SKU
    const existingProduct = await Product.findOne({ where: { sku: safeProduct.sku } });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists",
        error: "SKU must be unique"
      });
    }

    // Validate category exists
    if (safeProduct.category_id) {
      const Category = (await import("../models/Category.js")).default;
      const category = await Category.findByPk(safeProduct.category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
          error: "Category not found"
        });
      }
    }

    const product = await Product.create(safeProduct);

    // Return product with success response
    const productWithUnits = await Product.findByPk(product.id);
    res.status(201).json({
      success: true,
      data: productWithUnits
    });
  } catch (error) {
    let errorMsg = "Error creating product";
    if (error instanceof Error && error.message.includes("image")) {
      errorMsg = error.message;
    }
    res.status(500).json({
      success: false,
      message: errorMsg,
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Update a product
router.put("/:id", requireAuth, requireRole(["admin", "manager"]), upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if user has access to this product's store
    if (req.user && req.user.role !== 'super_admin' && product.store_id !== req.user.store_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this product"
      });
    }

    // Upload new image if provided
    if (req.file) {
      if (process.env.CLOUDINARY_URL) {
        try {
          const image_url = await uploadToCloudinary(req.file);
          productData.image_url = image_url;
        } catch (cloudErr) {
          return res.status(400).json({
            success: false,
            message: "Image upload failed",
            error: cloudErr instanceof Error ? cloudErr.message : cloudErr,
          });
        }
      } else {
        productData.image_url = getImageUrl(req.file);
      }
    }

    // Validate data
    if (productData.piece_selling_price !== undefined) {
      const price = Number(productData.piece_selling_price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid selling price",
          error: "Price must be a valid non-negative number"
        });
      }
    }

    if (productData.quantity !== undefined) {
      const quantity = Number(productData.quantity);
      if (isNaN(quantity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
          error: "Quantity must be a valid number"
        });
      }
    }

    // Ensure quantity is a number
    if (productData.quantity !== undefined) {
      productData.quantity = Number(productData.quantity);
    }

    // Log the data being sent to update
    console.log("Updating product with data:", productData);
    console.log(
      "Before update: product.stock_unit =",
      product.stock_unit,
      "productData.stock_unit =",
      productData.stock_unit,
    );
    await product.update(productData);
    await product.reload();
    console.log("After update: product.stock_unit =", product.stock_unit);

    // Return updated product
    const updatedProduct = await Product.findByPk(product.id);

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    let errorMsg = "Error updating product";
    if (error instanceof Error && error.message.includes("image")) {
      errorMsg = error.message;
    }
    res.status(500).json({
      success: false,
      message: errorMsg,
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Delete a product
router.delete("/:id", requireAuth, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      // Check if user has access to this product's store
      if (req.user && req.user.role !== 'super_admin' && product.store_id !== req.user.store_id) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this product"
        });
      }

      // Check if product is referenced in purchase order items
      const refCount = await PurchaseOrderItem.count({
        where: { product_id: product.id },
      });
      if (refCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete product: it is referenced in purchase orders.",
        });
      }
      // Delete image from Cloudinary if exists and Cloudinary is configured
      if (product.image_url) {
        try {
          // For testing, just log the image deletion
          console.log(`Would delete image: ${product.image_url}`);
        } catch {
          console.log("Image deletion not available, skipping");
        }
      }
      await product.destroy();
      res.json({
        success: true,
        message: "Product deleted successfully"
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get product pricing information
router.get("/:id/pricing", requireAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if user has access to this product's store
    if (req.user && req.user.role !== 'super_admin' && product.store_id !== req.user.store_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this product"
      });
    }

    // Calculate profit margins
    const piece_margin = product.piece_selling_price - product.piece_buying_price;
    const pack_margin = (product.pack_selling_price || 0) - (product.pack_buying_price || 0);
    const dozen_margin = (product.dozen_selling_price || 0) - (product.dozen_buying_price || 0);

    res.json({
      success: true,
      data: {
        piece_margin,
        pack_margin,
        dozen_margin,
        piece_margin_percent: product.piece_buying_price > 0 ? (piece_margin / product.piece_buying_price) * 100 : 0,
        pack_margin_percent: (product.pack_buying_price || 0) > 0 ? (pack_margin / (product.pack_buying_price || 1)) * 100 : 0,
        dozen_margin_percent: (product.dozen_buying_price || 0) > 0 ? (dozen_margin / (product.dozen_buying_price || 1)) * 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating pricing",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});



// Stock adjustment
router.post("/:id/adjust-stock", requireAuth, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { quantity_change, reason } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if user has access to this product's store
    if (req.user && req.user.role !== 'super_admin' && product.store_id !== req.user.store_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this product"
      });
    }

    if (!quantity_change || isNaN(Number(quantity_change))) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity change",
        error: "quantity_change must be a valid number"
      });
    }

    const newQuantity = product.quantity + Number(quantity_change);
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity change",
        error: "Resulting quantity cannot be negative"
      });
    }

    await product.update({ quantity: newQuantity });

    res.json({
      success: true,
      data: {
        message: `Stock adjusted by ${quantity_change}`,
        new_quantity: newQuantity,
        reason: reason || "Stock adjustment"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adjusting stock",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Stock adjustment
router.post("/:id/adjust-stock", requireAuth, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { quantity_change, reason } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!quantity_change || isNaN(Number(quantity_change))) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity change",
        error: "quantity_change must be a valid number"
      });
    }

    const newQuantity = product.quantity + Number(quantity_change);
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity change",
        error: "Resulting quantity cannot be negative"
      });
    }

    await product.update({ quantity: newQuantity });

    res.json({
      success: true,
      data: {
        message: `Stock adjusted by ${quantity_change}`,
        new_quantity: newQuantity,
        reason: reason || "Stock adjustment"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adjusting stock",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get a single product - must come after all specific routes
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if user has access to this product's store
    if (req.user && req.user.role !== 'super_admin' && product.store_id !== req.user.store_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this product"
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
