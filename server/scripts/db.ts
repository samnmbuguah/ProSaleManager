import { sequelize } from "../src/config/database.js";

// Import advanced seed functions for all entities from src/seed
import { seedStoresAndSuperAdmin } from "../src/seed/stores.js";
import { seedUsers } from "../src/seed/users.js";
import { seedCustomers } from "../src/seed/customers.js";
import { seedCategories } from "../src/seed/categories.js";
import { seedProducts } from "../src/seed/products.js";
import { seedSuppliers } from "../src/seed/suppliers.js";
import { seedSales } from "../src/seed/sales.js";
import { seedExpenses } from "../src/seed/expenses.js";

const syncDatabase = async () => {
  try {
    console.log("Starting database synchronization...");

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync(); // Non-destructive in production
    }

    console.log("Database synchronized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error synchronizing database:", error);
    process.exit(1);
  }
};

const seedAll = async () => {
  try {
    console.log("Starting database seeding...");

    if (process.env.NODE_ENV !== "development") {
      throw new Error("Seeding is only allowed in development environment.");
    }

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
    // 8. Seed sales (last 2 months of data)
    await seedSales();
    // 9. Seed expenses (last 2 months of data)
    await seedExpenses();

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

    if (process.env.NODE_ENV !== "development") {
      throw new Error("Undo is only allowed in development environment.");
    }

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

    if (process.env.NODE_ENV !== "development") {
      throw new Error("Reset is only allowed in development environment.");
    }

    // Drop all tables
    await sequelize.drop();
    console.log("All tables dropped successfully");

    // Sync database
    await sequelize.sync({ force: true });
    console.log("Database synced successfully");

    // Seed data in order
    await seedStoresAndSuperAdmin();
    await seedUsers();
    await seedCategories();
    await seedProducts();
    await seedSuppliers();
    await seedCustomers();
    await seedSales();
    await seedExpenses();

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
  case "sync":
    syncDatabase();
    break;
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
    console.log("  npm run seed:sync     - Sync database schema only");
    console.log("  npm run seed:all      - Seed all data");
    console.log("  npm run seed:undo:all - Remove all data");
    console.log("  npm run seed:reset:all - Reset and reseed all data");
    console.log("  npm run seed:tables   - Show all tables");
    process.exit(0);
}
