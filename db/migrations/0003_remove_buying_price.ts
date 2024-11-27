import { sql } from "drizzle-orm";

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE sale_items 
    DROP COLUMN IF EXISTS buying_price;
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE sale_items 
    ADD COLUMN buying_price decimal(10,2);
  `);
}
