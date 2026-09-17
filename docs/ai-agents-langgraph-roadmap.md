# Integrating AI Agents into ProSaleManager with LangGraph

**Status:** Proposal / roadmap — Phase 0 implemented (see below)
**Scope:** Backend (Express 5 + Sequelize + TypeScript), Web client, Mobile apps
**Target runtime:** LangGraph.js (`@langchain/langgraph`) on Node 22 — co-located with the API

---

## 0. Implementation status

- **Phase 0 (done):** `server/src/services/agent/` (state, 3 read-only tools,
  LLM switch, router → toolCall/respond graph with `MemorySaver`),
  `POST /api/agent/message` behind `requireAuth` + `AGENT_ENABLED`, 20-case
  eval golden set (`server/src/__tests__/agent/eval.test.ts`).
- **Phase 1 (done):** floating `AgentPanel` chat UI in the web client
  (`client/src/components/agent/` + `agentService.ts`, thread persisted in
  localStorage); Postgres checkpointer (`AGENT_CHECKPOINT_URL`, falls back to
  `MemorySaver`).
- **Phase 2 (done):** write actions behind human approval — proposal →
  `interrupt()` → approve/reject → transactional execute for expenses,
  purchase-order drafts, and stock receipt; `AgentAction` audit trail +
  migration; role gates mirroring the REST endpoints; approver notifications;
  `/api/agent/resume` with store-ownership and role re-checks; approval card
  in the web panel.
- **Not yet:** proactive briefings, multi-agent supervisor, pgvector RAG.

## 1. Executive summary

ProSaleManager already contains the hard part of an agentic system: a multi-tenant,
role-aware API with transactional business logic (sales, stock, purchase orders,
reports) and an event-capable notification layer. What it lacks is a reasoning
layer that can *observe* that data and *act* on it safely.

LangGraph is a good fit because it models an agent as an explicit **state machine**
(nodes + edges + conditional routing) with built-in **checkpointing**, **human-in-the-loop
interrupts**, and **streaming** — exactly the primitives needed to safely let an LLM
touch money and inventory.

**Recommendation:** build a dedicated `agent-service` inside the existing server
package, start with **read-only copilot** use cases, and only enable **write actions**
behind human approval and per-role tool allowlists.

---

## 2. Why LangGraph (and why JS, not Python)

| Requirement | Why it matters here | LangGraph feature |
|---|---|---|
| Deterministic control flow | POS/inventory actions must be auditable | Explicit `StateGraph` nodes/edges |
| Resumable long tasks | Approvals may take minutes/hours | Checkpointer + `interrupt()` |
| Multi-tenant isolation | Every query is `store_id`-scoped | State carries `store_id`; tools enforce scope |
| Role-based safety | `super_admin` vs `sales` vs `client` | Tool allowlists + conditional edges |
| Streaming UX | Chat/report UIs want token streams | `streamEvents()` → SSE |
| Observability | Debug + eval agents | LangSmith tracing |

Use **LangGraph.js** (`@langchain/langgraph`) because the server is TypeScript/ESM
and can reuse existing Sequelize models, Zod schemas (`server/src/validation/schemas.ts`),
and auth middleware. A separate Python service is only worth it if you plan heavy
data-science workloads; it adds a second runtime and duplicate tool code.

---

