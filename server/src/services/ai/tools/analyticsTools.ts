import { Op } from "sequelize";
import {
  Sale,
  SaleItem,
  Product,
  Expense,
  ProductSupplier,
  Supplier,
} from "../../../models/index.js";
import { storeScope } from "../../../utils/helpers.js";
import { resolvePeriod, PERIOD_NAMES } from "./period.js";
import type { ToolDefinition } from "../aiClient.js";

/** The authenticated user, used to scope every query to their store. */
export interface ToolContext {
  id: number;
  role: string;
  store_id?: number | null;
}

export interface AiTool {
  definition: ToolDefinition;
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

const periodParam = {
  period: {
    type: "string",
    enum: PERIOD_NAMES,
    description: "Named time window. Omit if using startDate/endDate.",
  },
  startDate: { type: "string", description: "ISO date (YYYY-MM-DD) for a custom range start." },
  endDate: { type: "string", description: "ISO date (YYYY-MM-DD) for a custom range end." },
};

type SaleWithItems = Sale & { items?: Array<SaleItem> };

async function loadCompletedSales(ctx: ToolContext, start: Date, end: Date): Promise<SaleWithItems[]> {
  return (await Sale.findAll({
    where: storeScope(ctx, {
      status: "completed",
      createdAt: { [Op.between]: [start, end] },
    }),
    include: [{ model: SaleItem, as: "items" }],
  })) as SaleWithItems[];
}

export const getSalesSummary: AiTool = {
  definition: {
    type: "function",
    function: {
      name: "get_sales_summary",
      description:
        "Total revenue, completed order count, average order value and gross profit for a period. Amounts are in Kenyan Shillings (KES).",
      parameters: { type: "object", properties: { ...periodParam } },
    },
  },
  run: async (args, ctx) => {
    const { start, end, label } = resolvePeriod(
      args.period as string,
      args.startDate as string,
      args.endDate as string,
    );
    const sales = await loadCompletedSales(ctx, start, end);
    let revenue = 0;
    let profit = 0;
    for (const sale of sales) {
      revenue += num(sale.total_amount);
      for (const item of sale.items || []) {
        profit += (num(item.unit_price) - num(item.buying_price)) * num(item.quantity);
      }
    }
    const orderCount = sales.length;
    return {
      period: label,
      currency: "KES",
      totalRevenue: Math.round(revenue * 100) / 100,
      orderCount,
      averageOrderValue: orderCount ? Math.round((revenue / orderCount) * 100) / 100 : 0,
      grossProfit: Math.round(profit * 100) / 100,
    };
  },
};

export const getTopProducts: AiTool = {
  definition: {
    type: "function",
    function: {
      name: "get_top_products",
      description: "Best-selling products for a period, ranked by revenue or units sold. Amounts in KES.",
      parameters: {
        type: "object",
        properties: {
          ...periodParam,
          metric: {
            type: "string",
            enum: ["revenue", "quantity"],
            description: "Ranking metric. Default revenue.",
          },
          limit: { type: "number", description: "How many products to return (default 10, max 25)." },
        },
      },
    },
  },
  run: async (args, ctx) => {
    const { start, end, label } = resolvePeriod(
      args.period as string,
      args.startDate as string,
      args.endDate as string,
    );
    const metric = args.metric === "quantity" ? "quantity" : "revenue";
    const limit = Math.min(Math.max(num(args.limit) || 10, 1), 25);
    const sales = await loadCompletedSales(ctx, start, end);

    const agg = new Map<number, { name: string; quantity: number; revenue: number; profit: number }>();
    const productIds = new Set<number>();
    for (const sale of sales) for (const item of sale.items || []) productIds.add(item.product_id);
    const products = await Product.findAll({
      where: { id: { [Op.in]: [...productIds] } },
      attributes: ["id", "name", "sku"],
    });
    const nameById = new Map(products.map((p) => [p.id, p.name]));

    for (const sale of sales) {
      for (const item of sale.items || []) {
        const cur = agg.get(item.product_id) || {
          name: nameById.get(item.product_id) || `Product #${item.product_id}`,
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
        cur.quantity += num(item.quantity);
        cur.revenue += num(item.total);
        cur.profit += (num(item.unit_price) - num(item.buying_price)) * num(item.quantity);
        agg.set(item.product_id, cur);
      }
    }

    const ranked = [...agg.values()]
      .sort((a, b) => (metric === "quantity" ? b.quantity - a.quantity : b.revenue - a.revenue))
      .slice(0, limit)
      .map((p) => ({
        name: p.name,
        quantity: p.quantity,
        revenue: Math.round(p.revenue * 100) / 100,
        profit: Math.round(p.profit * 100) / 100,
      }));

    return { period: label, currency: "KES", rankedBy: metric, products: ranked };
  },
};

export const getInventoryStatus: AiTool = {
  definition: {
    type: "function",
    function: {
      name: "get_inventory_status",
      description:
        "Current stock levels. Use filter 'low_stock' (at or below minimum), 'out_of_stock', or 'all'. Returns total stock value at buying price (KES).",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            enum: ["low_stock", "out_of_stock", "all"],
            description: "Default low_stock.",
          },
          limit: { type: "number", description: "Max products to list (default 25, max 50)." },
        },
      },
    },
  },
  run: async (args, ctx) => {
    const filter = (args.filter as string) || "low_stock";
    const limit = Math.min(Math.max(num(args.limit) || 25, 1), 50);
    const products = await Product.findAll({
      where: storeScope(ctx, { is_active: true }),
      attributes: ["id", "name", "sku", "quantity", "min_quantity", "piece_buying_price"],
    });

    let totalValue = 0;
    for (const p of products) totalValue += num(p.quantity) * num(p.piece_buying_price);

    let matched = products;
    if (filter === "out_of_stock") matched = products.filter((p) => num(p.quantity) <= 0);
    else if (filter === "low_stock")
      matched = products.filter((p) => num(p.quantity) <= num(p.min_quantity));

    const items = matched
      .sort((a, b) => num(a.quantity) - num(b.quantity))
      .slice(0, limit)
      .map((p) => ({
        name: p.name,
        sku: p.sku,
        quantity: num(p.quantity),
        minimum: num(p.min_quantity),
      }));

    return {
      currency: "KES",
      filter,
      totalProducts: products.length,
      matchingCount: matched.length,
      totalStockValueAtCost: Math.round(totalValue * 100) / 100,
      items,
    };
  },
};

