import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Op } from "sequelize";
import { Product, Sale, SaleItem } from "../../models/index.js";

export interface AgentToolContext {
  storeId: number | null;
  userId: number;
  role: string;
}

export const salesPeriodSchema = z.object({
  period: z.enum(["today", "week", "month", "year"]).default("week"),
});

export const inventoryInputSchema = z.object({
  lowStockOnly: z.boolean().default(false),
});

export const productSearchSchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(100),
});

export const myOrdersSchema = z.object({});

export type SalesPeriod = z.infer<typeof salesPeriodSchema>["period"];

function periodRange(period: SalesPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
  } else if (period === "month") {
    start.setMonth(start.getMonth() - 1);
  } else {
    start.setFullYear(start.getFullYear() - 1);
  }
  return { start, end };
}

export interface ProductHit {
  id: number;
  name: string;
  sku?: string | null;
  quantity?: number | null;
  piece_selling_price?: number | string | null;
}

function scopedWhere(
  storeId: number | null,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return storeId == null ? extra : { ...extra, store_id: storeId };
}

/**
 * Data-access layer behind the tools. The functions are deliberately kept on
 * a mutable registry so tests (and future tenants) can override them without
 * touching a database.
 */
export const agentFetchers = {
  async salesSummary(storeId: number | null, period: SalesPeriod) {
    const { start, end } = periodRange(period);
    const sales = await Sale.findAll({
      where: scopedWhere(storeId, { createdAt: { [Op.gte]: start, [Op.lt]: end } }),
      attributes: ["id", "total_amount", "payment_method"],
    });
    const total = sales.reduce(
      (sum, sale) =>
        sum + Number((sale.toJSON() as { total_amount: string | number }).total_amount),
      0,
    );
    return { period, count: sales.length, total: Number(total.toFixed(2)) };
  },

  async inventoryReport(storeId: number | null) {
    const products = await Product.findAll({
      where: scopedWhere(storeId),
      attributes: ["id", "name", "quantity", "min_quantity"],
    });
    const list = products.map(
      (p) => p.toJSON() as { name: string; quantity: number; min_quantity: number },
    );
    const low = list.filter(
      (p) => Number(p.quantity) > 0 && Number(p.quantity) < Number(p.min_quantity || 10),
    );
    const out = list.filter((p) => Number(p.quantity) <= 0);
    return {
      total: list.length,
      lowStock: low.length,
      outOfStock: out.length,
      lowStockProducts: low.slice(0, 10).map((p) => p.name),
    };
  },

  async myOrders(storeId: number | null, userId: number) {
    const orders = await Sale.findAll({
      where: { ...scopedWhere(storeId), user_id: userId },
      attributes: ["id", "status", "total_amount", "payment_method", "createdAt"],
      include: [{ model: SaleItem, as: "items", attributes: ["id"] }],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });
    return orders.map((o) => {
      const row = o.toJSON() as {
        id: number;
        status: string;
        total_amount: number | string;
        payment_method: string;
        createdAt: string;
        items?: Array<{ id: number }>;
      };
      return {
        id: row.id,
        status: row.status,
        total: Number(row.total_amount),
        payment_method: row.payment_method,
        date: row.createdAt,
        items: (row.items ?? []).length,
      };
    });
  },

  async searchProducts(storeId: number | null, q: string): Promise<ProductHit[]> {
    const products = await Product.findAll({
      where: {
        ...scopedWhere(storeId),
        [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { sku: { [Op.like]: `%${q}%` } }],
      },
      attributes: ["id", "name", "sku", "quantity", "piece_selling_price"],
      order: [["name", "ASC"]],
      limit: 10,
    });
    return products.map((p) => {
      const row = p.toJSON() as {
        id: number;
        name: string;
        sku?: string | null;
        quantity?: number | null;
        piece_selling_price?: number | string | null;
      };
      return {
        id: row.id,
        name: row.name,
        sku: row.sku ?? null,
        quantity: row.quantity ?? null,
        piece_selling_price: row.piece_selling_price ?? null,
      };
    });
  },
};

type ToolConfig = { configurable?: Record<string, unknown> };

function toolContext(config?: ToolConfig): AgentToolContext {
  const raw = (config?.configurable ?? {}) as Partial<AgentToolContext>;
  return {
    storeId: raw.storeId ?? null,
    userId: raw.userId ?? 0,
    role: raw.role ?? "client",
  };
}

/** Number of sales and total revenue for a period. Read-only. */
export const getSalesSummaryTool = tool(
  async (input, config) => {
    const ctx = toolContext(config);
    return JSON.stringify(await agentFetchers.salesSummary(ctx.storeId, input.period));
  },
  {
    name: "get_sales_summary",
    description: "Get the number of sales and total revenue for a period (today, week, month, year).",
    schema: salesPeriodSchema,
  },
);

/** Inventory health: totals plus low/out-of-stock counts. Read-only. */
export const getInventoryReportTool = tool(
  async (input, config) => {
    const ctx = toolContext(config);
    const report = await agentFetchers.inventoryReport(ctx.storeId);
    if (input.lowStockOnly) {
      return JSON.stringify({ lowStock: report.lowStock, lowStockProducts: report.lowStockProducts });
    }
    return JSON.stringify(report);
  },
  {
    name: "get_inventory_report",
    description: "Get inventory health: product totals and low/out-of-stock counts.",
    schema: inventoryInputSchema,
  },
);

/** Search products by name or SKU. Read-only. */
export const searchProductsTool = tool(
  async (input, config) => {
    const ctx = toolContext(config);
    return JSON.stringify(await agentFetchers.searchProducts(ctx.storeId, input.q));
  },
  {
    name: "search_products",
    description: "Search products by name or SKU. Returns up to 10 matches.",
    schema: productSearchSchema,
  },
);

/** The current user's recent orders with statuses. Read-only. */
export const getMyOrdersTool = tool(
  async (_input, config) => {
    const ctx = toolContext(config);
    return JSON.stringify(await agentFetchers.myOrders(ctx.storeId, ctx.userId));
  },
  {
    name: "get_my_orders",
    description: "Get the current user's recent orders and their statuses. Use for order tracking questions.",
    schema: myOrdersSchema,
  },
);

export const agentTools = [
  getSalesSummaryTool,
  getInventoryReportTool,
  searchProductsTool,
  getMyOrdersTool,
];
