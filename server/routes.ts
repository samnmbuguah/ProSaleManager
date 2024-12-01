import type { Express } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { products, customers, sales, saleItems } from "@db/schema";
import { initiateSTKPush } from "./mpesa";
import { createPaymentIntent } from "./stripe";

export function setupRoutes(app: Express) {
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const allProducts = await db.select().from(products).orderBy(products.name);
      res.json(allProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { q } = req.query;
      if (typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const searchResults = await db
        .select()
        .from(products)
        .where(sql`${products.name} ILIKE ${`%${q}%`}`)
        .limit(10);

      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Payment endpoints
  app.post("/api/payments/mpesa", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { phone, amount } = req.body;
      if (!phone || !amount) {
        return res.status(400).json({ error: "Phone and amount are required" });
      }

      const result = await initiateSTKPush(phone, amount);
      res.json(result);
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      res.status(500).json({ 
        error: "Failed to initiate M-Pesa payment",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Stripe payment endpoint
  app.post("/api/payments/stripe/create-payment-intent", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { amount } = req.body;
      const paymentIntent = await createPaymentIntent(amount);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Stripe payment error:', error);
      res.status(500).json({ 
        error: "Failed to create payment intent",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/products/:id/stock", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { quantity } = req.body;
      const productId = parseInt(req.params.id);
      
      const [updatedProduct] = await db
        .update(products)
        .set({ 
          stock: sql`${products.stock} + ${quantity}`,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning();
      
      res.json(updatedProduct);
    } catch (error) {
      console.error('Stock update error:', error);
      res.status(500).json({ 
        error: "Failed to update stock",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Customers API
  app.get("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const allCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt));
      res.json(allCustomers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [customer] = await db.insert(customers).values(req.body).returning();
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Sales API
  app.post("/api/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { items, customerId, total, paymentMethod } = req.body;
      
      // Create sale record
      const [sale] = await db.insert(sales).values({
        customerId,
        userId: req.user!.id,
        total,
        paymentMethod,
      }).returning();

      // Create sale items
      await db.insert(saleItems).values(
        items.map((item: any) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      );

      // Update product stock
      for (const item of items) {
        await db.update(products)
          .set({ 
            stock: sql`${products.stock} - ${item.quantity}`
          })
          .where(eq(products.id, item.productId));
      }

      res.json(sale);
    } catch (error) {
      console.error('Sale creation error:', error);
      res.status(500).json({ 
        error: "Failed to create sale",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Reports API endpoints
  app.get("/api/reports/product-performance", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const productStats = await db
        .select({
          productId: saleItems.productId,
          name: products.name,
          category: products.category,
          totalQuantity: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
          totalRevenue: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price}), 0)`,
          profit: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profit_margin} / 100), 0)`
        })
        .from(saleItems)
        .rightJoin(products, eq(products.id, saleItems.productId))
        .groupBy(saleItems.productId, products.name, products.category)
        .orderBy(desc(sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profit_margin} / 100), 0)`))
        .limit(10);
      
      res.json(productStats);
    } catch (error) {
      console.error('Product performance error:', error);
      res.status(500).json({ 
        error: "Failed to fetch product performance report",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/reports/sales-trend", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const salesTrend = await db
        .select({
          date: sql<string>`DATE_TRUNC('day', ${sales.createdAt})::date`,
          total: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
          profit: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profit_margin} / 100), 0)`,
          cost: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * (100 - ${products.profit_margin}) / 100), 0)`,
          count: sql<number>`COUNT(*)`
        })
        .from(sales)
        .innerJoin(saleItems, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(products.id, saleItems.productId))
        .groupBy(sql`DATE_TRUNC('day', ${sales.createdAt})::date`)
        .orderBy(sql`DATE_TRUNC('day', ${sales.createdAt})::date`);
      
      res.json(salesTrend);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales trend" });
    }
  });

  app.get("/api/reports/customer-history/:customerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const customerSales = await db
        .select({
          saleId: sales.id,
          date: sales.createdAt,
          total: sales.total,
          paymentMethod: sales.paymentMethod
        })
        .from(sales)
        .where(eq(sales.customerId, parseInt(req.params.customerId)))
        .orderBy(desc(sales.createdAt));
      
      res.json(customerSales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer history" });
    }
  });

  app.get("/api/reports/top-selling", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const topProducts = await db
        .select({
          productId: saleItems.productId,
          name: products.name,
          category: products.category,
          units: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
          revenue: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price}), 0)`,
          profit: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profit_margin} / 100), 0)`
        })
        .from(saleItems)
        .innerJoin(products, eq(products.id, saleItems.productId))
        .groupBy(saleItems.productId, products.name, products.category)
        .orderBy(desc(sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profit_margin} / 100), 0)`))
        .limit(10);
      
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top selling products" });
    }
  });

  app.get("/api/reports/low-stock", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const lowStockProducts = await db.select()
        .from(products)
        .where(sql`${products.stock} < 10`)
        .orderBy(products.stock);
      
      res.json(lowStockProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock report" });
    }
  });
}
