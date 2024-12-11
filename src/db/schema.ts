import { pgTable, varchar, integer, decimal, boolean, timestamp, serial } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';

// Define unit types enum
export const UnitType = {
  PER_PIECE: 'per_piece',
  THREE_PIECE: 'three_piece',
  DOZEN: 'dozen'
} as const;

export type UnitTypeValues = (typeof UnitType)[keyof typeof UnitType];

export type UnitPriceUnit = {
  unit_type: UnitTypeValues;
  quantity: number;
  buying_price: string;
  selling_price: string;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type UnitPricing = UnitPriceUnit & {
  id: number;
  product_id: number;
};

// Create unit pricing table
export const unitPricing = pgTable('unit_pricing', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull(),
  unit_type: varchar('unit_type').notNull(),
  quantity: integer('quantity').notNull().default(1),
  buying_price: decimal('buying_price', { precision: 10, scale: 2 }).notNull(),
  selling_price: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  is_default: boolean('is_default').notNull().default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  sku: varchar('sku').notNull().unique(),
  stock: integer('stock').notNull().default(0),
  category: varchar('category'),
  min_stock: integer('min_stock'),
  max_stock: integer('max_stock'),
  reorder_point: integer('reorder_point'),
  stock_unit: varchar('stock_unit', { length: 20 }).notNull().default('per_piece'),
  default_unit_pricing_id: integer('default_unit_pricing_id'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Validation Schemas
export const insertProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  category: z.string().optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  stock_unit: z.enum([UnitType.PER_PIECE, UnitType.THREE_PIECE, UnitType.DOZEN]).default(UnitType.PER_PIECE),
  price_units: z.array(z.object({
    unit_type: z.enum([UnitType.PER_PIECE, UnitType.THREE_PIECE, UnitType.DOZEN]),
    quantity: z.number(),
    buying_price: z.string(),
    selling_price: z.string(),
    is_default: z.boolean()
  })).min(1, "At least one price unit is required"),
  is_active: z.boolean().default(true),
});

export const unitPricingSchema = z.object({
  product_id: z.number().int().positive("Product ID is required"),
  unit_type: z.enum([UnitType.PER_PIECE, UnitType.THREE_PIECE, UnitType.DOZEN]),
  quantity: z.number().int().positive(),
  buying_price: z.number().positive("Buying price must be greater than 0"),
  selling_price: z.number().positive("Selling price must be greater than 0"),
  is_default: z.boolean().default(false),
}).refine(
  (data) => {
    const quantityMap = {
      [UnitType.PER_PIECE]: 1,
      [UnitType.THREE_PIECE]: 3,
      [UnitType.DOZEN]: 12
    };
    return data.quantity === quantityMap[data.unit_type];
  },
  {
    message: "Quantity must match the unit type (1 for per piece, 3 for three piece, 12 for dozen)",
    path: ["quantity"]
  }
);

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UnitPricingInsert = typeof unitPricing.$inferInsert;

export type Product = typeof products.$inferSelect & {
  price_units?: Array<UnitPriceUnit>;
  default_unit_pricing?: UnitPriceUnit | null;
};

// Sale items table with unit pricing reference
export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  unit_pricing_id: integer('unit_pricing_id'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});
