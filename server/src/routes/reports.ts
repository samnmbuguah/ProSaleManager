import { Router } from "express";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Category from "../models/Category.js";
import Store from "../models/Store.js";
import User from "../models/User.js";
import { Op } from "sequelize";
import { storeScope } from "../utils/helpers.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import { requireAuth, attachStoreIdToUser } from "../middleware/auth.middleware.js";
import Expense from "../models/Expense.js";

const router = Router();

// Helper functions for date calculations
function toNairobiTime(date: Date): Date {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000);
}

function getMondayNairobi(date: Date): Date {
  const nairobi = toNairobiTime(date);
  const day = nairobi.getDay();
  const diff = nairobi.getDate() - day + (day === 0 ? -6 : 1);
  const mondayNairobi = new Date(nairobi);
  mondayNairobi.setDate(diff);
  mondayNairobi.setHours(0, 0, 0, 0);
  // Convert back to UTC for DB query
  return new Date(mondayNairobi.getTime() - 3 * 60 * 60 * 1000);
}

function getFirstDayOfMonthNairobi(date: Date): Date {
  const nairobi = toNairobiTime(date);
  const firstDay = new Date(nairobi.getFullYear(), nairobi.getMonth(), 1, 0, 0, 0, 0);
  return new Date(firstDay.getTime() - 3 * 60 * 60 * 1000);
}

function getFirstDayOfNextMonthNairobi(date: Date): Date {
  const nairobi = toNairobiTime(date);
  const firstDayNextMonth = new Date(nairobi.getFullYear(), nairobi.getMonth() + 1, 1, 0, 0, 0, 0);
  return new Date(firstDayNextMonth.getTime() - 3 * 60 * 60 * 1000);
}

// Helper to fetch sales summary for a period
async function getSummary(
  req: { user?: { role: string; store_id?: number | null } },
  start: Date | undefined,
  end: Date | undefined
) {
  const dateFilter: Record<string, unknown> = {};
  if (start && end) {
    dateFilter.createdAt = { [Op.gte]: start, [Op.lt]: end };
  }
  const sales = (await Sale.findAll({
    where: storeScope(req.user!, {
      status: "completed",
      ...dateFilter,
    }),
    include: [
      {
        model: SaleItem,
        as: "items",
      },
    ],
  })) as Array<Sale & { items?: SaleItem[] }>;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce(
    (sum, sale) => sum + parseFloat(String(sale.total_amount || "0")),
    0,
  );
  const totalItems = sales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0);
  const paymentMethods = sales.reduce(
    (acc, sale) => {
      const method = sale.payment_method || "unknown";
      acc[method] = (acc[method] || 0) + parseFloat(String(sale.total_amount || 0));
      return acc;
    },
    {} as Record<string, number>,
  );
  // Group by day
  const salesByDay: Record<string, number> = {};
  sales.forEach((sale) => {
    const date = sale.createdAt.toISOString().slice(0, 10);
    salesByDay[date] = (salesByDay[date] || 0) + parseFloat(String(sale.total_amount || 0));
  });
  return {
    totalSales,
    totalRevenue,
    totalItems,
    paymentMethods,
    salesByDay,
  };
}

