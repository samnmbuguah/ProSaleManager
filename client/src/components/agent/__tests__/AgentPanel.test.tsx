import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentPanel } from "../AgentPanel";
import { resumeAgentDecision, sendAgentMessage } from "@/services/agentService";

vi.mock("@/services/agentService", () => ({
  sendAgentMessage: vi.fn(),
  resumeAgentDecision: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const sendMock = sendAgentMessage as unknown as ReturnType<typeof vi.fn>;
const resumeMock = resumeAgentDecision as unknown as ReturnType<typeof vi.fn>;

describe("AgentPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders a toggle and keeps the panel closed initially", async () => {
    const user = userEvent.setup();
    render(<AgentPanel />);

    expect(screen.getByRole("button", { name: "Open store assistant" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Ask the store assistant")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open store assistant" }));
    expect(screen.getByLabelText("Ask the store assistant")).toBeInTheDocument();
  });

  it("sends a message and renders the reply", async () => {
    const user = userEvent.setup();
    sendMock.mockResolvedValue({ status: "replied", reply: "3 sales this week.", threadId: "t-9" });
    render(<AgentPanel />);

    await user.click(screen.getByRole("button", { name: "Open store assistant" }));
    await user.type(screen.getByLabelText("Ask the store assistant"), "Sales this week");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(sendMock).toHaveBeenCalledWith("Sales this week", undefined);
    expect(await screen.findByText("3 sales this week.")).toBeInTheDocument();
    expect(localStorage.getItem("agent-thread-id")).toBe("t-9");
  });

  it("renders a proposal card and approves it", async () => {
    const user = userEvent.setup();
    sendMock.mockResolvedValue({
      status: "approval_required",
      proposal: {
        name: "create_expense",
        args: { description: "Transport", amount: 500 },
        summary: "Create expense: Transport — KSh 500.00",
      },
      threadId: "t-5",
    });
    resumeMock.mockResolvedValue({ status: "executed", reply: "Done.", threadId: "t-5" });
    render(<AgentPanel />);

    await user.click(screen.getByRole("button", { name: "Open store assistant" }));
    await user.type(screen.getByLabelText("Ask the store assistant"), "Add expense 500");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Needs your approval")).toBeInTheDocument();
    expect(screen.getByText(/Create expense: Transport/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Approve proposal" }));

    expect(resumeMock).toHaveBeenCalledWith("t-5", true);
    expect(await screen.findByText("Done.")).toBeInTheDocument();
    expect(screen.queryByText("Needs your approval")).not.toBeInTheDocument();
  });

  it("rejects a proposal", async () => {
    const user = userEvent.setup();
    sendMock.mockResolvedValue({
      status: "approval_required",
      proposal: { name: "create_expense", args: {}, summary: "Create expense" },
      threadId: "t-6",
    });
    resumeMock.mockResolvedValue({ status: "cancelled", reply: "Cancelled.", threadId: "t-6" });
    render(<AgentPanel />);

    await user.click(screen.getByRole("button", { name: "Open store assistant" }));
    await user.click(screen.getByText("Find sugar"));
    expect(await screen.findByText("Needs your approval")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reject proposal" }));

    expect(resumeMock).toHaveBeenCalledWith("t-6", false);
    expect(await screen.findByText("Cancelled.")).toBeInTheDocument();
  });

  it("shows an inline error when the request fails", async () => {
    const user = userEvent.setup();
    sendMock.mockRejectedValue(new Error("AI assistant is disabled."));
    render(<AgentPanel />);

    await user.click(screen.getByRole("button", { name: "Open store assistant" }));
    await user.click(screen.getByText("Find sugar"));

    expect(await screen.findByText(/AI assistant is disabled/)).toBeInTheDocument();
  });
});
