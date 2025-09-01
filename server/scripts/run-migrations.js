#!/usr/bin/env node

import { sequelize } from "../src/config/database.js";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    
    // Run the migration
    const migrationPath = join(__dirname, "../src/database/migrations/20250101000000-create-user-preferences.js");
    
    // Import and run the migration
    const migration = await import(migrationPath);
    await migration.default.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log("✅ Migration completed successfully!");
    
    // Sync models to ensure they're up to date
    console.log("🔄 Syncing models...");
    await sequelize.sync({ alter: true });
    console.log("✅ Models synced successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runMigrations();
