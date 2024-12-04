import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

// This will run migrations on the database, skipping the ones already applied
async function main() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error performing migrations:", error);
    process.exit(1);
  }
}

main(); 