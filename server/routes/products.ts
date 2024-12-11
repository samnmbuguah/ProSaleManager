import { Router } from 'express';
import { db } from '../../db';
import { products, productPrices, insertProductSchema, unitPricing, UnitTypeValues, defaultUnitQuantities } from '../../db/schema';
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
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string(),
  stock: z.number().min(0, "Stock cannot be negative"),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  stock_unit: z.enum(UnitTypeValues).default("per_piece"),
  price_units: z.array(z.object({
    unit_type: z.enum(UnitTypeValues),
    quantity: z.number().int().positive(),
    buying_price: z.union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
      z.number().positive()
    ]).transform(val => typeof val === 'string' ? val : val.toString()),
    selling_price: z.union([
      z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
      z.number().positive()
    ]).transform(val => typeof val === 'string' ? val : val.toString()),
    is_default: z.boolean()
  })).min(1, "At least one price unit is required").refine(
    (units) => units.filter(unit => unit.is_default).length === 1,
    "Exactly one price unit must be marked as default"
  )
});

// Create a new product with unit pricing
router.post('/', async (req, res) => {
  try {
    console.log('Received product data:', JSON.stringify(req.body, null, 2));
    const validatedData = productSchema.parse(req.body);
    const { price_units, ...productData } = validatedData;

    // Validate that we have a default unit
    const defaultUnit = price_units.find(unit => unit.is_default);
    if (!defaultUnit) {
      throw new Error("A default price unit must be specified");
    }

    const result = await db.transaction(async (tx) => {
      // Step 1: Create the product first
      const [newProduct] = await tx.insert(products)
        .values({
          name: productData.name,
          sku: productData.sku,
          category: productData.category,
          stock: productData.stock,
          min_stock: productData.min_stock,
          max_stock: productData.max_stock,
          reorder_point: productData.reorder_point,
          stock_unit: productData.stock_unit,
          default_unit_pricing_id: null // Will be set after creating unit prices
        })
        .returning();
      
      console.log('Created product:', JSON.stringify(newProduct, null, 2));
      
      // Step 2: Create unit pricing entries
      const unitPricingData = price_units.map(unit => {
        // Ensure prices are valid decimal strings
        const buyingPrice = typeof unit.buying_price === 'number' 
          ? unit.buying_price.toString() 
          : unit.buying_price;
        const sellingPrice = typeof unit.selling_price === 'number'
          ? unit.selling_price.toString()
          : unit.selling_price;
          
        return {
          product_id: newProduct.id,
          unit_type: unit.unit_type,
          quantity: defaultUnitQuantities[unit.unit_type as UnitTypeValues],
          buying_price: buyingPrice,
          selling_price: sellingPrice,
          is_default: unit.is_default,
        };
      });
      
      console.log('Creating unit pricing with data:', JSON.stringify(unitPricingData, null, 2));
      
      try {
        const insertedPricingUnits = await tx.insert(unitPricing)
          .values(unitPricingData)
          .returning();
        
        console.log('Created unit pricing:', JSON.stringify(insertedPricingUnits, null, 2));
        
        // Find the default pricing unit
        const defaultPricingUnit = insertedPricingUnits.find(unit => unit.is_default);
        if (!defaultPricingUnit) {
          throw new Error("No default pricing unit was created");
        }
        
        // Step 3: Update product with the default unit pricing ID
        const [updatedProduct] = await tx.update(products)
          .set({ 
            default_unit_pricing_id: defaultPricingUnit.id
          })
          .where(eq(products.id, newProduct.id))
          .returning();
        
        console.log('Updated product with default pricing:', JSON.stringify(updatedProduct, null, 2));
        
        return {
          ...updatedProduct,
          price_units: insertedPricingUnits.map(unit => ({
            unit_type: unit.unit_type,
            quantity: unit.quantity,
            buying_price: unit.buying_price,
            selling_price: unit.selling_price,
            is_default: unit.is_default
          }))
        };
      } catch (err) {
        console.error('Error creating unit pricing:', err);
        throw new Error(`Failed to create unit pricing: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to create product',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Get all products with their price units
router.get('/', async (req, res) => {
  try {
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stock: products.stock,
        category: products.category,
        min_stock: products.min_stock,
        max_stock: products.max_stock,
        reorder_point: products.reorder_point,
        stock_unit: products.stock_unit,
        default_unit_pricing_id: products.default_unit_pricing_id,
      })
      .from(products);

    // Fetch price units for each product
    const result = await Promise.all(
      productsData.map(async (product) => {
        const priceUnits = await db
          .select({
            id: unitPricing.id,
            unit_type: unitPricing.unit_type,
            quantity: unitPricing.quantity,
            buying_price: unitPricing.buying_price,
            selling_price: unitPricing.selling_price,
            is_default: unitPricing.is_default,
          })
          .from(unitPricing)
          .where(eq(unitPricing.product_id, product.id));

        return {
          ...product,
          price_units: priceUnits.map(unit => ({
            unit_type: unit.unit_type,
            quantity: unit.quantity,
            buying_price: unit.buying_price,
            selling_price: unit.selling_price,
            is_default: unit.is_default
          }))
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : undefined 
    });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    console.log('Fetching product with ID:', productId);

    // Get product with all its unit pricing in a single query
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stock: products.stock,
        category: products.category,
        min_stock: products.min_stock,
        max_stock: products.max_stock,
        reorder_point: products.reorder_point,
        stock_unit: products.stock_unit,
        default_unit_pricing_id: products.default_unit_pricing_id,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      console.log('Product not found with ID:', productId);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Found product:', product);

    // Get all unit pricing for the product
    const priceUnits = await db
      .select({
        id: unitPricing.id,
        unit_type: unitPricing.unit_type,
        quantity: unitPricing.quantity,
        buying_price: unitPricing.buying_price,
        selling_price: unitPricing.selling_price,
        is_default: unitPricing.is_default,
      })
      .from(unitPricing)
      .where(eq(unitPricing.product_id, product.id));

    console.log('Found price units:', priceUnits);

    const formattedPriceUnits = priceUnits.map(unit => ({
      unit_type: unit.unit_type,
      quantity: unit.quantity,
      buying_price: unit.buying_price.toString(),
      selling_price: unit.selling_price.toString(),
      is_default: unit.is_default
    }));

    const response = {
      ...product,
      price_units: formattedPriceUnits
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error instanceof Error ? error.message : undefined
    });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const validatedData = productSchema.parse(req.body);
    const productId = parseInt(req.params.id);

    const result = await db.transaction(async (tx) => {
      // Get the default pricing unit
      const defaultUnit = validatedData.price_units.find(unit => unit.is_default);
      if (!defaultUnit) {
        throw new Error("A default pricing unit is required");
      }

      // Step 1: Remove the default_unit_pricing_id reference first
      await tx.update(products)
        .set({ default_unit_pricing_id: null })
        .where(eq(products.id, productId));

      // Step 2: Delete existing unit pricing
      await tx.delete(unitPricing)
        .where(eq(unitPricing.product_id, productId));

      // Step 3: Insert new unit pricing
      let newDefaultPricingId = null;
      if (validatedData.price_units && validatedData.price_units.length > 0) {
        const unitPricingData = validatedData.price_units.map(unit => ({
          product_id: productId,
          unit_type: unit.unit_type,
          quantity: defaultUnitQuantities[unit.unit_type as UnitTypeValues],
          buying_price: unit.buying_price,
          selling_price: unit.selling_price,
          is_default: unit.is_default,
        }));

        const insertedPricingUnits = await tx.insert(unitPricing)
          .values(unitPricingData)
          .returning();

        // Find the default pricing unit
        const defaultPricingUnit = insertedPricingUnits.find(unit => unit.is_default);
        if (defaultPricingUnit) {
          newDefaultPricingId = defaultPricingUnit.id;
        }
      }

      // Step 4: Update the product with all new information including the new default pricing ID
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
          buying_price: defaultUnit.buying_price,
          selling_price: defaultUnit.selling_price,
          default_unit_pricing_id: newDefaultPricingId,
        })
        .where(eq(products.id, productId));

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