// Get inventory status report
router.get(
  "/inventory",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      const {
        search,
        category,
        stockStatus,
        minPrice,
        maxPrice,
        startDate,
        endDate
      } = req.query;

      // Build base where clause
      const where: Record<string, any> = storeScope(req.user!, { is_active: true });

      // Add category filter
      if (category && category !== "all") {
        where.category_id = category;
      }

      // Add price range filter
      if (minPrice || maxPrice) {
        where.piece_selling_price = {};
        if (minPrice) where.piece_selling_price[Op.gte] = parseFloat(minPrice as string);
        if (maxPrice) where.piece_selling_price[Op.lte] = parseFloat(maxPrice as string);
      }

      // Add date range filter
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const products = await Product.findAll({
        where,
        include: [
          {
            model: Category,
            attributes: ["id", "name"],
          },
        ],
        order: [["name", "ASC"]],
      });

      let inventoryData = products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category_id: product.category_id,
        category_name: (product as any).Category?.name || "Unknown",
        piece_selling_price: product.piece_selling_price,
        piece_buying_price: product.piece_buying_price,
        pack_selling_price: product.pack_selling_price,
        dozen_selling_price: product.dozen_selling_price,
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        is_active: product.is_active,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      }));

      // Apply search filter (client-side for now, could be moved to database)
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        inventoryData = inventoryData.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm)
        );
      }

      // Apply stock status filter
      if (stockStatus && stockStatus !== "all") {
        switch (stockStatus) {
          case "instock":
            inventoryData = inventoryData.filter((p) => (p.quantity || 0) >= (p.min_quantity || 10));
            break;
          case "lowstock":
            inventoryData = inventoryData.filter((p) => (p.quantity || 0) > 0 && (p.quantity || 0) < (p.min_quantity || 10));
            break;
          case "outofstock":
            inventoryData = inventoryData.filter((p) => (p.quantity || 0) <= 0);
            break;
        }
      }

      const totalValue = inventoryData.reduce((sum, product) => {
        return sum + (product.piece_buying_price || 0) * (product.quantity || 0);
      }, 0);

      res.json({
        success: true,
        data: {
          products: inventoryData,
          totalValue,
          totalProducts: inventoryData.length,
          lowStockProducts: inventoryData.filter((p) => (p.quantity || 0) < (p.min_quantity || 10))
            .length,
          outOfStockProducts: inventoryData.filter((p) => (p.quantity || 0) <= 0).length,
        },
      });
    } catch (error) {
      console.error("Error fetching inventory report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inventory report",
      });
    }
  },
);

