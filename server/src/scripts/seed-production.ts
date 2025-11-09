#!/usr/bin/env node
/**
 * Production Database Seeding Script
 * 
 * This script syncs the database and seeds all necessary data for production.
 * Run this on the production server after deployment to initialize the database.
 * 
 * Usage: npm run seed:production
 *        or: npx tsx src/scripts/seed-production.ts
 */

import { sequelize } from "../config/database.js";
import { syncDatabase } from "../db/sync.js";
import { setupAssociations } from "../models/associations.js";
import { seedStoresAndSuperAdmin } from "../seed/stores.js";
import { seedUsers } from "../seed/users.js";
import { seedCategories } from "../seed/categories.js";
import { seedProducts } from "../seed/seed-products.js";
import { seedSuppliers } from "../seed/suppliers.js";
import { seedCustomers } from "../seed/customers.js";
import { seedSales } from "../seed/sales.js";
import { seedExpenses } from "../seed/expenses.js";

async function seedProduction() {
  try {
    console.log("🚀 Starting production database seeding...");
    console.log("=".repeat(60));
    
    // Test database connection
    console.log("\n📡 Testing database connection...");
    await sequelize.authenticate();
    const dbType = process.env.NODE_ENV === "production" ? "MySQL" : "SQLite";
    console.log(`✅ ${dbType} database connection established`);
    
    // Set up model associations
    console.log("\n🔗 Setting up model associations...");
    setupAssociations();
    console.log("✅ Model associations configured");
    
    // Sync database (create/update tables)
    console.log("\n🗄️  Syncing database schema...");
    const syncResult = await syncDatabase();
    if (!syncResult) {
      throw new Error("Database sync failed");
    }
    console.log("✅ Database schema synced");
    
    // Seed all data (using safe seeders, not the force sync version)
    console.log("\n🌱 Seeding database with initial data...");
    console.log("-".repeat(60));
    
    // 1. Seed stores and super admin
    console.log("\n1️⃣ Seeding stores and super admin...");
    await seedStoresAndSuperAdmin();
    console.log("✅ Stores and super admin seeded");
    
    // 2. Seed users
    console.log("\n2️⃣ Seeding users...");
    await seedUsers();
    console.log("✅ Users seeded");
    
    // 3. Seed categories
    console.log("\n3️⃣ Seeding categories...");
    await seedCategories();
    console.log("✅ Categories seeded");
    
    // 4. Seed products
    console.log("\n4️⃣ Seeding products...");
    await seedProducts();
    console.log("✅ Products seeded");
    
    // 5. Seed suppliers
    console.log("\n5️⃣ Seeding suppliers...");
    await seedSuppliers();
    console.log("✅ Suppliers seeded");
    
    // 6. Seed customers
    console.log("\n6️⃣ Seeding customers...");
    await seedCustomers();
    console.log("✅ Customers seeded");
    
    // 7. Seed sales (last 2 months for all stores)
    console.log("\n7️⃣ Seeding sales...");
    await seedSales();
    console.log("✅ Sales seeded");
    
    // 8. Seed expenses (only for Demo Store)
    console.log("\n8️⃣ Seeding expenses...");
    await seedExpenses();
    console.log("✅ Expenses seeded");
    
    console.log("-".repeat(60));
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Production database seeding completed successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log("   ✅ Database schema synced");
    console.log("   ✅ Stores and super admin created");
    console.log("   ✅ Users seeded for all stores");
    console.log("   ✅ Categories seeded");
    console.log("   ✅ Products seeded for all stores");
    console.log("   ✅ Suppliers seeded");
    console.log("   ✅ Customers seeded");
    console.log("   ✅ Sales seeded for all stores (last 2 months)");
    console.log("   ✅ Expenses seeded for Demo Store");
    console.log("\n🔑 Login credentials:");
    console.log("   Super Admin: superadmin@prosale.com / superadmin123");
    console.log("\n   Eltee Store:");
    console.log("      Admin: eltee.admin@prosale.com / elteeadmin123");
    console.log("      Manager: eltee.manager@prosale.com / elteemgr123");
    console.log("      Cashier: eltee.cashier@prosale.com / eltee123");
    console.log("\n   Eltee Store Nairobi:");
    console.log("      Admin: eltee.nairobi.admin@prosale.com / elteeadmin123");
    console.log("      Manager: eltee.nairobi.manager@prosale.com / elteemgr123");
    console.log("      Cashier: eltee.nairobi.cashier@prosale.com / eltee123");
    console.log("\n   Demo Store:");
    console.log("      Admin: demo.admin@prosale.com / demoadmin123");
    console.log("      Manager: demo.manager@prosale.com / demomgr123");
    console.log("      Cashier: demo.cashier@prosale.com / demo123");
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding production database:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    try {
      await sequelize.close();
    } catch (closeError) {
      // Ignore close errors
    }
    process.exit(1);
  }
}

// Run the seeder
seedProduction();

