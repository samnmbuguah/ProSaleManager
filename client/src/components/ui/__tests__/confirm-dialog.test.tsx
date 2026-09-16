import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialogProvider, useConfirm } from "../confirm-dialog";

function Trigger({ destructive = false }: { destructive?: boolean }) {
  const confirm = useConfirm();
  return (
    <button
      onClick={async () => {
        const result = await confirm({
          title: "Delete item?",
          description: "This cannot be undone.",
          confirmText: "Delete",
          destructive,
        });
        document.title = result ? "confirmed" : "cancelled";
      }}
    >
      Open
    </button>
  );
}

function renderWithProvider(ui: React.ReactNode) {
  return render(<ConfirmDialogProvider>{ui}</ConfirmDialogProvider>);
}

describe("ConfirmDialogProvider", () => {
  it("resolves true when the confirm action is clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger destructive />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Delete item?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(document.title).toBe("confirmed"));
  });

  it("resolves false when the cancel action is clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Delete item?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(document.title).toBe("cancelled"));
  });

  it("renders the provided description", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("This cannot be undone.")).toBeInTheDocument();
  });
});
