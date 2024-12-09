import { Router } from "express";
import { db } from "../../db";
import { sales, saleItems, products, customers, users, loyaltyTransactions } from "../../db/schema";
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
        unitPrice: saleItems.price,
        total: saleItems.price,
        product: {
          name: products.name,
          sku: products.sku,
        },
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, parseInt(id)));

    // Calculate total with quantity
    const itemsWithTotal = items.map(item => ({
      ...item,
      total: (Number(item.unitPrice) * item.quantity).toString(),
    }));

    res.json(itemsWithTotal);
  } catch (error) {
    console.error("Error fetching sale items:", error);
    res.status(500).json({ error: "Failed to fetch sale items" });
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

// Get sales data by payment method and period
router.get("/chart", async (req, res) => {
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
        date: sales.createdAt,
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
      .groupBy(sales.createdAt, sales.paymentMethod)
      .orderBy(sales.createdAt);

    // Transform the data for the chart
    const salesByDate = new Map();
    
    result.forEach((row) => {
      if (!row.date) return; // Skip if date is null
      const date = row.date.toISOString();
      if (!salesByDate.has(date)) {
        salesByDate.set(date, {
          date,
          mpesa: 0,
          cash: 0,
          total: 0,
        });
      }
      
      const entry = salesByDate.get(date);
      const amount = Number(row.total) || 0;
      
      if (row.paymentMethod === 'mpesa') {
        entry.mpesa = amount;
      } else if (row.paymentMethod === 'cash') {
        entry.cash = amount;
      }
      
      entry.total = entry.mpesa + entry.cash;
    });

    res.json(Array.from(salesByDate.values()));
  } catch (error) {
    console.error("Error fetching sales chart data:", error);
    res.status(500).json({ error: "Failed to fetch sales chart data" });
  }
});

// Add receipt sending endpoint
router.post("/:id/receipt/send", async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body; // 'whatsapp' or 'sms'
    
    // Get sale details including customer phone
    const sale = await db
      .select({
        id: sales.id,
        total: sales.total,
        customer: {
          phone: customers.phone,
          name: customers.name
        }
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.id, parseInt(id)))
      .limit(1);

    if (!sale[0]?.customer?.phone) {
      return res.status(400).json({ error: "Customer phone number not found" });
    }

    // Format receipt message
    const receiptText = `Thank you for your purchase!
Total: ${sale[0].total}
Transaction ID: ${sale[0].id}`;

    // Send via selected method
    if (method === 'whatsapp') {
      // TODO: Integrate with WhatsApp Business API
      // For now, simulate success
      console.log('Sending via WhatsApp:', receiptText);
    } else if (method === 'sms') {
      // TODO: Integrate with SMS API
      // For now, simulate success
      console.log('Sending via SMS:', receiptText);
    }

    res.json({ success: true, message: `Receipt sent via ${method}` });
  } catch (error) {
    console.error('Error sending receipt:', error);
    res.status(500).json({ error: "Failed to send receipt" });
  }
});

// Get sale receipt
router.get("/:id/receipt", async (req, res) => {
  try {
    const { id } = req.params;

    // Get sale details with customer info
    const [sale] = await db
      .select({
        id: sales.id,
        total: sales.total,
        paymentMethod: sales.paymentMethod,
        createdAt: sales.createdAt,
        customer: {
          name: customers.name,
          phone: customers.phone,
          email: customers.email,
        }
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.id, parseInt(id)))
      .limit(1);

    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    // Get sale items with product details
    const items = await db
      .select({
        name: products.name,
        quantity: saleItems.quantity,
        unitPrice: saleItems.price,
        total: sql<string>`(${saleItems.quantity} * ${saleItems.price})::text`,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, parseInt(id)));

    // Format receipt data
    const receipt = {
      id: sale.id,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      customer: sale.customer?.name ? {
        name: sale.customer.name,
        phone: sale.customer.phone,
        email: sale.customer.email,
      } : undefined,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      timestamp: sale.createdAt,
      transactionId: `TXN-${sale.id}`,
    };

    res.json(receipt);
  } catch (error) {
    console.error("Error generating receipt:", error);
    res.status(500).json({ error: "Failed to generate receipt" });
  }
});
export default router; 