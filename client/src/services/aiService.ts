import { api } from "../lib/api";
import { API_ENDPOINTS } from "../lib/api-endpoints";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatResponse {
  reply: string;
  toolsUsed: string[];
}

export const aiService = {
  /** Whether the assistant is enabled for the current user (server gates by role + config). */
  getStatus: async (): Promise<boolean> => {
    try {
      const res = await api.get<{ enabled: boolean }>(API_ENDPOINTS.ai.status);
      return Boolean(res.data?.enabled);
    } catch {
      return false;
    }
  },

  /** Send a message with recent history; returns the assistant's reply. */
  chat: async (message: string, history: AiChatMessage[]): Promise<AiChatResponse> => {
    const res = await api.post<AiChatResponse>(API_ENDPOINTS.ai.chat, {
      message,
      history: history.slice(-10),
    });
    return res.data;
  },
};
