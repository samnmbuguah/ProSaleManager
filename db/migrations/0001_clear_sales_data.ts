import { sql } from "drizzle-orm";

export async function up(db: any) {
  await db.execute(sql`
    TRUNCATE TABLE sale_items CASCADE;
    TRUNCATE TABLE sales CASCADE;
  `);
}

export async function down(db: any) {
  // No down migration needed as we can't restore deleted data
  return;
}
