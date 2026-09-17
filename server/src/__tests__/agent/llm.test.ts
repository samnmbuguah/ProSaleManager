import { ChatOpenAI } from "@langchain/openai";
import {
  ZEN_BASE_URL,
  ZEN_DEFAULT_MODEL,
  getChatModel,
  resolveLlmConfig,
} from "../../services/agent/llm.js";

const KEYS = [
  "AGENT_ENABLED",
  "OPENCODE_ZEN_API_KEY",
  "OPENAI_API_KEY",
  "AGENT_BASE_URL",
  "AGENT_MODEL",
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const key of KEYS) snap[key] = process.env[key];
  return snap;
}

function restoreEnv(snap: Record<string, string | undefined>) {
  for (const key of KEYS) {
    if (snap[key] === undefined) delete process.env[key];
    else process.env[key] = snap[key];
  }
}

describe("resolveLlmConfig", () => {
  it("returns null when the agent flag is off", () => {
    expect(resolveLlmConfig({ AGENT_ENABLED: "false", OPENCODE_ZEN_API_KEY: "sk-x" })).toBeNull();
    expect(resolveLlmConfig({})).toBeNull();
  });

  it("returns null when enabled but no key is set", () => {
    expect(resolveLlmConfig({ AGENT_ENABLED: "true" })).toBeNull();
  });

  it("prefers the Zen key with Zen defaults", () => {
    expect(
      resolveLlmConfig({ AGENT_ENABLED: "true", OPENCODE_ZEN_API_KEY: "sk-zen" }),
    ).toEqual({
      provider: "zen",
      apiKey: "sk-zen",
      baseURL: ZEN_BASE_URL,
      model: ZEN_DEFAULT_MODEL,
    });
  });

  it("honours custom Zen base URL and model, ignoring blanks", () => {
    expect(
      resolveLlmConfig({
        AGENT_ENABLED: "true",
        OPENCODE_ZEN_API_KEY: "sk-zen",
        AGENT_BASE_URL: "https://proxy.local/zen",
        AGENT_MODEL: "",
      }),
    ).toMatchObject({
      provider: "zen",
      baseURL: "https://proxy.local/zen",
      model: ZEN_DEFAULT_MODEL,
    });
  });

  it("falls back to plain OpenAI", () => {
    expect(
      resolveLlmConfig({ AGENT_ENABLED: "true", OPENAI_API_KEY: "sk-openai" }),
    ).toEqual({ provider: "openai", apiKey: "sk-openai", model: "gpt-4o-mini" });
  });
});

describe("getChatModel", () => {
  const saved = snapshotEnv();

  beforeEach(() => {
    restoreEnv({ ...saved, AGENT_ENABLED: undefined, OPENCODE_ZEN_API_KEY: undefined, OPENAI_API_KEY: undefined });
  });

  afterEach(() => {
    restoreEnv(saved);
  });

  it("returns null without a key", () => {
    process.env.AGENT_ENABLED = "true";
    expect(getChatModel()).toBeNull();
  });

  it("builds a ChatOpenAI instance for Zen", () => {
    process.env.AGENT_ENABLED = "true";
    process.env.OPENCODE_ZEN_API_KEY = "sk-zen-test";
    expect(getChatModel()).toBeInstanceOf(ChatOpenAI);
  });
});
