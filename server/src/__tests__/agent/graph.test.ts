import { runAgent } from "../../services/agent/graph.js";
import { agentFetchers } from "../../services/agent/tools.js";

const originalFetchers = { ...agentFetchers };

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  agentFetchers.salesSummary = async (_storeId, period) => ({ period, count: 3, total: 4500 });
  agentFetchers.inventoryReport = async () => ({
    total: 10,
    lowStock: 0,
    outOfStock: 0,
    lowStockProducts: [],
  });
  agentFetchers.searchProducts = async () => [{ id: 1, name: "Sugar" }];
});

afterEach(() => {
  Object.assign(agentFetchers, originalFetchers);
});

const base = { storeId: 1, userId: 2, role: "admin" };

describe("runAgent (stub mode)", () => {
  it("answers sales questions with tool data", async () => {
    const result = await runAgent({ message: "How were sales this week?", ...base });
    expect(result.reply).toContain("3 sale(s)");
    expect(result.reply).toContain("4500.00");
    expect(result.threadId).toMatch(/^thread-/);
  });

  it("answers inventory questions with tool data", async () => {
    const result = await runAgent({ message: "What is low in stock?", ...base });
    expect(result.reply).toContain("10 product(s)");
  });

  it("searches products by name", async () => {
    const result = await runAgent({ message: "Sugar", ...base });
    expect(result.reply).toContain("Sugar");
  });

  it("echoes free chat in stub mode", async () => {
    const result = await runAgent({ message: "Hello there", ...base });
    expect(result.reply).toContain("Hello there");
  });

  it("preserves a caller-supplied thread id", async () => {
    const result = await runAgent({ message: "Hello", threadId: "t-1", ...base });
    expect(result.threadId).toBe("t-1");
  });
});
