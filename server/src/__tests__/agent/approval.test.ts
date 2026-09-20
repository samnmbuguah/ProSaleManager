import {
  AgentResumeError,
  resumeAgent,
  runAgent,
} from "../../services/agent/graph.js";
import { resetCheckpointerCache } from "../../services/agent/checkpointer.js";
import { agentFetchers } from "../../services/agent/tools.js";
import {
  agentAudit,
  agentNotify,
  agentResolvers,
  agentWriters,
} from "../../services/agent/writes.js";

const originalFetchers = { ...agentFetchers };
const originalResolvers = { ...agentResolvers };
const originalWriters = { ...agentWriters };
const originalAuditRecord = agentAudit.record;
const originalNotifyProposal = agentNotify.proposal;

const auditLog: Array<{ status: string; action: string; decidedBy?: number | null }> = [];
const notifications: Array<{ title: string; message: string }> = [];
const writerCalls: Array<{ name: string; args: unknown }> = [];

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENCODE_ZEN_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  resetCheckpointerCache();
  auditLog.length = 0;
  notifications.length = 0;
  writerCalls.length = 0;

  agentFetchers.searchProducts = async (_storeId, q) => [{ id: 9, name: q }];
  agentResolvers.findSuppliers = async () => [{ id: 5, name: "Acme" }];
  agentResolvers.getProductPricing = async () => ({
    name: "Rice",
    store_id: 1,
    piece_buying_price: 80,
    pack_buying_price: 240,
    dozen_buying_price: 960,
    piece_selling_price: 100,
    pack_selling_price: 300,
    dozen_selling_price: 1200,
  });
  agentWriters.createExpense = async (args) => {
    writerCalls.push({ name: "create_expense", args });
    return { id: 101 };
  };
  agentWriters.createPurchaseOrder = async (args) => {
    writerCalls.push({ name: "draft_purchase_order", args });
    return { id: 7, order_number: "PO-1" };
  };
  agentWriters.receiveStock = async (args) => {
    writerCalls.push({ name: "receive_stock", args });
    return { product_id: args.product_id, new_quantity: 60 };
  };
  agentAudit.record = async (entry) => {
    auditLog.push({ status: entry.status, action: entry.action, decidedBy: entry.decidedBy });
  };
  agentNotify.proposal = async (_storeId, title, message) => {
    notifications.push({ title, message });
  };
});

afterEach(() => {
  Object.assign(agentFetchers, originalFetchers);
  Object.assign(agentResolvers, originalResolvers);
  Object.assign(agentWriters, originalWriters);
  agentAudit.record = originalAuditRecord;
  agentNotify.proposal = originalNotifyProposal;
});

const admin = { storeId: 1, userId: 2, role: "admin" };

async function proposeExpense() {
  const result = await runAgent({ message: "Add expense 500 for transport", ...admin });
  if (result.status !== "approval_required") {
    throw new Error(`Expected approval_required, got ${result.status}`);
  }
  return result;
}

describe("expense approval lifecycle", () => {
  it("proposes, notifies, audits, then executes on approval", async () => {
    const proposed = await proposeExpense();

    expect(proposed.proposal.name).toBe("create_expense");
    expect(proposed.proposal.args).toMatchObject({ amount: 500, category: "Transport" });
    expect(auditLog).toHaveLength(1);
    expect(auditLog[0]).toMatchObject({ status: "proposed", action: "create_expense" });
    expect(notifications).toHaveLength(1);

    const done = await resumeAgent({
      threadId: proposed.threadId,
      approved: true,
      decidedBy: 2,
      storeId: 1,
      role: "admin",
    });

    expect(done.status).toBe("executed");
    expect(done.reply).toContain("Expense #101");
    expect(writerCalls).toHaveLength(1);
    expect(writerCalls[0].name).toBe("create_expense");
    expect(auditLog.at(-1)).toMatchObject({ status: "executed", decidedBy: 2 });
  });

  it("writes nothing when rejected", async () => {
    const proposed = await proposeExpense();

    const done = await resumeAgent({
      threadId: proposed.threadId,
      approved: false,
      decidedBy: 2,
      storeId: 1,
      role: "admin",
    });

    expect(done.status).toBe("cancelled");
    expect(done.reply).toContain("Cancelled");
    expect(writerCalls).toHaveLength(0);
    expect(auditLog.at(-1)).toMatchObject({ status: "rejected" });
  });

  it("denies write proposals for the client role", async () => {
    const result = await runAgent({
      message: "Add expense 500 for transport",
      storeId: 1,
      userId: 9,
      role: "client",
    });

    expect(result.status).toBe("replied");
    if (result.status !== "replied") throw new Error("expected reply");
    expect(result.reply).toContain("cannot perform");
    expect(writerCalls).toHaveLength(0);
    expect(auditLog).toHaveLength(0);
  });

  it("records failures when the writer throws", async () => {
    agentWriters.createExpense = async () => {
      throw new Error("DB is down");
    };
    const proposed = await proposeExpense();

    const done = await resumeAgent({
      threadId: proposed.threadId,
      approved: true,
      decidedBy: 2,
      storeId: 1,
      role: "admin",
    });

    expect(done.status).toBe("executed");
    expect(done.reply).toContain("Failed: DB is down");
    expect(auditLog.at(-1)).toMatchObject({ status: "failed" });
  });
});

