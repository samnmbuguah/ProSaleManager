import type { Express } from "express";
import { Request, Response } from "express";
import { eq, sql, asc, desc, and, or } from "drizzle-orm";
import { db } from "../db";
import {
  products,
  type Product,
  type InsertProduct,
  customers,
  type Customer,
  type InsertCustomer,
  sales,
  type Sale,
  type InsertSale,
  saleItems,
  type SaleItem,
  type InsertSaleItem,
  suppliers,
  type Supplier,
  type InsertSupplier,
  purchaseOrders,
  type PurchaseOrder,
  purchaseOrderItems,
  type PurchaseOrderItem,
  supplierProducts,
  type SupplierProduct,
  type InsertSupplierProduct,
} from "@db/schema";
import { initiateSTKPush } from "./mpesa";

export function registerRoutes(app: Express) {
  // Products routes
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const allProducts = await db.query.products.findMany({
      orderBy: [asc(products.name)],
    });
    res.json(allProducts);
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [product] = await db
        .insert(products)
        .values(req.body)
        .returning();
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.post("/api/products/:id/stock", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const { id } = req.params;
    const { quantity } = req.body;

    try {
      const [product] = await db
        .update(products)
        .set({
          stock: sql`${products.stock} + ${quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, parseInt(id)))
        .returning();

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stock" });
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
          profit: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profitMargin} / 100), 0)`
        })
        .from(saleItems)
        .rightJoin(products, eq(products.id, saleItems.productId))
        .groupBy(saleItems.productId, products.name, products.category)
        .orderBy(desc(sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profitMargin} / 100), 0)`))
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
          profit: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * ${products.profitMargin} / 100), 0)`,
          cost: sql<number>`COALESCE(SUM(${saleItems.quantity} * ${saleItems.price} * (100 - ${products.profitMargin}) / 100), 0)`,
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

  // Get supplier performance and reorder suggestions
  app.get("/api/inventory/reorder-suggestions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      // Get all products that need reordering
      const lowStockProducts = await db
        .select({
          product: products,
          supplier: suppliers,
        })
        .from(products)
        .leftJoin(
          suppliers,
          eq(products.preferredSupplierId, suppliers.id)
        )
        .where(
          or(
            sql`${products.stock} <= ${products.reorderPoint}`,
            sql`${products.stock} <= ${products.minStock}`
          )
        );

      // Get performance metrics for all suppliers
      const allSuppliers = await db
        .select()
        .from(suppliers)
        .where(
          and(
            sql`${suppliers.onTimeDeliveryRate} > 0`,
            sql`${suppliers.qualityRating} > 0`
          )
        )
        .orderBy(desc(suppliers.onTimeDeliveryRate));

      const suggestions = await Promise.all(
        lowStockProducts.map(async ({ product, supplier: preferredSupplier }) => {
          // Calculate urgency based on current stock level
          const stockOutDays = Math.ceil(product.stock / (product.maxStock / 30)); // Assuming max stock is monthly capacity
          const isUrgent = stockOutDays <= 7; // Mark as urgent if less than 7 days of stock

          // Find best supplier based on performance metrics
          let bestSupplier = preferredSupplier;
          if (!bestSupplier || Number(bestSupplier.onTimeDeliveryRate) < 80) {
            const potentialSuppliers = allSuppliers.filter(s => 
              Number(s.onTimeDeliveryRate) >= 80 && Number(s.qualityRating) >= 4
            );
            if (potentialSuppliers.length > 0) {
              bestSupplier = potentialSuppliers[0];
            }
          }

          // Calculate optimal order quantity considering min and max stock levels
          const optimalQuantity = Math.min(
            product.maxStock - product.stock,
            Math.max(
              product.reorderPoint * 2 - product.stock,
              product.minStock * 3 - product.stock
            )
          );

          return {
            product: {
              id: product.id,
              name: product.name,
              currentStock: product.stock,
              reorderPoint: product.reorderPoint,
              maxStock: product.maxStock,
              minStock: product.minStock,
            },
            supplier: bestSupplier ? {
              id: bestSupplier.id,
              name: bestSupplier.name,
              onTimeDeliveryRate: bestSupplier.onTimeDeliveryRate,
              qualityRating: bestSupplier.qualityRating,
              responseTime: bestSupplier.responseTime,
            } : null,
            suggestedOrderQuantity: optimalQuantity,
            isUrgent,
            stockOutDays,
          };
        })
      );

      // Sort suggestions by urgency and stock out days
      suggestions.sort((a, b) => {
        if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
        return a.stockOutDays - b.stockOutDays;
      });

      res.json(suggestions);
    } catch (error) {
      console.error('Reorder suggestions error:', error);
      res.status(500).json({ 
        error: "Failed to fetch reorder suggestions",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Suppliers routes
  app.get("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const allSuppliers = await db.query.suppliers.findMany({
      orderBy: [asc(suppliers.name)],
    });
    res.json(allSuppliers);
  });

  app.post("/api/suppliers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [supplier] = await db
        .insert(suppliers)
        .values(req.body)
        .returning();
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  // Purchase Orders routes
  app.get("/api/purchase-orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const orders = await db.query.purchaseOrders.findMany({
        with: {
          supplier: true,
          items: {
            with: {
              product: true,
            },
          },
        },
        orderBy: [desc(purchaseOrders.createdAt)],
      });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/purchase-orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const { supplierId, items, expectedDeliveryDate } = req.body;

    try {
      const total = items.reduce(
        (sum: number, item: { quantity: number; unitPrice: number }) =>
          sum + item.quantity * item.unitPrice,
        0
      );

      const [order] = await db
        .insert(purchaseOrders)
        .values({
          supplierId,
          userId: req.user!.id,
          total,
          expectedDeliveryDate: expectedDeliveryDate
            ? new Date(expectedDeliveryDate)
            : null,
        })
        .returning();

      await db.insert(purchaseOrderItems).values(
        items.map((item: any) => ({
          purchaseOrderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  app.post("/api/purchase-orders/:id/receive", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const { id } = req.params;
    const { items } = req.body;

    try {
      // Update received quantities and product stock
      for (const item of items) {
        await db.transaction(async (tx) => {
          await tx
            .update(purchaseOrderItems)
            .set({
              receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${item.quantity}`,
            })
            .where(eq(purchaseOrderItems.id, item.id));

          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        });
      }

      // Check if all items are received
      const orderItems = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, Number(id)));

      const allReceived = orderItems.every(
        (item) => item.receivedQuantity === item.quantity
      );

      // Update order status if all items are received
      if (allReceived) {
        const order = await db.query.purchaseOrders.findFirst({
          where: eq(purchaseOrders.id, Number(id)),
          with: {
            supplier: true,
          }
        });

        if (order) {
          const deliveryDate = new Date();
          const expectedDate = order.expectedDeliveryDate;
          const onTime = expectedDate ? deliveryDate <= expectedDate : true;
          
          // Calculate metrics
          const leadTime = Math.floor((deliveryDate.getTime() - order.orderDate.getTime()) / (1000 * 60 * 60));
          const orderItems = await db.query.purchaseOrderItems.findMany({
            where: eq(purchaseOrderItems.purchaseOrderId, order.id),
          });
          
          const fulfilledItems = orderItems.filter(item => item.receivedQuantity === item.quantity);
          const fulfillmentRate = (fulfilledItems.length / orderItems.length) * 100;

          // Update supplier metrics
          await db.update(suppliers)
            .set({
              onTimeDeliveryRate: sql`
                CASE 
                  WHEN ${suppliers.onTimeDeliveryRate} = 0 
                  THEN ${onTime ? 100 : 0}
                  ELSE (${suppliers.onTimeDeliveryRate} * 0.8 + ${onTime ? 100 : 0} * 0.2)
                END
              `,
              responseTime: sql`
                CASE 
                  WHEN ${suppliers.responseTime} = 0 
                  THEN ${leadTime}
                  ELSE (${suppliers.responseTime} * 0.8 + ${leadTime} * 0.2)
                END
              `,
              orderFulfillmentRate: sql`
                CASE 
                  WHEN ${suppliers.orderFulfillmentRate} = 0 
                  THEN ${fulfillmentRate}
                  ELSE (${suppliers.orderFulfillmentRate} * 0.8 + ${fulfillmentRate} * 0.2)
                END
              `,
              averageLeadTime: sql`
                CASE 
                  WHEN ${suppliers.averageLeadTime} = 0 
                  THEN ${leadTime}
                  ELSE (${suppliers.averageLeadTime} * 0.8 + ${leadTime} * 0.2)
                END
              `,
              lastOrderDate: new Date()
            })
            .where(eq(suppliers.id, order.supplierId));

          // Update supplier product price history
          for (const item of orderItems) {
            const supplierProduct = await db.query.supplierProducts.findFirst({
              where: and(
                eq(supplierProducts.supplierId, order.supplierId),
                eq(supplierProducts.productId, item.productId)
              ),
            });

            if (supplierProduct && supplierProduct.unitPrice !== item.unitPrice) {
              const priceVariance = ((Number(item.unitPrice) - Number(supplierProduct.unitPrice)) / Number(supplierProduct.unitPrice)) * 100;
              
              await db.update(supplierProducts)
                .set({
                  previousPrice: supplierProduct.unitPrice,
                  unitPrice: item.unitPrice,
                  lastPriceChange: new Date(),
                  priceVariance: sql`
                    CASE 
                      WHEN ${supplierProducts.priceVariance} IS NULL 
                      THEN ${priceVariance}
                      ELSE (${supplierProducts.priceVariance} * 0.8 + ${priceVariance} * 0.2)
                    END
                  `
                })
                .where(eq(supplierProducts.id, supplierProduct.id));
            }
          }
        }

        // Update order status
        await db.update(purchaseOrders)
          .set({ 
            status: 'completed',
            deliveryDate: new Date()
          })
          .where(eq(purchaseOrders.id, Number(id)));
      }

      res.json({ message: "Items received successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to receive items" });
    }
  });

  app.post("/api/suppliers/:id/quality-rating", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const { id } = req.params;
    const { rating } = req.body;

    try {
      if (rating < 0 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 0 and 5" });
      }

      const [supplier] = await db
        .update(suppliers)
        .set({
          qualityRating: sql`
            CASE 
              WHEN ${suppliers.qualityRating} = 0 
              THEN ${rating}
              ELSE (${suppliers.qualityRating} * 0.8 + ${rating} * 0.2)
            END
          `,
          updatedAt: new Date(),
        })
        .where(eq(suppliers.id, parseInt(id)))
        .returning();

      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update supplier quality rating" });
    }
  });

  // Supplier Products routes
  app.get("/api/supplier-products/:supplierId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const products = await db.query.supplierProducts.findMany({
        where: eq(supplierProducts.supplierId, parseInt(req.params.supplierId)),
        with: {
          product: true,
        },
      });
      res.json(products);
    } catch (error) {
      console.error('Fetch supplier products error:', error);
      res.status(500).json({ 
        error: "Failed to fetch supplier products",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/supplier-products", async (req: Request<{}, {}, InsertSupplierProduct>, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [supplierProduct] = await db
        .insert(supplierProducts)
        .values(req.body)
        .returning();
      
      // If this is marked as preferred, update the product's preferred supplier
      if (supplierProduct.isPreferred) {
        await db
          .update(products)
          .set({ preferredSupplierId: supplierProduct.supplierId })
          .where(eq(products.id, supplierProduct.productId));
      }
      
      res.json(supplierProduct);
    } catch (error) {
      console.error('Create supplier product error:', error);
      res.status(500).json({ 
        error: "Failed to create supplier product",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/supplier-products/:id", async (req: Request<{ id: string }, {}, Partial<InsertSupplierProduct>>, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const [supplierProduct] = await db
        .update(supplierProducts)
        .set(req.body)
        .where(eq(supplierProducts.id, parseInt(req.params.id)))
        .returning();
      
      // Update preferred supplier if needed
      if (supplierProduct.isPreferred) {
        await db
          .update(products)
          .set({ preferredSupplierId: supplierProduct.supplierId })
          .where(eq(products.id, supplierProduct.productId));
      }
      
      res.json(supplierProduct);
    } catch (error) {
      console.error('Update supplier product error:', error);
      res.status(500).json({ 
        error: "Failed to update supplier product",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}