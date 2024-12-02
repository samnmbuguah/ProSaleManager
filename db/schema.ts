import { pgTable, integer, text, timestamp, boolean, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table and schemas
export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("cashier"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .extend({
    password: z.string().min(8),
  })
  .omit({ 
    passwordHash: true,
    createdAt: true,
    updatedAt: true,
    role: true
  });

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

// Products table and schemas
export const products = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  category: text("category"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  maxStock: integer("max_stock").notNull().default(100),
  reorderPoint: integer("reorder_point").notNull().default(20),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull().default("30"),
  preferredSupplierId: integer("preferred_supplier_id").references(() => suppliers.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Suppliers table and schemas
export const suppliers = pgTable("suppliers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  onTimeDeliveryRate: decimal("on_time_delivery_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  qualityRating: decimal("quality_rating", { precision: 3, scale: 1 }).notNull().default("0"),
  responseTime: integer("response_time").notNull().default(0),
  orderFulfillmentRate: decimal("order_fulfillment_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  averageLeadTime: integer("average_lead_time").notNull().default(0),
  lastOrderDate: timestamp("last_order_date"),
  status: text("status").notNull().default("active"),
  paymentTerms: text("payment_terms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supplier Products table and schemas
export const supplierProducts = pgTable("supplier_products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  supplierId: integer().notNull().references(() => suppliers.id),
  productId: integer().notNull().references(() => products.id),
  supplierSku: text("supplier_sku"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  minimumOrderQuantity: integer("minimum_order_quantity").notNull().default(1),
  leadTime: integer("lead_time").notNull().default(1),
  isPreferred: boolean("is_preferred").notNull().default(false),
  lastDeliveryQuality: decimal("last_delivery_quality", { precision: 3, scale: 1 }),
  lastDeliveryTime: integer("last_delivery_time"),
  lastPriceChange: timestamp("last_price_change"),
  previousPrice: decimal("previous_price", { precision: 10, scale: 2 }),
  priceVariance: decimal("price_variance", { precision: 5, scale: 2 }),
  qualityConsistency: decimal("quality_consistency", { precision: 3, scale: 1 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Purchase Orders table and schemas
export const purchaseOrders = pgTable("purchase_orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  supplierId: integer().notNull().references(() => suppliers.id),
  userId: integer().notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  deliveryDate: timestamp("delivery_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Purchase Order Items table and schemas
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  purchaseOrderId: integer().notNull().references(() => purchaseOrders.id),
  productId: integer().notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  receivedQuantity: integer("received_quantity").notNull().default(0),
  qualityRating: decimal("quality_rating", { precision: 3, scale: 1 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create schemas for all tables
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = z.infer<typeof selectProductSchema>;

export const insertSupplierSchema = createInsertSchema(suppliers);
export const selectSupplierSchema = createSelectSchema(suppliers);
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = z.infer<typeof selectSupplierSchema>;

export const insertSupplierProductSchema = createInsertSchema(supplierProducts);
export const selectSupplierProductSchema = createSelectSchema(supplierProducts);
export type InsertSupplierProduct = z.infer<typeof insertSupplierProductSchema>;
export type SupplierProduct = z.infer<typeof selectSupplierProductSchema>;

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const selectPurchaseOrderSchema = createSelectSchema(purchaseOrders);
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = z.infer<typeof selectPurchaseOrderSchema>;

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems);
export const selectPurchaseOrderItemSchema = createSelectSchema(purchaseOrderItems);
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = z.infer<typeof selectPurchaseOrderItemSchema>;

// Customers table
export const customers = pgTable("customers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sales table
export const sales = pgTable("sales", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sale Items table
export const saleItems = pgTable("sale_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers);
export const selectCustomerSchema = createSelectSchema(customers);
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = z.infer<typeof selectCustomerSchema>;

export const insertSaleSchema = createInsertSchema(sales);
export const selectSaleSchema = createSelectSchema(sales);
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = z.infer<typeof selectSaleSchema>;

export const insertSaleItemSchema = createInsertSchema(saleItems);
export const selectSaleItemSchema = createSelectSchema(saleItems);
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = z.infer<typeof selectSaleItemSchema>;