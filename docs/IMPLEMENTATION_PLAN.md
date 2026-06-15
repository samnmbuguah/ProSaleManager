# ProSaleManager — Production-Readiness Implementation Plan

Ordered by business impact and dependency. Each phase is independently shippable.
File paths are real; schema changes go through `sequelize-cli` migrations in
`server/src/database/migrations/` (`.cjs`, timestamped).

---

## Phase 1 — Test + validation foundation (prerequisite for payments)

**Why first:** payment and refund code must be born tested and validated. The
server currently has zero tests (`jest` passes with `passWithNoTests`) and
controllers trust request bodies.

1. **Server test infrastructure**
   - Point `server/jest.config.js` `roots` at `src` (already done) and add the
     first suites under `server/src/**/__tests__/`.
   - Unit-test pure logic first (no DB): `utils/priceCalculations.ts`,
     `utils/helpers.ts` (`storeScope`), `utils/params.ts`.
   - Add `sqlite::memory:` integration harness (`tests/helpers/db.ts`) that
     boots models via `sequelize.sync()` for controller tests with supertest.
2. **Zod validation middleware**
   - `server/src/middleware/validate.ts`: `validate(schema)` →
     parses `{ body, query, params }`, 400s with field errors.
   - Schemas in `server/src/schemas/` per route. Server already has
     `zod@3.25`; bump to v4 to match the clients (small API delta, the
     `required_error → error` migration pattern is already known).
   - Apply to the money routes first: `routes/sales.ts`, `routes/order.routes.ts`
     (via `order.controller.ts`), `routes/stock.ts`, then the rest.
3. **Exit criteria:** `cd server && npm test` runs real suites green; invalid
   bodies on sales/orders/stock return 400 with structured errors.

Effort: ~2–3 dev-days.

---

## Phase 2 — M-Pesa Daraja: STK Push for e-commerce checkout

**Goal:** customer checks out in mobile-client → gets an M-Pesa prompt on their
phone → order is confirmed automatically when the callback lands. Works with
either a Paybill or a Till (Buy Goods) shortcode via config.

### 2.1 Config (env vars, per store deployment)

```
MPESA_ENV=sandbox|production          # base URL switch
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...                   # Paybill number, or Store/HO number for Till
MPESA_PASSKEY=...                     # Lipa na M-Pesa Online passkey
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline|CustomerBuyGoodsOnline
MPESA_PARTY_B=...                     # Till number for Buy Goods; defaults to SHORTCODE
MPESA_CALLBACK_BASE_URL=https://...   # public HTTPS host (Daraja requires HTTPS)
MPESA_CALLBACK_SECRET=<random>        # unguessable callback path segment
```

### 2.2 Schema — migration `create-mpesa-transactions.cjs`

`mpesa_transactions`: `id`, `sale_id` (FK → sales), `store_id`, `phone`
(normalized `2547XXXXXXXX`), `amount DECIMAL(12,2)`, `merchant_request_id`,
`checkout_request_id` (UNIQUE, indexed), `status`
(`pending|success|failed|cancelled|timeout`), `result_code`, `result_desc`,
`mpesa_receipt_number`, `transaction_date`, `raw_callback JSON`, timestamps.
Model at `server/src/models/MpesaTransaction.ts` + association in
`models/associations.ts`.

### 2.3 Server — `services/mpesa.service.ts` + `routes/payments.ts`

- Service: OAuth token fetch with in-memory cache (expiry − 60 s);
  `stkPush({ phone, amount, accountReference, saleId })` building the
  base64(`Shortcode+Passkey+Timestamp`) password; `queryStatus(checkoutRequestId)`
  (STK query API) as a fallback when callbacks are delayed/lost.
- `POST /api/payments/mpesa/stk` (requireAuth): validates the sale belongs to
  the caller and `payment_status` is unpaid; **amount is read from the Sale row,
  never from the client**; creates a pending `mpesa_transactions` row.
