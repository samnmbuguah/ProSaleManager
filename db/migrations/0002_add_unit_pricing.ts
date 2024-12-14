import { sql } from "drizzle-orm";

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS unit_pricing (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      unit_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      buying_price DECIMAL(10,2) NOT NULL,
      selling_price DECIMAL(10,2) NOT NULL,
      is_default BOOLEAN DEFAULT false NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Add foreign key constraint for default_unit_pricing_id in products table
    ALTER TABLE products
    ADD CONSTRAINT fk_default_unit_pricing
    FOREIGN KEY (default_unit_pricing_id)
    REFERENCES unit_pricing(id);
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_default_unit_pricing;
    DROP TABLE IF EXISTS unit_pricing;
  `);
} 