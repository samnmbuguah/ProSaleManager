import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState, type AgentStateType } from "./state.js";
import { getChatModel } from "./llm.js";
import {
  getInventoryReportTool,
  getSalesSummaryTool,
  searchProductsTool,
} from "./tools.js";

export interface RunAgentInput {
  message: string;
  threadId?: string;
  storeId: number | null;
  userId: number;
  role: string;
}

const saver = new MemorySaver();

function lastUserText(state: AgentStateType): string {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const message = state.messages[i];
    if (message.getType() === "human") {
      return typeof message.content === "string" ? message.content : JSON.stringify(message.content);
    }
  }
  return "";
}

function detectIntent(text: string): "sales" | "inventory" | "search" | "chat" {
  const lower = text.toLowerCase();
  if (/(sale|revenue|sold|report|profit)/.test(lower)) return "sales";
  if (/(stock|inventory|low|out of stock|restock)/.test(lower)) return "inventory";
  if (/^(hi|hello|hey|thanks|thank you|bye)\b/.test(lower.trim())) return "chat";
  return "search";
}

function detectPeriod(text: string): "today" | "week" | "month" | "year" {
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower)) return "today";
  if (/\bmonth\b/.test(lower)) return "month";
  if (/\byear\b/.test(lower)) return "year";
  return "week";
}

async function routerNode(state: AgentStateType) {
  return { intent: detectIntent(lastUserText(state)) };
}

async function toolCallNode(state: AgentStateType, config: RunnableConfig) {
  const storeId = state.storeId;
  const toolConfig = {
    configurable: { ...(config.configurable ?? {}), storeId },
  };
  const text = lastUserText(state);

  if (state.intent === "sales") {
    const raw = await getSalesSummaryTool.invoke({ period: detectPeriod(text) }, toolConfig);
    const summary = JSON.parse(raw) as { period: string; count: number; total: number };
    return {
      messages: [
        new AIMessage(
          `Sales (${summary.period}): ${summary.count} sale(s), total KSh ${summary.total.toFixed(2)}.`,
        ),
      ],
    };
  }

  if (state.intent === "inventory") {
    const raw = await getInventoryReportTool.invoke({ lowStockOnly: false }, toolConfig);
    const report = JSON.parse(raw) as {
      total: number;
      lowStock: number;
      outOfStock: number;
      lowStockProducts: string[];
    };
    const names =
      report.lowStockProducts.length > 0 ? ` Low stock: ${report.lowStockProducts.join(", ")}.` : "";
    return {
      messages: [
        new AIMessage(
          `Inventory: ${report.total} product(s), ${report.lowStock} low stock, ${report.outOfStock} out of stock.${names}`,
        ),
      ],
    };
  }

  const raw = await searchProductsTool.invoke({ q: text.trim() }, toolConfig);
  const products = JSON.parse(raw) as Array<{ name: string }>;
  if (products.length === 0) {
    return { messages: [new AIMessage(`No products found for "${text.trim()}".`)] };
  }
  return {
    messages: [
      new AIMessage(
        `Found ${products.length} product(s): ${products.map((p) => p.name).join(", ")}.`,
      ),
    ],
  };
}

async function respondNode(state: AgentStateType) {
  const model = getChatModel();
  if (!model) {
    const text = lastUserText(state);
    return {
      messages: [
        new AIMessage(
          `(stub mode) You said: "${text}". Ask about sales, inventory, or search for a product by name.`,
        ),
      ],
    };
  }
  const reply = await model.invoke(state.messages);
  return { messages: [reply] };
}

function buildGraph() {
  return new StateGraph(AgentState)
    .addNode("router", routerNode)
    .addNode("toolCall", toolCallNode)
    .addNode("respond", respondNode)
    .addEdge(START, "router")
    .addConditionalEdges(
      "router",
      (state: AgentStateType) => (state.intent === "chat" ? "respond" : "toolCall"),
      ["respond", "toolCall"],
    )
    .addEdge("toolCall", END)
    .addEdge("respond", END)
    .compile({ checkpointer: saver });
}

/** Runs one agent turn. Works offline (stub mode) when no model key is set. */
export async function runAgent(input: RunAgentInput): Promise<{ reply: string; threadId: string }> {
  const threadId =
    input.threadId ?? `thread-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const result = await buildGraph().invoke(
    {
      messages: [new HumanMessage(input.message)],
      storeId: input.storeId,
      role: input.role,
      userId: input.userId,
    },
    { configurable: { thread_id: threadId } },
  );

  const last = result.messages[result.messages.length - 1];
  const content = last?.content;
  return {
    reply: typeof content === "string" ? content : JSON.stringify(content ?? ""),
    threadId,
  };
}
