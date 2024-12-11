import { Router } from 'express';
import { db } from '../../db';
import { products, insertProductSchema, unitPricing, UnitTypeValues, defaultUnitQuantities } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();
function generateSKU(name: string): string {
  // Convert name to uppercase and remove special characters
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Take first 3 characters (or pad with X if shorter)
  const prefix = (cleanName + 'XXX').slice(0, 3);
  // Add random 4-digit number
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

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
  price_units: z.array(priceUnitSchema).min(1, "At least one price unit is required").refine(
    (units) => units.filter(unit => unit.is_default).length === 1,
    "Exactly one price unit must be marked as default"
  )
});

// Create a new product with unit pricing
router.post('/', async (req, res) => {
  try {
    console.log('=== Creating Product ===');
    console.log('1. Received product data:', JSON.stringify(req.body, null, 2));
    const validatedData = productSchema.parse(req.body);
    console.log('2. Validated data:', JSON.stringify(validatedData, null, 2));
    const { price_units, ...productData } = validatedData;

    const result = await db.transaction(async (tx) => {
      // Create the product first
      const [newProduct] = await tx.insert(products)
        .values({
          name: productData.name,
          sku: productData.sku || generateSKU(productData.name),
          category: productData.category,
          stock: productData.stock,
          min_stock: productData.min_stock,
          max_stock: productData.max_stock,
          reorder_point: productData.reorder_point,
          stock_unit: productData.stock_unit,
          default_unit_pricing_id: null, // Will be set after creating unit prices
          buying_price: "0", // Default value, will be updated from unit pricing
          selling_price: "0" // Default value, will be updated from unit pricing
        })
        .returning();
      
      console.log('3. Created product:', JSON.stringify(newProduct, null, 2));
      
      // Create unit pricing entries
      const unitPricingData = price_units.map(unit => ({
        product_id: newProduct.id,
        unit_type: unit.unit_type,
        quantity: defaultUnitQuantities[unit.unit_type],
        buying_price: unit.buying_price,
        selling_price: unit.selling_price,
        is_default: unit.is_default,
      }));
      
      console.log('4. Creating unit pricing with data:', JSON.stringify(unitPricingData, null, 2));
      
      const insertedPricingUnits = await tx.insert(unitPricing)
        .values(unitPricingData)
        .returning();
      
      console.log('5. Created unit pricing:', JSON.stringify(insertedPricingUnits, null, 2));
      
      // Find the default pricing unit
      const defaultPricingUnit = insertedPricingUnits.find(unit => unit.is_default);
      if (!defaultPricingUnit) {
        throw new Error("No default pricing unit was created");
      }
      
      // Update product with the default unit pricing ID
      const [updatedProduct] = await tx.update(products)
        .set({ default_unit_pricing_id: defaultPricingUnit.id })
        .where(eq(products.id, newProduct.id))
        .returning();
      
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
    console.log('Fetching all products with pricing information...');
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        category: products.category,
        stock: products.stock,
        min_stock: products.min_stock,
        max_stock: products.max_stock,
        reorder_point: products.reorder_point,
        stock_unit: products.stock_unit,
        default_unit_pricing_id: products.default_unit_pricing_id,
        created_at: products.created_at,
        updated_at: products.updated_at,
      })
      .from(products)
      .orderBy(products.name);

    console.log(`Found ${allProducts.length} products`);

    // Fetch price units for each product
    const result = await Promise.all(
      allProducts.map(async (product) => {
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

        console.log(`Found ${priceUnits.length} price units for product ${product.id}`);

        // Transform the price units into the expected format
        const formattedPriceUnits = priceUnits.map(unit => ({
          unit_type: unit.unit_type,
          quantity: unit.quantity,
          buying_price: unit.buying_price,
          selling_price: unit.selling_price,
          is_default: unit.is_default
        }));

        return {
          ...product,
          price_units: formattedPriceUnits,
          default_unit_pricing: formattedPriceUnits.find(unit => unit.is_default) || null
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
    console.log('\n=== Retrieving Product ===');
    console.log('1. Product ID:', productId);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      console.log('Product not found with ID:', productId);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Found product:', JSON.stringify(product, null, 2));

    // Get all unit pricing for the product
    const priceUnits = await db
      .select()
      .from(unitPricing)
      .where(eq(unitPricing.product_id, product.id));

    console.log('Found price units:', JSON.stringify(priceUnits, null, 2));

    const response = {
      ...product,
      price_units: priceUnits
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
      const unitPricingData = validatedData.price_units.map(unit => ({
        product_id: productId,
        unit_type: unit.unit_type,
        quantity: defaultUnitQuantities[unit.unit_type],
        buying_price: unit.buying_price,
        selling_price: unit.selling_price,
        is_default: unit.is_default,
      }));

      const insertedPricingUnits = await tx.insert(unitPricing)
        .values(unitPricingData)
        .returning();

      // Find the default pricing unit
      const defaultPricingUnit = insertedPricingUnits.find(unit => unit.is_default);
      if (!defaultPricingUnit) {
        throw new Error("No default pricing unit was created");
      }

      // Step 4: Update the product
      const [updatedProduct] = await tx.update(products)
        .set({
          name: validatedData.name,
          category: validatedData.category,
          stock: validatedData.stock,
          min_stock: validatedData.min_stock,
          max_stock: validatedData.max_stock,
          reorder_point: validatedData.reorder_point,
          stock_unit: validatedData.stock_unit,
          default_unit_pricing_id: defaultPricingUnit.id,
        })
        .where(eq(products.id, productId))
        .returning();

      return {
        ...updatedProduct,
        price_units: insertedPricingUnits
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to update product',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router;