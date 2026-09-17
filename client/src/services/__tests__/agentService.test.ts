import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { resumeAgentDecision, sendAgentMessage } from "../agentService";

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn() },
}));

const post = api.post as unknown as ReturnType<typeof vi.fn>;

describe("sendAgentMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the message and thread id and returns the reply", async () => {
    post.mockResolvedValue({
      data: { success: true, data: { status: "replied", reply: "Hello!", threadId: "t-1" } },
    });

    const result = await sendAgentMessage("Hi", "t-1");

    expect(post).toHaveBeenCalledWith(API_ENDPOINTS.agent.message, {
      message: "Hi",
      threadId: "t-1",
    });
    expect(result).toEqual({ status: "replied", reply: "Hello!", threadId: "t-1" });
  });

  it("passes approval proposals through", async () => {
    const proposal = { name: "create_expense", args: { amount: 500 }, summary: "Create expense" };
    post.mockResolvedValue({
      data: { success: true, data: { status: "approval_required", proposal, threadId: "t-2" } },
    });

    const result = await sendAgentMessage("Add expense 500");

    expect(result).toEqual({ status: "approval_required", proposal, threadId: "t-2" });
  });

  it("surfaces the server error message", async () => {
    post.mockRejectedValue({ response: { data: { message: "AI assistant is disabled." } } });

    await expect(sendAgentMessage("Hi")).rejects.toThrow("AI assistant is disabled.");
  });

  it("falls back to a generic message for network errors", async () => {
    post.mockRejectedValue(new Error("Network Error"));

    await expect(sendAgentMessage("Hi")).rejects.toThrow("Network Error");
  });
});

describe("resumeAgentDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the decision and returns the outcome", async () => {
    post.mockResolvedValue({
      data: { success: true, data: { status: "executed", reply: "Done.", threadId: "t-1" } },
    });

    const result = await resumeAgentDecision("t-1", true);

    expect(post).toHaveBeenCalledWith(API_ENDPOINTS.agent.resume, {
      threadId: "t-1",
      approved: true,
    });
    expect(result).toEqual({ status: "executed", reply: "Done.", threadId: "t-1" });
  });

  it("surfaces server errors", async () => {
    post.mockRejectedValue({ response: { data: { message: "No pending approval" } } });

    await expect(resumeAgentDecision("t-9", true)).rejects.toThrow("No pending approval");
  });
});