// Get product performance report
router.get(
  "/product-performance",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        sortBy,
        category,
        paymentMethod,
        minPrice,
        maxPrice
      } = req.query;

      // Build date filter
      const dateFilter: Record<string, unknown> = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      // Build payment method filter
      const paymentFilter: Record<string, unknown> = {};
      if (paymentMethod && paymentMethod !== "all") {
        paymentFilter.payment_method = paymentMethod;
      }

      // Get sales with items and products
      const sales = (await Sale.findAll({
        where: storeScope(req.user!, {
          status: "completed",
          ...dateFilter,
          ...paymentFilter,
        }),
        include: [
          {
            model: SaleItem,
            as: "items",
            include: [
              {
                model: Product,
                include: [
                  {
                    model: Category,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      })) as Array<
        Sale & {
          items?: Array<SaleItem & {
            Product?: {
              name?: string;
              sku?: string;
              Category?: { id?: number; name?: string };
            }
          }>;
        }
      >;

      // Aggregate product performance data
      const productPerformanceMap = new Map<number, {
        productId: number;
        productName: string;
        productSku: string;
        categoryId: number | null;
        categoryName: string;
        quantity: number;
        revenue: number;
        profit: number;
        lastSold: Date | null;
        averagePrice: number;
        totalSales: number;
      }>();

      sales.forEach((sale) => {
        sale.items?.forEach((item) => {
          const productId = item.product_id;
          const product = item.Product;

          // Apply category filter
          if (category && category !== "all") {
            const categoryId = (product as any)?.Category?.id;
            if (!categoryId || categoryId.toString() !== category) {
              return;
            }
          }

          if (!productPerformanceMap.has(productId)) {
            productPerformanceMap.set(productId, {
              productId,
              productName: product?.name || "Unknown Product",
              productSku: product?.sku || "N/A",
              categoryId: (product as any)?.Category?.id || null,
              categoryName: (product as any)?.Category?.name || "Unknown",
              quantity: 0,
              revenue: 0,
              profit: 0,
              lastSold: null,
              averagePrice: 0,
              totalSales: 0,
            });
          }

          const performance = productPerformanceMap.get(productId);
          if (!performance) return;

          const quantity = parseFloat(String(item.quantity)) || 0;
          const total = parseFloat(String(item.total)) || 0;

          performance.quantity += quantity;
          performance.revenue += total;
          performance.totalSales += 1;
          performance.averagePrice = performance.revenue / performance.quantity;

          // Calculate profit (assuming 20% margin for demo)
          const profit = total * 0.2;
          performance.profit += profit;

          // Update last sold date
          const saleDate = new Date(sale.createdAt as Date);
          if (!performance.lastSold || saleDate > new Date(performance.lastSold)) {
            performance.lastSold = saleDate;
          }
        });
      });

      let productPerformance = Array.from(productPerformanceMap.values()) as Array<{
        productId: number;
        productName: string;
        productSku: string;
        categoryId: number | null;
        categoryName: string;
        quantity: number;
        revenue: number;
        profit: number;
        lastSold: Date | null;
        averagePrice: number;
        totalSales: number;
      }>;

      // Apply price range filter
      if (minPrice || maxPrice) {
        productPerformance = productPerformance.filter((product) => {
          const price = product.averagePrice;
          if (minPrice && price < parseFloat(minPrice as string)) return false;
          if (maxPrice && price > parseFloat(maxPrice as string)) return false;
          return true;
        });
      }

      // Sorting logic
      if (sortBy === "profit") {
        productPerformance.sort((a, b) => b.profit - a.profit);
      } else if (sortBy === "quantity") {
        productPerformance.sort((a, b) => b.quantity - a.quantity);
      } else if (sortBy === "lastSold") {
        productPerformance.sort((a, b) => {
          if (!a.lastSold && !b.lastSold) return 0;
          if (!a.lastSold) return 1;
          if (!b.lastSold) return -1;
          return new Date(b.lastSold).getTime() - new Date(a.lastSold).getTime();
        });
      } else {
        // Default to revenue
        productPerformance.sort((a, b) => b.revenue - a.revenue);
      }

      // Calculate totals
      const totalRevenue = productPerformance.reduce((sum, p) => sum + p.revenue, 0);
      const totalProfit = productPerformance.reduce((sum, p) => sum + p.profit, 0);
      const totalQuantity = productPerformance.reduce((sum, p) => sum + p.quantity, 0);

      res.json({
        success: true,
        data: {
          products: productPerformance,
          summary: {
            totalRevenue,
            totalProfit,
            totalQuantity,
            totalProducts: productPerformance.length,
            averageRevenue: totalRevenue / productPerformance.length || 0,
            averageProfit: totalProfit / productPerformance.length || 0,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching product performance report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch product performance report",
      });
    }
  },
);

// Get sales summary report
router.get(
  "/sales-summary",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      const { startDate, endDate, period } = req.query;
      const now = new Date();
      let start: Date | undefined, end: Date | undefined, compareStart: Date | undefined, compareEnd: Date | undefined;
      // Determine period
      if (period === "today") {
        const nairobi = toNairobiTime(now);
        const startNairobi = new Date(nairobi.getFullYear(), nairobi.getMonth(), nairobi.getDate(), 0, 0, 0, 0);
        const endNairobi = new Date(nairobi.getFullYear(), nairobi.getMonth(), nairobi.getDate() + 1, 0, 0, 0, 0);
        start = new Date(startNairobi.getTime() - 3 * 60 * 60 * 1000);
        end = new Date(endNairobi.getTime() - 3 * 60 * 60 * 1000);
        compareStart = new Date(startNairobi.getTime() - 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);
        compareEnd = start;
      } else if (period === "this_week") {
        start = getMondayNairobi(now);
        const nextMonday = new Date(start);
        nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
        end = nextMonday;
        compareStart = new Date(start);
        compareStart.setUTCDate(compareStart.getUTCDate() - 7);
        compareEnd = start;
      } else if (period === "last_week") {
        end = getMondayNairobi(now);
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 7);
        compareEnd = start;
        compareStart = new Date(start);
        compareStart.setUTCDate(compareStart.getUTCDate() - 7);
      } else if (period === "this_month") {
        start = getFirstDayOfMonthNairobi(now);
        end = getFirstDayOfNextMonthNairobi(now);
        compareStart = getFirstDayOfMonthNairobi(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        compareEnd = getFirstDayOfNextMonthNairobi(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      } else if (period === "last_month") {
        end = getFirstDayOfMonthNairobi(now);
        start = getFirstDayOfMonthNairobi(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        compareEnd = start;
        compareStart = getFirstDayOfMonthNairobi(new Date(now.getFullYear(), now.getMonth() - 2, 1));
      } else if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      }
      // Fetch current and comparison period summaries
      const current = await getSummary(req, start, end);
      const compare = compareStart && compareEnd ? await getSummary(req, compareStart, compareEnd) : null;
      res.json({
        success: true,
        data: {
          current,
          compare,
        },
      });
    } catch (error) {
      console.error("Error fetching sales summary report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch sales summary report",
      });
    }
  },
);

// Get expenses summary report
router.get(
  "/expenses-summary",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        category,
        paymentMethod
      } = req.query;

      const dateFilter: Record<string, unknown> = {};
      if (startDate && endDate) {
        dateFilter.date = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const where: Record<string, any> = storeScope(req.user!, { ...dateFilter });

      // Add category filter
      if (category && category !== "all") {
        where.category = category;
      }

      // Add payment method filter
      if (paymentMethod && paymentMethod !== "all") {
        where.payment_method = paymentMethod;
      }

      const expenses = await Expense.findAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name"],
          },
        ],
        order: [["date", "DESC"]],
      });

      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(String(exp.amount || 0)), 0);

      // Calculate category breakdown
      const categoryMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach((expense) => {
        const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
        categoryMap.set(expense.category, {
          amount: existing.amount + parseFloat(String(expense.amount || 0)),
          count: existing.count + 1,
        });
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      })).sort((a, b) => b.amount - a.amount);

      res.json({
        success: true,
        data: {
          expenses: expenses.map(expense => ({
            id: expense.id,
            description: expense.description,
            amount: parseFloat(String(expense.amount || 0)),
            category: expense.category,
            date: expense.date,
            payment_method: expense.payment_method,
            user: (expense as any).user,
          })),
          totalExpenses,
          count: expenses.length,
          categoryBreakdown,
        },
      });
    } catch (error) {
      console.error("Error fetching expenses summary report:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch expenses summary report",
      });
    }
  },
);

