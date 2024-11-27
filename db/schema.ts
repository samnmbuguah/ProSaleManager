import { pgTable, text, integer, timestamp, decimal, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role
export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("cashier"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  sku: text("sku").unique().notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  profit_margin: integer("profit_margin").notNull().default(20),
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sales table
export const sales = pgTable("sales", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