describe("resume guards", () => {
  it("rejects unknown threads", async () => {
    const error = await resumeAgent({
      threadId: "nope",
      approved: true,
      decidedBy: 2,
      storeId: 1,
      role: "admin",
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AgentResumeError);
    expect((error as AgentResumeError).code).toBe("NO_PENDING");
  });

  it("rejects cross-store approvals", async () => {
    const proposed = await proposeExpense();
    const error = await resumeAgent({
      threadId: proposed.threadId,
      approved: true,
      decidedBy: 3,
      storeId: 2,
      role: "admin",
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AgentResumeError);
    expect((error as AgentResumeError).code).toBe("WRONG_STORE");
    expect(writerCalls).toHaveLength(0);
  });
});

describe("receive stock flow", () => {
  it("denies the sales role, mirroring the stock endpoint", async () => {
    const result = await runAgent({
      message: "receive 10 packs of sugar",
      storeId: 1,
      userId: 4,
      role: "sales",
    });

    expect(result.status).toBe("replied");
    if (result.status !== "replied") throw new Error("expected reply");
    expect(result.reply).toContain("cannot perform");
    expect(writerCalls).toHaveLength(0);
  });

  it("asks for prices, then proposes and executes across turns", async () => {
    const threadId = "recv-1";
    const first = await runAgent({
      message: "receive 10 packs of sugar",
      threadId,
      ...admin,
    });
    expect(first.status).toBe("replied");
    if (first.status !== "replied") throw new Error("expected reply");
    expect(first.reply).toContain("buying and selling");

    const second = await runAgent({
      message: "buying 300, selling 450",
      threadId,
      ...admin,
    });
    expect(second.status).toBe("approval_required");
    if (second.status !== "approval_required") throw new Error("expected proposal");
    expect(second.proposal.name).toBe("receive_stock");
    expect(second.proposal.args).toMatchObject({
      product_id: 9,
      quantity: 10,
      unit_type: "pack",
      buying_price: 300,
      selling_price: 450,
    });

    const done = await resumeAgent({
      threadId,
      approved: true,
      decidedBy: 2,
      storeId: 1,
      role: "admin",
    });
    expect(done.status).toBe("executed");
    expect(done.reply).toContain("new quantity 60");
    expect(writerCalls).toHaveLength(1);
  });

  it("forbids a sales user from approving a receive proposal", async () => {
    const first = await runAgent({ message: "receive 10 packs of sugar", threadId: "recv-2", ...admin });
    expect(first.status).toBe("replied");
    const second = await runAgent({ message: "buying 300, selling 450", threadId: "recv-2", ...admin });
    if (second.status !== "approval_required") throw new Error("expected proposal");

    const error = await resumeAgent({
      threadId: "recv-2",
      approved: true,
      decidedBy: 4,
      storeId: 1,
      role: "sales",
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AgentResumeError);
    expect((error as AgentResumeError).code).toBe("FORBIDDEN");
    expect(writerCalls).toHaveLength(0);
  });
});

describe("purchase order flow", () => {
  it("drafts from a single command and executes on approval", async () => {
    const proposed = await runAgent({
      message: "order 20 bags of rice from Acme",
      threadId: "po-1",
      ...admin,
    });
    expect(proposed.status).toBe("approval_required");
    if (proposed.status !== "approval_required") throw new Error("expected proposal");
    expect(proposed.proposal.name).toBe("draft_purchase_order");
    expect(proposed.proposal.summary).toContain("Acme");

    const done = await resumeAgent({
      threadId: "po-1",
      approved: true,
      decidedBy: 2,
      storeId: 1,
      role: "admin",
    });
    expect(done.status).toBe("executed");
    expect(done.reply).toContain("PO-1");
    expect(writerCalls).toHaveLength(1);
    expect(writerCalls[0].args).toMatchObject({ supplier_id: 5 });
  });

  it("asks for the supplier when missing, then completes", async () => {
    agentResolvers.findSuppliers = async (_storeId, name) =>
      name.toLowerCase() === "acme" ? [{ id: 5, name: "Acme" }] : [];
    const first = await runAgent({ message: "order 20 bags of rice", threadId: "po-2", ...admin });
    expect(first.status).toBe("replied");
    if (first.status !== "replied") throw new Error("expected reply");
    expect(first.reply).toContain("supplier");

    const second = await runAgent({ message: "Acme", threadId: "po-2", ...admin });
    expect(second.status).toBe("approval_required");
  });
});

describe("expense draft flow", () => {
  it("asks for the amount, then completes on follow-up", async () => {
    const first = await runAgent({
      message: "add expense for transport",
      threadId: "exp-1",
      ...admin,
    });
    expect(first.status).toBe("replied");
    if (first.status !== "replied") throw new Error("expected reply");
    expect(first.reply).toContain("How much");

    const second = await runAgent({ message: "750", threadId: "exp-1", ...admin });
    expect(second.status).toBe("approval_required");
    if (second.status !== "approval_required") throw new Error("expected proposal");
    expect(second.proposal.args).toMatchObject({ amount: 750 });
  });
});
