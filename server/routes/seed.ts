import { Router } from 'express';
import { db } from '../../db';
import { products, unitPricing } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { seedProducts } from '../seed/products';

const router = Router();

router.post('/seed-demo-data', async (req, res) => {
  try {
    const result = await db.transaction(async (tx) => {
      const createdProducts = [];
      
      for (const productData of seedProducts) {
        const { price_units, ...productDetails } = productData;
        
        // Find default price unit
        const defaultUnit = price_units.find(unit => unit.is_default);
        if (!defaultUnit) {
          throw new Error(`Product ${productData.name} has no default price unit`);
        }
        
        // Create product with default unit prices
        const [newProduct] = await tx.insert(products)
          .values({
            ...productDetails,
            buying_price: defaultUnit.buying_price,
            selling_price: defaultUnit.selling_price,
          })
          .returning();
          
        // Create all price units
        const priceUnitsData = price_units.map(unit => ({
          product_id: newProduct.id,
          unit_type: unit.unit_type,
          quantity: unit.quantity,
          buying_price: unit.buying_price,
          selling_price: unit.selling_price,
          is_default: unit.is_default,
        }));
        
        const [defaultPricing] = await tx.insert(unitPricing)
          .values(priceUnitsData)
          .returning();
          
        // Update product with default unit pricing ID
        await tx.update(products)
          .set({ default_unit_pricing_id: defaultPricing.id })
          .where(eq(products.id, newProduct.id));
          
        createdProducts.push({
          ...newProduct,
          price_units: priceUnitsData
        });
      }
      
      return createdProducts;
    });
    
    res.status(201).json({
      message: 'Demo data seeded successfully',
      products: result
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

export default router;
