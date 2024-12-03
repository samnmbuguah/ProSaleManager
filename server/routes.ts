import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { products, customers, sales, saleItems, suppliers, productSuppliers as productSuppliersTable } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Suppliers API
  app.get("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const allSuppliers = await db.select().from(suppliers).orderBy(suppliers.name);
      res.json(allSuppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [supplier] = await db.insert(suppliers).values(req.body).returning();
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.get("/api/product-suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const supplierProducts = await db
        .select({
          id: productSuppliersTable.id,
          productId: productSuppliersTable.productId,
          supplierId: productSuppliersTable.supplierId,
          costPrice: productSuppliersTable.costPrice,
          isPreferred: productSuppliersTable.isPreferred,
          lastSupplyDate: productSuppliersTable.lastSupplyDate,
          supplier: suppliers,
          product: products,
        })
        .from(productSuppliersTable)
        .leftJoin(suppliers, eq(suppliers.id, productSuppliersTable.supplierId))
        .leftJoin(products, eq(products.id, productSuppliersTable.productId));
      res.json(supplierProducts);
    } catch (error) {
      console.error('Fetch product suppliers error:', error);
      res.status(500).json({ error: "Failed to fetch product suppliers" });
    }
  });

  app.post("/api/product-suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [productSupplier] = await db
        .insert(productSuppliersTable)
        .values(req.body)
        .returning();
      res.json(productSupplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to link product to supplier" });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          buyingPrice: products.buyingPrice,
          sellingPrice: products.sellingPrice,
          stock: products.stock,
          category: products.category,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .orderBy(products.name);
      
      if (!allProducts) {
        return res.json([]);
      }
      
      res.json(allProducts);
    } catch (error) {
      console.error('Fetch products error:', error);
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
          totalQuantity: sql`SUM(${saleItems.quantity})`,
          totalRevenue: sql`SUM(${saleItems.quantity} * ${saleItems.price})`
        })
        .from(saleItems)
        .innerJoin(products, eq(products.id, saleItems.productId))
        .innerJoin(sales, eq(sales.id, saleItems.saleId))
        .groupBy(saleItems.productId, products.name, products.category)
        .orderBy(desc(sql`SUM(${saleItems.quantity})`));
      
      res.json(productStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product performance report" });
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
