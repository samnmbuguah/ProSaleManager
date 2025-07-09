import { Router } from "express";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import ProductSupplier from "../models/ProductSupplier.js";
import { Op } from "sequelize";
import upload, { getImageUrl } from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";
import PurchaseOrderItem from "../models/PurchaseOrderItem.js";

const router = Router();

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      },
    );

    uploadStream.end(file.buffer);
  });
}

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [["name", "ASC"]],
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Error fetching products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Search products endpoint
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    console.log("Received search query:", query);
    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.json({ success: true, data: [] });
    }

    const products = await Product.findAll({
      where: {
        name: { [Op.iLike]: `%${query}%` },
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

// Get a single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Supplier,
          through: ProductSupplier,
        },
      ],
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
});

// Create a new product
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;

    // Log the raw body for debugging
    console.log('[ProductRoute] Received req.body:', req.body);

    // Coerce all fields to correct types and only keep model fields
    const toNumber = (v) => v === undefined || v === null || v === '' ? null : Number(v);
    const toBool = (v) => v === 'true' || v === true;

    const cleanProduct = {
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
      // image_url will be added below
    };

    // Log the cleaned and coerced data
    console.log('[ProductRoute] Cleaned product data:', cleanProduct);

    // Upload image if provided
    let image_url = null;
    if (req.file) {
      if (process.env.CLOUDINARY_URL) {
        try {
          image_url = await uploadToCloudinary(req.file);
        } catch (cloudErr) {
          return res.status(400).json({
            message: "Image upload failed",
            error: cloudErr instanceof Error ? cloudErr.message : cloudErr,
          });
        }
      } else {
        image_url = getImageUrl(req.file);
      }
    }
    cleanProduct.image_url = image_url;

    // Create the product
    const product = await Product.create(cleanProduct);

    // Return product with price_units
    const productWithUnits = await Product.findByPk(product.id);
    res.status(201).json(productWithUnits);
  } catch (error) {
    let errorMsg = "Error creating product";
    if (error instanceof Error && error.message.includes("image")) {
      errorMsg = error.message;
    }
    res.status(500).json({
      message: errorMsg,
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Update a product
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const productData = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Upload new image if provided
    if (req.file) {
      if (process.env.CLOUDINARY_URL) {
        try {
          const image_url = await uploadToCloudinary(req.file);
          productData.image_url = image_url;
        } catch (cloudErr) {
          return res.status(400).json({
            message: "Image upload failed",
            error: cloudErr instanceof Error ? cloudErr.message : cloudErr,
          });
        }
      } else {
        productData.image_url = getImageUrl(req.file);
      }
    }

    // Ensure quantity is a number
    if (productData.quantity !== undefined) {
      productData.quantity = Number(productData.quantity);
    }

    // Log the data being sent to update
    console.log("Updating product with data:", productData);

    await product.update(productData);

    // Return updated product
    const updatedProduct = await Product.findByPk(product.id);

    res.json(updatedProduct);
  } catch (error) {
    let errorMsg = "Error updating product";
    if (error instanceof Error && error.message.includes("image")) {
      errorMsg = error.message;
    }
    res.status(500).json({
      message: errorMsg,
      error: error instanceof Error ? error.message : error,
    });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (product) {
      // Check if product is referenced in purchase order items
      const refCount = await PurchaseOrderItem.count({
        where: { product_id: product.id },
      });
      if (refCount > 0) {
        return res.status(400).json({
          message:
            "Cannot delete product: it is referenced in purchase orders.",
        });
      }
      // Delete image from Cloudinary if exists
      if (product.image_url) {
        const publicId = product.image_url.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        }
      }
      await product.destroy();
      res.json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
});

export default router;
