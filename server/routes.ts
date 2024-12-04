import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { 
  products, customers, sales, saleItems, suppliers, 
  productSuppliers as productSuppliersTable, 
  purchaseOrders, purchaseOrderItems,
  insertSupplierSchema,
  insertProductSupplierSchema,
} from "@db/schema";
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
      // Validate the request body
      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid supplier data",
          details: result.error.issues 
        });
      }

      const [supplier] = await db
        .insert(suppliers)
        .values(result.data)
        .returning();

      res.json(supplier);
    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  // Product-Supplier Management
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
          createdAt: productSuppliersTable.createdAt,
          updatedAt: productSuppliersTable.updatedAt,
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            email: suppliers.email,
            phone: suppliers.phone,
            address: suppliers.address,
          },
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
            buyingPrice: products.buyingPrice,
            sellingPrice: products.sellingPrice,
          },
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
      const result = insertProductSupplierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid product-supplier data",
          details: result.error.issues 
        });
      }

      const [productSupplier] = await db
        .insert(productSuppliersTable)
        .values(result.data)
        .returning();
      res.json(productSupplier);
    } catch (error) {
      console.error('Link product to supplier error:', error);
      res.status(500).json({ error: "Failed to link product to supplier" });
    }
  });

  // Products API with correct column names
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
          minStock: products.minStock,
          maxStock: products.maxStock,
          reorderPoint: products.reorderPoint,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .orderBy(products.name);
      
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

  // Purchase Orders endpoints
  app.get("/api/purchase-orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const orders = await db
        .select()
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .orderBy(desc(purchaseOrders.createdAt));

      const result = orders.map(order => ({
        id: order.purchase_orders.id,
        supplierId: order.purchase_orders.supplierId,
        status: order.purchase_orders.status,
        orderDate: order.purchase_orders.orderDate,
        receivedDate: order.purchase_orders.receivedDate,
        total: order.purchase_orders.total,
        createdAt: order.purchase_orders.createdAt,
        updatedAt: order.purchase_orders.updatedAt,
        supplier: order.suppliers ? {
          id: order.suppliers.id,
          name: order.suppliers.name,
          email: order.suppliers.email,
          phone: order.suppliers.phone,
        } : null
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Fetch purchase orders error:", error);
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/purchase-orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { items, supplierId, total } = req.body;
      
      // Create purchase order
      const [order] = await db.insert(purchaseOrders)
        .values({
          supplierId,
          userId: req.user!.id,
          total,
          status: "pending",
        })
        .returning();

      // Create purchase order items and update product prices
      for (const item of items) {
        await db.insert(purchaseOrderItems)
          .values({
            purchaseOrderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.buyingPrice, // Use buying price as unit price
          });

        // Update product prices
        await db.update(products)
          .set({
            buyingPrice: item.buyingPrice,
            sellingPrice: item.sellingPrice,
            updatedAt: new Date()
          })
          .where(eq(products.id, item.productId));
      }

      res.json(order);
    } catch (error) {
      console.error("Create purchase order error:", error);
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  app.put("/api/purchase-orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const { id } = req.params;
    const { status } = req.body;
    try {
      // Update purchase order status
      const [updatedOrder] = await db
        .update(purchaseOrders)
        .set({ 
          status,
          receivedDate: status === "received" ? new Date() : null,
          updatedAt: new Date()
        })
        .where(eq(purchaseOrders.id, parseInt(id)))
        .returning();

      // If order is received, update product stock levels
      if (status === "received") {
        const orderItems = await db
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchaseOrderId, parseInt(id)));

        for (const item of orderItems) {
          await db
            .update(products)
            .set({ 
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(products.id, item.productId));
        }
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Update purchase order status error:", error);
      res.status(500).json({ error: "Failed to update purchase order status" });
    }
  });

  // Get purchase order items
  app.get("/api/purchase-orders/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const orderId = parseInt(req.params.id);
      const items = await db
        .select({
          id: purchaseOrderItems.id,
          purchaseOrderId: purchaseOrderItems.purchaseOrderId,
          quantity: purchaseOrderItems.quantity,
          unitPrice: purchaseOrderItems.unitPrice,
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
          }
        })
        .from(purchaseOrderItems)
        .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
        .where(eq(purchaseOrderItems.purchaseOrderId, orderId));

      res.json(items);
    } catch (error) {
      console.error("Fetch purchase order items error:", error);
      res.status(500).json({ error: "Failed to fetch purchase order items" });
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

  // Demo data seeding endpoint
  app.post("/api/seed-demo-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const demoProducts = [
        {
          name: "Milk 500ml",
          sku: "DAIRY-001",
          buyingPrice: "45.00",
          sellingPrice: "65.00",
          stock: 50,
          category: "Dairy",
          minStock: 10,
          maxStock: 100,
          reorderPoint: 20,
        },
        {
          name: "Bread",
          sku: "BAKERY-001", 
          buyingPrice: "50.00",
          sellingPrice: "70.00",
          stock: 30,
          category: "Bakery",
          minStock: 5,
          maxStock: 50,
          reorderPoint: 10,
        },
        {
          name: "Sugar 1kg",
          sku: "GROCERY-001",
          buyingPrice: "130.00",
          sellingPrice: "165.00",
          stock: 100,
          category: "Grocery",
          minStock: 20,
          maxStock: 200,
          reorderPoint: 50,
        }
      ];

      await db.insert(products).values(demoProducts);
      res.json({ message: "Demo data added successfully" });
    } catch (error) {
      console.error('Add demo data error:', error);
      res.status(500).json({ error: "Failed to add demo data" });
    }
  });
}