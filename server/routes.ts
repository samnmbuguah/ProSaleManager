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

  // Reports API
  app.get("/api/reports/sales", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const period = req.query.period as string || 'monthly';
      
      // Validate period parameter
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
        return res.status(400).json({ error: "Invalid period parameter" });
      }

      const startDate = new Date();
      
      // Calculate start date based on period
      switch (period) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 7); // Last 7 days
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 28); // Last 4 weeks
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 5); // Last 5 years
          break;
      }

      const salesData = await db.select({
        date: sql`date_trunc(${period}, ${sales.createdAt})::date`,
        total: sql`COALESCE(SUM(${sales.total}), 0)`,
        count: sql`COUNT(*)`
      })
      .from(sales)
      .where(sql`${sales.createdAt} >= ${startDate}`)
      .groupBy(sql`date_trunc(${period}, ${sales.createdAt})::date`)
      .orderBy(sql`date_trunc(${period}, ${sales.createdAt})::date`);
      
      res.json(salesData);
    } catch (error: any) {
      console.error("Sales report error:", error);
      res.status(500).json({ 
        error: "Failed to fetch sales report", 
        details: error.message 
      });
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
