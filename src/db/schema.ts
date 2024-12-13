import { pgTable, varchar, integer, decimal, boolean, timestamp, serial } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';

// Define unit types enum
export const UnitType = {
  PER_PIECE: 'per_piece' as const,
  THREE_PIECE: 'three_piece' as const,
  DOZEN: 'dozen' as const
} as const;

export type UnitTypeValues = typeof UnitType[keyof typeof UnitType];

// Ensure all unit type values are properly typed
export const UnitTypeEnum = z.enum(['per_piece', 'three_piece', 'dozen']);

export const defaultUnitQuantities: Record<UnitTypeValues, number> = {
  'per_piece': 1,
  'three_piece': 3,
  'dozen': 12
};

// Validation schemas
export const productSchema = z.object({
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
    quantity: z.number().min(1, "Quantity must be at least 1"),
    buying_price: z.string().refine(
      (price) => {
        const num = Number(price);
        return !isNaN(num) && num > 0;
      },
      "Buying price must be a positive number"
    ),
    selling_price: z.string().refine(
      (price) => {
        const num = Number(price);
        return !isNaN(num) && num > 0;
      },
      "Selling price must be a positive number"
    ),
    is_default: z.boolean()
  }))
  .min(1, "At least one price unit is required")
  .refine(
    (units) => units.some(unit => unit.is_default),
    "One unit must be marked as default"
  )
  .refine(
    (units) => units.every(unit => 
      Number(unit.selling_price) > Number(unit.buying_price)
    ),
    "Selling price must be higher than buying price for all units"
  )
  .refine(
    (units) => {
      const sortedUnits = [...units].sort((a, b) => a.quantity - b.quantity);
      for (let i = 1; i < sortedUnits.length; i++) {
        const prevUnit = sortedUnits[i - 1];
        const currentUnit = sortedUnits[i];
        const prevUnitPrice = Number(prevUnit.selling_price) / prevUnit.quantity;
        const currentUnitPrice = Number(currentUnit.selling_price) / currentUnit.quantity;
        if (currentUnitPrice >= prevUnitPrice) {
          return false;
        }
      }
      return true;
    },
    "Bulk units should have lower per-unit prices"
  ),
  is_active: z.boolean().default(true),
});

export type UnitPriceUnit = {
  unit_type: UnitTypeValues;
  quantity: number;
  buying_price: string;
  selling_price: string;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
};

// Ensure consistent type handling for price values
export const ensurePriceString = (price: string | number): string => {
  return typeof price === 'string' ? price : price.toString();
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
  buying_price: decimal('buying_price', { precision: 10, scale: 2 }).notNull().default('0'),
  selling_price: decimal('selling_price', { precision: 10, scale: 2 }).notNull().default('0'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export type InsertProduct = z.infer<typeof productSchema>;
export type UnitPricingInsert = typeof unitPricing.$inferInsert;

export type Product = typeof products.$inferSelect & {
  price_units?: Array<{
    unit_type: UnitTypeValues;
    quantity: number;
    buying_price: string;
    selling_price: string;
    is_default: boolean;
  }>;
  default_unit_pricing?: {
    unit_type: UnitTypeValues;
    quantity: number;
    buying_price: string;
    selling_price: string;
    is_default: boolean;
  } | null;
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