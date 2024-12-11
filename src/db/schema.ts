import { pgTable, varchar, integer, decimal, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  sku: varchar('sku', { length: 50 }).unique().notNull(),
  stock: integer('stock').notNull().default(0),
  category: varchar('category', { length: 100 }),
  min_stock: integer('min_stock'),
  max_stock: integer('max_stock'),
  reorder_point: integer('reorder_point'),
  stock_unit: varchar('stock_unit', { length: 20 }).notNull().default('per_piece'),
  buying_price: decimal('buying_price', { precision: 10, scale: 2 }).notNull(),
  selling_price: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Add type for product
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// Add Zod schema for product validation
import { z } from 'zod';

export const insertProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  category: z.string().optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  stock_unit: z.enum(['per_piece', 'three_piece', 'dozen']).default('per_piece'),
  buying_price: z.string().or(z.number()).transform(val => Number(val)),
  selling_price: z.string().or(z.number()).transform(val => Number(val)),
  is_active: z.boolean().default(true),
});

export type InsertProduct = z.infer<typeof insertProductSchema>; 