export const getExpensesSummary: AiTool = {
  definition: {
    type: "function",
    function: {
      name: "get_expenses_summary",
      description: "Total expenses and a breakdown by category for a period. Amounts in KES.",
      parameters: { type: "object", properties: { ...periodParam } },
    },
  },
  run: async (args, ctx) => {
    const { start, end, label } = resolvePeriod(
      args.period as string,
      args.startDate as string,
      args.endDate as string,
    );
    const expenses = await Expense.findAll({
      where: storeScope(ctx, { date: { [Op.between]: [start, end] } }),
      attributes: ["amount", "category"],
    });

    let total = 0;
    const byCat = new Map<string, number>();
    for (const e of expenses) {
      const amt = num(e.amount);
      total += amt;
      byCat.set(e.category, (byCat.get(e.category) || 0) + amt);
    }

    return {
      period: label,
      currency: "KES",
      total: Math.round(total * 100) / 100,
      count: expenses.length,
      byCategory: [...byCat.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 })),
    };
  },
};

export interface ReorderInput {
  name: string;
  sku: string;
  quantity: number;
  minimum: number;
  buyingPrice: number;
}

export interface ReorderRow {
  name: string;
  sku: string;
  currentStock: number;
  minimum: number;
  soldInPeriod: number;
  dailyVelocity: number;
  daysOfStockLeft: number | null;
  suggestedReorderQty: number;
  estimatedCost: number;
  needsReorder: boolean;
}

/**
 * Pure reorder maths for one product. `sold` is units sold over `days` days;
 * `coverageDays` is how long the reorder should last. Exported for unit tests.
 */
