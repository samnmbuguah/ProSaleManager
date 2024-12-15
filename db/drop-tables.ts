import { sql } from "drizzle-orm";
import { db } from "./index";

async function dropTables() {
  try {
    await db.execute(sql`
      DROP TABLE IF EXISTS 
        loyalty_transactions,
        loyalty_points,
        purchase_order_items,
        purchase_orders,
        product_suppliers,
        suppliers,
        sale_items,
        sales,
        customers,
        products,
        users,
        drizzle_migrations
      CASCADE;
    `);
    console.log("All tables dropped successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error dropping tables:", error);
    process.exit(1);
  }
}

dropTables(); 