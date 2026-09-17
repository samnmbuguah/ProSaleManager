/**
 * Live smoke test for the assistant's LLM wiring (OpenCode Zen gateway).
 *
 * Usage (from server/):  AGENT_ENABLED=true npm run agent:smoke
 * Sends one tiny prompt and prints the reply. Costs a few tokens.
 * Never prints credentials — only provider, model, and reply text.
 */
import dotenv from "dotenv";

dotenv.config();

import { HumanMessage } from "@langchain/core/messages";
import { getChatModel, resolveLlmConfig } from "../src/services/agent/llm.js";

async function main(): Promise<void> {
  const config = resolveLlmConfig();
  if (!config) {
    console.error(
      "No model configured. Set AGENT_ENABLED=true and OPENCODE_ZEN_API_KEY (or OPENAI_API_KEY).",
    );
    process.exit(2);
  }
  console.log(`Provider: ${config.provider} | model: ${config.model}`);

  const model = getChatModel();
  if (!model) {
    console.error("getChatModel() returned null despite a resolved config.");
    process.exit(2);
  }

  const response = await model.invoke([
    new HumanMessage("Reply with exactly: SMOKE-OK and nothing else."),
  ]);
  const text =
    typeof response.content === "string" ? response.content : JSON.stringify(response.content);
  console.log(`Reply: ${text}`);

  if (!text.includes("SMOKE-OK")) {
    console.error("Wiring works, but the model did not follow instructions.");
    process.exit(1);
  }
  console.log("Smoke test passed.");
}

main().catch((error: unknown) => {
  console.error("Smoke test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
