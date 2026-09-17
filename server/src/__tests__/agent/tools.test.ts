import {
  agentFetchers,
  getInventoryReportTool,
  getMyOrdersTool,
  getSalesSummaryTool,
  myOrdersSchema,
  productSearchSchema,
  salesPeriodSchema,
  searchProductsTool,
} from "../../services/agent/tools.js";

const originalFetchers = { ...agentFetchers };

beforeEach(() => {
  agentFetchers.salesSummary = async () => ({ period: "week", count: 3, total: 4500 });
  agentFetchers.inventoryReport = async () => ({
    total: 10,
    lowStock: 2,
    outOfStock: 1,
    lowStockProducts: ["Sugar", "Rice"],
  });
  agentFetchers.searchProducts = async () => [{ id: 1, name: "Sugar" }];
});

afterEach(() => {
  Object.assign(agentFetchers, originalFetchers);
});

describe("agent input schemas", () => {
  it("defaults the sales period to week", () => {
    expect(salesPeriodSchema.parse({}).period).toBe("week");
  });

  it("rejects an unknown period", () => {
    expect(salesPeriodSchema.safeParse({ period: "decade" }).success).toBe(false);
  });

  it("rejects an empty product search", () => {
    expect(productSearchSchema.safeParse({ q: "   " }).success).toBe(false);
  });

  it("accepts an empty my-orders input", () => {
    expect(myOrdersSchema.safeParse({}).success).toBe(true);
  });
});

describe("get_sales_summary", () => {
  it("returns fetcher data as JSON and forwards the store scope", async () => {
    let seenStoreId: number | null | undefined;
    agentFetchers.salesSummary = async (storeId, period) => {
      seenStoreId = storeId;
      return { period, count: 1, total: 100 };
    };

    const raw = await getSalesSummaryTool.invoke(
      { period: "today" },
      { configurable: { storeId: 7 } },
    );

    expect(JSON.parse(raw)).toEqual({ period: "today", count: 1, total: 100 });
    expect(seenStoreId).toBe(7);
  });
});

describe("get_inventory_report", () => {
  it("returns counts and low-stock names", async () => {
    const raw = await getInventoryReportTool.invoke({ lowStockOnly: false }, { configurable: {} });
    expect(JSON.parse(raw)).toEqual({
      total: 10,
      lowStock: 2,
      outOfStock: 1,
      lowStockProducts: ["Sugar", "Rice"],
    });
  });

  it("narrows to low-stock products when requested", async () => {
    const raw = await getInventoryReportTool.invoke({ lowStockOnly: true }, { configurable: {} });
    expect(JSON.parse(raw)).toEqual({ lowStock: 2, lowStockProducts: ["Sugar", "Rice"] });
  });
});

describe("search_products", () => {
  it("returns matching products", async () => {
    const raw = await searchProductsTool.invoke({ q: "sug" }, { configurable: {} });
    expect(JSON.parse(raw)).toEqual([{ id: 1, name: "Sugar" }]);
  });
});

describe("get_my_orders", () => {
  it("returns the user's orders and forwards user scope", async () => {
    let seen: { storeId: number | null; userId: number } | undefined;
    agentFetchers.myOrders = async (storeId, userId) => {
      seen = { storeId, userId };
      return [{ id: 12, status: "pending", total: 500, payment_method: "cash", date: "2026-01-01", items: 2 }];
    };

    const raw = await getMyOrdersTool.invoke(
      {},
      { configurable: { storeId: 3, userId: 9 } },
    );

    expect(JSON.parse(raw)).toEqual([
      { id: 12, status: "pending", total: 500, payment_method: "cash", date: "2026-01-01", items: 2 },
    ]);
    expect(seen).toEqual({ storeId: 3, userId: 9 });
  });
});
