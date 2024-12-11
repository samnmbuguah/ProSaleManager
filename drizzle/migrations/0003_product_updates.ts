import { pgTable, varchar, integer, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';

export async function up(db) {
  await db.schema.alterTable('products').addColumns({
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 1000 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    sku: varchar('sku', { length: 50 }).unique(),
    stock: integer('stock').notNull().default(0),
    category: varchar('category', { length: 100 }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow()
  });
}

export async function down(db) {
  await db.schema.alterTable('products').dropColumns(
    'name', 'description', 'price', 'sku', 'stock', 'category', 'is_active', 'created_at', 'updated_at'
  );
} 