## 3. Where agents plug into the current architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Web (React)        Mobile-admin        Mobile-client             │
│   │  chat/report     │  scan/reorder       │  support chat      │
└───┼──────────────────┼─────────────────────┼────────────────────┘
    │   POST /api/agent/:threadId  (SSE stream)
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ Express app (server/src/app.ts)                                  │
│  ├─ requireAuth + resolveStore + requireRole   ← reuse as-is      │
│  └─ routes/agent.routes.ts  →  services/agent/                    │
│         ├─ graph.ts            (LangGraph StateGraph)             │
│         ├─ state.ts            (Annotation schema)                │
│         ├─ tools/*.ts          (server-owned tools)               │
│         ├─ checkpointer.ts     (Postgres saver)                   │
│         └─ llm.ts              (provider + model config)          │
└──────────────────────────────────────────────────────────────────┘
    │ tools call existing controllers/services (NOT raw SQL where avoidable)
    ▼
┌──────────────────────────────────────────────────────────────────┐
│ Sequelize models (store-scoped) · Postgres/SQLite · pgvector      │
└──────────────────────────────────────────────────────────────────┘
```

**Key principle:** tools are thin wrappers over the *same* business logic the REST
API uses (`sales.controller`, `stock.controller`, `reports` queries). Agents must
never bypass store scoping or transactional guarantees.

---

## 4. Use cases (prioritised)

| # | Use case | Value | Write? | Phase |
|---|---|---|---|---|
| 1 | **Store Operations Copilot** — "How were sales yesterday?", "What's low stock?" | High | No | 1 |
| 2 | **NL → report** — natural language to existing report endpoints | High | No | 1 |
| 3 | **Reorder assistant** — draft purchase orders from low-stock + supplier data | High | Yes (HITL) | 2 |
| 4 | **Expense OCR & categorisation** — classify receipts, suggest category | Medium | Yes (HITL) | 2 |
| 5 | **Customer support / order status** (mobile-client) | Medium | No | 3 |
| 6 | **Anomaly & fraud watch** — flag unusual discounts/voids | Medium | No | 3 |
| 7 | **Proactive daily briefing** — scheduled agent posts a summary | Medium | Yes (auto, low risk) | 4 |

---

## 5. Reference graph — "Store Operations Copilot"

```
        ┌───────────┐
        │  START    │
        └─────┬─────┘
              ▼
        ┌───────────┐
        │  router   │  classify intent + required role/capability
        └─────┬─────┘
     ┌────────┼───────────────┐
     ▼        ▼               ▼
 ┌───────┐ ┌────────┐   ┌────────────┐
 │retrieve│ │  llm   │   │ tool-call  │◄──────────┐
 │(RAG)   │ │ direct │   │  (agent)   │           │
 └───┬───┘ └───┬────┘   └──────┬─────┘           │
     │         │               │                 │
     │         │        needs write action?      │
     │         │               ▼                 │
     │         │        ┌─────────────┐          │
     │         │        │  approval   │  reject  │
     │         │        │ (interrupt) │──────────┘
     │         │        └──────┬──────┘  approve
     │         │               ▼
     │         │        ┌─────────────┐
     │         │        │ execute_tool│
     │         │        └──────┬──────┘
     └─────────┴───────────────┼──────────
                               ▼
                        ┌────────────┐
                        │  respond   │──► END
                        └────────────┘
```

**State (`Annotation`):**

```ts
type AgentState = {
  messages: BaseMessage[];          // reduce: concat
  storeId: number | null;           // tenant scope (never trust the LLM for this)
  userId: number;
  role: "super_admin" | "admin" | "manager" | "sales" | "client";
  intent?: string;
  pendingAction?: { name: string; args: unknown; summary: string };
  approved?: boolean;
};
```

**Checkpointer:** `@langchain/langgraph-checkpoint-postgres` against the same
Postgres instance (a new `agent_checkpoints` schema). Enables resume-after-approval
and time-travel debugging.

---

## 6. Tools (server-owned, Zod-typed)

Reuse the validation style already in `server/src/validation/schemas.ts`.

| Tool | Backing code | Scope | Write |
|---|---|---|---|
| `getSalesSummary({ period })` | reports query | store | no |
| `getInventoryReport({ category?, low_stock? })` | reports / products | store | no |
| `getProductPerformance({ period, limit })` | reports | store | no |
| `searchProducts({ q })` | products | store | no |
| `getSupplierList()` | suppliers | store | no |
| `draftPurchaseOrder({ items })` | purchase-orders | store | yes → HITL |
| `receiveStock({ receipt })` | stock.controller | store | yes → HITL |
| `createExpense({ ... })` | expenses.controller | store | yes → HITL |
| `sendReceipt({ saleId, via })` | receipt.service | store | yes (low risk) |

**Tool safety rules**
1. Every tool takes `storeId` from **state**, never from model output.
2. Wrap tool handlers in a `requireRole`-equivalent check before execution.
3. Write tools return a *proposal* first; execution happens only after approval.
4. All tool calls are logged with `{ threadId, userId, storeId, tool, args, result }`.

Example:

```ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const getSalesSummary = tool(
  async ({ period }, config) => {
    const { storeId } = config.configurable as { storeId: number };
    // reuse the existing report query path, already store-scoped
    return JSON.stringify(await reportsService.salesSummary(storeId, period));
  },
  {
    name: "get_sales_summary",
    description: "Summarise sales totals and counts for a period.",
    schema: z.object({ period: z.enum(["today", "week", "month", "year"]) }),
  },
);
```

---

## 7. Human-in-the-loop (approvals)

Use LangGraph `interrupt()` for any write action:

```ts
import { interrupt } from "@langchain/langgraph";
import { Command } from "@langchain/langgraph";

async function approvalNode(state: AgentState) {
  const decision = interrupt({
    type: "approval",
    summary: state.pendingAction?.summary,
    args: state.pendingAction?.args,
  }) as { approved: boolean };
  return { approved: decision.approved };
}
```

Resume with `new Command({ resume: { approved: true } })`.

**Integration with existing notifications:** when the graph interrupts, create a
`Notification` for the approving role (reuse `notification.service.ts`). The web
`MainNav` bell already polls every 60s; approvals surface there naturally.

---

## 8. Multi-tenancy, RBAC & security

- **Tenant isolation:** `storeId` lives in graph state, set from the authenticated
  request (`req.user.store_id`), and is injected into tools via
  `config.configurable`. The model never supplies it.
- **Role → capability map:** mirror the REST rules (e.g. `sales` cannot view
  reports or delete sales). Filter the tool list per role *before* binding to the LLM.
- **Prompt injection:** treat all retrieved/store data as untrusted. Never let tool
  *results* change which tools are available. Consider a "data-only" system prompt
  and output validation on write proposals.
- **PII:** customer phone/email must be redacted from LLM context unless strictly
  needed; prefer IDs + store aggregation.
- **Secrets:** model/API keys in env (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`),
  never exposed to clients. Proxy LLM traffic server-side only.
- **Cost control:** per-store token budgets, `max_iterations` on the tool loop,
  and a hard timeout per thread.

---

## 9. Data & retrieval

- **Structured:** tools query Sequelize directly (no vector store needed).
- **Unstructured (policies, product docs, FAQs):** add `pgvector`; embed documents
  into a `documents` table (`store_id`, `content`, `embedding`). A `retrieve` node
  performs a store-scoped similarity search.
- **Schema awareness:** expose a compact, curated schema description to the router
  LLM rather than the full 18-model schema, to reduce tokens and hallucination.

---

## 10. Observability & evaluation

- **Tracing:** LangSmith (or OpenTelemetry) on every graph run; tag with
  `storeId`, `userId`, `threadId`, `graphVersion`.
- **Evals:** a golden set of ~50 Q/A pairs per use case; run on every change
  (`evals/` folder + CI job). Track tool-selection accuracy and answer faithfulness.
- **Guardrails:** assertions on tool args (Zod), refusal paths for out-of-scope
  questions, and a max-tool-call circuit breaker.
- **Audit table:** `agent_actions` (who/what/when/approved-by/result) for compliance.

---

## 11. Deployment & scaling

**Recommended shape:** a `services/agent/` module inside the existing `server`
package, exposed at `POST /api/agent/:threadId` (SSE) and `POST /api/agent/:threadId/resume`.

- **Long-running writes / scheduled briefings:** a Redis + BullMQ worker (or
  `node-cron`, already a dependency) that invokes the graph outside the request
  lifecycle.
- **Streaming:** `graph.streamEvents(...)` piped to `res.write` (SSE), consumed by
  the web client with `EventSource`/`fetch` streams.
- **Scaling:** stateless API pods + shared Postgres checkpointer; sticky sessions
  are **not** required because state is checkpointed.
- **Timeouts/retries:** per-node retry policy; idempotency keys on write tools.

---

## 12. Proposed repository layout

```
server/src/
  routes/
    agent.routes.ts            # POST /agent/:threadId, /resume  (auth + role)
  services/agent/
    graph.ts                   # StateGraph wiring
    state.ts                   # Annotation + reducers
    llm.ts                     # provider selection, model per role/cost
    checkpointer.ts            # Postgres saver
    approval.ts                # interrupt/resume helpers + notifications
    prompts/
      system.md
      router.md
    tools/
      index.ts                 # role-filtered tool registry
      reports.tools.ts
      inventory.tools.ts
      purchasing.tools.ts      # write (HITL)
      expenses.tools.ts        # write (HITL)
  database/migrations/
    xxxx-create-agent-checkpoints.ts
    xxxx-create-agent-actions.ts
    xxxx-create-documents-pgvector.ts
client/src/
  components/agent/AgentPanel.tsx   # chat + approval cards
mobile-admin/services/agentService.ts
```

---

## 13. Phased roadmap

### Phase 0 — Foundations (1–2 weeks)
- Add deps: `@langchain/langgraph`, `@langchain/core`, chosen model SDK,
  `@langchain/langgraph-checkpoint-postgres`.
- Migrations: `agent_checkpoints`, `agent_actions`.
- `agent.routes.ts` behind `requireAuth` + `requireRole`; SSE plumbing.
- Read-only tool registry using existing report/product queries.
- Observability: tracing + structured logs.
- **Exit criteria:** authenticated user can ask "sales this week" and get a correct,
  store-scoped answer.

### Phase 1 — Read-only Copilot GA (2–3 weeks)
- Router node, tool loop with iteration cap, response node with citations.
- Web `AgentPanel` + mobile-admin chat surface.
- Eval harness (golden set) and CI job.
- **Exit criteria:** ≥90% tool-selection accuracy on golden set; p95 latency < 6s.

### Phase 2 — Write actions with HITL (3–4 weeks)
- `interrupt()` approval flow; approval notifications via existing system.
- `draftPurchaseOrder`, `receiveStock`, `createExpense` tools (proposal → approve → execute).
- `agent_actions` audit trail; role-based tool allowlists enforced server-side.
- **Exit criteria:** zero unapproved writes; 100% of writes auditable.

### Phase 3 — Proactive & mobile (3–4 weeks)
- Scheduled daily briefing (cron) with low-risk auto-actions (e.g., alert only).
- Customer-facing order-status support in `mobile-client` (read-only, PII-safe).
- Anomaly detection tool + rules.
- **Exit criteria:** weekly active store adoption metric defined and measured.

### Phase 4 — Multi-agent & optimisation (ongoing)
- Supervisor pattern: separate "analyst", "purchasing", "support" subgraphs.
- pgvector RAG for policies/FAQs.
- Cost/latency tuning, model routing (small model for routing, large for synthesis).

---

## 14. Illustrative graph (LangGraph.js)

```ts
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  storeId: Annotation<number | null>(),
  role: Annotation<string>(),
  pendingAction: Annotation<PendingAction | null>(),
  approved: Annotation<boolean | null>(),
});

const graph = new StateGraph(State)
  .addNode("router", routerNode)
  .addNode("agent", agentNode)          // llm.bindTools(toolsForRole(role))
  .addNode("tools", toolNode)           // read tools execute directly
  .addNode("approval", approvalNode)    // writes interrupt here
  .addNode("execute", executeToolNode)
  .addNode("respond", respondNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeAfterRouter, {
    retrieve: "agent", direct: "respond", tools: "agent",
  })
  .addConditionalEdges("agent", (s) =>
    /* tool_calls? */ "tools" : "respond")
  .addConditionalEdges("tools", (s) => (s.pendingAction ? "approval" : "agent"))
  .addConditionalEdges("approval", (s) => (s.approved ? "execute" : "respond"))
  .addEdge("execute", "agent")
  .addEdge("respond", END)
  .compile({ checkpointer });
