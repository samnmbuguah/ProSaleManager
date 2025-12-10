import { Router } from "express";
import { Op } from "sequelize";
import * as XLSX from "xlsx";
import { sequelize } from "../config/database.js";
import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Category from "../models/Category.js";
import Store from "../models/Store.js";
import User from "../models/User.js";
import { storeScope } from "../utils/helpers.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import { requireAuth, attachStoreIdToUser, requireRole } from "../middleware/auth.middleware.js";
import Expense from "../models/Expense.js";
import StockTakeSession from "../models/StockTakeSession.js";
import StockTakeItem, { StockTakeItemInstance } from "../models/StockTakeItem.js";
import { notifyAdminsOfStockTake } from "../services/notification.service.js";

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

// Export stock take CSV
router.get(
  "/stock-take/export",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      // Get all products with categories and store information
      const products = await Product.findAll({
        where: storeScope(req.user!, { is_active: true }),
        include: [
          {
            model: Category,
            as: "Category",
            attributes: ["name"],
          },
        ],
        order: [["name", "ASC"]],
      });

      // Create CSV header for stock take
      const headers = [
        "Product Name",
        "SKU",
        "Category",
        "Current Quantity",
        "New Quantity",
        "Variance",
        "Notes"
      ];

      // Create CSV content
      let csvContent = headers.join(",") + "\n";

      products.forEach((product: any) => {
        const csvRow = [
          `"${(product.name || "").replace(/"/g, '""')}"`, // Escape quotes
          `"${(product.sku || "").replace(/"/g, '""')}"`,
          `"${(product.Category?.name || "").replace(/"/g, '""')}"`,
          product.quantity || 0,
          "", // Empty for user to fill in
          "", // Will be calculated as New Quantity - Current Quantity
          "" // Empty for user notes
        ];
        csvContent += csvRow.join(",") + "\n";
      });

      // Set response headers for CSV download
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `stock-take-${timestamp}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-cache");

      // Send CSV content
      res.send(csvContent);

    } catch (error) {
      console.error("Error exporting stock take to CSV:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export stock take to CSV",
      });
    }
  },
);

// Import stock take CSV and calculate variance
router.post(
  "/stock-take/import",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      const { stockTakeData } = req.body; // Array of {sku, newQuantity, notes}

      if (!Array.isArray(stockTakeData)) {
        return res.status(400).json({
          success: false,
          message: "Invalid stock take data format",
        });
      }

      const varianceResults = [];
      const products = await Product.findAll({
        where: storeScope(req.user!, { is_active: true }),
        include: [
          {
            model: Category,
            as: "Category",
            attributes: ["name"],
          },
        ],
      });

      // Create a map for quick product lookup
      const productMap = new Map();
      products.forEach((product: any) => {
        productMap.set(product.sku, product);
      });

      for (const item of stockTakeData) {
        const { sku, newQuantity, notes } = item;
        const product = productMap.get(sku);

        if (product) {
          const currentQuantity = product.quantity || 0;
          const variance = (newQuantity || 0) - currentQuantity;

          varianceResults.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            category: product.Category?.name || "Unknown",
            currentQuantity,
            newQuantity: newQuantity || 0,
            variance,
            notes: notes || "",
            variancePercentage: currentQuantity > 0 ? ((variance / currentQuantity) * 100).toFixed(2) : 0
          });
        }
      }

      // Calculate summary statistics
      const totalVariance = varianceResults.reduce((sum, item) => sum + item.variance, 0);
      const positiveVariance = varianceResults.filter(item => item.variance > 0).length;
      const negativeVariance = varianceResults.filter(item => item.variance < 0).length;
      const noVariance = varianceResults.filter(item => item.variance === 0).length;

      res.json({
        success: true,
        data: {
          varianceResults,
          summary: {
            totalProducts: varianceResults.length,
            totalVariance,
            positiveVariance,
            negativeVariance,
            noVariance,
            averageVariance: varianceResults.length > 0 ? (totalVariance / varianceResults.length).toFixed(2) : 0
          }
        },
      });

    } catch (error) {
      console.error("Error processing stock take import:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process stock take import",
      });
    }
  },
);

// Cashier submits stock take counts (no inventory mutation)
router.post(
  "/stock-take/submit",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    const { items, notes } = req.body as {
      items?: Array<{ productId: number; countedQuantity: number; note?: string }>;
      notes?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock take payload. Provide items with productId and countedQuantity.",
      });
    }

    const validItems = items.filter(
      (item) => typeof item.productId === "number" && typeof item.countedQuantity === "number",
    );
    if (validItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items found. Ensure productId and countedQuantity are numbers.",
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found." });
    }

    const storeId = req.user.store_id ?? req.store?.id;
    if (!storeId) {
      return res.status(400).json({ success: false, message: "Store context is required." });
    }

    const productIds = validItems.map((item) => item.productId);
    const products = await Product.findAll({
      where: {
        ...storeScope(req.user, { id: { [Op.in]: productIds } }),
        store_id: storeId,
      },
      include: [{ model: Category, attributes: ["name"] }],
    });
    const productMap = new Map(products.map((p) => [p.id!, p]));

    const missing = productIds.filter((id) => !productMap.has(id));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Products not found or not in your store: ${missing.join(", ")}`,
      });
    }

    const transaction = await sequelize.transaction();
    try {
      const session = await StockTakeSession.create(
        {
          store_id: storeId,
          submitted_by: req.user.id,
          status: "pending",
          notes: notes || null,
        },
        { transaction },
      );

      const itemsToCreate = validItems.map((item) => {
        const product = productMap.get(item.productId)!;
        const systemQty = product.quantity || 0;
        const countedQty = Number(item.countedQuantity || 0);
        const variance = countedQty - systemQty;
        return {
          session_id: session.id!,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          category_name: (product as any).Category?.name || null,
          system_quantity: systemQty,
          counted_quantity: countedQty,
          variance,
          notes: item.note || null,
        };
      });

      await StockTakeItem.bulkCreate(itemsToCreate, { transaction });
      await transaction.commit();

      // Notify admins/managers for this store
      await notifyAdminsOfStockTake(req.user.store_id, {
        title: "New stock take submitted",
        message: `Stock take #${session.id} is awaiting review (${itemsToCreate.length} items).`,
        data: { sessionId: session.id, storeId },
        type: "stock_take",
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          itemsCount: itemsToCreate.length,
          status: session.status,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error submitting stock take:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit stock take",
      });
    }
  },
);

