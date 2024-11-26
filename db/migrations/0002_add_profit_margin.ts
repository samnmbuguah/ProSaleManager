import { sql } from "drizzle-orm";

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE products 
    ADD COLUMN profit_margin integer NOT NULL DEFAULT 20 
    CHECK (profit_margin BETWEEN 10 AND 199);
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE products 
    DROP COLUMN profit_margin;
  `);
}
