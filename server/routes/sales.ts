import { Router } from "express";
import { db } from "../../db";
import { sales, saleItems, products, customers, users, loyaltyTransactions, loyaltyPoints } from "../../db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";

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

// Get paginated sales with customer and user information
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const [salesData, totalCount] = await Promise.all([
      db
        .select({
          id: sales.id,
          customerId: sales.customerId,
          total: sales.total,
          paymentMethod: sales.paymentMethod,
          paymentStatus: sales.paymentStatus,
          createdAt: sales.createdAt,
          customer: {
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
          },
          user: {
            username: users.username,
          },
        })
        .from(sales)
        .leftJoin(customers, eq(sales.customerId, customers.id))
        .leftJoin(users, eq(sales.userId, users.id))
        .orderBy(desc(sales.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sales.id }).from(sales),
    ]);

    // Add default payment status for older records
    const salesWithStatus = salesData.map(sale => ({
      ...sale,
      paymentStatus: sale.paymentStatus || 'paid'
    }));

    res.json({
      sales: salesWithStatus,
      total: totalCount.length,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

// Get sale items for a specific sale
router.get("/:id/items", async (req, res) => {
  try {
    const { id } = req.params;

    const items = await db
      .select({
        id: saleItems.id,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        price: saleItems.price,
        product: {
          name: products.name,
          sku: products.sku,
        },
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, parseInt(id)));

    // Calculate total for each item
    const itemsWithTotal = items.map(item => ({
      ...item,
      total: (Number(item.price) * item.quantity).toString(),
    }));

    res.json(itemsWithTotal);
  } catch (error) {
    console.error("Error fetching sale items:", error);
    res.status(500).json({ error: "Failed to fetch sale items" });
  }
});

// POST /api/sales - Create new sale
router.post("/", async (req, res) => {
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

    // Get product details for receipt
    const productDetails = await Promise.all(
      items.map(async (item: any) => {
        const [product] = await db
          .select({
            id: products.id,
            name: products.name,
            sku: products.sku,
          })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);
        return {
          ...item,
          name: product?.name || 'Unknown Product',
          sku: product?.sku || 'N/A',
        };
      })
    );

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

    // Prepare receipt data with proper type handling and validation
    const receipt = {
      id: sale.id,
      items: productDetails.map(item => ({
        name: item.name || 'Unknown Product',
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.price) || 0,
        total: (Number(item.quantity) * Number(item.price)) || 0,
      })),
      customer: customerData ? {
        name: customerData.name || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
      } : undefined,
      total: Number(total) || 0,
      paymentMethod: paymentMethod || 'cash',
      timestamp: sale.createdAt?.toISOString() || new Date().toISOString(),
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

// Get sales summary by payment method for a period
router.get("/summary", async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    let startDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        startDate = startOfDay(now);
    }

    const result = await db
      .select({
        paymentMethod: sales.paymentMethod,
        total: sql<string>`sum(${sales.total})::text`,
      })
      .from(sales)
      .where(
        and(
          gte(sales.createdAt, startDate),
          lte(sales.createdAt, endOfDay(now))
        )
      )
      .groupBy(sales.paymentMethod);

    // Transform the data into summary format
    const summary = {
      mpesa: 0,
      cash: 0,
      total: 0,
    };

    result.forEach((row) => {
      const amount = Number(row.total) || 0;
      if (row.paymentMethod === 'mpesa') {
        summary.mpesa = amount;
      } else if (row.paymentMethod === 'cash') {
        summary.cash = amount;
      }
    });

    summary.total = summary.mpesa + summary.cash;
    res.json(summary);
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    res.status(500).json({ error: "Failed to fetch sales summary" });
  }
});

export default router;