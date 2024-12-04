import { db } from '../db';
import { products, users } from '@db/schema';
import demoData from '../data/demo.json';
import { hash } from '@node-rs/argon2';

export async function loadDemoData(db: any) {
  try {
    // Check if products table is empty using a basic select
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      console.log('Loading demo products...');
      for (const product of demoData.products) {
        await db.insert(products).values({
          name: product.name,
          sku: product.sku,
          buyingPrice: product.buyingPrice,
          sellingPrice: product.sellingPrice,
          stock: product.stock,
          category: product.category,
          minStock: product.minStock,
          maxStock: product.maxStock,
          reorderPoint: product.reorderPoint,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Check if users table is empty using a basic select
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Creating default admin user...');
      const hashedPassword = await hash(demoData.users[0].password);
      await db.insert(users).values({
        email: demoData.users[0].email,
        password: hashedPassword,
        role: demoData.users[0].role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error loading demo data:', error);
    throw error;
  }
}
