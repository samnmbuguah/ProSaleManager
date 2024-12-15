import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "prosalemanager",
  password: process.env.DB_PASSWORD || "prosalepassword",
  database: process.env.DB_NAME || "prosaledatabase",
  ssl: false,
});

const db = drizzle(pool);

async function main() {
  console.log("Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "db/migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
  
  await pool.end();
}

main(); 