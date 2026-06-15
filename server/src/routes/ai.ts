import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth, attachStoreIdToUser, requireRole } from "../middleware/auth.middleware.js";
import { requireStoreContext } from "../middleware/store-context.middleware.js";
import { isAiEnabled, AiError, ChatMessage } from "../services/ai/aiClient.js";
import { runAgent } from "../services/ai/agent.js";
import { buildSystemPrompt, toolsForRole, STAFF_ROLES, isStaff } from "../services/ai/guardrails.js";

const router = Router();

// Stricter limit than the global one: LLM calls are expensive.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many AI requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(10)
    .optional(),
});

/** Lightweight capability probe so clients can show/hide the assistant. */
router.get("/status", requireAuth, (req, res) => {
  res.json({ enabled: isAiEnabled() && isStaff(req.user?.role) });
});

router.post(
  "/chat",
  aiLimiter,
  requireAuth,
  attachStoreIdToUser,
  requireStoreContext,
  requireRole(STAFF_ROLES),
  async (req, res) => {
    if (!isAiEnabled()) {
      return res.status(503).json({ message: "AI assistant is not enabled on this server." });
    }

    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = req.user!;
    const tools = toolsForRole(user.role);
    const today = new Date().toISOString().slice(0, 10);
    const system = buildSystemPrompt(
      { name: user.name, role: user.role, storeName: req.store?.name },
      today,
    );

    const history: ChatMessage[] = (parsed.data.history || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const startedAt = Date.now();
    try {
      const { reply, toolsUsed } = await runAgent({
        system,
        history,
        userMessage: parsed.data.message,
        tools,
        ctx: { id: user.id, role: user.role, store_id: user.store_id },
      });

      // Audit (PII-minimised: preview only).
      console.info(
        JSON.stringify({
          ai: "chat",
          userId: user.id,
          role: user.role,
          storeId: user.store_id ?? null,
          preview: parsed.data.message.slice(0, 120),
          toolsUsed,
          ms: Date.now() - startedAt,
        }),
      );

      res.json({ reply, toolsUsed });
    } catch (err) {
      const status = err instanceof AiError ? err.status : 500;
      console.error("AI chat error:", (err as Error).message);
      res.status(status).json({ message: (err as Error).message || "AI request failed" });
    }
  },
);

export default router;
