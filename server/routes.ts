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
  UnitTypeValues,
} from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { gte, lte } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";

interface SaleItemInput {
  product_id: number;
  quantity: number;
  price: string | number;
  name?: string;
  unit_pricing_id?: number | null;
}

function generateSKU(name: string): string {
  // Convert name to uppercase and remove special characters
  const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Take first 3 characters (or pad with X if shorter)
  const prefix = (cleanName + 'XXX').slice(0, 3);
  // Add random 4-digit number
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
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
          product_id: productSuppliersTable.productId,
          supplier_id: productSuppliersTable.supplierId,
          cost_price: productSuppliersTable.costPrice,
          is_preferred: productSuppliersTable.isPreferred,
          last_supply_date: productSuppliersTable.lastSupplyDate,
          created_at: productSuppliersTable.createdAt,
          updated_at: productSuppliersTable.updatedAt,
          supplier: suppliers,
          product: {
            id: products.id,
            name: products.name,
            stock_unit: products.stock_unit,
            default_unit_pricing_id: products.default_unit_pricing_id,
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
      console.log('Fetching products with pricing information...');
      
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          stock: products.stock,
          category: products.category,
          min_stock: products.min_stock,
          max_stock: products.max_stock,
          reorder_point: products.reorder_point,
          stock_unit: products.stock_unit,
          default_unit_pricing_id: products.default_unit_pricing_id,
          created_at: products.created_at,
          updated_at: products.updated_at,
        })
        .from(products)
        .orderBy(products.name);

      console.log(`Found ${allProducts.length} products`);
      
      // Fetch unit pricing for each product
      const productsWithPricing = await Promise.all(
        allProducts.map(async (product) => {
          try {
            console.log(`Fetching pricing for product ${product.id}`);
            const pricing = await db
              .select({
                id: unitPricing.id,
                unit_type: unitPricing.unit_type,
                quantity: unitPricing.quantity,
                buying_price: unitPricing.buying_price,
                selling_price: unitPricing.selling_price,
                is_default: unitPricing.is_default,
              })
              .from(unitPricing)
              .where(eq(unitPricing.product_id, product.id));
            console.log('Found pricing:', pricing);

            console.log(`Found ${pricing.length} price units for product ${product.id}`);

            // Transform pricing data to match frontend expectations
            const price_units = pricing.map(unit => ({
              unit_type: unit.unit_type,
              quantity: unit.quantity,
              buying_price: unit.buying_price.toString(),
              selling_price: unit.selling_price.toString(),
              is_default: unit.is_default
            }));

            // Find default pricing unit
            const defaultUnit = price_units.find(unit => unit.is_default);

            return {
              ...product,
              price_units,
              default_unit_pricing: defaultUnit || null,
            };
          } catch (error) {
            console.error(`Error fetching pricing for product ${product.id}:`, error);
            return {
              ...product,
              price_units: [],
              default_unit_pricing: null,
            };
          }
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
      const { price_units, ...productData } = req.body as {
        price_units: Array<{
          unit_type: UnitTypeValues;
          quantity: number;
          buying_price: string;
          selling_price: string;
          is_default: boolean;
        }>;
        name: string;
        sku?: string;
        stock: number;
        category: string;
        min_stock?: number;
        max_stock?: number;
        reorder_point?: number;
        stock_unit: UnitTypeValues;
      };

      // Find default price unit
      const defaultPriceUnit = price_units.find(unit => unit.is_default) || price_units[0];
      
      // Create product first with default price values
      const [product] = await db.insert(products)
        .values({
          name: productData.name,
          sku: productData.sku || generateSKU(productData.name),
          stock: productData.stock,
          category: productData.category,
          min_stock: productData.min_stock || 0,
          max_stock: productData.max_stock || 0,
          reorder_point: productData.reorder_point || 0,
          stock_unit: productData.stock_unit,
          buying_price: defaultPriceUnit.buying_price,
          selling_price: defaultPriceUnit.selling_price,
          default_unit_pricing_id: null, // Will be updated after creating unit pricing
        })
        .returning();

      console.log('Created product:', product);

      if (price_units && Array.isArray(price_units)) {
        console.log('Received price units:', price_units);
        
        // Insert all unit pricing records
        const unitPricingData = price_units.map(unit => ({
          product_id: product.id,
          unit_type: unit.unit_type,
          quantity: unit.quantity,
          buying_price: unit.buying_price,
          selling_price: unit.selling_price,
          is_default: unit.is_default,
        }));
        
        console.log('Preparing to insert unit pricing data:', unitPricingData);

        const insertedPricing = await db.insert(unitPricing)
          .values(unitPricingData)
          .returning();

        console.log('Inserted unit pricing:', insertedPricing);

        // Find default unit pricing
        const defaultPricing = insertedPricing.find(p => p.is_default);
        if (defaultPricing) {
          // Update product with default unit pricing ID
          await db.update(products)
            .set({ default_unit_pricing_id: defaultPricing.id })
            .where(eq(products.id, product.id));
        }

        // Return complete product with pricing
        return res.json({
          ...product,
          price_units: insertedPricing.map(p => ({
            unit_type: p.unit_type,
            quantity: p.quantity,
            buying_price: p.buying_price.toString(),
            selling_price: p.selling_price.toString(),
            is_default: p.is_default,
          })),
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Products API
  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const productId = parseInt(req.params.id);
      const updates = req.body;

      // Check if product exists and has sales records
      const [existingProduct] = await db
        .select({
          id: products.id,
          hasSales: sql`EXISTS (SELECT 1 FROM ${saleItems} WHERE ${saleItems.productId} = ${products.id})`
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      // If product has sales, only allow updating certain fields
      if (existingProduct.hasSales) {
        const safeUpdates = {
          name: updates.name,
          category: updates.category,
          min_stock: updates.min_stock,
          max_stock: updates.max_stock,
          reorder_point: updates.reorder_point,
        };

        const [updatedProduct] = await db
          .update(products)
          .set(safeUpdates)
          .where(eq(products.id, productId))
          .returning();

        return res.json(updatedProduct);
      }

      // If no sales records, allow updating all fields
      const [updatedProduct] = await db
        .update(products)
        .set(updates)
        .where(eq(products.id, productId))
        .returning();

      res.json(updatedProduct);
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Unit Pricing endpoints
  app.post("/api/unit-pricing", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { productId, prices } = req.body;
      
      interface UnitPrice {
        unit_type: string;
        quantity: number;
        buying_price: string;
        selling_price: string;
      }
      
      const unitPrices = Object.entries(prices).map(([unit_type, pricing]: [string, any]) => ({
        productId,
        unit_type,
        quantity: (pricing as UnitPrice).quantity,
        buying_price: (pricing as UnitPrice).buying_price,
        selling_price: (pricing as UnitPrice).selling_price,
      }));

      // Delete existing prices for this product first
      await db.delete(unitPricing).where(eq(unitPricing.product_id, productId));
      
      // Insert new prices
      await db.insert(unitPricing).values(unitPrices.map(price => ({
        product_id: price.productId,
        unit_type: price.unit_type,
        quantity: price.quantity,
        buying_price: price.buying_price,
        selling_price: price.selling_price,
        is_default: false,
      })));
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
            buying_price: string;
            selling_price: string;
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
        
        const unitPrices = Object.entries(prices).map(([unit_type, pricing]) => ({
          productId,
          unit_type,
          quantity: pricing.quantity,
          buying_price: pricing.buying_price,
          selling_price: pricing.selling_price,
        }));

        // Delete existing prices for this product
        await db.delete(unitPricing).where(eq(unitPricing.product_id, productId));
        
        // Insert new prices
        await db.insert(unitPricing).values(unitPrices.map(price => ({
          product_id: price.productId,
          unit_type: price.unit_type,
          quantity: price.quantity,
          buying_price: price.buying_price,
          selling_price: price.selling_price,
          is_default: false,
        })));
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
        .where(eq(unitPricing.product_id, productId));
      
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
          product_id: productId,
          unit_type: 'piece', // Default to piece, will be updated from product data later
          quantity: 1,
          buying_price: buyingPrice,
          selling_price: sellingPrice,
          is_default: true,
        })
        .onConflictDoUpdate({
          target: [unitPricing.product_id, unitPricing.unit_type],
          set: {
            buying_price: buyingPrice,
            selling_price: sellingPrice,
            updated_at: new Date(),
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
              updated_at: new Date()
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
          purchase_order_id: purchaseOrderItems.purchaseOrderId,
          quantity: purchaseOrderItems.quantity,
          buyingPrice: purchaseOrderItems.buyingPrice,
          sellingPrice: purchaseOrderItems.sellingPrice,
          product: {
            id: products.id,
            name: products.name,
            stock_unit: products.stock_unit,
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
      // Map and validate sale items before insertion
      const validatedItems = items.map((item: SaleItemInput) => {
        if (!item.product_id) {
          throw new Error(`Invalid product ID for item: ${JSON.stringify(item)}`);
        }
        return {
          saleId: sale.id,
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price,
          unitPricingId: item.unit_pricing_id || null,
        };
      });

      console.log('Inserting sale items:', validatedItems);
      
      await db.insert(saleItems).values(validatedItems);

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
    
    // Clear existing data first
    await db.transaction(async (tx) => {
      // First remove the foreign key references
      await tx.update(products)
        .set({ default_unit_pricing_id: null });
      
      // Then delete the unit pricing entries
      await tx.delete(unitPricing);
      
      // Finally delete the products
      await tx.delete(products);
    });
    
    try {
      const demoProducts = [
        {
          name: "Rice",
          stock: 100,
          category: "Grains",
          min_stock: 20,
          max_stock: 200,
          reorder_point: 40,
          stock_unit: "per_piece" as const,
          sku: generateSKU("Rice"),
          default_unit_pricing_id: null,
          buying_price: "0",
          selling_price: "0"
        },
        {
          name: "Cooking Oil",
          stock: 50,
          category: "Cooking",
          min_stock: 10,
          max_stock: 100,
          reorder_point: 20,
          stock_unit: "per_piece" as const,
          sku: generateSKU("Cooking Oil"),
          default_unit_pricing_id: null,
          buying_price: "0",
          selling_price: "0"
        },
        {
          name: "Wheat Flour",
          stock: 80,
          category: "Baking",
          min_stock: 15,
          max_stock: 150,
          reorder_point: 30,
          stock_unit: "per_piece" as const,
          sku: generateSKU("Wheat Flour"),
          default_unit_pricing_id: null,
          buying_price: "0",
          selling_price: "0"
        }
      ];

      const insertedProducts = await db.insert(products).values(demoProducts).returning();
      
      // Add unit pricing for each product
      const unitPricingData = insertedProducts.flatMap(product => {
        const baseConfig = {
          product_id: product.id,
        };

        // Define prices based on product name
        let basePrice, sellingPrice;
        switch (product.name) {
          case "Rice":
            basePrice = "120.00";
            sellingPrice = "150.00";
            break;
          case "Cooking Oil":
            basePrice = "200.00";
            sellingPrice = "250.00";
            break;
          case "Wheat Flour":
            basePrice = "150.00";
            sellingPrice = "180.00";
            break;
          default:
            basePrice = "100.00";
            sellingPrice = "120.00";
        }

        // Create pricing entries for different units
        return [
          {
            ...baseConfig,
            unit_type: "per_piece",
            quantity: 1,
            buying_price: basePrice,
            selling_price: sellingPrice,
            is_default: true
          },
          {
            ...baseConfig,
            unit_type: "three_piece",
            quantity: 3,
            buying_price: (parseFloat(basePrice) * 2.7).toFixed(2), // 3 for price of 2.7
            selling_price: (parseFloat(sellingPrice) * 2.7).toFixed(2),
            is_default: false
          },
          {
            ...baseConfig,
            unit_type: "dozen",
            quantity: 12,
            buying_price: (parseFloat(basePrice) * 10.2).toFixed(2), // 12 for price of 10.2
            selling_price: (parseFloat(sellingPrice) * 10.2).toFixed(2),
            is_default: false
          }
        ];
      });

      // Insert unit pricing data and get the inserted records
      const insertedUnitPricing = await db.insert(unitPricing)
        .values(unitPricingData)
        .returning();

      // Update products with their default unit pricing
      for (const product of insertedProducts) {
        const defaultPricing = insertedUnitPricing.find(
          up => up.product_id === product.id && up.is_default
        );

        if (defaultPricing) {
          await db.update(products)
            .set({
              default_unit_pricing_id: defaultPricing.id,
              buying_price: defaultPricing.buying_price,
              selling_price: defaultPricing.selling_price
            })
            .where(eq(products.id, product.id));
        }
      }
      
      // Update default unit pricing IDs and prices
      await Promise.all(
        insertedProducts.map(async (product) => {
          const [defaultPricing] = await db
            .select()
            .from(unitPricing)
            .where(and(
              eq(unitPricing.product_id, product.id),
              eq(unitPricing.is_default, true)
            ))
            .limit(1);

          if (defaultPricing) {
            await db
              .update(products)
              .set({ 
                default_unit_pricing_id: defaultPricing.id,
                buying_price: defaultPricing.buying_price,
                selling_price: defaultPricing.selling_price
              })
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