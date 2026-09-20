import { runAgent } from "../../services/agent/graph.js";
import { resetCheckpointerCache } from "../../services/agent/checkpointer.js";
import { agentFetchers } from "../../services/agent/tools.js";

/**
 * Golden-set evaluation for the Phase 0 assistant. Runs in stub mode (no LLM
 * key) against fixture data and asserts each answer contains the expected
 * facts. Extend this table — not the graph — to lock in new behaviours.
 */
const CASES: Array<{ question: string; expect: string[]; role?: string }> = [
  { question: "How were sales today?", expect: ["Sales (today)", "3 sale(s)", "4500.00"] },
  { question: "Show me sales this week", expect: ["Sales (week)", "3 sale(s)"] },
  { question: "Monthly sales report", expect: ["Sales (month)"] },
  { question: "Yearly revenue please", expect: ["Sales (year)", "4500.00"] },
  { question: "sales", expect: ["Sales (week)"] },
  { question: "What is the gross profit?", expect: ["Sales (week)"] },
  { question: "What is low in stock?", expect: ["Inventory:", "2 low stock"] },
  { question: "Check inventory health", expect: ["Inventory:", "10 product(s)"] },
  { question: "Anything out of stock?", expect: ["out of stock"] },
  { question: "Do we need to restock?", expect: ["Inventory:"] },
  { question: "Sugar", expect: ["Found 1 product(s): Sugar"] },
  { question: "Rice", expect: ["Rice"] },
  { question: "Do we have milk?", expect: ["milk"] },
  { question: "Find the cheapest product", expect: ["cheapest"] },
  { question: "Hello", expect: ["Hello"] },
  { question: "Hi there", expect: ["Hi there"] },
  { question: "Thanks!", expect: ["Thanks"] },
  { question: "thank you", expect: ["thank you"] },
  { question: "bye", expect: ["bye"] },
  { question: "revenue year to date", expect: ["Sales (year)"] },
  { question: "Where is my order?", expect: ["#12", "pending"], role: "client" },
  { question: "Find sugar", expect: ["sugar"], role: "client" },
  { question: "How were sales this week?", expect: ["cannot perform"], role: "client" },
  { question: "What is low in stock?", expect: ["cannot perform"], role: "client" },
];

const originalFetchers = { ...agentFetchers };

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENCODE_ZEN_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  resetCheckpointerCache();
  agentFetchers.salesSummary = async (_storeId, period) => ({ period, count: 3, total: 4500 });
  agentFetchers.inventoryReport = async () => ({
    total: 10,
    lowStock: 2,
    outOfStock: 1,
    lowStockProducts: ["Sugar", "Rice"],
  });
  agentFetchers.searchProducts = async (_storeId, q) => [{ id: 1, name: q }];
  agentFetchers.myOrders = async () => [
    { id: 12, status: "pending", total: 500, payment_method: "cash", date: "2026-01-01", items: 2 },
  ];
});

afterEach(() => {
  Object.assign(agentFetchers, originalFetchers);
});

describe("agent eval golden set", () => {
  it.each(
    CASES.map((c) => [c.question, c.expect, c.role ?? "admin"] as [string, string[], string]),
  )("answers %p", async (question, expected, role) => {
    const result = await runAgent({ message: question, storeId: 1, userId: 2, role });
    if (result.status !== "replied") {
      throw new Error(`Expected a reply for "${question}", got status: ${result.status}`);
    }
    for (const fragment of expected) {
      expect(result.reply).toContain(fragment);
    }
  });
});
