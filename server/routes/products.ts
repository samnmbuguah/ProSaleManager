import { Router } from 'express';
import { db } from '../../db';
import { products, productPrices, insertProductSchema } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const priceUnitSchema = z.object({
  stock_unit: z.string(),
  selling_price: z.string(),
  buying_price: z.string(),
  conversion_rate: z.string(),
});

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  stock_unit: z.string(),
  priceUnits: z.array(priceUnitSchema).min(1),
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const validatedData = insertProductSchema.parse(req.body);
    const [newProduct] = await db.insert(products).values(validatedData).returning();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get all products with their price units
router.get('/', async (req, res) => {
  try {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        buying_price: products.buying_price,
        selling_price: products.selling_price,
        stock: products.stock,
        category: products.category,
        min_stock: products.min_stock,
        max_stock: products.max_stock,
        reorder_point: products.reorder_point,
        stock_unit: products.stock_unit,
        default_unit_pricing_id: products.default_unit_pricing_id,
      })
      .from(products);

    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(req.params.id)))
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product prices
    const prices = await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.productId, product.id));

    res.json({ ...product, priceUnits: prices });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const validatedData = productSchema.parse(req.body);
    const productId = parseInt(req.params.id);

    const result = await db.transaction(async (tx) => {
      // Update the product
      await tx.update(products)
        .set({
          name: validatedData.name,
          sku: validatedData.sku || undefined,
          stock_unit: validatedData.stock_unit,
        })
        .where(eq(products.id, productId));

      // Delete existing price units
      await tx.delete(productPrices)
        .where(eq(productPrices.productId, productId));

      // Insert new price units
      await tx.insert(productPrices).values(
        validatedData.priceUnits.map(pu => ({
          productId,
          stockUnit: pu.stock_unit,
          sellingPrice: pu.selling_price,
          buyingPrice: pu.buying_price,
          conversionRate: pu.conversion_rate,
        }))
      );

      // Fetch the updated product
      const [updatedProduct] = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      const prices = await tx
        .select()
        .from(productPrices)
        .where(eq(productPrices.productId, productId));

      return { ...updatedProduct, priceUnits: prices };
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    await db.transaction(async (tx) => {
      // Delete price units first (cascade should handle this, but being explicit)
      await tx.delete(productPrices)
        .where(eq(productPrices.productId, productId));

      // Delete the product
      await tx.delete(products)
        .where(eq(products.id, productId));
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router; 