import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export interface AgentProposal {
  name: string;
  args: Record<string, unknown>;
  summary: string;
}

export type AgentMessageResult =
  | { status: "replied"; reply: string; threadId: string }
  | { status: "approval_required"; proposal: AgentProposal; threadId: string };

export interface AgentDecisionResult {
  status: "executed" | "cancelled";
  reply: string;
  threadId: string;
}

function serverErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}

/** Sends one chat turn to the AI assistant and surfaces server error text. */
export async function sendAgentMessage(
  message: string,
  threadId?: string,
): Promise<AgentMessageResult> {
  try {
    const response = await api.post(API_ENDPOINTS.agent.message, { message, threadId });
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    throw new Error(serverErrorMessage(error, "Assistant request failed"));
  }
}

/** Approves or rejects a pending write proposal. */
export async function resumeAgentDecision(
  threadId: string,
  approved: boolean,
): Promise<AgentDecisionResult> {
  try {
    const response = await api.post(API_ENDPOINTS.agent.resume, { threadId, approved });
    return response.data?.data ?? response.data;
  } catch (error: unknown) {
    throw new Error(serverErrorMessage(error, "Assistant decision failed"));
  }
}
