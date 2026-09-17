import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { agentMessageSchema, agentResumeSchema } from "../validation/schemas.js";
import { isAgentEnabled } from "../services/agent/llm.js";
import { AgentResumeError, resumeAgent, runAgent } from "../services/agent/graph.js";

const router = Router();

router.use(requireAuth);

function agentDisabled(res: import("express").Response) {
  return res.status(503).json({
    success: false,
    message: "AI assistant is disabled. Set AGENT_ENABLED=true to enable it.",
  });
}

/**
 * POST /api/agent/message
 * Body: { message: string, threadId?: string }
 * Returns either a reply or an approval_required proposal for write actions.
 * Disabled with 503 unless AGENT_ENABLED=true.
 */
router.post("/message", validate(agentMessageSchema), async (req, res) => {
  if (!isAgentEnabled()) {
    return agentDisabled(res);
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

/**
 * POST /api/agent/resume
 * Body: { threadId: string, approved: boolean }
 * Decides a pending write proposal. Re-checks store ownership and role.
 */
router.post("/resume", validate(agentResumeSchema), async (req, res) => {
  if (!isAgentEnabled()) {
    return agentDisabled(res);
  }

  const { threadId, approved } = req.body as { threadId: string; approved: boolean };

  try {
    const result = await resumeAgent({
      threadId,
      approved,
      decidedBy: req.user?.id ?? 0,
      storeId: req.user?.store_id ?? null,
      role: req.user?.role ?? "client",
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AgentResumeError) {
      const status = error.code === "NO_PENDING" ? 404 : 403;
      return res.status(status).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Agent request failed" });
  }
});

export default router;
