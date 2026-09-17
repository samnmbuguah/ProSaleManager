import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { sendAgentMessage } from "../agentService";

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
      data: { success: true, data: { reply: "Hello!", threadId: "t-1" } },
    });

    const result = await sendAgentMessage("Hi", "t-1");

    expect(post).toHaveBeenCalledWith(API_ENDPOINTS.agent.message, {
      message: "Hi",
      threadId: "t-1",
    });
    expect(result).toEqual({ reply: "Hello!", threadId: "t-1" });
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
