import { Command, END, START, StateGraph, interrupt } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";

export type AgentRunResult =
  | { status: "replied"; reply: string; threadId: string }
  | { status: "approval_required"; proposal: PendingAction; threadId: string };

export class AgentResumeError extends Error {
  code: "NO_PENDING" | "FORBIDDEN" | "WRONG_STORE";

  constructor(code: AgentResumeError["code"], message: string) {
    super(message);
    this.name = "AgentResumeError";
    this.code = code;
  }
}
import type { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { AgentState, type ActionDraft, type AgentStateType, type PendingAction } from "./state.js";
import { getCheckpointer } from "./checkpointer.js";
import { getChatModel } from "./llm.js";
import {
  agentFetchers,
  getInventoryReportTool,
  getSalesSummaryTool,
  searchProductsTool,
} from "./tools.js";
import {
  agentAudit,
  agentNotify,
  agentResolvers,
  agentWriters,
  canPerformWrite,
  expenseArgsSchema,
  purchaseOrderArgsSchema,
  receiveStockArgsSchema,
  type WriteActionName,
  type WriteContext,
} from "./writes.js";

export interface RunAgentInput {
  message: string;
  threadId?: string;
  storeId: number | null;
  userId: number;
  role: string;
}

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
  if (lower.includes("today")) return "today";
  if (lower.includes("month")) return "month";
  if (lower.includes("year")) return "year";
  return "week";
}

function detectWriteIntent(text: string): WriteActionName | null {
  const lower = text.toLowerCase();
  const hasNumber = /[\d,]+\.?\d*/.test(lower);
  if (/\bexpense\b/.test(lower) && (/\b(add|record|log|create|spent)\b/.test(lower) || hasNumber)) {
    return "create_expense";
  }
  if (
    /\breceive\b/.test(lower) ||
    (/\badd\b/.test(lower) && hasNumber && /\bstock\b/.test(lower))
  ) {
    return "receive_stock";
  }
  if (
    /purchase order|reorder/.test(lower) ||
    (/\border\b/.test(lower) && /\bfrom\b/.test(lower)) ||
    (/\border\b/.test(lower) &&
      /[\d,]+\.?\d*/.test(lower) &&
      !/\b(show|list|view|my|history|status|track|find|search)\b/.test(lower))
  ) {
    return "draft_purchase_order";
  }
  return null;
}

async function routerNode(state: AgentStateType) {
  if (state.draft) return { intent: "continue" };
  const write = detectWriteIntent(lastUserText(state));
  if (write) {
    return { intent: canPerformWrite(write, state.role) ? `write:${write}` : "denied" };
  }
  return { intent: detectIntent(lastUserText(state)) };
}

const STOPWORDS = new Set([
  "add", "record", "log", "create", "an", "a", "the", "for", "of", "new", "some",
  "please", "to", "and", "from", "order", "orders", "receive", "received", "receiveing",
  "stock", "expense", "expenses", "me", "my", "our", "with",
]);

/** First positive number in the text (commas tolerated). */
function firstNumber(text: string): number | null {
  const match = text.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** All positive numbers in the text, in order. */
function allNumbers(text: string): number[] {
  const matches = text.replace(/,/g, "").match(/\d+(?:\.\d{1,2})?/g) ?? [];
  return matches.map(Number).filter((n) => Number.isFinite(n) && n > 0);
}

/** Lowercased content words: strips punctuation, digits and filler verbs. */
function contentWords(text: string, extraStopwords: string[] = []): string {
  const stop = new Set([...STOPWORDS, ...extraStopwords]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^\d/.test(w) && !stop.has(w))
    .join(" ");
}

const EXPENSE_CATEGORIES: Array<[RegExp, string]> = [
  [/transport|fuel|fare|matatu|uber|delivery/i, "Transport"],
  [/rent/i, "Rent"],
  [/salar|wage|staff/i, "Salaries"],
  [/electric|water|internet|wifi|utilit/i, "Utilities"],
  [/stock|inventory|goods|supplier|purchase/i, "Stock"],
  [/food|lunch|meal/i, "Food"],
];

function classifyExpenseCategory(text: string): string {
  for (const [pattern, category] of EXPENSE_CATEGORIES) {
    if (pattern.test(text)) return category;
  }
  return "General";
}

const UNIT_WORDS = [
  "piece", "pieces", "pack", "packs", "dozen", "dozens", "unit", "units",
  "bag", "bags", "box", "boxes", "bottle", "bottles",
];

function parseQuantityUnit(text: string): { quantity: number; unit_type: "piece" | "pack" | "dozen"; rest: string } | null {
  const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(pieces?|packs?|dozens?|units?|bags?|boxes?|bottles?)?/i);
  if (!qtyMatch) return null;
  const quantity = Number(qtyMatch[1]);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const unitWord = (qtyMatch[2] ?? "").toLowerCase();
  const unit_type = unitWord.startsWith("pack")
    ? "pack"
    : unitWord.startsWith("dozen")
      ? "dozen"
      : "piece";
  const rest = contentWords(text, [...UNIT_WORDS, "quantity", "qty"]);
  return { quantity, unit_type, rest };
}

