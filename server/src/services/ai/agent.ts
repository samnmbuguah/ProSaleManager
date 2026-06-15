import { chatCompletion, ChatMessage, ChatResult, ToolDefinition } from "./aiClient.js";
import { AiTool, ToolContext } from "./tools/analyticsTools.js";

const MAX_ITERATIONS = 5;

/** Signature of the model-completion call; injectable for testing. */
export type CompleteFn = (opts: {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
}) => Promise<ChatResult>;

export interface AgentInput {
  system: string;
  history: ChatMessage[];
  userMessage: string;
  tools: AiTool[];
  ctx: ToolContext;
  /** Override the provider call (tests inject a stub). Defaults to the real client. */
  complete?: CompleteFn;
}

export interface AgentResult {
  reply: string;
  toolsUsed: string[];
}

/**
 * Runs the tool-calling loop: the model may call any of the supplied tools
 * (which are already store-scoped to `ctx`), we execute them, feed results
 * back, and repeat until the model produces a final answer or we hit the
 * iteration cap. A tool that throws returns its error to the model so it can
 * recover or explain, rather than crashing the request.
 */
export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const complete = input.complete ?? chatCompletion;
  const toolMap = new Map(input.tools.map((t) => [t.definition.function.name, t]));
  const toolDefs = input.tools.map((t) => t.definition);

  const messages: ChatMessage[] = [
    { role: "system", content: input.system },
    ...input.history,
    { role: "user", content: input.userMessage },
  ];

  const toolsUsed: string[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const { message } = await complete({ messages, tools: toolDefs });

    if (!message.tool_calls?.length) {
      return { reply: message.content?.trim() || "", toolsUsed };
    }

    // Record the assistant's tool-call request verbatim before answering it.
    messages.push(message);

    for (const call of message.tool_calls) {
      const tool = toolMap.get(call.function.name);
      let content: string;
      try {
        if (!tool) throw new Error(`Unknown tool: ${call.function.name}`);
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        const data = await tool.run(args, input.ctx);
        content = JSON.stringify(data);
        toolsUsed.push(call.function.name);
      } catch (err) {
        content = JSON.stringify({ error: (err as Error).message || "tool failed" });
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content,
      });
    }
  }

  return {
    reply: "I couldn't complete that request — please try rephrasing it more specifically.",
    toolsUsed,
  };
}