export function computeReorderRow(
  p: ReorderInput,
  sold: number,
  days: number,
  coverageDays: number,
): ReorderRow {
  const span = Math.max(days, 1);
  const velocity = sold / span;
  const daysLeft = velocity > 0 ? p.quantity / velocity : null;
  const target = Math.ceil(velocity * coverageDays);
  const suggestedReorderQty = Math.max(Math.max(target, p.minimum) - p.quantity, 0);
  const needsReorder = p.quantity <= p.minimum || (daysLeft !== null && daysLeft <= coverageDays);
  return {
    name: p.name,
    sku: p.sku,
    currentStock: p.quantity,
    minimum: p.minimum,
    soldInPeriod: sold,
    dailyVelocity: Math.round(velocity * 100) / 100,
    daysOfStockLeft: daysLeft === null ? null : Math.round(daysLeft * 10) / 10,
    suggestedReorderQty,
    estimatedCost: Math.round(suggestedReorderQty * p.buyingPrice * 100) / 100,
    needsReorder,
  };
}

export const getReorderSuggestions: AiTool = {
  definition: {
    type: "function",
    function: {
      name: "get_reorder_suggestions",
      description:
        "Products that should be restocked, based on recent sales velocity and current stock. Returns days of stock left, a suggested reorder quantity to cover the target days, estimated cost (KES) and the preferred supplier. Use this for purchasing decisions.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: PERIOD_NAMES,
            description: "Window used to measure sales velocity. Default last_30_days.",
          },
          coverageDays: {
            type: "number",
            description: "Target days of stock the reorder should cover. Default 14.",
          },
          limit: { type: "number", description: "Max suggestions (default 15, max 30)." },
          includeAll: {
            type: "boolean",
            description: "If true, include products that don't need reordering. Default false.",
          },
        },
      },
    },
  },
  run: async (args, ctx) => {
    const period = (args.period as string) || "last_30_days";
    const { start, end, label } = resolvePeriod(period);
    const coverageDays = Math.min(Math.max(num(args.coverageDays) || 14, 1), 120);
    const limit = Math.min(Math.max(num(args.limit) || 15, 1), 30);
    const includeAll = args.includeAll === true;
    const days = Math.max((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000), 1);

    // Units sold per product over the window (completed sales only).
    const sales = await loadCompletedSales(ctx, start, end);
    const soldByProduct = new Map<number, number>();
    for (const sale of sales)
      for (const item of sale.items || [])
        soldByProduct.set(item.product_id, (soldByProduct.get(item.product_id) || 0) + num(item.quantity));

    const products = await Product.findAll({
      where: storeScope(ctx, { is_active: true }),
      attributes: ["id", "name", "sku", "quantity", "min_quantity", "piece_buying_price"],
    });

    // Preferred supplier per product (falls back to any supplier link).
    const links = (await ProductSupplier.findAll({
      where: storeScope(ctx, { product_id: { [Op.in]: products.map((p) => p.id!) } }),
      include: [{ model: Supplier, attributes: ["id", "name"] }],
    })) as Array<ProductSupplier & { Supplier?: { name?: string } }>;
    const supplierByProduct = new Map<number, string>();
    for (const link of links) {
      const name = link.Supplier?.name;
      if (!name) continue;
      if (link.is_preferred || !supplierByProduct.has(link.product_id)) {
        supplierByProduct.set(link.product_id, name);
      }
    }

    const rows = products.map((p) => {
      const sold = soldByProduct.get(p.id!) || 0;
      const row = computeReorderRow(
        {
          name: p.name,
          sku: p.sku,
          quantity: num(p.quantity),
          minimum: num(p.min_quantity),
          buyingPrice: num(p.piece_buying_price),
        },
        sold,
        days,
        coverageDays,
      );
      return { ...row, supplier: supplierByProduct.get(p.id!) || null };
    });

    const selected = (includeAll ? rows : rows.filter((r) => r.needsReorder))
      .sort((a, b) => {
        const da = a.daysOfStockLeft ?? Number.MAX_SAFE_INTEGER;
        const db = b.daysOfStockLeft ?? Number.MAX_SAFE_INTEGER;
        return da - db || a.currentStock - b.currentStock;
      })
      .slice(0, limit);

    return {
      period: label,
      coverageDays,
      currency: "KES",
      count: selected.length,
      suggestions: selected,
    };
  },
};

/** All analytics tools, keyed by function name. */
export const ANALYTICS_TOOLS: Record<string, AiTool> = {
  get_sales_summary: getSalesSummary,
  get_top_products: getTopProducts,
  get_inventory_status: getInventoryStatus,
  get_expenses_summary: getExpensesSummary,
  get_reorder_suggestions: getReorderSuggestions,
};
