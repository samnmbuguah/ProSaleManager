import { sequelize } from "../src/config/database.js";

// Import advanced seed functions for all entities from src/seed
import { seedStoresAndSuperAdmin } from "../src/seed/stores.js";
import { seedUsers } from "../src/seed/users.js";
import { seedCustomers } from "../src/seed/customers.js";
import { seedCategories } from "../src/seed/categories.js";
import { seedProducts } from "../src/seed/products.js";
import { seedSuppliers } from "../src/seed/suppliers.js";

const seedAll = async () => {
  try {
    console.log("Starting database seeding...");

    // 1. Sync database
    await sequelize.sync({ force: true });
    console.log("Database synced successfully");

    // 2. Seed stores and super admin
    await seedStoresAndSuperAdmin();
    // 3. Seed users (admins, cashiers, managers for each store)
    await seedUsers();
    // 4. Seed categories
    await seedCategories();
    // 5. Seed products
    await seedProducts();
    // 6. Seed suppliers
    await seedSuppliers();
    // 7. Seed customers
    await seedCustomers();

    console.log("All data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

const undoAll = async () => {
  try {
    console.log("Starting database cleanup...");

    // Drop all tables
    await sequelize.drop();
    console.log("All tables dropped successfully");

    console.log("Database cleanup completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning database:", error);
    process.exit(1);
  }
};

const resetAll = async () => {
  try {
    console.log("Starting database reset...");

    // Drop all tables
    await sequelize.drop();
    console.log("All tables dropped successfully");

    // Sync database
    await sequelize.sync({ force: true });
    console.log("Database synced successfully");

    // Seed data in order
    await seedUsers();
    await seedCategories();
    await seedProducts();
    await seedCustomers();
    await seedSuppliers();

    console.log("Database reset completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
};

const showTables = async () => {
  try {
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    console.log("Available tables:");
    (results as Array<Record<string, unknown>>).forEach((row: Record<string, unknown>) => {
      console.log(`- ${row.table_name}`);
    });
    process.exit(0);
  } catch (error) {
    console.error("Error showing tables:", error);
    process.exit(1);
  }
};

// Get command from command line arguments
const command = process.argv[2];

switch (command) {
  case "seed":
    seedAll();
    break;
  case "undo":
    undoAll();
    break;
  case "reset":
    resetAll();
    break;
  case "tables":
    showTables();
    break;
  default:
    console.log("Available commands:");
    console.log("  npm run seed:all     - Seed all data");
    console.log("  npm run seed:undo:all - Remove all data");
    console.log("  npm run seed:reset:all - Reset and reseed all data");
    console.log("  npm run seed:tables  - Show all tables");
    process.exit(0);
}
