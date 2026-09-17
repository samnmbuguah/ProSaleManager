import { ChatOpenAI } from "@langchain/openai";

/** Master switch for the AI assistant. Off by default. */
export function isAgentEnabled(): boolean {
  return process.env.AGENT_ENABLED === "true";
}

/**
 * Returns a chat model when an API key is configured, otherwise null.
 * Without a model the graph runs in deterministic stub mode (keyword router
 * + direct tool calls), which keeps CI and offline environments green.
 */
export function getChatModel(): ChatOpenAI | null {
  if (!isAgentEnabled() || !process.env.OPENAI_API_KEY) {
    return null;
  }
  return new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.AGENT_MODEL ?? "gpt-4o-mini",
    temperature: 0,
  });
}
