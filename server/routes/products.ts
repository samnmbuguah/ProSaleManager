import { Router } from 'express';
import { db } from '../../db';
import { products, productPrices, insertProductSchema, unitPricing, UnitTypeValues } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const priceUnitSchema = z.object({
  unit_type: z.enum(UnitTypeValues),
  quantity: z.number(),
  buying_price: z.string(),
  selling_price: z.string(),
  is_default: z.boolean()
});

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string(),
  category: z.string(),
  stock: z.number(),
  min_stock: z.number(),
  max_stock: z.number(),
  reorder_point: z.number(),
  stock_unit: z.enum(UnitTypeValues),
  price_units: z.array(z.object({
    unit_type: z.enum(UnitTypeValues),
    quantity: z.number(),
    buying_price: z.string(),
    selling_price: z.string(),
    is_default: z.boolean()
  }))
});

// Create a new product with unit pricing
router.post('/', async (req, res) => {
  try {
    const validatedData = productSchema.parse(req.body);
    const { price_units, ...productData } = validatedData;
    
    // Get the default pricing unit for the product's base price
    const defaultUnit = price_units.find(unit => unit.is_default);
    if (!defaultUnit) {
      throw new Error("A default pricing unit is required");
    }

    // Prepare the product data with the default unit's prices
    const validatedProduct = {
      ...productData,
      buying_price: defaultUnit.buying_price,
      selling_price: defaultUnit.selling_price,
    };
    
    const result = await db.transaction(async (tx) => {
      // Create the product first
      const [newProduct] = await tx.insert(products)
        .values(validatedProduct)
        .returning();
      
      // Create unit pricing entries if provided
      if (Array.isArray(price_units) && price_units.length > 0) {
        const unitPricingData = price_units.map(unit => ({
          product_id: newProduct.id,
          unit_type: unit.unit_type,
          quantity: unit.quantity,
          buying_price: unit.buying_price,
          selling_price: unit.selling_price,
          is_default: unit.is_default,
        }));
        
        const [defaultPricing] = await tx.insert(unitPricing)
          .values(unitPricingData)
          .returning();
        
        // Update product with default unit pricing ID
        await tx.update(products)
          .set({ default_unit_pricing_id: defaultPricing.id })
          .where(eq(products.id, newProduct.id));
          
        // Get the updated product with all pricing
        const [updatedProduct] = await tx.select()
          .from(products)
          .where(eq(products.id, newProduct.id))
          .limit(1);
          
        const prices = await tx.select()
          .from(unitPricing)
          .where(eq(unitPricing.product_id, newProduct.id));
          
        return { ...updatedProduct, unit_pricing: prices };
      }
      
      return newProduct;
    });
    
    res.status(201).json(result);
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
          sku: validatedData.sku,
          category: validatedData.category,
          stock: validatedData.stock,
          min_stock: validatedData.min_stock,
          max_stock: validatedData.max_stock,
          reorder_point: validatedData.reorder_point,
          stock_unit: validatedData.stock_unit,
        })
        .where(eq(products.id, productId));

      // Delete existing unit pricing
      await tx.delete(unitPricing)
        .where(eq(unitPricing.product_id, productId));

      // Insert new unit pricing
      if (validatedData.price_units && validatedData.price_units.length > 0) {
        const unitPricingData = validatedData.price_units.map(unit => ({
          product_id: productId,
          unit_type: unit.unit_type,
          quantity: unit.quantity,
          buying_price: unit.buying_price,
          selling_price: unit.selling_price,
          is_default: unit.is_default,
        }));

        await tx.insert(unitPricing).values(unitPricingData);
      }

      // Fetch the updated product
      const [updatedProduct] = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      const prices = await tx
        .select()
        .from(unitPricing)
        .where(eq(unitPricing.product_id, productId));

      return { ...updatedProduct, price_units: prices };
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