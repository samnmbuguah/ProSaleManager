import { Router } from 'express';
import { db } from '../../db';
import { products, unitPricing, UnitTypeValues, defaultUnitQuantities } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { seedProducts } from '../seed/products';

const router = Router();

router.post('/seed-demo-data', async (req, res) => {
  try {
    // Clear existing data in a separate transaction
    console.log('Starting data cleanup...');
    
    await db.transaction(async (tx) => {
      // Step 1: Remove all default_unit_pricing_id references from products
      await tx.update(products)
        .set({ default_unit_pricing_id: null });
      console.log('Removed default_unit_pricing_id references');
      
      // Step 2: Delete all unit pricing entries
      await tx.delete(unitPricing);
      console.log('Deleted unit pricing entries');
      
      // Step 3: Delete all products
      await tx.delete(products);
      console.log('Deleted products');
    });

    console.log('Starting demo data insertion...');
    
    // Insert new data in a separate transaction
    const result = await db.transaction(async (tx) => {
      const createdProducts = [];
      
      for (const productData of seedProducts) {
        const { price_units, ...productDetails } = productData;
        console.log(`Processing product: ${productDetails.name}`);
        
        // Validate default price unit
        const defaultUnit = price_units.find(unit => unit.is_default);
        if (!defaultUnit) {
          throw new Error(`Product ${productDetails.name} has no default price unit`);
        }

        // Step 1: Create product without default unit pricing ID
        const [newProduct] = await tx.insert(products)
          .values({
            name: productDetails.name,
            sku: productDetails.sku || generateSKU(productDetails.name),
            category: productDetails.category,
            stock: productDetails.stock,
            min_stock: productDetails.min_stock,
            max_stock: productDetails.max_stock,
            reorder_point: productDetails.reorder_point,
            stock_unit: productDetails.stock_unit,
            default_unit_pricing_id: null
          })
          .returning();

        console.log(`Created product: ${newProduct.id}`);
        
        // Step 2: Create all price units
        const priceUnitsData = price_units.map(unit => ({
          product_id: newProduct.id,
          unit_type: unit.unit_type,
          quantity: defaultUnitQuantities[unit.unit_type as UnitTypeValues],
          buying_price: unit.buying_price.toString(),
          selling_price: unit.selling_price.toString(),
          is_default: unit.is_default,
        }));
        
        const insertedPricingUnits = await tx.insert(unitPricing)
          .values(priceUnitsData)
          .returning();
          
        console.log(`Created ${insertedPricingUnits.length} price units for product ${newProduct.id}`);
        
        // Find the default pricing unit
        const defaultPricingUnit = insertedPricingUnits.find(unit => unit.is_default);
        if (!defaultPricingUnit) {
          throw new Error(`No default pricing unit found for product ${newProduct.name}`);
        }
        
        // Step 3: Update product with default unit pricing ID
        const [updatedProduct] = await tx.update(products)
          .set({ default_unit_pricing_id: defaultPricingUnit.id })
          .where(eq(products.id, newProduct.id))
          .returning();
        
        createdProducts.push({
          ...updatedProduct,
          price_units: insertedPricingUnits.map(unit => ({
            unit_type: unit.unit_type,
            quantity: unit.quantity,
            buying_price: unit.buying_price,
            selling_price: unit.selling_price,
            is_default: unit.is_default
          }))
        });
      }
      
      return createdProducts;
    });
    
    console.log('Demo data seeding completed successfully');
    res.status(201).json({
      message: 'Demo data seeded successfully',
      products: result
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to seed demo data' 
    });
  }
});

function generateSKU(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .padEnd(6, '0') + 
    Math.random().toString(36).substring(2, 5).toUpperCase();
}

export default router;
