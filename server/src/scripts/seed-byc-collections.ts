#!/usr/bin/env node
/**
 * BYC Collections Seeding Script
 * 
 * This script seeds the BYC Collections store with products from Itemlist.csv
 * 
 * Usage: npx tsx src/scripts/seed-byc-collections.ts
 */

import { sequelize } from "../config/database.js";
import { Store, User, Category, Product, sequelize as seq } from "../models/index.js";
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import bcrypt from 'bcrypt';

interface ProductCSV {
  Category: string;
  'Item Name': string;
  'Margin %': string;
  'Cost': string;
  'Active Price': string;
}

async function seedBYCCollections() {
  try {
    console.log("🚀 Starting BYC Collections database seeding...");
    
    // Read the CSV file
    const csvFilePath = path.join(process.cwd(), 'Itemlist.csv');
    const products: ProductCSV[] = [];
    
    // Parse CSV
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv.parse({ headers: true, skipLines: 0 }))
        .on('error', error => reject(error))
        .on('data', (row: ProductCSV) => products.push(row))
        .on('end', () => resolve());
    });

    console.log(`📊 Found ${products.length} products in the CSV`);

    // Start transaction
    const transaction = await seq.transaction();

    try {
      // Create or find BYC Collections store
      let store = await Store.findOne({ 
        where: { name: 'BYC Collections' },
        transaction 
      });

      if (!store) {
        store = await Store.create({
          name: 'BYC Collections',
          subdomain: 'byc-collections',
          is_active: true
        }, { transaction });
        console.log("🏪 Created BYC Collections store");
      } else {
        console.log("🏪 Using existing BYC Collections store");
      }

      // Create admin user for BYC Collections
      const hashedPassword = await bcrypt.hash('bycadmin123', 10);
      
      const [admin] = await User.findOrCreate({
        where: { email: 'admin@byccollections.com' },
        defaults: {
          name: 'BYC Admin',
          email: 'admin@byccollections.com',
          password: hashedPassword,
          role: 'admin',
          is_active: true,
          store_id: store.id
        },
        transaction
      });

      console.log(`👤 Created admin user: ${admin.email}`);

      // Get unique categories from CSV
      const categories = [...new Set(products.map(p => p.Category))];
      
      // Create categories
      const categoryMap = new Map<string, Category>();
      for (const categoryName of categories) {
        if (!categoryName) continue;
        
        const [category] = await Category.findOrCreate({
          where: { 
            name: categoryName.trim(),
            store_id: store.id
          },
          defaults: {
            name: categoryName.trim(),
            description: `${categoryName} category`,
            store_id: store.id,
            is_active: true
          },
          transaction
        });
        
        categoryMap.set(categoryName, category);
      }

      console.log(`📂 Created ${categoryMap.size} categories`);

      // Create products
      let productCount = 0;
      
      for (const productData of products) {
        if (!productData.Category || !productData['Item Name']) continue;
        
        const category = categoryMap.get(productData.Category);
        if (!category) continue;

        const cost = parseFloat(productData.Cost) || 0;
        const sellingPrice = parseFloat(productData['Active Price']) || 0;
        
        // Calculate dozen price (10% discount from piece price)
        const dozenSellingPrice = sellingPrice * 12 * 0.9; // 10% discount for dozen
        
        // Generate SKU (simple implementation)
        const sku = `BYC-${productData.Category.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        if (!category?.id) {
          console.warn(`Skipping product '${productData['Item Name']}' - invalid category`);
          continue;
        }
        
        await Product.create({
          name: productData['Item Name'].trim(),
          sku,
          barcode: sku,
          description: `${productData['Item Name']} - ${productData.Category}`,
          category_id: category.id,
          store_id: store.id,
          piece_buying_price: cost,
          piece_selling_price: sellingPrice,
          dozen_buying_price: cost * 12,
          dozen_selling_price: dozenSellingPrice,
          pack_buying_price: 0,
          pack_selling_price: 0,
          quantity: 100, // Default quantity
          min_quantity: 5,
          stock_unit: 'piece',
          pack_size: null,
          is_active: true,
          margin_percentage: parseFloat(productData['Margin %']) || 0,
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction });
        
        productCount++;
      }

      console.log(`🛍️  Created ${productCount} products`);
      
      // Commit transaction
      await transaction.commit();
      console.log("✅ BYC Collections seeding completed successfully!");
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("❌ Error seeding BYC Collections:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the seeder
seedBYCCollections();
