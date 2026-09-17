import { ChatOpenAI } from "@langchain/openai";

export type LlmProvider = "openai" | "zen";

/** OpenCode Zen gateway. ChatOpenAI speaks /chat/completions under this base. */
export const ZEN_BASE_URL = "https://opencode.ai/zen/v1";

/**
 * Default model. Served on Zen's Responses API, so AGENT_RESPONSES_API
 * defaults to true. Chat/completions models (e.g. kimi-k2.5) need
 * AGENT_RESPONSES_API=false instead.
 */
export const ZEN_DEFAULT_MODEL = "muse-spark-1.3-contributor-free";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  baseURL?: string;
  model: string;
  useResponsesApi: boolean;
}

/** Master switch for the AI assistant. Off by default. */
export function isAgentEnabled(): boolean {
  return process.env.AGENT_ENABLED === "true";
}

/**
 * Pure provider resolution (takes env explicitly so it is unit-testable).
 * An OpenCode Zen key takes precedence when set; otherwise a plain
 * OPENAI_API_KEY keeps the previous default-OpenAI behaviour.
 */
export function resolveLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig | null {
  if (env.AGENT_ENABLED !== "true") return null;
  if (env.OPENCODE_ZEN_API_KEY) {
    return {
      provider: "zen",
      apiKey: env.OPENCODE_ZEN_API_KEY,
      baseURL: env.AGENT_BASE_URL || ZEN_BASE_URL,
      model: env.AGENT_MODEL || ZEN_DEFAULT_MODEL,
      // The default model is Responses-API-only; explicit "false" required
      // for chat/completions models such as kimi-k2.5.
      useResponsesApi: env.AGENT_RESPONSES_API ? env.AGENT_RESPONSES_API === "true" : true,
    };
  }
  if (env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: env.OPENAI_API_KEY,
      model: env.AGENT_MODEL || "gpt-4o-mini",
      useResponsesApi: env.AGENT_RESPONSES_API === "true",
    };
  }
  return null;
}

/**
 * Returns a chat model when an API key is configured, otherwise null.
 * Without a model the graph runs in deterministic stub mode (keyword router
 * + direct tool calls), which keeps CI and offline environments green.
 */
export function getChatModel(): ChatOpenAI | null {
  const config = resolveLlmConfig();
  if (!config) return null;
  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    temperature: 0,
    useResponsesApi: config.useResponsesApi,
    ...(config.baseURL ? { configuration: { baseURL: config.baseURL } } : {}),
  });
}
