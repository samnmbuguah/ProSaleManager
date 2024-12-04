import { Express, Request, Response } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "db";
import {
  products,
  suppliers,
  customers,
  sales,
  saleItems,
  productSuppliers,
  purchaseOrders,
  purchaseOrderItems,
  insertSupplierSchema,
  insertProductSupplierSchema,
} from "@db/schema";
import { setupAuth } from "./auth";

// Loyalty program helper functions
function calculateLoyaltyTier(points: number): string {
  if (points >= 10000) return "gold";
  if (points >= 5000) return "silver";
  return "bronze";
}

function getPointsMultiplier(tier: string): number {
  switch (tier) {
    case "gold": return 1.5;
    case "silver": return 1.25;
    case "bronze": return 1;
    default: return 1;
  }
}

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Products API
  app.get("/api/products", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const allProducts = await db.select().from(products);
      res.json(allProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Suppliers API
  app.get("/api/suppliers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const allSuppliers = await db.select().from(suppliers);
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
          id: productSuppliers.id,
          productId: productSuppliers.productId,
          supplierId: productSuppliers.supplierId,
          costPrice: productSuppliers.costPrice,
          isPreferred: productSuppliers.isPreferred,
          lastSupplyDate: productSuppliers.lastSupplyDate,
          createdAt: productSuppliers.createdAt,
          updatedAt: productSuppliers.updatedAt,
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
        .from(productSuppliers)
        .leftJoin(suppliers, eq(suppliers.id, productSuppliers.supplierId))
        .leftJoin(products, eq(products.id, productSuppliers.productId));
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
        .insert(productSuppliers)
        .values(result.data)
        .returning();
      res.json(productSupplier);
    } catch (error) {
      console.error('Link product to supplier error:', error);
      res.status(500).json({ error: "Failed to link product to supplier" });
    }
  });


  // Customers API with loyalty
  app.get("/api/customers", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const allCustomers = await db.select().from(customers);
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

  // Sales API with loyalty points
  app.post("/api/sales", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { items, customerId, total, paymentMethod } = req.body;
      
      // Create sale
      const [sale] = await db.insert(sales).values({
        customerId,
        userId: req.user!.id,
        total: total.toString(),
        paymentMethod,
      }).returning();

      // Create sale items
      await Promise.all(items.map(async (item: any) => {
        await db.insert(saleItems).values({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
        });

        // Update product stock
        await db
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`
          })
          .where(eq(products.id, item.productId));
      }));

      // Update customer loyalty points if customer exists
      if (customerId) {
        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, customerId));

        if (customer) {
          const pointsEarned = Math.floor(Number(total) * getPointsMultiplier(customer.loyaltyTier));
          const newPoints = customer.loyaltyPoints + pointsEarned;
          const newTier = calculateLoyaltyTier(newPoints);

          await db.update(customers)
            .set({
              loyaltyPoints: newPoints,
              loyaltyTier: newTier,
            })
            .where(eq(customers.id, customerId));
        }
      }

      res.json(sale);
    } catch (error) {
      console.error('Create sale error:', error);
      res.status(500).json({ error: "Failed to create sale" });
    }
  });

  // Loyalty points redemption
  app.post("/api/customers/:id/redeem-points", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const customerId = parseInt(req.params.id);
      const { pointsToRedeem } = req.body;

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      if (customer.loyaltyPoints < pointsToRedeem) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      const discountAmount = pointsToRedeem / 10; // 10 points = 1 KSh discount

      await db.update(customers)
        .set({
          loyaltyPoints: customer.loyaltyPoints - pointsToRedeem,
        })
        .where(eq(customers.id, customerId));

      res.json({ 
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        remainingPoints: customer.loyaltyPoints - pointsToRedeem 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to redeem points" });
    }
  });

  // Get customer loyalty info
  app.get("/api/customers/:id/loyalty", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const customerId = parseInt(req.params.id);
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const nextTier = customer.loyaltyTier === "bronze" 
        ? { name: "silver", pointsNeeded: 5000 - customer.loyaltyPoints }
        : customer.loyaltyTier === "silver"
          ? { name: "gold", pointsNeeded: 10000 - customer.loyaltyPoints }
          : null;

      res.json({
        points: customer.loyaltyPoints,
        tier: customer.loyaltyTier,
        multiplier: getPointsMultiplier(customer.loyaltyTier),
        nextTier,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loyalty info" });
    }
  });

  // Purchase Orders API
  app.post("/api/purchase-orders", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { supplierId, items, total } = req.body;

      const [order] = await db.insert(purchaseOrders).values({
        supplierId,
        userId: req.user!.id,
        total: total.toString(),
      }).returning();

      await Promise.all(items.map((item: any) =>
        db.insert(purchaseOrderItems).values({
          purchaseOrderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          buyingPrice: item.buyingPrice.toString(),
          sellingPrice: item.sellingPrice.toString(),
        })
      ));

      res.json(order);
    } catch (error) {
      console.error('Create purchase order error:', error);
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  // Get purchase orders
  app.get("/api/purchase-orders", async (req: Request, res: Response) => {
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

      // If order is received, update product stock levels and prices
      if (status === "received") {
        const orderItems = await db
          .select({
            ...purchaseOrderItems,
            product: products,
          })
          .from(purchaseOrderItems)
          .leftJoin(products, eq(products.id, purchaseOrderItems.productId))
          .where(eq(purchaseOrderItems.purchaseOrderId, parseInt(id)));

        for (const item of orderItems) {
          await db
            .update(products)
            .set({ 
              stock: sql`${products.stock} + ${item.quantity}`,
              buyingPrice: item.buyingPrice, // Update buying price from purchase order
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