function formatKSh(value: number): string {
  return `KSh ${Number(value).toFixed(2)}`;
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
  if (state.intent === "denied") {
    return { messages: [new AIMessage("Sorry — your role cannot perform that action.")] };
  }
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

type ProposalOutcome =
  | { action: PendingAction }
  | { ask: string; draft: ActionDraft };

async function resolveProduct(
  storeId: number | null,
  candidate: string,
): Promise<
  | { status: "one"; product: { id: number; name: string } }
  | { status: "none" }
  | { status: "many"; options: string[] }
> {
  const hits = await agentFetchers.searchProducts(storeId, candidate);
  const exact = hits.find((h) => h.name.toLowerCase() === candidate.toLowerCase());
  if (exact) return { status: "one", product: exact };
  if (hits.length === 1) return { status: "one", product: hits[0] };
  if (hits.length === 0) return { status: "none" };
  return { status: "many", options: hits.map((h) => h.name) };
}

async function buildExpenseProposal(
  text: string,
  draft: ActionDraft | null,
): Promise<ProposalOutcome> {
  const data: Record<string, unknown> = { ...(draft?.data ?? {}) };
  if (data.amount == null) {
    const amount = firstNumber(text);
    if (amount == null) {
      return {
        ask: "How much was the expense, and what was it for?",
        draft: {
          name: "create_expense",
          data: {
            category: classifyExpenseCategory(text),
            description: contentWords(text) || "General expense",
          },
        },
      };
    }
    data.amount = amount;
  }
  if (!data.description) data.description = contentWords(text) || "General expense";
  if (!data.category) data.category = classifyExpenseCategory(text);
  data.payment_method = "cash";
  const args = expenseArgsSchema.parse(data);
  const summary = `Create expense: ${args.description} — ${formatKSh(args.amount)} (${args.category}, ${args.payment_method})`;
  return { action: { name: "create_expense", args: { ...args }, summary } };
}

async function buildReceiveProposal(
  text: string,
  draft: ActionDraft | null,
  ctx: WriteContext,
): Promise<ProposalOutcome> {
  const data: Record<string, unknown> = { ...(draft?.data ?? {}) };

  if (data.product_id == null) {
    const parsed = parseQuantityUnit(text);
    if (!parsed) {
      return { ask: "Which product, and how many units should I receive?", draft: { name: "receive_stock", data } };
    }
    const resolved = await resolveProduct(ctx.storeId, parsed.rest);
    if (resolved.status !== "one") {
      const ask =
        resolved.status === "none"
          ? `I couldn't find a product matching "${parsed.rest}". Which product did you mean?`
          : `Multiple products match. Which one: ${resolved.options.join(", ")}?`;
      return {
        ask,
        draft: {
          name: "receive_stock",
          data: { quantity: parsed.quantity, unit_type: parsed.unit_type },
        },
      };
    }
    data.product_id = resolved.product.id;
    data.product_name = resolved.product.name;
    data.quantity = parsed.quantity;
    data.unit_type = parsed.unit_type;
  }

  if (data.buying_price == null || data.selling_price == null) {
    const numbers = allNumbers(text);
    if (numbers.length >= 2) {
      data.buying_price = numbers[0];
      data.selling_price = numbers[1];
    } else {
      return {
        ask: `What are the buying and selling prices for ${String(data.product_name ?? "this product")}? (e.g. "buying 300, selling 450")`,
        draft: { name: "receive_stock", data },
      };
    }
  }

  const args = receiveStockArgsSchema.parse(data);
  const summary =
    `Receive ${args.quantity} ${args.unit_type}(s) of ${args.product_name ?? `#${args.product_id}`}: ` +
    `buying ${formatKSh(args.buying_price)}, selling ${formatKSh(args.selling_price)}`;
  return { action: { name: "receive_stock", args: { ...args }, summary } };
}

function parsePurchaseItems(
  text: string,
): Array<{ quantity: number; unit_type: "piece" | "pack" | "dozen"; name: string }> | null {
  const itemsText = text.split(/\bfrom\b/i)[0];
  const chunks = itemsText
    .split(/\band\b|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  const items: Array<{ quantity: number; unit_type: "piece" | "pack" | "dozen"; name: string }> = [];
  for (const chunk of chunks) {
    const parsed = parseQuantityUnit(chunk);
    if (!parsed || !parsed.rest) return null;
    items.push({ quantity: parsed.quantity, unit_type: parsed.unit_type, name: parsed.rest });
  }
  return items.length > 0 ? items : null;
}

async function buildPurchaseOrderProposal(
  text: string,
  draft: ActionDraft | null,
  ctx: WriteContext,
): Promise<ProposalOutcome> {
  const data: Record<string, unknown> = { ...(draft?.data ?? {}) };

  // 1. Items (parsed once, then carried in the draft).
  if (!Array.isArray(data.items) || data.items.length === 0) {
    const parsed = parsePurchaseItems(text);
    if (!parsed) {
      return {
        ask: "What should I order? (e.g. \"order 20 bags of rice from Acme\")",
        draft: { name: "draft_purchase_order", data },
      };
    }
    const items: Array<Record<string, unknown>> = [];
    for (const item of parsed) {
      const resolved = await resolveProduct(ctx.storeId, item.name);
      if (resolved.status !== "one") {
        const ask =
          resolved.status === "none"
            ? `I couldn't find a product matching "${item.name}". Which product did you mean?`
            : `Multiple products match "${item.name}". Which one: ${resolved.options.join(", ")}?`;
        return { ask, draft: { name: "draft_purchase_order", data } };
      }
      const pricing = await agentResolvers.getProductPricing(resolved.product.id);
      const buying =
        item.unit_type === "pack"
          ? pricing.pack_buying_price
          : item.unit_type === "dozen"
            ? pricing.dozen_buying_price
            : pricing.piece_buying_price;
      const selling =
        item.unit_type === "pack"
          ? pricing.pack_selling_price
          : item.unit_type === "dozen"
            ? pricing.dozen_selling_price
            : pricing.piece_selling_price;
      items.push({
        product_id: resolved.product.id,
        product_name: pricing.name,
        quantity: item.quantity,
        unit_type: item.unit_type,
        unit_price: buying,
        selling_price: selling,
      });
    }
    data.items = items;
  }

  // 2. Supplier ("from X" clause, else the whole reply on follow-up turns).
  if (typeof data.supplier_id !== "number") {
    const fromParts = text.split(/\bfrom\b/i);
    const supplierQuery = (
      fromParts.length > 1 ? fromParts.slice(1).join(" ").replace(/[.?!]+$/, "") : text
    ).trim();
    const suppliers = supplierQuery
      ? await agentResolvers.findSuppliers(ctx.storeId, supplierQuery)
      : [];
    const supplier =
      suppliers.find((s) => s.name.toLowerCase() === supplierQuery.toLowerCase()) ??
      (suppliers.length === 1 ? suppliers[0] : undefined);
    if (!supplier) {
      const ask =
        suppliers.length === 0
          ? `I couldn't find a supplier matching "${supplierQuery}". Which supplier should I order from?`
          : `Multiple suppliers match. Which one: ${suppliers.map((s) => s.name).join(", ")}?`;
      return { ask, draft: { name: "draft_purchase_order", data } };
    }
    data.supplier_id = supplier.id;
    data.supplier_name = supplier.name;
  }

  const args = purchaseOrderArgsSchema.parse(data);
  const total = args.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const lines = args.items
    .map((item) => `${item.quantity}x ${item.product_name ?? `#${item.product_id}`} @ ${formatKSh(item.unit_price)}`)
    .join("; ");
  const summary =
    `Draft purchase order from ${args.supplier_name ?? `#${args.supplier_id}`}: ` +
    `${args.items.length} item(s), total ${formatKSh(total)} — ${lines}`;
  return { action: { name: "draft_purchase_order", args: { ...args }, summary } };
}

async function proposeNode(state: AgentStateType, config: RunnableConfig) {
  const threadId = (config.configurable?.thread_id as string | undefined) ?? "unknown-thread";
  const ctx: WriteContext = {
    storeId: state.storeId,
    userId: state.userId ?? 0,
    role: state.role,
  };
  const text = lastUserText(state);
  const action = state.intent.startsWith("write:")
    ? (state.intent.slice("write:".length) as WriteActionName)
    : (state.draft?.name as WriteActionName | undefined);

  if (!action || !canPerformWrite(action, state.role)) {
    return { messages: [new AIMessage("Sorry — your role cannot perform that action.")] };
  }

  let outcome: ProposalOutcome;
  if (action === "create_expense") {
    outcome = await buildExpenseProposal(text, state.draft);
  } else if (action === "receive_stock") {
    outcome = await buildReceiveProposal(text, state.draft, ctx);
  } else {
    outcome = await buildPurchaseOrderProposal(text, state.draft, ctx);
  }

  if ("ask" in outcome) {
    return { draft: outcome.draft, messages: [new AIMessage(outcome.ask)] };
  }

  await agentAudit.record({
    threadId,
    userId: ctx.userId,
    storeId: ctx.storeId,
    action: outcome.action.name,
    args: outcome.action.args,
    summary: outcome.action.summary,
    status: "proposed",
  });
  try {
    await agentNotify.proposal(
      ctx.storeId,
      "Assistant proposal needs approval",
      outcome.action.summary,
    );
  } catch (error) {
    console.error("Failed to notify approvers of agent proposal:", error);
  }
  return {
    pendingAction: outcome.action,
    draft: null,
    messages: [
      new AIMessage(`Proposal — ${outcome.action.summary}\nUse Approve to apply it, or Reject to discard it.`),
    ],
  };
}

async function approvalNode(state: AgentStateType) {
  const decision = interrupt({
    type: "approval",
    action: state.pendingAction,
  }) as { approved?: boolean; decidedBy?: number } | undefined;
  return {
    approved: decision?.approved === true,
    decidedBy: decision?.decidedBy ?? null,
  };
}

async function dispatchWrite(pending: PendingAction, ctx: WriteContext): Promise<string> {
  if (pending.name === "create_expense") {
    const args = expenseArgsSchema.parse(pending.args);
    const { id } = await agentWriters.createExpense(args, ctx);
    return `Expense #${id} recorded: ${args.description} — ${formatKSh(args.amount)}.`;
  }
  if (pending.name === "draft_purchase_order") {
    const args = purchaseOrderArgsSchema.parse(pending.args);
    const { order_number } = await agentWriters.createPurchaseOrder(args, ctx);
    return `Purchase order #${order_number} drafted with ${args.items.length} item(s).`;
  }
  const args = receiveStockArgsSchema.parse(pending.args);
  const { new_quantity } = await agentWriters.receiveStock(args, ctx);
  return `Stock received for ${args.product_name ?? `#${args.product_id}`}: new quantity ${new_quantity}.`;
}

async function executeNode(state: AgentStateType, config: RunnableConfig) {
  const threadId = (config.configurable?.thread_id as string | undefined) ?? "unknown-thread";
  const pending = state.pendingAction;
  const clear = { pendingAction: null, approved: null, decidedBy: null, draft: null };
  const auditBase = {
    threadId,
    userId: state.userId ?? 0,
    storeId: state.storeId,
    action: pending?.name ?? "unknown",
    args: pending?.args ?? {},
    summary: pending?.summary ?? "",
  };

  if (!pending) {
    return { ...clear, messages: [new AIMessage("Nothing to do.")] };
  }
  if (!state.approved) {
    await agentAudit.record({ ...auditBase, status: "rejected", decidedBy: state.decidedBy });
    return { ...clear, messages: [new AIMessage("Cancelled — nothing was changed.")] };
  }
  if (!canPerformWrite(pending.name, state.role)) {
    await agentAudit.record({ ...auditBase, status: "failed", decidedBy: state.decidedBy });
    return { ...clear, messages: [new AIMessage("Denied — your role cannot perform this action.")] };
  }
  try {
    const confirmation = await dispatchWrite(pending, {
      storeId: state.storeId,
      userId: state.userId ?? 0,
      role: state.role,
    });
    await agentAudit.record({ ...auditBase, status: "executed", decidedBy: state.decidedBy });
    return { ...clear, messages: [new AIMessage(`Done: ${confirmation}`)] };
  } catch (error) {
    await agentAudit.record({ ...auditBase, status: "failed", decidedBy: state.decidedBy });
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      ...clear,
      messages: [new AIMessage(`Failed: ${message}. Nothing was changed.`)],
    };
  }
}

let compiled: ReturnType<typeof buildGraphInternal> | null = null;

function buildGraphInternal(checkpointer?: BaseCheckpointSaver) {
  return new StateGraph(AgentState)
    .addNode("router", routerNode)
    .addNode("toolCall", toolCallNode)
    .addNode("propose", proposeNode)
    .addNode("approval", approvalNode)
    .addNode("execute", executeNode)
    .addNode("respond", respondNode)
    .addEdge(START, "router")
    .addConditionalEdges(
      "router",
      (state: AgentStateType) => {
        if (state.intent === "chat" || state.intent === "denied") return "respond";
        if (state.intent === "sales" || state.intent === "inventory" || state.intent === "search") {
          return "toolCall";
        }
        return "propose";
      },
      ["respond", "toolCall", "propose"],
    )
    .addConditionalEdges("propose", (state: AgentStateType) => (state.pendingAction ? "approval" : END), [
      "approval",
      END,
    ])
    .addEdge("approval", "execute")
    .addEdge("execute", END)
    .addEdge("toolCall", END)
    .addEdge("respond", END)
    .compile(checkpointer ? { checkpointer } : {});
}

async function getCompiled() {
  if (!compiled) {
    compiled = buildGraphInternal(await getCheckpointer());
  }
  return compiled;
}

function threadConfig(threadId: string) {
  return { configurable: { thread_id: threadId } };
}

function hasPendingInterrupt(snapshot: { tasks: Array<{ interrupts?: unknown[] }> }): boolean {
  return snapshot.tasks.some((task) => (task.interrupts ?? []).length > 0);
}

/** Runs one agent turn. Works offline (stub mode) when no model key is set. */
export async function runAgent(input: RunAgentInput): Promise<AgentRunResult> {
  const graph = await getCompiled();
  const threadId =
    input.threadId ?? `thread-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const config = threadConfig(threadId);

  const existing = await graph.getState(config);
  if (hasPendingInterrupt(existing)) {
    const pending = existing.values.pendingAction as PendingAction | null;
    if (pending) return { status: "approval_required", proposal: pending, threadId };
  }

  const result = await graph.invoke(
    {
      messages: [new HumanMessage(input.message)],
      storeId: input.storeId,
      role: input.role,
      userId: input.userId,
    },
    config,
  );

  const snapshot = await graph.getState(config);
  if (hasPendingInterrupt(snapshot)) {
    const pending = snapshot.values.pendingAction as PendingAction | null;
    if (pending) return { status: "approval_required", proposal: pending, threadId };
  }

  const last = result.messages[result.messages.length - 1];
  const content = last?.content;
  return {
    status: "replied",
    reply: typeof content === "string" ? content : JSON.stringify(content ?? ""),
    threadId,
  };
}

/** Resumes a thread paused at an approval checkpoint. */
export async function resumeAgent(input: {
  threadId: string;
  approved: boolean;
  decidedBy: number;
  storeId: number | null;
  role: string;
}): Promise<{ status: "executed" | "cancelled"; reply: string; threadId: string }> {
  const graph = await getCompiled();
  const config = threadConfig(input.threadId);
  const snapshot = await graph.getState(config);
  const pending = snapshot.values.pendingAction as PendingAction | null;
  if (!hasPendingInterrupt(snapshot) || !pending) {
    throw new AgentResumeError("NO_PENDING", "No pending approval for this thread");
  }
  const ownerStore = (snapshot.values.storeId as number | null) ?? null;
  if (ownerStore !== input.storeId && input.role !== "super_admin") {
    throw new AgentResumeError("WRONG_STORE", "This approval belongs to a different store");
  }
  if (!canPerformWrite(pending.name, input.role)) {
    throw new AgentResumeError("FORBIDDEN", "Insufficient permissions");
  }

  const result = await graph.invoke(
    new Command({ resume: { approved: input.approved, decidedBy: input.decidedBy } }),
    config,
  );
  const last = result.messages[result.messages.length - 1];
  const content = last?.content;
  return {
    status: input.approved ? "executed" : "cancelled",
    reply: typeof content === "string" ? content : JSON.stringify(content ?? ""),
    threadId: input.threadId,
  };
}
