import axios, { AxiosInstance } from "axios";

/**
 * Provider-agnostic chat client speaking the OpenAI Chat Completions API,
 * pointed at OpenRouter by default. Everything is env-driven so the model can
 * be swapped (free model in dev, reliable paid model in production) without a
 * code change.
 *
 *   AI_ENABLED       "true" to turn the feature on (defaults to enabled when a
 *                    key is present, disabled otherwise — so dev/CI without a
 *                    key degrade gracefully instead of crashing).
 *   AI_BASE_URL      default https://openrouter.ai/api/v1
 *   AI_API_KEY       OpenRouter API key
 *   AI_MODEL         primary model id, e.g. "openai/gpt-4o-mini"
 *   AI_MODEL_FALLBACK optional second model tried if the primary errors
 *   AI_TIMEOUT_MS    per-request timeout (default 30000)
 *   AI_SITE_URL / AI_APP_NAME  OpenRouter attribution headers (optional)
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  // assistant tool-call requests
  tool_calls?: ToolCall[];
  // tool result messages
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatResult {
  message: ChatMessage;
  finishReason: string;
}

export function isAiEnabled(): boolean {
  const flag = process.env.AI_ENABLED;
  if (flag === "true") return true;
  if (flag === "false") return false;
  // Auto: enabled only when a key is configured.
  return Boolean(process.env.AI_API_KEY);
}

function getConfig() {
  return {
    baseUrl: process.env.AI_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.AI_API_KEY || "",
    model: process.env.AI_MODEL || "openai/gpt-4o-mini",
    fallback: process.env.AI_MODEL_FALLBACK || "",
    timeout: Number(process.env.AI_TIMEOUT_MS) || 30000,
    siteUrl: process.env.AI_SITE_URL || "",
    appName: process.env.AI_APP_NAME || "ProSaleManager",
  };
}

let cachedHttp: AxiosInstance | null = null;
let cachedKey = "";

function http(): AxiosInstance {
  const cfg = getConfig();
  // Rebuild if the key/base changed (e.g. tests mutating env).
  if (!cachedHttp || cachedKey !== `${cfg.baseUrl}|${cfg.apiKey}`) {
    cachedHttp = axios.create({
      baseURL: cfg.baseUrl,
      timeout: cfg.timeout,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter attribution (harmless against other OpenAI-compatible APIs)
        ...(cfg.siteUrl ? { "HTTP-Referer": cfg.siteUrl } : {}),
        "X-Title": cfg.appName,
      },
    });
    cachedKey = `${cfg.baseUrl}|${cfg.apiKey}`;
  }
  return cachedHttp;
}

export class AiError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
    this.name = "AiError";
  }
}

interface ChatOptions {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
}

async function callModel(model: string, opts: ChatOptions): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }

  const res = await http().post("/chat/completions", body);
  const choice = res.data?.choices?.[0];
  if (!choice) throw new AiError("AI provider returned no choices");
  return {
    message: choice.message as ChatMessage,
    finishReason: choice.finish_reason || "stop",
  };
}

/**
 * Single chat completion turn. Tries the primary model, then the fallback (if
 * configured) on transient/provider errors. Throws AiError on failure.
 */
export async function chatCompletion(opts: ChatOptions): Promise<ChatResult> {
  if (!isAiEnabled()) {
    throw new AiError("AI assistant is not enabled on this server", 503);
  }
  const cfg = getConfig();
  if (!cfg.apiKey) throw new AiError("AI assistant is not configured", 503);

  const models = [cfg.model, cfg.fallback].filter(Boolean);
  let lastErr: unknown;
  for (const model of models) {
    try {
      return await callModel(model, opts);
    } catch (err) {
      lastErr = err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // Retry on the fallback only for provider-side / rate-limit failures.
      if (status && status >= 400 && status < 429 && status !== 408) break;
    }
  }
  const detail = axios.isAxiosError(lastErr)
    ? lastErr.response?.data?.error?.message || lastErr.message
    : (lastErr as Error)?.message;
  throw new AiError(`AI request failed: ${detail || "unknown error"}`);
}