```

---

## 15. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated numbers | Force tools for all numeric answers; cite source rows |
| Unauthorised write | HITL + role-filtered tools + server-side re-check |
| Cross-tenant leakage | `storeId` only from auth context; store-scoped tools |
| Runaway cost | Token budgets, iteration caps, model routing |
| Prompt injection via data | Treat data as untrusted; never let data alter tool availability |
| Latency | Small model for router, stream tokens, cache common reports |
| LLM/API outages | Graceful fallback to deterministic reports; circuit breaker |

---

## 16. KPIs

- Answer accuracy on golden set (target ≥ 90%)
- Tool-selection precision / recall
- p95 end-to-end latency (read path < 6s)
- % write actions with recorded approval (target 100%)
- Cost per active store / month
- Assistant task completion rate (thumbs up/down + explicit resolution)

---

## 17. Immediate next steps (first sprint)

1. Add agent dependencies and feature flag (`AGENT_ENABLED`).
2. Create `agent_checkpoints` + `agent_actions` migrations.
3. Implement `agent.routes.ts` (auth + role + SSE) and a stub graph that echoes.
4. Wrap 3 read-only tools (`get_sales_summary`, `get_inventory_report`, `search_products`).
5. Ship a minimal `AgentPanel` in the web client.
6. Stand up the eval golden set (start with 20 questions).
