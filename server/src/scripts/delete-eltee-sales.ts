#!/usr/bin/env node
/**
 * Delete Sales for Eltee Store and Eltee Store Nairobi
 * This script removes all sales data for Eltee stores, keeping only Demo Store sales
 * 
 * Usage: npm run delete:eltee-sales
 *        or: npx tsx src/scripts/delete-eltee-sales.ts
 */

import { sequelize } from "../config/database.js";
import { setupAssociations } from "../models/associations.js";
import { Sale, SaleItem, Store } from "../models/index.js";

async function deleteElteeSales() {
  try {
    console.log("🗑️  Starting deletion of Eltee Store sales...");
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
    
    // Find stores
    const elteeStore = await Store.findOne({ where: { name: "Eltee Store" } });
    const elteeNairobiStore = await Store.findOne({ where: { name: "Eltee Store Nairobi" } });
    
    if (!elteeStore && !elteeNairobiStore) {
      console.log("⚠️  No Eltee stores found. Nothing to delete.");
      return;
    }
    
    let totalSalesDeleted = 0;
    let totalItemsDeleted = 0;
    
    // Delete sales for Eltee Store
    if (elteeStore) {
      console.log(`\n🏪 Deleting sales for: ${elteeStore.name} (ID: ${elteeStore.id})`);
      
      // Get sales for this store
      const sales = await Sale.findAll({ where: { store_id: elteeStore.id } });
      const saleIds = sales.map(s => s.id);
      
      if (saleIds.length > 0) {
        // Delete sale items first
        const itemsDeleted = await SaleItem.destroy({ where: { sale_id: saleIds } });
        console.log(`   Deleted ${itemsDeleted} sale items`);
        totalItemsDeleted += itemsDeleted;
        
        // Delete sales
        const salesDeleted = await Sale.destroy({ where: { store_id: elteeStore.id } });
        console.log(`   Deleted ${salesDeleted} sales`);
        totalSalesDeleted += salesDeleted;
      } else {
        console.log("   No sales found for this store");
      }
    }
    
    // Delete sales for Eltee Store Nairobi
    if (elteeNairobiStore) {
      console.log(`\n🏪 Deleting sales for: ${elteeNairobiStore.name} (ID: ${elteeNairobiStore.id})`);
      
      // Get sales for this store
      const sales = await Sale.findAll({ where: { store_id: elteeNairobiStore.id } });
      const saleIds = sales.map(s => s.id);
      
      if (saleIds.length > 0) {
        // Delete sale items first
        const itemsDeleted = await SaleItem.destroy({ where: { sale_id: saleIds } });
        console.log(`   Deleted ${itemsDeleted} sale items`);
        totalItemsDeleted += itemsDeleted;
        
        // Delete sales
        const salesDeleted = await Sale.destroy({ where: { store_id: elteeNairobiStore.id } });
        console.log(`   Deleted ${salesDeleted} sales`);
        totalSalesDeleted += salesDeleted;
      } else {
        console.log("   No sales found for this store");
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Deletion completed!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Deleted ${totalSalesDeleted} sales`);
    console.log(`   ✅ Deleted ${totalItemsDeleted} sale items`);
    
    // Verify Demo Store sales are still intact
    const demoStore = await Store.findOne({ where: { name: "Demo Store" } });
    if (demoStore) {
      const demoSalesCount = await Sale.count({ where: { store_id: demoStore.id } });
      // Get sale IDs for Demo Store
      const demoSales = await Sale.findAll({ where: { store_id: demoStore.id }, attributes: ['id'] });
      const demoSaleIds = demoSales.map(s => s.id);
      const demoItemsCount = demoSaleIds.length > 0 
        ? await SaleItem.count({ where: { sale_id: demoSaleIds } })
        : 0;
      console.log(`\n✅ Demo Store sales intact: ${demoSalesCount} sales, ${demoItemsCount} items`);
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error deleting Eltee Store sales:", error);
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

// Run the script
deleteElteeSales();

