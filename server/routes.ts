import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { products, customers, sales, saleItems } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const allProducts = await db.select().from(products).orderBy(products.name);
      res.json(allProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [product] = await db.insert(products).values(req.body).returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to create product" });
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
          price: item.price,
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
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  // Product Performance Report
  app.get("/api/reports/product-performance", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const productStats = await db
        .select({
          productId: saleItems.productId,
          name: products.name,
          category: products.category,
          totalQuantity: sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`,
          totalRevenue: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price}), 0)`
        })
        .from(saleItems)
        .innerJoin(products, eq(products.id, saleItems.productId))
        .innerJoin(sales, eq(sales.id, saleItems.saleId))
        .groupBy(saleItems.productId, products.name, products.category)
        .orderBy(sql<number>`COALESCE(SUM(${saleItems.quantity}), 0)`, 'desc');
      
      res.json(productStats);
    } catch (error) {
      console.error('Product performance error:', error);
      res.status(500).json({ 
        error: "Failed to fetch product performance report",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Customer Purchase History
  app.get("/api/reports/customer-history/:customerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const customerId = Number(req.params.customerId);
      const history = await db
        .select({
          saleId: sales.id,
          date: sales.createdAt,
          total: sales.total,
          paymentMethod: sales.paymentMethod
        })
        .from(sales)
        .where(eq(sales.customerId, customerId))
        .orderBy(desc(sales.createdAt));
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer history" });
    }
  });
  // Product Performance Report
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
          totalCost: sql<number>`COALESCE(SUM(${saleItems.quantity} * NULLIF(${products.buying_price}, 0)), 0)`,
          profit: sql<number>`COALESCE(SUM(${saleItems.quantity} * (${saleItems.price} - COALESCE(NULLIF(${products.buying_price}, 0), ${saleItems.price}))), 0)`
        })
        .from(saleItems)
        .rightJoin(products, eq(products.id, saleItems.productId))
        .groupBy(saleItems.productId, products.name, products.category)
        .orderBy(sql`COALESCE(SUM(${saleItems.quantity} * (${saleItems.price} - COALESCE(NULLIF(${products.buying_price}, 0), ${saleItems.price}))), 0) DESC`)
        .limit(10);
      
      res.json(productStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product performance" });
    }
  });

  // Sales Trend Analysis
  app.get("/api/reports/sales-trend", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const salesTrend = await db
        .select({
          date: sql<string>`DATE_TRUNC('day', ${sales.createdAt})::date`,
          total: sql<number>`COALESCE(SUM(${sales.total}), 0)`,
          profit: sql<number>`COALESCE(SUM(
            ${saleItems.quantity} * (${saleItems.price} - COALESCE(${products.buying_price}, 0))
          ), 0)`,
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

  // Customer Purchase History
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
        .orderBy(sales.createdAt, "desc");
      
      res.json(customerSales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer history" });
    }
  });

  // Top Selling Products Report
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
          cost: sql<number>`COALESCE(SUM(${saleItems.quantity} * NULLIF(${products.buying_price}, 0)), 0)`,
          profit: sql<number>`COALESCE(SUM(${saleItems.quantity} * (${saleItems.price} - COALESCE(NULLIF(${products.buying_price}, 0), ${saleItems.price}))), 0)`
        })
        .from(saleItems)
        .innerJoin(products, eq(products.id, saleItems.productId))
        .groupBy(saleItems.productId, products.name, products.category)
        .orderBy(sql`COALESCE(SUM(${saleItems.quantity} * (${saleItems.price} - COALESCE(NULLIF(${products.buying_price}, 0), ${saleItems.price}))), 0) DESC`)
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
