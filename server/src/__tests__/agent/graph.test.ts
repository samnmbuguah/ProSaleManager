import { routeTarget, runAgent } from "../../services/agent/graph.js";
import { agentFetchers } from "../../services/agent/tools.js";

async function replyFor(args: Parameters<typeof runAgent>[0]): Promise<string> {
  const result = await runAgent(args);
  if (result.status !== "replied") {
    throw new Error(`Expected a reply, got status: ${result.status}`);
  }
  return result.reply;
}

const originalFetchers = { ...agentFetchers };

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENCODE_ZEN_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
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
    expect(result.status).toBe("replied");
    if (result.status !== "replied") throw new Error("expected reply");
    expect(result.reply).toContain("3 sale(s)");
    expect(result.reply).toContain("4500.00");
    expect(result.threadId).toMatch(/^thread-/);
  });

  it("answers inventory questions with tool data", async () => {
    expect(await replyFor({ message: "What is low in stock?", ...base })).toContain("10 product(s)");
  });

  it("searches products by name", async () => {
    expect(await replyFor({ message: "Sugar", ...base })).toContain("Sugar");
  });

  it("echoes free chat in stub mode", async () => {
    expect(await replyFor({ message: "Hello there", ...base })).toContain("Hello there");
  });

  it("routes deterministically in stub mode", () => {
    expect(routeTarget("chat", "admin", false)).toBe("respond");
    expect(routeTarget("denied", "client", true)).toBe("respond");
    expect(routeTarget("sales", "admin", false)).toBe("toolCall");
    expect(routeTarget("search", "client", false)).toBe("toolCall");
    expect(routeTarget("write:create_expense", "admin", true)).toBe("propose");
    expect(routeTarget("continue", "admin", true)).toBe("propose");
  });

  it("routes reads to the live loop when a model is present", () => {
    expect(routeTarget("chat", "admin", true)).toBe("liveAgent");
    expect(routeTarget("sales", "admin", true)).toBe("liveAgent");
    expect(routeTarget("orders", "client", true)).toBe("liveAgent");
  });

  it("preserves a caller-supplied thread id", async () => {
    const result = await runAgent({ message: "Hello", threadId: "t-1", ...base });
    expect(result.threadId).toBe("t-1");
  });

  it("denies store revenue questions for clients", async () => {
    const result = await runAgent({
      message: "How were sales this week?",
      storeId: 1,
      userId: 9,
      role: "client",
    });
    expect(result.status).toBe("replied");
    if (result.status !== "replied") throw new Error("expected reply");
    expect(result.reply).toContain("cannot perform");
  });

  it("denies inventory questions for clients", async () => {
    expect(
      await replyFor({ message: "What is low in stock?", storeId: 1, userId: 9, role: "client" }),
    ).toContain("cannot perform");
  });

  it("lets clients search products and track orders", async () => {
    agentFetchers.myOrders = async () => [
      { id: 12, status: "pending", total: 500, payment_method: "cash", date: "2026-01-01", items: 2 },
    ];
    const client = { storeId: 1, userId: 9, role: "client" };
    expect(await replyFor({ message: "Sugar", ...client })).toContain("Sugar");
    const orders = await replyFor({ message: "Where is my order?", ...client });
    expect(orders).toContain("#12");
    expect(orders).toContain("pending");
  });
});
