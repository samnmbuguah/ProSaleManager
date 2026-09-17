import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { agentMessageSchema } from "../validation/schemas.js";
import { isAgentEnabled } from "../services/agent/llm.js";
import { runAgent } from "../services/agent/graph.js";

const router = Router();

router.use(requireAuth);

/**
 * POST /api/agent/message
 * Body: { message: string, threadId?: string }
 * Phase 0: read-only assistant (sales summary, inventory, product search).
 * Disabled with 503 unless AGENT_ENABLED=true.
 */
router.post("/message", validate(agentMessageSchema), async (req, res) => {
  if (!isAgentEnabled()) {
    return res.status(503).json({
      success: false,
      message: "AI assistant is disabled. Set AGENT_ENABLED=true to enable it.",
    });
  }

  const { message, threadId } = req.body as { message: string; threadId?: string };

  try {
    const result = await runAgent({
      message,
      threadId,
      storeId: req.user?.store_id ?? null,
      userId: req.user?.id ?? 0,
      role: req.user?.role ?? "client",
    });
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: "Agent request failed" });
  }
});

export default router;
