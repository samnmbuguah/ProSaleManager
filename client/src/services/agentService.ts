import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export interface AgentReply {
  reply: string;
  threadId: string;
}

/** Sends one chat turn to the AI assistant and surfaces server error text. */
export async function sendAgentMessage(message: string, threadId?: string): Promise<AgentReply> {
  try {
    const response = await api.post(API_ENDPOINTS.agent.message, { message, threadId });
    const data = response.data?.data ?? response.data;
    return { reply: data.reply, threadId: data.threadId };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      (error instanceof Error ? error.message : "Assistant request failed");
    throw new Error(message);
  }
}