// Admin view pending stock takes with variance
router.get(
  "/stock-take/pending",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  requireRole(["admin", "manager", "super_admin"]),
  async (req, res) => {
    const storeFilter = req.store?.id ? { store_id: req.store.id } : {};
    const sessions = await StockTakeSession.findAll({
      where: storeScope(req.user!, { status: "pending", ...storeFilter }),
      include: [
        { model: StockTakeItem, as: "items" },
        { model: User, as: "submittedBy", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const summary = sessions.reduce(
      (acc, session) => {
        const items = (session as any).items || [];
        acc.totalSessions += 1;
        acc.totalItems += items.length;
        acc.totalVariance += items.reduce(
          (sum: number, i: StockTakeItemInstance) => sum + i.variance,
          0,
        );
        return acc;
      },
      { totalSessions: 0, totalItems: 0, totalVariance: 0 },
    );

    res.json({
      success: true,
      data: {
        sessions,
        summary,
      },
    });
  },
);

// Approve/apply a stock take (admin)
router.post(
  "/stock-take/:id/approve",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  requireRole(["admin", "manager", "super_admin"]),
  async (req, res) => {
    const { notes } = req.body as { notes?: string };
    const storeFilter = req.store?.id ? { store_id: req.store.id } : {};
    const session = await StockTakeSession.findOne({
      where: storeScope(req.user!, { id: req.params.id, ...storeFilter }),
      include: [{ model: StockTakeItem, as: "items" }],
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Stock take session not found" });
    }
    if (session.status !== "pending") {
      return res.status(400).json({ success: false, message: "Stock take already processed" });
    }

    const transaction = await sequelize.transaction();
    try {
      const items = (session as any).items as StockTakeItemInstance[];
      for (const item of items) {
        if (!item.product_id) continue;
        await Product.update(
          { quantity: item.counted_quantity },
          { where: storeScope(req.user!, { id: item.product_id, ...storeFilter }), transaction },
        );
      }

      await session.update(
        {
          status: "applied",
          reviewed_by: req.user!.id,
          reviewed_at: new Date(),
          notes: notes ?? session.notes,
        },
        { transaction },
      );

      await transaction.commit();
      res.json({
        success: true,
        data: { sessionId: session.id, updated: (items || []).length },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error applying stock take:", error);
      res.status(500).json({ success: false, message: "Failed to apply stock take" });
    }
  },
);

// Reject a stock take (admin)
router.post(
  "/stock-take/:id/reject",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  requireRole(["admin", "manager", "super_admin"]),
  async (req, res) => {
    const { notes } = req.body as { notes?: string };
    const storeFilter = req.store?.id ? { store_id: req.store.id } : {};
    const session = await StockTakeSession.findOne({
      where: storeScope(req.user!, { id: req.params.id, ...storeFilter }),
    });
    if (!session) {
      return res.status(404).json({ success: false, message: "Stock take session not found" });
    }
    if (session.status !== "pending") {
      return res.status(400).json({ success: false, message: "Stock take already processed" });
    }

    await session.update({
      status: "rejected",
      reviewed_by: req.user!.id,
      reviewed_at: new Date(),
      notes: notes ?? session.notes,
    });

    res.json({ success: true, data: { sessionId: session.id, status: session.status } });
  },
);

// Apply stock take updates - bulk update quantities
router.post(
  "/stock-take/apply",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  requireRole(["admin", "manager", "super_admin"]),
  async (req, res) => {
    try {
      const { updates } = req.body; // Array of { productId, newQuantity, notes? }

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid updates data format. Expected array of { productId, newQuantity }",
        });
      }

      const storeId = req.user!.store_id;
      const results = {
        updated: 0,
        failed: 0,
        failedProducts: [] as { productId: number; reason: string }[],
      };

      // Get all products for this store to validate
      const products = await Product.findAll({
        where: storeScope(req.user!, { is_active: true }),
      });
      const productMap = new Map<number, typeof products[0]>();
      products.forEach((p) => productMap.set(p.id!, p));

      // Process updates
      for (const update of updates) {
        const { productId, newQuantity } = update;

        if (typeof productId !== 'number' || typeof newQuantity !== 'number') {
          results.failed++;
          results.failedProducts.push({
            productId,
            reason: "Invalid productId or newQuantity",
          });
          continue;
        }

        const product = productMap.get(productId);
        if (!product) {
          results.failed++;
          results.failedProducts.push({
            productId,
            reason: "Product not found or not in your store",
          });
          continue;
        }

        try {
          await Product.update(
            { quantity: newQuantity },
            { where: { id: productId, store_id: product.store_id } }
          );
          results.updated++;
        } catch (err) {
          results.failed++;
          results.failedProducts.push({
            productId,
            reason: "Database update failed",
          });
        }
      }

      res.json({
        success: true,
        data: {
          totalProcessed: updates.length,
          updated: results.updated,
          failed: results.failed,
          failedProducts: results.failedProducts,
        },
      });

    } catch (error) {
      console.error("Error applying stock take updates:", error);
      res.status(500).json({
        success: false,
        message: "Failed to apply stock take updates",
      });
    }
  },
);

// Enhanced export endpoint with multiple formats
router.get(
  "/export/:type/:format",
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  async (req, res) => {
    try {
      const { type, format } = req.params;
      const {
        search,
        category,
        stockStatus,
        minPrice,
        maxPrice,
        startDate,
        endDate
      } = req.query;

      // Build where clause for filtering
      const where: Record<string, any> = storeScope(req.user!, { is_active: true });

      if (category && category !== "all") {
        where.category_id = category;
      }

      if (minPrice || maxPrice) {
        where.piece_selling_price = {};
        if (minPrice) where.piece_selling_price[Op.gte] = parseFloat(minPrice as string);
        if (maxPrice) where.piece_selling_price[Op.lte] = parseFloat(maxPrice as string);
      }

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
            as: "Category",
            attributes: ["name"],
          },
        ],
        order: [["name", "ASC"]],
      });

      let filteredProducts = products.map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.Category?.name || "Unknown",
        piece_selling_price: product.piece_selling_price,
        piece_buying_price: product.piece_buying_price,
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        is_active: product.is_active,
        created_at: product.createdAt,
      }));

      // Apply additional filters
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm)
        );
      }

      if (stockStatus && stockStatus !== "all") {
        switch (stockStatus) {
          case "instock":
            filteredProducts = filteredProducts.filter((p) => (p.quantity || 0) >= (p.min_quantity || 10));
            break;
          case "lowstock":
            filteredProducts = filteredProducts.filter((p) => (p.quantity || 0) > 0 && (p.quantity || 0) < (p.min_quantity || 10));
            break;
          case "outofstock":
            filteredProducts = filteredProducts.filter((p) => (p.quantity || 0) <= 0);
            break;
        }
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

      if (format === 'excel') {
        // Create Excel workbook
        const workbook = XLSX.utils.book_new();

        if (type === 'inventory') {
          const worksheetData = filteredProducts.map(product => ({
            'Product Name': product.name,
            'SKU': product.sku,
            'Category': product.category,
            'Selling Price': product.piece_selling_price || 0,
            'Buying Price': product.piece_buying_price || 0,
            'Current Quantity': product.quantity || 0,
            'Min Quantity': product.min_quantity || 0,
            'Status': product.is_active ? 'Active' : 'Inactive',
            'Created Date': new Date(product.created_at).toLocaleDateString()
          }));

          const worksheet = XLSX.utils.json_to_sheet(worksheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
        } else if (type === 'stock-take') {
          const worksheetData = filteredProducts.map(product => ({
            'Product Name': product.name,
            'SKU': product.sku,
            'Category': product.category,
            'Current Quantity': product.quantity || 0,
            'New Quantity': '',
            'Variance': '',
            'Notes': ''
          }));

          const worksheet = XLSX.utils.json_to_sheet(worksheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Take');
        }

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${type}-export-${timestamp}.xlsx"`);
        res.send(excelBuffer);

      } else if (format === 'pdf') {
        // For PDF, we'll return a simple text-based response
        // In a real implementation, you might use a PDF library like jsPDF or pdfkit
        const pdfContent = `
INVENTORY REPORT
Generated: ${new Date().toLocaleString()}
Total Products: ${filteredProducts.length}

${filteredProducts.map(product =>
          `${product.name} (${product.sku}) - Qty: ${product.quantity} - Price: KSh ${product.piece_selling_price || 0}`
        ).join('\n')}
        `;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${type}-export-${timestamp}.pdf"`);
        res.send(pdfContent);

      } else {
        // Default to CSV
        const headers = type === 'inventory'
          ? ["Product Name", "SKU", "Category", "Selling Price", "Buying Price", "Current Quantity", "Min Quantity", "Status"]
          : ["Product Name", "SKU", "Category", "Current Quantity", "New Quantity", "Variance", "Notes"];

        let csvContent = headers.join(",") + "\n";

        filteredProducts.forEach((product) => {
          const csvRow = type === 'inventory'
            ? [
              `"${product.name.replace(/"/g, '""')}"`,
              `"${product.sku.replace(/"/g, '""')}"`,
              `"${product.category.replace(/"/g, '""')}"`,
              product.piece_selling_price || 0,
              product.piece_buying_price || 0,
              product.quantity || 0,
              product.min_quantity || 0,
              product.is_active ? "Active" : "Inactive"
            ]
            : [
              `"${product.name.replace(/"/g, '""')}"`,
              `"${product.sku.replace(/"/g, '""')}"`,
              `"${product.category.replace(/"/g, '""')}"`,
              product.quantity || 0,
              "",
              "",
              ""
            ];
          csvContent += csvRow.join(",") + "\n";
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${type}-export-${timestamp}.csv"`);
        res.send(csvContent);
      }

    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export data",
      });
    }
  },
);

export default router;