// Export inventory to CSV
router.get(
  "/inventory/export",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      // Get all products with categories and store information
      const products = await Product.findAll({
        where: storeScope(req.user!),
        include: [
          {
            model: Category,
            as: "Category",
            attributes: ["name"],
          },
          {
            model: Store,
            as: "Store",
            attributes: ["name"],
          },
        ],
        order: [["name", "ASC"]],
      });

      // Create CSV header
      const headers = [
        "ID",
        "Product Name",
        "SKU",
        "Description",
        "Piece Selling Price",
        "Piece Buying Price",
        "Pack Selling Price",
        "Pack Buying Price",
        "Dozen Selling Price",
        "Dozen Buying Price",
        "Current Quantity",
        "Min Quantity",
        "Stock Unit",
        "Image URL",
        "Is Active",
        "Category",
        "Store",
        "Created At",
        "Updated At"
      ];

      // Create CSV content
      let csvContent = headers.join(",") + "\n";

      products.forEach((product: any) => {
        const csvRow = [
          product.id,
          `"${(product.name || "").replace(/"/g, '""')}"`, // Escape quotes
          `"${(product.sku || "").replace(/"/g, '""')}"`,
          `"${(product.description || "").replace(/"/g, '""')}"`,
          product.piece_selling_price || 0,
          product.piece_buying_price || 0,
          product.pack_selling_price || 0,
          product.pack_buying_price || 0,
          product.dozen_selling_price || 0,
          product.dozen_buying_price || 0,
          product.quantity || 0,
          product.min_quantity || 0,
          `"${(product.stock_unit || "").replace(/"/g, '""')}"`,
          `"${(product.image_url || "").replace(/"/g, '""')}"`,
          product.is_active ? "Yes" : "No",
          `"${(product.Category?.name || "").replace(/"/g, '""')}"`,
          `"${(product.Store?.name || "").replace(/"/g, '""')}"`,
          product.createdAt || "",
          product.updatedAt || ""
        ];
        csvContent += csvRow.join(",") + "\n";
      });

      // Set response headers for CSV download
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `inventory-export-${timestamp}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-cache");

      // Send CSV content
      res.send(csvContent);

    } catch (error) {
      console.error("Error exporting inventory to CSV:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export inventory to CSV",
      });
    }
  },
);

export default router;
