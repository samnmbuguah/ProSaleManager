#!/usr/bin/env node
import 'dotenv/config';
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
import { randomUUID } from 'crypto';

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
    
    // Read the CSV file from the current directory on the server
    const csvFilePath = path.join(process.cwd(), 'Itemlist.csv');
    console.log(`Looking for CSV file at: ${csvFilePath}`);
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

      // Create or update admin user for BYC Collections
      const adminPassword = process.env.BYC_ADMIN_PASSWORD || 'changeme!';
      const [admin, createdAdmin] = await User.findOrCreate({
        where: { email: 'admin@byccollections.com' },
        defaults: {
          name: 'BYC Admin',
          email: 'admin@byccollections.com',
          password: adminPassword, // rely on model hook to hash
          role: 'admin',
          is_active: true,
          store_id: store.id
        },
        transaction
      });
      if (!createdAdmin) {
        const matches = await (admin as any).comparePassword(adminPassword);
        if (!matches) {
          admin.password = adminPassword; // hook will hash
          await admin.save({ transaction });
        }
      }

      console.log(`👤 Created admin user: ${admin.email}`);

      // Get unique categories from CSV
      const categories = [...new Set(products.map(p => p.Category))];
      
      // Create categories (reuse existing by name to avoid unique constraint errors)
      const categoryMap = new Map<string, Category>();
      for (const categoryName of categories) {
        const trimmed = categoryName?.trim();
        if (!trimmed) continue;

        // First, try to find any existing category by name (global uniqueness on name)
        let category = await Category.findOne({ where: { name: trimmed }, transaction });

        // If not found, create it and associate to the current store
        if (!category) {
          category = await Category.create(
            {
              name: trimmed,
              description: `${trimmed} category`,
              store_id: store.id,
              is_active: true,
            },
            { transaction }
          );
        }

        categoryMap.set(categoryName, category);
      }

      console.log(`📂 Created ${categoryMap.size} categories`);

      // Create products (skip if products already exist for this store)
      const existingProductCount = await Product.count({ where: { store_id: store.id }, transaction });
      let productCount = 0;
      if (existingProductCount > 0) {
        console.log(`🛑 Skipping product creation: ${existingProductCount} products already exist for BYC Collections`);
      } else {
        for (const productData of products) {
          if (!productData.Category || !productData['Item Name']) continue;
          
          const category = categoryMap.get(productData.Category);
          if (!category) continue;

          const cost = parseFloat(productData.Cost) || 0;
          const sellingPrice = parseFloat(productData['Active Price']) || 0;
          
          // Calculate dozen price (10% discount from piece price)
          const dozenSellingPrice = sellingPrice * 12 * 0.9; // 10% discount for dozen
          
          // Generate collision-resistant SKU/barcode
          const categoryCode = productData.Category.substring(0, 3).toUpperCase();
          const uniqueSuffix = `${Date.now()}-${productCount}-${randomUUID().slice(0, 8)}`;
          const sku = `BYC-${categoryCode}-${uniqueSuffix}`;
          
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
            is_active: true
          }, { transaction });
          
          productCount++;
        
        }
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
