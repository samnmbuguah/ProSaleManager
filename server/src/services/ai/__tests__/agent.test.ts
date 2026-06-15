import { jest } from "@jest/globals";
import { runAgent, CompleteFn } from "../agent.js";
import type { ChatResult } from "../aiClient.js";
import type { AiTool } from "../tools/analyticsTools.js";

const ctx = { id: 1, role: "admin", store_id: 7 };

function toolCallTurn(name: string, args: object): ChatResult {
  return {
    finishReason: "tool_calls",
    message: {
      role: "assistant",
      content: null,
      tool_calls: [{ id: "c1", type: "function", function: { name, arguments: JSON.stringify(args) } }],
    },
  };
}

function finalTurn(text: string): ChatResult {
  return { finishReason: "stop", message: { role: "assistant", content: text } };
}

function makeTool(name: string, run: AiTool["run"]): AiTool {
  return {
    definition: {
      type: "function",
      function: { name, description: "test tool", parameters: { type: "object", properties: {} } },
    },
    run,
  };
}

describe("runAgent", () => {
  it("executes a requested tool and returns the model's final answer", async () => {
    const run = jest.fn<AiTool["run"]>().mockResolvedValue({ totalRevenue: 5000 });
    const tool = makeTool("get_sales_summary", run);
    const complete = jest
      .fn<CompleteFn>()
      .mockResolvedValueOnce(toolCallTurn("get_sales_summary", { period: "today" }))
      .mockResolvedValueOnce(finalTurn("Revenue today was KSh 5,000.00."));

    const res = await runAgent({
      system: "sys",
      history: [],
      userMessage: "revenue today?",
      tools: [tool],
      ctx,
      complete,
    });

    expect(run).toHaveBeenCalledWith({ period: "today" }, ctx);
    expect(res.toolsUsed).toEqual(["get_sales_summary"]);
    expect(res.reply).toContain("KSh 5,000.00");
  });

  it("answers directly when the model needs no tool", async () => {
    const complete = jest
      .fn<CompleteFn>()
      .mockResolvedValueOnce(finalTurn("I can help with sales, stock and expenses."));
    const res = await runAgent({
      system: "sys",
      history: [],
      userMessage: "hi",
      tools: [],
      ctx,
      complete,
    });
    expect(res.toolsUsed).toEqual([]);
    expect(res.reply).toMatch(/help/);
  });

  it("feeds a tool error back to the model instead of crashing", async () => {
    const tool = makeTool(
      "get_inventory_status",
      jest.fn<AiTool["run"]>().mockRejectedValue(new Error("db down")),
    );
    const complete = jest
      .fn<CompleteFn>()
      .mockResolvedValueOnce(toolCallTurn("get_inventory_status", {}))
      .mockResolvedValueOnce(finalTurn("Sorry, inventory data is unavailable right now."));

    const res = await runAgent({
      system: "sys",
      history: [],
      userMessage: "low stock?",
      tools: [tool],
      ctx,
      complete,
    });

    // A failing tool is not recorded as used, but the request still completes.
    expect(res.toolsUsed).toEqual([]);
    expect(res.reply).toMatch(/unavailable/);
    const secondCall = complete.mock.calls[1][0];
    expect(
      secondCall.messages.some((m) => m.role === "tool" && (m.content || "").includes("db down")),
    ).toBe(true);
  });

  it("rejects an unknown tool name without crashing", async () => {
    const complete = jest
      .fn<CompleteFn>()
      .mockResolvedValueOnce(toolCallTurn("nonexistent_tool", {}))
      .mockResolvedValueOnce(finalTurn("done"));
    const res = await runAgent({
      system: "sys",
      history: [],
      userMessage: "x",
      tools: [],
      ctx,
      complete,
    });
    expect(res.reply).toBe("done");
    const secondCall = complete.mock.calls[1][0];
    expect(secondCall.messages.some((m) => (m.content || "").includes("Unknown tool"))).toBe(true);
  });

  it("stops after the iteration cap if the model keeps calling tools", async () => {
    const tool = makeTool("get_sales_summary", jest.fn<AiTool["run"]>().mockResolvedValue({ ok: true }));
    const complete = jest.fn<CompleteFn>().mockResolvedValue(toolCallTurn("get_sales_summary", {}));

    const res = await runAgent({
      system: "sys",
      history: [],
      userMessage: "loop",
      tools: [tool],
      ctx,
      complete,
    });
    expect(res.reply).toMatch(/rephrasing/);
    expect(complete.mock.calls.length).toBeLessThanOrEqual(5);
  });
});
