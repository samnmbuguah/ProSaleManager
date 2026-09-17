import { Store } from "../../models/index.js";
import { agentFetchers } from "./tools.js";
import { agentNotify } from "./writes.js";

/**
 * Proactive daily briefing: summarizes yesterday-to-today sales and inventory
 * health per store and notifies store approvers. Alert-only — the briefing
 * never performs writes.
 */
export const briefingStores = {
  async listStores(): Promise<Array<{ id: number; name: string }>> {
    const stores = await Store.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });
    return stores.map((s) => ({ id: s.id, name: s.name }));
  },
};

export async function buildStoreBriefing(storeId: number, storeName: string): Promise<string> {
  const [sales, inventory] = await Promise.all([
    agentFetchers.salesSummary(storeId, "today"),
    agentFetchers.inventoryReport(storeId),
  ]);
  const low =
    inventory.lowStockProducts.length > 0
      ? ` Low stock: ${inventory.lowStockProducts.join(", ")}.`
      : "";
  return (
    `Daily briefing for ${storeName} — today: ${sales.count} sale(s), ` +
    `KSh ${sales.total.toFixed(2)}. Inventory: ${inventory.total} product(s), ` +
    `${inventory.lowStock} low, ${inventory.outOfStock} out of stock.${low}`
  );
}

export async function runDailyBriefings(): Promise<{ stores: number; notified: number }> {
  const stores = await briefingStores.listStores();
  let notified = 0;
  for (const store of stores) {
    const message = await buildStoreBriefing(store.id, store.name);
    await agentNotify.proposal(store.id, "Daily store briefing", message);
    notified += 1;
  }
  return { stores: stores.length, notified };
}
