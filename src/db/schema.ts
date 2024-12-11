import { pgTable, varchar, integer, decimal, boolean, timestamp, serial, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';

// Define all database tables
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email'),
  phone: varchar('phone'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id'),
  userId: integer('user_id').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method').notNull(),
  paymentStatus: varchar('payment_status').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email'),
  phone: varchar('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const productSuppliers = pgTable('product_suppliers', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  supplierId: integer('supplier_id').notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  isPreferred: boolean('is_preferred').default(false),
  lastSupplyDate: timestamp('last_supply_date'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  supplierId: integer('supplier_id').notNull(),
  userId: integer('user_id').notNull(),
  status: varchar('status').notNull(),
  orderDate: timestamp('order_date').defaultNow(),
  receivedDate: timestamp('received_date'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  purchaseOrderId: integer('purchase_order_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  buyingPrice: decimal('buying_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const loyaltyPoints = pgTable('loyalty_points', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull(),
  points: integer('points').notNull().default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull(),
  saleId: integer('sale_id').notNull(),
  points: integer('points').notNull(),
  type: varchar('type').notNull(),
  created_at: timestamp('created_at').defaultNow()
});

// Validation schemas
export const insertSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const insertProductSupplierSchema = z.object({
  productId: z.number(),
  supplierId: z.number(),
  costPrice: z.string().optional(),
  isPreferred: z.boolean().optional()
});

// Define unit types enum
export const UnitType = {
  PER_PIECE: 'per_piece',
  THREE_PIECE: 'three_piece',
  DOZEN: 'dozen'
} as const;

export type UnitTypeValues = (typeof UnitType)[keyof typeof UnitType];

// Define the enum for unit types
export const UnitTypeEnum = z.enum([UnitType.PER_PIECE, UnitType.THREE_PIECE, UnitType.DOZEN]);

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
    quantity: z.number(),
    buying_price: z.string(),
    selling_price: z.string(),
    is_default: z.boolean()
  })).min(1, "At least one price unit is required"),
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
export const ensurePriceString = (price: string | number | undefined): string => {
  if (price === undefined) {
    throw new Error('Price is required');
  }
  // Handle numeric strings that might have currency symbols
  if (typeof price === 'string') {
    // Remove any currency symbols and whitespace
    const cleanPrice = price.replace(/[^0-9.-]/g, '');
    if (!cleanPrice || isNaN(Number(cleanPrice))) {
      throw new Error('Invalid price format');
    }
    return cleanPrice;
  }
  return price.toString();
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