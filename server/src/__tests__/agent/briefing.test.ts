import {
  buildStoreBriefing,
  briefingStores,
  runDailyBriefings,
} from "../../services/agent/briefing.js";
import { agentFetchers } from "../../services/agent/tools.js";
import { agentNotify } from "../../services/agent/writes.js";

const originalFetchers = { ...agentFetchers };
const originalListStores = briefingStores.listStores;
const originalNotify = agentNotify.proposal;

const notifications: Array<{ storeId: number | null; title: string }> = [];

beforeEach(() => {
  notifications.length = 0;
  agentFetchers.salesSummary = async (_storeId, period) => ({ period, count: 5, total: 12000 });
  agentFetchers.inventoryReport = async () => ({
    total: 40,
    lowStock: 3,
    outOfStock: 1,
    lowStockProducts: ["Sugar", "Rice", "Flour"],
  });
  briefingStores.listStores = async () => [
    { id: 1, name: "Eltee" },
    { id: 2, name: "BYC" },
  ];
  agentNotify.proposal = async (storeId, title) => {
    notifications.push({ storeId, title });
  };
});

afterEach(() => {
  Object.assign(agentFetchers, originalFetchers);
  briefingStores.listStores = originalListStores;
  agentNotify.proposal = originalNotify;
});

describe("buildStoreBriefing", () => {
  it("summarizes sales and inventory for a store", async () => {
    const message = await buildStoreBriefing(1, "Eltee");

    expect(message).toContain("Eltee");
    expect(message).toContain("5 sale(s)");
    expect(message).toContain("12000.00");
    expect(message).toContain("3 low");
    expect(message).toContain("Sugar");
  });
});

describe("runDailyBriefings", () => {
  it("briefs every store exactly once", async () => {
    const result = await runDailyBriefings();

    expect(result).toEqual({ stores: 2, notified: 2 });
    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toMatchObject({ storeId: 1, title: "Daily store briefing" });
    expect(notifications[1]).toMatchObject({ storeId: 2, title: "Daily store briefing" });
  });

  it("handles zero stores", async () => {
    briefingStores.listStores = async () => [];

    await expect(runDailyBriefings()).resolves.toEqual({ stores: 0, notified: 0 });
    expect(notifications).toHaveLength(0);
  });
});
