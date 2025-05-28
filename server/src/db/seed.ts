import { syncDatabase } from "./sync.js";
import { seedProducts } from "../../seed/products.js";
import { seedUsers } from "../../seed/users.js";
import { seedCustomers } from "../../seed/customers.js";

async function seed() {
  try {
    // Sync the database
    const synced = await syncDatabase();
    if (!synced) {
      throw new Error("Failed to sync database");
    }
    console.log("Database synced successfully");

    // Seed data
    await seedProducts();
    await seedUsers();
    await seedCustomers();
    console.log("All tables seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
