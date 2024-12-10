import { Router } from "express";
import { Express } from "express";
import { setupAuth } from "./auth";
import { createDatabaseBackup } from "./db/backup";
import { db } from "../db";
import * as path from "path";
import * as fs from "fs/promises";
import { 
  products, customers, sales, saleItems, suppliers, 
  productSuppliers as productSuppliersTable, 
  purchaseOrders, purchaseOrderItems,
  loyaltyPoints, loyaltyTransactions,
  insertSupplierSchema,
  insertProductSupplierSchema,
  unitPricing,
} from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { gte, lte } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";

interface SaleItemInput {
  productId: number;
  quantity: number;
  price: string | number;
  name?: string;
  unitPricingId?: number | null;
}

export function registerRoutes(app: Express) {
  setupAuth(app);

  const router = Router();

  // Development only - Delete all sales
  router.delete("/all", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Not allowed in production" });
    }

    try {
      // Delete in order of dependencies
      await db.delete(loyaltyTransactions);
      await db.delete(saleItems);
      await db.delete(sales);

      res.json({ message: "All sales and related records deleted successfully" });
    } catch (error) {
      console.error("Error deleting sales:", error);
      res.status(500).json({ error: "Failed to delete sales" });
    }
  });

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
          supplier: suppliers,
          product: {
            id: products.id,
            name: products.name,
            stockUnit: products.stockUnit,
            defaultUnitPricingId: products.defaultUnitPricingId,
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
          stock: products.stock,
          category: products.category,
          minStock: products.minStock,
          maxStock: products.maxStock,
          reorderPoint: products.reorderPoint,
          stockUnit: products.stockUnit,
          defaultUnitPricingId: products.defaultUnitPricingId,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .orderBy(products.name);
      
      // Fetch unit pricing for each product
      const productsWithPricing = await Promise.all(
        allProducts.map(async (product) => {
          const pricing = await db
            .select()
            .from(unitPricing)
            .where(eq(unitPricing.productId, product.id));
          
          const defaultPricing = product.defaultUnitPricingId
            ? await db
                .select()
                .from(unitPricing)
                .where(eq(unitPricing.id, product.defaultUnitPricingId))
                .limit(1)
            : null;

          return {
            ...product,
            unitPricing: pricing,
            defaultUnitPricing: defaultPricing?.[0] || null,
          };
        })
      );
      
      res.json(productsWithPricing);
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
      console.error('Create product error:', error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Unit Pricing endpoints
  app.post("/api/unit-pricing", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { productId, prices } = req.body;
      
      interface UnitPrice {
        unitType: string;
        quantity: number;
        buyingPrice: string;
        sellingPrice: string;
      }
      
      const unitPrices = Object.entries(prices).map(([unitType, pricing]: [string, any]) => ({
        productId,
        unitType,
        quantity: (pricing as UnitPrice).quantity,
        buyingPrice: (pricing as UnitPrice).buyingPrice,
        sellingPrice: (pricing as UnitPrice).sellingPrice,
      }));

      // Delete existing prices for this product first
      await db.delete(unitPricing).where(eq(unitPricing.productId, productId));
      
      // Insert new prices
      await db.insert(unitPricing).values(unitPrices);
      res.json({ success: true });
    } catch (error) {
      console.error('Create unit pricing error:', error);
      res.status(500).json({ error: "Failed to create unit pricing" });
    }
  });

  // Bulk Unit Pricing update endpoint
  app.post("/api/unit-pricing/bulk", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { updates } = req.body;
      
      interface BulkUnitPricing {
        productId: number;
        prices: {
          [key: string]: {
            quantity: number;
            buyingPrice: string;
            sellingPrice: string;
          }
        }
      }

      // Validate input structure
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Updates must be an array" });
      }

      // Process each product's pricing updates
      for (const update of updates as BulkUnitPricing[]) {
        const { productId, prices } = update;
        
        const unitPrices = Object.entries(prices).map(([unitType, pricing]) => ({
          productId,
          unitType,
          quantity: pricing.quantity,
          buyingPrice: pricing.buyingPrice,
          sellingPrice: pricing.sellingPrice,
        }));

        // Delete existing prices for this product
        await db.delete(unitPricing).where(eq(unitPricing.productId, productId));
        
        // Insert new prices
        await db.insert(unitPricing).values(unitPrices);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Bulk unit pricing update error:', error);
      res.status(500).json({ error: "Failed to update unit pricing" });
    }
  });

  // Get Unit Pricing for a product
  app.get("/api/unit-pricing/:productId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const productId = parseInt(req.params.productId);
      const prices = await db
        .select()
        .from(unitPricing)
        .where(eq(unitPricing.productId, productId));
      
      res.json(prices);
    } catch (error) {
      console.error('Fetch unit pricing error:', error);
      res.status(500).json({ error: "Failed to fetch unit pricing" });
    }
  });

  // Purchase Orders endpoints
  app.get("/api/purchase-orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const orders = await db
        .select({
          id: purchaseOrders.id,
          supplierId: purchaseOrders.supplierId,
          status: purchaseOrders.status,
          orderDate: purchaseOrders.orderDate,
          receivedDate: purchaseOrders.receivedDate,
          total: purchaseOrders.total,
          createdAt: purchaseOrders.createdAt,
          updatedAt: purchaseOrders.updatedAt,
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            email: suppliers.email,
            phone: suppliers.phone,
          }
        })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .orderBy(desc(purchaseOrders.createdAt));

      const result = orders.map(order => ({
        ...order,
        supplier: order.supplier?.id ? order.supplier : null
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
      const { supplierId, userId, total, status } = req.body;
      
      // Create purchase order
      const [order] = await db.insert(purchaseOrders)
        .values({
          supplierId,
          userId,
          total,
          status: status || "pending",
        })
        .returning();

      res.json(order);
    } catch (error) {
      console.error("Create purchase order error:", error);
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  app.post("/api/purchase-order-items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { purchaseOrderId, productId, quantity, buyingPrice, sellingPrice } = req.body;
      
      // Create purchase order item
      const [item] = await db.insert(purchaseOrderItems)
        .values({
          purchaseOrderId,
          productId,
          quantity,
          buyingPrice,
          sellingPrice,
        })
        .returning();

      // Update or create unit pricing for the product
      await db.insert(unitPricing)
        .values({
          productId,
          unitType: product.stockUnit || 'piece',
          quantity: 1,
          buyingPrice,
          sellingPrice,
          isDefault: true,
        })
        .onConflictDoUpdate({
          target: [unitPricing.productId, unitPricing.unitType],
          set: {
            buyingPrice,
            sellingPrice,
            updatedAt: new Date(),
          },
        });

      res.json(item);
    } catch (error) {
      console.error("Create purchase order item error:", error);
      res.status(500).json({ error: "Failed to create purchase order item" });
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
            id: purchaseOrderItems.id,
            productId: purchaseOrderItems.productId,
            quantity: purchaseOrderItems.quantity,
            buyingPrice: purchaseOrderItems.buyingPrice,
            sellingPrice: purchaseOrderItems.sellingPrice,
          })
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
          buyingPrice: purchaseOrderItems.buyingPrice,
          sellingPrice: purchaseOrderItems.sellingPrice,
          product: {
            id: products.id,
            name: products.name,
            stockUnit: products.stockUnit,
          }
        })
        .from(purchaseOrderItems)
        .leftJoin(products, eq(products.id, purchaseOrderItems.productId))
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
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { items, customerId, total, paymentMethod, usePoints = 0 } = req.body;
      
      // Create sale record
      const [sale] = await db.insert(sales).values({
        customerId,
        userId: req.user!.id,
        total,
        paymentMethod,
        paymentStatus: 'paid',
      }).returning();

      // Create sale items
      await db.insert(saleItems).values(
        items.map((item: SaleItemInput) => ({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitPricingId: item.unitPricingId || null,
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

      // Handle loyalty points
      if (customerId) {
        const pointsToAward = Math.floor(Number(total) / 100);
        const [existingPoints] = await db
          .select()
          .from(loyaltyPoints)
          .where(eq(loyaltyPoints.customerId, customerId));

        if (existingPoints) {
          await db
            .update(loyaltyPoints)
            .set({ 
              points: sql`${loyaltyPoints.points} + ${pointsToAward} - ${usePoints}`,
              updatedAt: new Date()
            })
            .where(eq(loyaltyPoints.customerId, customerId));
        } else {
          await db
            .insert(loyaltyPoints)
            .values({
              customerId,
              points: pointsToAward,
            });
        }

        await db.insert(loyaltyTransactions).values({
          customerId,
          saleId: sale.id,
          points: pointsToAward,
          type: 'earn',
        });

        if (usePoints > 0) {
          await db.insert(loyaltyTransactions).values({
            customerId,
            saleId: sale.id,
            points: -usePoints,
            type: 'redeem',
          });
        }
      }

      // Fetch customer data if customerId exists
      let customerData;
      if (customerId) {
        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, customerId))
          .limit(1);
        customerData = customer;
      }

      // Prepare receipt data
      const receipt = {
        id: sale.id,
        items: items.map((item: SaleItemInput) => ({
          name: item.name || 'Unknown Product',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.price) || 0,
          total: ((Number(item.quantity) || 0) * (Number(item.price) || 0)).toString(),
        })),
        customer: customerData ? {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
        } : undefined,
        total: total,
        paymentMethod: paymentMethod,
        timestamp: sale.createdAt,
        transactionId: `TXN-${sale.id}`,
        receiptStatus: {
          sms: false,
          whatsapp: false,
        },
      };

      res.json({
        sale: {
          id: sale.id,
          customerId: sale.customerId,
          userId: sale.userId,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          paymentStatus: sale.paymentStatus,
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt,
        },
        receipt
      });
    } catch (error) {
      console.error('Sale error:', error);
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
  // Loyalty Program endpoints
  app.get("/api/customers/:customerId/loyalty", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const customerId = parseInt(req.params.customerId);
      const points = await db
        .select()
        .from(loyaltyPoints)
        .where(eq(loyaltyPoints.customerId, customerId))
        .limit(1);
      
      res.json(points[0] || { customerId, points: 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loyalty points" });
    }
  });

  app.get("/api/customers/:customerId/loyalty/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const customerId = parseInt(req.params.customerId);
      const transactions = await db
        .select()
        .from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.customerId, customerId))
        .orderBy(desc(loyaltyTransactions.createdAt));
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loyalty transactions" });
    }
  });

  // Update sales endpoint to handle loyalty points
  const calculateLoyaltyPoints = (total: number) => Math.floor(total / 100); // 1 point per 100 spent

  // Backup endpoints
  app.post("/api/backup", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const result = await createDatabaseBackup();
      if (result.success) {
        res.json({ message: "Backup created successfully", ...result });
      } else {
        res.status(500).json({ error: "Backup failed", ...result });
      }
    } catch (error) {
      console.error('Manual backup error:', error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.get("/api/backup/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      const files = await fs.readdir(backupDir);
      interface BackupFile {
        filename: string;
        timestamp: Date;
        size: number;
      }

      const backupFiles = files.filter((f: string) => f.startsWith('backup-'));
      const backups: BackupFile[] = await Promise.all(
        backupFiles.map(async (f: string) => {
          const stats = await fs.stat(path.join(backupDir, f));
          return {
            filename: f,
            timestamp: new Date(f.replace('backup-', '').replace('.sql', '').replace(/-/g, ':')),
            size: stats.size
          };
        })
      );
      backups.sort((a: BackupFile, b: BackupFile) => b.timestamp.getTime() - a.timestamp.getTime());

      res.json({
        totalBackups: backups.length,
        latestBackup: backups[0] || null,
        backups: backups
      });
    } catch (error) {
      console.error('Backup status check error:', error);
      res.status(500).json({ error: "Failed to get backup status" });
    }
  });

  // Demo data seeding endpoint
  app.post("/api/seed-demo-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const demoProducts = [
        {
          name: "Rice",
          stock: 100,
          category: "Grains",
          minStock: 20,
          maxStock: 200,
          reorderPoint: 40,
          stockUnit: "kg",
        },
        {
          name: "Cooking Oil",
          stock: 50,
          category: "Cooking",
          minStock: 10,
          maxStock: 100,
          reorderPoint: 20,
          stockUnit: "litre",
        },
        {
          name: "Wheat Flour",
          stock: 80,
          category: "Baking",
          minStock: 15,
          maxStock: 150,
          reorderPoint: 30,
          stockUnit: "kg",
        }
      ];

      const insertedProducts = await db.insert(products).values(demoProducts).returning();
      
      // Add unit pricing for each product
      const unitPricingData = insertedProducts.map(product => {
        const baseConfig = {
          productId: product.id,
          isDefault: true,
        };

        if (product.name === "Rice") {
          return [
            {
              ...baseConfig,
              unitType: "kg",
              quantity: 1,
              buyingPrice: "120.00",
              sellingPrice: "150.00",
            },
            {
              ...baseConfig,
              isDefault: false,
              unitType: "kg",
              quantity: 25,
              buyingPrice: "2800.00",
              sellingPrice: "3500.00",
            }
          ];
        } else if (product.name === "Cooking Oil") {
          return [
            {
              ...baseConfig,
              unitType: "litre",
              quantity: 1,
              buyingPrice: "200.00",
              sellingPrice: "250.00",
            },
            {
              ...baseConfig,
              isDefault: false,
              unitType: "litre",
              quantity: 5,
              buyingPrice: "950.00",
              sellingPrice: "1150.00",
            }
          ];
        } else {
          return [
            {
              ...baseConfig,
              unitType: "kg",
              quantity: 1,
              buyingPrice: "150.00",
              sellingPrice: "180.00",
            },
            {
              ...baseConfig,
              isDefault: false,
              unitType: "kg",
              quantity: 2,
              buyingPrice: "290.00",
              sellingPrice: "350.00",
            }
          ];
        }
      }).flat();

      await db.insert(unitPricing).values(unitPricingData);
      
      // Update default unit pricing IDs
      await Promise.all(
        insertedProducts.map(async (product) => {
          const [defaultPricing] = await db
            .select()
            .from(unitPricing)
            .where(and(
              eq(unitPricing.productId, product.id),
              eq(unitPricing.isDefault, true)
            ))
            .limit(1);

          if (defaultPricing) {
            await db
              .update(products)
              .set({ defaultUnitPricingId: defaultPricing.id })
              .where(eq(products.id, product.id));
          }
        })
      );

      res.json({ message: "Demo data added successfully" });
    } catch (error) {
      console.error('Add demo data error:', error);
      res.status(500).json({ error: "Failed to add demo data" });
    }
  });

  app.use("/api/sales", router); // Mount the sales router

}