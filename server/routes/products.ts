import { Router } from 'express';
import { Product, PriceUnit } from '../models';
import { Op } from 'sequelize';
import { z } from "zod";
import multer from 'multer';
import cloudinary from '../config/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Define the product schema for validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  category: z.string().optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  stock_unit: z.enum(['piece', 'box', 'carton', 'pack', 'kg', 'g', 'l', 'ml']),
  price_units: z.array(z.object({
    unit_type: z.enum(['piece', 'box', 'carton', 'pack', 'kg', 'g', 'l', 'ml']),
    quantity: z.number(),
    buying_price: z.string(),
    selling_price: z.string(),
    is_default: z.boolean()
  }))
});

type ProductFormData = z.infer<typeof productSchema>;

function generateSKU(name: string): string {
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefix = (cleanName + 'XXX').slice(0, 3);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

// Get all products with their price units
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all products with pricing information...');
    
    const products = await Product.findAll({
      include: [{ model: PriceUnit }],
      order: [['name', 'ASC']]
    });

    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch products',
      details: error instanceof Error ? error.stack : undefined 
    });
  }
});

// Search products endpoint
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    console.log('Searching for products with query:', query);

    const products = await Product.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      },
      include: [{ model: PriceUnit }],
      order: [['name', 'ASC']]
    });

    return res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ 
      error: 'Failed to search products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new product with unit pricing
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const validatedData = productSchema.parse(req.body) as ProductFormData;
    let imageUrl = null;

    // Upload image to Cloudinary if provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    const product = await Product.create({
      name: validatedData.name,
      sku: validatedData.sku,
      stock: validatedData.stock,
      category: validatedData.category || "",
      min_stock: validatedData.min_stock || 0,
      max_stock: validatedData.max_stock || 0,
      reorder_point: validatedData.reorder_point || 0,
      stock_unit: validatedData.stock_unit,
      image_url: imageUrl
    });

    // Create price units
    await PriceUnit.bulkCreate(
      validatedData.price_units.map(unit => ({
        product_id: product.id,
        unit_type: unit.unit_type,
        quantity: unit.quantity,
        buying_price: unit.buying_price,
        selling_price: unit.selling_price,
        is_default: unit.is_default
      }))
    );

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({ error: "Failed to create product" });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [{ model: PriceUnit }]
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Update a product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = productSchema.parse(req.body) as ProductFormData;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let imageUrl = product.image_url;

    // Upload new image to Cloudinary if provided
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (product.image_url) {
        const publicId = product.image_url.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        }
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    // Update product
    await product.update({
      name: validatedData.name,
      sku: validatedData.sku,
      stock: validatedData.stock,
      category: validatedData.category || "",
      min_stock: validatedData.min_stock || 0,
      max_stock: validatedData.max_stock || 0,
      reorder_point: validatedData.reorder_point || 0,
      stock_unit: validatedData.stock_unit,
      image_url: imageUrl
    });

    // Update price units
    await PriceUnit.destroy({ where: { product_id: id } });
    await PriceUnit.bulkCreate(
      validatedData.price_units.map(unit => ({
        product_id: product.id,
        unit_type: unit.unit_type,
        quantity: unit.quantity,
        buying_price: unit.buying_price,
        selling_price: unit.selling_price,
        is_default: unit.is_default
      }))
    );

    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({ error: "Failed to update product" });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete image from Cloudinary if exists
    if (product.image_url) {
      const publicId = product.image_url.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }
    }

    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;