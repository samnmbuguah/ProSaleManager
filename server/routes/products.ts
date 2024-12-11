import { Router } from 'express';
import { db } from '../../db';
import { 
  products, 
  unitPricing,
  UnitType,
  UnitTypeValues,
  defaultUnitQuantities,
  productSchema,
  type Product,
  type InsertProduct
} from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

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
    const productsWithPricing = await Promise.all(
      allProducts.map(async (product) => {
        try {
          const pricing = await db
            .select()
            .from(unitPricing)
            .where(eq(unitPricing.product_id, product.id));

          console.log(`Found ${pricing.length} price units for product ${product.id}`);

          // Transform pricing data to match frontend expectations
          const price_units = pricing.map(unit => ({
            id: unit.id,
            unit_type: unit.unit_type as UnitTypeValues,
            quantity: unit.quantity,
            buying_price: unit.buying_price.toString(),
            selling_price: unit.selling_price.toString(),
            is_default: unit.is_default
          }));

          // Find default pricing unit
          const defaultUnit = price_units.find(unit => unit.is_default);

          return {
            ...product,
            price_units,
            default_unit_pricing: defaultUnit || null,
          };
        } catch (error) {
          console.error(`Error fetching pricing for product ${product.id}:`, error);
          return {
            ...product,
            price_units: [],
            default_unit_pricing: null,
          };
        }
      })
    );
    
    res.json(productsWithPricing);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch products',
      details: error instanceof Error ? error.stack : undefined 
    });
  }
});

// Create a new product with unit pricing
router.post('/', async (req, res) => {
  try {
    console.log('Creating new product with data:', JSON.stringify(req.body, null, 2));
    const validatedData = productSchema.parse(req.body);
    
    const result = await db.transaction(async (tx) => {
      // Create the product first
      const [newProduct] = await tx
        .insert(products)
        .values({
          name: validatedData.name,
          sku: validatedData.sku || generateSKU(validatedData.name),
          category: validatedData.category,
          stock: validatedData.stock,
          min_stock: validatedData.min_stock,
          max_stock: validatedData.max_stock,
          reorder_point: validatedData.reorder_point,
          stock_unit: validatedData.stock_unit,
          default_unit_pricing_id: null,
          is_active: validatedData.is_active
        })
        .returning();
      
      // Create unit pricing entries
      const unitPricingData = validatedData.price_units.map(unit => ({
        product_id: newProduct.id,
        unit_type: unit.unit_type,
        quantity: defaultUnitQuantities[unit.unit_type as UnitTypeValues],
        buying_price: unit.buying_price,
        selling_price: unit.selling_price,
        is_default: unit.is_default,
      }));
      
      const insertedPricingUnits = await tx
        .insert(unitPricing)
        .values(unitPricingData)
        .returning();
      
      // Find the default pricing unit
      const defaultPricingUnit = insertedPricingUnits.find(unit => unit.is_default);
      if (!defaultPricingUnit) {
        throw new Error("No default pricing unit was created");
      }
      
      // Update product with the default unit pricing ID
      const [updatedProduct] = await tx
        .update(products)
        .set({ default_unit_pricing_id: defaultPricingUnit.id })
        .where(eq(products.id, newProduct.id))
        .returning();
      
      return {
        ...updatedProduct,
        price_units: insertedPricingUnits.map(unit => ({
          id: unit.id,
          unit_type: unit.unit_type as UnitTypeValues,
          quantity: unit.quantity,
          buying_price: unit.buying_price.toString(),
          selling_price: unit.selling_price.toString(),
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
      price_units: priceUnits.map(unit => ({
        ...unit,
        buying_price: unit.buying_price.toString(),
        selling_price: unit.selling_price.toString()
      }))
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
          is_active: validatedData.is_active // Added is_active
        })
        .where(eq(products.id, productId))
        .returning();

      return {
        ...updatedProduct,
        price_units: insertedPricingUnits.map(unit => ({
          ...unit,
          buying_price: unit.buying_price.toString(),
          selling_price: unit.selling_price.toString()
        }))
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