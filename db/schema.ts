import { pgTable, text, integer, timestamp, decimal, foreignKey, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product-Supplier relationship table
export const productSuppliers = pgTable("product_suppliers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").references(() => products.id).notNull(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  isPreferred: boolean("is_preferred").default(false).notNull(),
  lastSupplyDate: timestamp("last_supply_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table with role
export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("cashier"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  sku: text("sku").unique().notNull(),
  buyingPrice: decimal("buying_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull(),
  minStock: integer("min_stock").notNull().default(10),
  maxStock: integer("max_stock").notNull().default(100),
  reorderPoint: integer("reorder_point").notNull().default(20),
  preferredSupplierId: integer("preferred_supplier_id").references(() => suppliers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales table
export const sales = pgTable("sales", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = z.infer<typeof selectProductSchema>;

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

// Supplier schemas
export const insertSupplierSchema = createInsertSchema(suppliers);
export const selectSupplierSchema = createSelectSchema(suppliers);
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = z.infer<typeof selectSupplierSchema>;

// ProductSupplier schemas
export const insertProductSupplierSchema = createInsertSchema(productSuppliers);
// Purchase Orders table
export const purchaseOrders = pgTable("purchase_orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, received
  orderDate: timestamp("order_date").defaultNow(),
  receivedDate: timestamp("received_date"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Order Items table
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// Schema validation for purchase orders
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const selectPurchaseOrderSchema = createSelectSchema(purchaseOrders);
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = z.infer<typeof selectPurchaseOrderSchema>;

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems);
export const selectPurchaseOrderItemSchema = createSelectSchema(purchaseOrderItems);
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = z.infer<typeof selectPurchaseOrderItemSchema>;
export const selectProductSupplierSchema = createSelectSchema(productSuppliers);
export type InsertProductSupplier = z.infer<typeof insertProductSupplierSchema>;
export type ProductSupplier = z.infer<typeof selectProductSupplierSchema>;
