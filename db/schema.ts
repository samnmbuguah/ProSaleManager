import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role").default("cashier").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define products table first without the foreign key reference
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  buying_price: decimal("buying_price", { precision: 10, scale: 2 }).notNull(),
  selling_price: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  category: text("category"),
  min_stock: integer("min_stock"),
  max_stock: integer("max_stock"),
  reorder_point: integer("reorder_point"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  stock_unit: text("stock_unit").default("per_piece").notNull(),
  default_unit_pricing_id: integer("default_unit_pricing_id"),
  
});

// Unit Pricing schema with references to products
// Define unit type values
export const UnitTypeValues = ['per_piece', 'three_piece', 'dozen'] as const;
export type UnitTypeValues = (typeof UnitTypeValues)[number];

export const defaultUnitQuantities: Record<UnitTypeValues, number> = {
  per_piece: 1,
  three_piece: 3,
  dozen: 12,
};

export const isValidUnitType = (type: string): type is UnitTypeValues => {
  return UnitTypeValues.includes(type as UnitTypeValues);
};

export const unitPricing = pgTable("unit_pricing", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  unit_type: text("unit_type").notNull(),
  quantity: integer("quantity").notNull(),
  buying_price: decimal("buying_price", { precision: 10, scale: 2 }).notNull(),
  selling_price: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Validation schema for unit pricing
export const unitPricingValidationSchema = z.object({
  unit_type: z.enum(UnitTypeValues),
  quantity: z.number().int().positive(),
  buying_price: z.string().transform(val => Number(val)),
  selling_price: z.string().transform(val => Number(val)),
  is_default: z.boolean(),
});

export const productWithPriceUnitsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  stock: z.number().min(0, "Stock cannot be negative"),
  category: z.string().optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional(),
  reorder_point: z.number().min(0).optional(),
  stock_unit: z.enum(UnitTypeValues).default("per_piece"),
  price_units: z.array(unitPricingValidationSchema)
    .min(1, "At least one price unit is required")
    .refine(units => units.some(unit => unit.is_default), {
      message: "One unit must be marked as default"
    }),
});

// Relations
export const unitPricingRelations = relations(unitPricing, ({ one }) => ({
  product: one(products, {
    fields: [unitPricing.product_id],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  unitPricing: many(unitPricing),
  defaultUnitPricing: one(unitPricing, {
    fields: [products.default_unit_pricing_id],
    references: [unitPricing.id],
  }),
}));

// Customer schema
export const customers = pgTable("customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Supplier schema
export const suppliers = pgTable("suppliers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Product Supplier schema
export const productSuppliers = pgTable("product_suppliers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  supplierId: integer("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  isPreferred: boolean("is_preferred").default(false),
  lastSupplyDate: timestamp("last_supply_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Purchase Order schema
export const purchaseOrders = pgTable("purchase_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  supplierId: integer("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  status: text("status").default("pending").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  receivedDate: timestamp("received_date"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Purchase Order Item schema
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  purchaseOrderId: integer("purchase_order_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  buyingPrice: decimal("buying_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sale schema
export const sales = pgTable("sales", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("paid").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sale Item schema
export const saleItems = pgTable("sale_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  saleId: integer("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  unitPricingId: integer("unit_pricing_id").references(() => unitPricing.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Points schema
export const loyaltyPoints = pgTable("loyalty_points", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id")
    .references(() => customers.id)
    .notNull(),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty Transactions schema
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id")
    .references(() => customers.id)
    .notNull(),
  saleId: integer("sale_id")
    .references(() => sales.id)
    .notNull(),
  points: integer("points").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product Prices schema
export const productPrices = pgTable('product_prices', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }),
  stockUnit: text('stock_unit').notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  buyingPrice: decimal('buying_price', { precision: 10, scale: 2 }).notNull(),
  conversionRate: decimal('conversion_rate', { precision: 10, scale: 4 }).notNull().default('1'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Schema validations with updated types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = z.infer<typeof selectProductSchema> & {
  unit_pricing?: Array<{
    id: number;
    product_id: number;
    unit_type: string;
    quantity: number;
    buying_price: string | number;
    selling_price: string | number;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
  }>;
  default_unit_pricing?: {
    id: number;
    product_id: number;
    unit_type: string;
    quantity: number;
    buying_price: string | number;
    selling_price: string | number;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
  } | null;
  price_units?: Array<{
    unit_type: string;
    quantity: number;
    buying_price: string;
    selling_price: string;
    is_default: boolean;
  }>;
};

export const insertUnitPricingSchema = createInsertSchema(unitPricing);
export const selectUnitPricingSchema = createSelectSchema(unitPricing);
export type InsertUnitPricing = z.infer<typeof insertUnitPricingSchema>;
export type UnitPricing = z.infer<typeof selectUnitPricingSchema>;

export const insertCustomerSchema = createInsertSchema(customers);
export const selectCustomerSchema = createSelectSchema(customers);
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = z.infer<typeof selectCustomerSchema>;

export const insertSupplierSchema = createInsertSchema(suppliers);
export const selectSupplierSchema = createSelectSchema(suppliers);
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = z.infer<typeof selectSupplierSchema>;

export const insertProductSupplierSchema = createInsertSchema(productSuppliers);
export const selectProductSupplierSchema = createSelectSchema(productSuppliers);
export type InsertProductSupplier = z.infer<typeof insertProductSupplierSchema>;
export type ProductSupplier = z.infer<typeof selectProductSupplierSchema>;

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const selectPurchaseOrderSchema = createSelectSchema(purchaseOrders);
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = z.infer<typeof selectPurchaseOrderSchema>;

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems);
export const selectPurchaseOrderItemSchema = createSelectSchema(purchaseOrderItems);
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = z.infer<typeof selectPurchaseOrderItemSchema>;

export const insertSaleSchema = createInsertSchema(sales);
export const selectSaleSchema = createSelectSchema(sales);
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = z.infer<typeof selectSaleSchema>;

export const insertSaleItemSchema = createInsertSchema(saleItems);
export const selectSaleItemSchema = createSelectSchema(saleItems);
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = z.infer<typeof selectSaleItemSchema>;

export const insertLoyaltyPointsSchema = createInsertSchema(loyaltyPoints);
export const selectLoyaltyPointsSchema = createSelectSchema(loyaltyPoints);
export type InsertLoyaltyPoints = z.infer<typeof insertLoyaltyPointsSchema>;
export type LoyaltyPoints = z.infer<typeof selectLoyaltyPointsSchema>;

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions);
export const selectLoyaltyTransactionSchema = createSelectSchema(loyaltyTransactions);
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = z.infer<typeof selectLoyaltyTransactionSchema>;