- `POST /api/payments/mpesa/callback/:secret` (public): rejects unless
  `:secret` matches `MPESA_CALLBACK_SECRET` AND the `CheckoutRequestID` matches
  a pending row (Daraja doesn't sign callbacks — both checks are the defense).
  Idempotent: replayed callbacks are no-ops. On `ResultCode 0`, inside one DB
  transaction: mark transaction `success`, set sale
  `payment_status='paid'`, `payment_method='mpesa'`, `amount_paid`,
  `payment_details={ mpesa: amount }` + receipt number. Non-zero → `failed`
  with `result_desc` (user cancelled = 1032).
- `GET /api/payments/mpesa/status/:checkoutRequestId` (requireAuth, owner):
  returns transaction status for app polling; if still `pending` after 30 s,
  triggers a `queryStatus` server-side before answering.
- Mount in `routes/index.ts`. Rate-limit the STK endpoint (reuse app limiter).

### 2.4 Mobile-client checkout flow

- New `app/checkout/payment.tsx`: phone input (prefilled from profile,
  validated/normalized to 254…), "Pay with M-Pesa" button, and a
  "Pay on delivery" fallback that keeps today's behavior.
- `services/paymentService.ts`: `initiateStk(orderId, phone)`,
  `pollStatus(checkoutRequestId)` (2 s interval, 60 s budget, then show
  "still waiting / retry / pay later").
- `app/cart/index.tsx`: after `createOrder` → navigate to payment screen
  instead of straight to confirmation. Order detail screen shows payment badge
  (`paid` / `pending payment`) from `payment_status`.

### 2.5 Testing & rollout

- Unit tests (Phase 1 harness): password/timestamp generation, phone
  normalization, callback parsing (success / cancel / malformed), idempotency,
  amount-mismatch rejection. Mock axios.
- Sandbox: Daraja sandbox app + test MSISDN `254708374149`; expose the callback
  via the contabo host behind HTTPS (nginx + certbot) — set
  `EXPO_PUBLIC_API_URL` to the same host for device testing.
- Production cutover: switch env to live credentials for the Paybill/Till,
  verify one real KES 1 transaction, monitor `mpesa_transactions` for stuck
  `pending` rows (add to admin dashboard later).

Effort: ~4–5 dev-days including sandbox testing.
**Follow-up (separate ticket):** reuse the same service for POS STK push in
mobile-admin (cashier enters customer phone; today's manual mpesa amount entry
stays as fallback).

---

## Phase 3 — Refunds, voids, VAT fields (eTIMS groundwork)

1. **Migration `add-tax-discount-to-sales.cjs`:** `sales` += `tax_amount`,
   `discount_amount`; `sale_items` += `tax_rate`, `tax_amount`,
   `discount_amount`; `products` += `tax_category`
   (`standard16|zero_rated|exempt`); `stores`/`receipt_settings` += `kra_pin`,
   `is_tax_inclusive`.
2. **Migration `add-refund-support.cjs`:** `sales` += `parent_sale_id`
   (self-FK, null for normal sales), `voided_at`, `voided_by`, `void_reason`.
   A refund is a child Sale with negative quantities/amounts → reporting keeps
   working with no special-casing.
3. **Endpoints** (`sales.controller.ts` + Zod schemas):
   - `POST /api/sales/:id/void` — manager/admin only, same-day guard,
     restocks all items (with `StockLog` entries), sets void fields.
   - `POST /api/sales/:id/refund` — body `{ items: [{ sale_item_id, quantity }], reason }`,
     partial allowed, creates the negative child sale, restocks, caps at
     originally sold quantities minus prior refunds.
4. **Receipts:** `receipt.service.ts` renders REFUND/VOID banner + original
   receipt reference. VAT line on all receipts once tax fields populate.
5. **Clients:** web `SalesPage` + mobile-admin sales tab get void/refund
   actions (role-gated); POS computes VAT at sale time from product
   `tax_category` (prices KES-inclusive by default — Kenyan retail norm).
6. **eTIMS:** explicitly out of scope here; this phase captures the data
   (KRA PIN, per-line VAT) an OSCU/VSCU integration needs. Evaluate
   KRA sandbox vs a middleware provider as its own project.

Effort: ~4 dev-days.

---

## Phase 4 — Offline-first POS (mobile-admin)

1. **Migration:** `sales` += `idempotency_key` (UUID, UNIQUE nullable).
   `POST /api/sales` accepts the key; on conflict returns the existing sale
   (200, not 500) — makes retries safe.
2. **Mobile-admin:**
   - `services/offlineQueue.ts`: queue completed sales in AsyncStorage
     (upgrade to `expo-sqlite` if volume demands), each with a client-generated
     UUID; `@react-native-community/netinfo` listener triggers drain with
     exponential backoff; UI badge "N sales pending sync" on the POS tab.
   - Product cache: persist last product list + `updatedAt` cursor; POS sells
     from cache when offline (stock counts reconcile on sync).
   - Conflict policy: offline sales never fail for stock reasons —
     negative-stock allowed with a flagged `StockLog`, surfaced in reports.
3. **Tests:** queue drain (success / repeated failure / dup key), jest +
   mocked NetInfo.

Effort: ~3–4 dev-days. Depends on Phase 1 (idempotency needs server tests).

---

## Phase 5 — Real COGS in reports (quick win)

`sale_items.buying_price` already exists (migration `20260409000001`). Replace
the hardcoded 20% margin in `/api/reports/product-performance`
(`routes/reports.ts`) with `SUM((unit_price − buying_price) × quantity)`;
fall back to product's current buying price where the snapshot is null
(pre-migration rows). While in the file, extract `reports.ts` (1,768 lines)
into `services/reports/` modules (sales-summary, product-performance,
inventory) — pure refactor, behavior pinned by new tests first.

Effort: ~1–2 dev-days.

---

## Phase 6 — Platform hardening (parallelizable, lower urgency)

| Item | Action |
|---|---|
| Reproducible builds | Commit lockfiles; adopt npm workspaces (root `workspaces: ["server","client","mobile-admin","mobile-client"]`); CI uses `npm ci` |
| CI coverage | Add mobile type-check + jest jobs to `.github/workflows/ci.yml`; lint as soft gate after one `--fix` cleanup pass (216 pre-existing problems) |
| Observability | `pino` structured logs + Sentry (server + both Expo apps); alert on 5xx rate and stuck `pending` mpesa transactions |
| Auth | Short-lived access token (15 min) + rotating refresh token (httpOnly cookie on web, SecureStore on mobile); optional TOTP 2FA for admin/super_admin |
| API hygiene | Pagination on `GET /api/orders` (`page`/`pageSize` are currently ignored); serialize DECIMALs as numbers via model getters so clients drop `Number()` coercion |
| Client bundle | Route-level `React.lazy` splitting (1.9 MB single chunk today) |
| Dependencies | Replace vulnerable `xlsx` (no fix exists) with `exceljs` in `routes/reports.ts` exports |

Effort: ~4–6 dev-days spread out; none block Phases 1–5.

---

## Phase 7 — AI assistant (OpenRouter, provider-agnostic)

**Status: first ticket SHIPPED** — staff NL analytics over live store data.

Architecture (all under `server/src/services/ai/`):
- `aiClient.ts` — OpenAI-compatible client → OpenRouter, env-driven
  (`AI_ENABLED/AI_BASE_URL/AI_API_KEY/AI_MODEL/AI_MODEL_FALLBACK/...`),
  per-request timeout, primary→fallback model chain, **gracefully disabled when
  no key** (endpoints return 503; dev/CI unaffected).
- `tools/` — `get_sales_summary`, `get_top_products`, `get_inventory_status`,
  `get_expenses_summary`. Each wraps Sequelize queries **scoped through
  `storeScope(req.user)`** — the model cannot reach another store's data
  regardless of prompt. `period.ts` resolves named windows in Nairobi time.
- `agent.ts` — tool-calling loop, max 5 iterations, tool errors fed back to the
  model (never crash), completion fn injectable for tests.
- `guardrails.ts` — role gating (`STAFF_ROLES`, clients excluded) + a system
  prompt that forbids inventing numbers and scopes the user to their store.
- `routes/ai.ts` — `GET /api/ai/status`, `POST /api/ai/chat`
  (requireAuth + store context + staff role, Zod-validated, dedicated 20/min
  rate limit, PII-minimised audit log).
- Web: `client/src/components/ai/AssistantWidget.tsx` — floating, staff-only,
  status-gated chat; `services/aiService.ts`.
- 21 server tests (period math, role gating, prompt, agent loop). `.env.example`
  documents all `AI_*` vars.

**Next tickets (not built):**
1. Reorder suggestions tool (sales velocity + StockLog + Supplier).
2. Product description / auto-categorisation on add (good free-model job).
3. Daily insight push via the Notification model (cron → summary).
4. Customer-facing assistant in mobile-client — separate, higher guardrails:
   catalog RAG, `getMyOrders` tool, strict refusal of off-catalog requests.
5. Mobile-admin assistant reusing the same `/api/ai/chat` endpoint.

**Operational notes:** free OpenRouter models log/train on prompts and have weak
tool-calling — use them only for low-stakes internal generation; point
`AI_MODEL` at a reliable paid model for the tool-calling agent and anything
customer-facing. Depends on Phase 1 (the validated, tested service layer the
tools wrap) and synergises with Phase 5 (report services become tools).

Effort to date: ~1.5 dev-days. Remaining tickets ~1–2 days each.

---

## Sequencing

```
Phase 1 ──► Phase 2 (M-Pesa) ──► POS STK follow-up
   │              │
   ├────────► Phase 3 (refunds/VAT)
   ├────────► Phase 4 (offline POS)
   └────────► Phase 5 (COGS) — anytime
Phase 6 — parallel, anytime
```

**Recommended order: 1 → 2 → 5 → 3 → 4 → 6**, on the rationale that payments
are the revenue feature (and the user-requested one), COGS is a near-free win
after Phase 1, refunds are operationally urgent, and offline mode is the
largest mobile effort.

## Risks

- **Daraja callbacks need public HTTPS** — contabo host must be fronted by
  nginx + TLS before sandbox testing can complete.
- **No lockfiles until Phase 6** — any phase can be perturbed by upstream
  releases; consider pulling the lockfile commit forward.
- **GitHub Actions is billing-locked** — CI can't gate merges until the
  account is unlocked; local clean-room verification (documented in this
  repo's history) is the stopgap.
