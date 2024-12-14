import { Router } from 'express';
import { db } from '../../db';
import { 
  products, 
  unitPricing,
  type UnitTypeValues,
  defaultUnitQuantities
} from '../../db/schema';
import { eq, sql, ilike } from 'drizzle-orm';
import { z } from "zod";

const router = Router();

// Define the product schema for validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  category: z.string().optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  stock_unit: z.enum(['per_piece', 'three_piece', 'dozen']),
  price_units: z.array(z.object({
    unit_type: z.enum(['per_piece', 'three_piece', 'dozen']),
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

          // console.log(`Found ${pricing.length} price units for product ${product.id}`);

          // Transform pricing data to match frontend expectations
          const price_units = pricing.map(unit => ({
            id: unit.id,
            product_id: product.id,
            unit_type: unit.unit_type as UnitTypeValues,
            quantity: unit.quantity,
            buying_price: unit.buying_price.toString(),
            selling_price: unit.selling_price.toString(),
            is_default: unit.is_default,
            created_at: unit.created_at || new Date(),
            updated_at: unit.updated_at || new Date()
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
// Search products endpoint
router.get('/search', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const query = req.query.q as string;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    console.log('Searching for products with query:', query);

    const searchResults = await db
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
        buying_price: products.buying_price,
        selling_price: products.selling_price
      })
      .from(products)
      .where(ilike(products.name, `%${query}%`))
      .orderBy(products.name);

    if (!Array.isArray(searchResults)) {
      throw new Error('Database query did not return an array');
    }

    // Fetch price units for each product
    const productsWithPricing = await Promise.all(
      searchResults.map(async (product) => {
        try {
          const pricing = await db
            .select()
            .from(unitPricing)
            .where(eq(unitPricing.product_id, product.id));

          if (!Array.isArray(pricing)) {
            console.error(`Invalid pricing data for product ${product.id}`);
            return {
              ...product,
              price_units: []
            };
          }

          return {
            ...product,
            price_units: pricing.map(unit => ({
              id: unit.id,
              product_id: product.id,
              unit_type: unit.unit_type,
              quantity: unit.quantity,
              buying_price: unit.buying_price.toString(),
              selling_price: unit.selling_price.toString(),
              is_default: unit.is_default
            }))
          };
        } catch (err) {
          console.error(`Error fetching pricing for product ${product.id}:`, err);
          return {
            ...product,
            price_units: []
          };
        }
      })
    );

    return res.json(productsWithPricing);
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ 
      error: 'Failed to search products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new product with unit pricing
router.post('/', async (req, res) => {
  try {
    const validatedData = productSchema.parse(req.body) as ProductFormData;

    await db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(products)
        .values({
          name: validatedData.name,
          sku: validatedData.sku,
          stock: validatedData.stock,
          category: validatedData.category || "",
          min_stock: validatedData.min_stock || 0,
          max_stock: validatedData.max_stock || 0,
          reorder_point: validatedData.reorder_point || 0,
          stock_unit: validatedData.stock_unit,
          buying_price: validatedData.price_units[0].buying_price,
          selling_price: validatedData.price_units[0].selling_price
        })
        .returning();

      const unitPricingData = validatedData.price_units.map((unit: {
        unit_type: UnitTypeValues;
        quantity: number;
        buying_price: string;
        selling_price: string;
        is_default: boolean;
      }) => ({
        product_id: newProduct.id,
        unit_type: unit.unit_type,
        quantity: defaultUnitQuantities[unit.unit_type as keyof typeof defaultUnitQuantities],
        buying_price: unit.buying_price,
        selling_price: unit.selling_price,
        is_default: unit.is_default
      }));

      await tx.insert(unitPricing).values(unitPricingData);
    });

    res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({ error: "Failed to create product" });
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
    const productId = parseInt(req.params.id);
    const validatedData = productSchema.parse(req.body);

    const defaultUnit = validatedData.price_units.find((unit: { is_default: boolean }) => unit.is_default);
    
    if (!defaultUnit) {
      return res.status(400).json({ error: "No default unit pricing provided" });
    }

    const unitPricingData = validatedData.price_units.map((unit: {
      unit_type: UnitTypeValues;
      quantity: number;
      buying_price: string;
      selling_price: string;
      is_default: boolean;
    }) => ({
      product_id: productId,
      unit_type: unit.unit_type,
      quantity: defaultUnitQuantities[unit.unit_type as keyof typeof defaultUnitQuantities],
      buying_price: unit.buying_price,
      selling_price: unit.selling_price,
      is_default: unit.is_default
    }));

    // Update product and unit pricing in a transaction
    await db.transaction(async (tx) => {
      // Update product
      await tx
        .update(products)
        .set({
          name: validatedData.name,
          sku: validatedData.sku,
          stock: validatedData.stock,
          category: validatedData.category,
          min_stock: validatedData.min_stock,
          max_stock: validatedData.max_stock,
          reorder_point: validatedData.reorder_point,
          stock_unit: validatedData.stock_unit
        })
        .where(eq(products.id, productId));

      // Delete existing unit pricing
      await tx
        .delete(unitPricing)
        .where(eq(unitPricing.product_id, productId));

      // Insert new unit pricing
      await tx.insert(unitPricing).values(unitPricingData);
    });

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

export default router;