import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ResponsiveTable,
  createTextColumn,
  createCurrencyColumn,
  createBadgeColumn,
} from "../responsive-table";

interface Row {
  id: number;
  name: string;
  price: number;
  status: string;
}

const rows: Row[] = [
  { id: 1, name: "Sugar", price: 150, status: "active" },
  { id: 2, name: "Rice", price: 220, status: "inactive" },
];

const columns = [
  createTextColumn<Row>("name", "Name", (r) => r.name, { priority: 2 }),
  createCurrencyColumn<Row>("price", "Price", (r) => r.price, { priority: 1 }),
  createBadgeColumn<Row>("status", "Status", (r) => r.status),
];

describe("ResponsiveTable", () => {
  it("renders the empty message when there is no data", () => {
    render(<ResponsiveTable data={[]} columns={columns} keyExtractor={(r) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders column labels and row values in the desktop table", () => {
    render(<ResponsiveTable data={rows} columns={columns} keyExtractor={(r) => r.id} />);
    expect(screen.getAllByText("Name").length).toBeGreaterThan(0);
    // Each row renders in both the desktop table and the mobile card view.
    expect(screen.getAllByText("Sugar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rice").length).toBeGreaterThan(0);
  });

  it("renders the title and description when provided", () => {
    render(
      <ResponsiveTable
        data={rows}
        columns={columns}
        keyExtractor={(r) => r.id}
        title="Inventory"
        description="All products"
      />,
    );
    expect(screen.getAllByText("Inventory").length).toBeGreaterThan(0);
    expect(screen.getAllByText("All products").length).toBeGreaterThan(0);
  });

  it("formats currency values with a KSh prefix", () => {
    render(<ResponsiveTable data={rows} columns={columns} keyExtractor={(r) => r.id} />);
    expect(screen.getAllByText(/KSh\s*150/).length).toBeGreaterThan(0);
  });

  it("hides columns flagged hideOnMobile from the mobile card view", () => {
    const cols = [
      createTextColumn<Row>("name", "Name", (r) => r.name),
      createTextColumn<Row>("secret", "Secret", () => "hidden-value", { hideOnMobile: true }),
    ];
    render(<ResponsiveTable data={rows} columns={cols} keyExtractor={(r) => r.id} />);
    // Rendered once per row in the desktop table; excluded from the mobile card view.
    // If it were also rendered on mobile we would see 4 occurrences.
    expect(screen.getAllByText("hidden-value")).toHaveLength(rows.length);
  });

  it("uses a custom mobileRender when supplied", () => {
    const cols = [
      {
        key: "name",
        label: "Name",
        render: (r: Row) => <span>{r.name}</span>,
        mobileRender: (r: Row) => <strong>mobile-{r.name}</strong>,
      },
    ];
    render(<ResponsiveTable data={rows} columns={cols} keyExtractor={(r) => r.id} />);
    expect(screen.getByText("mobile-Sugar")).toBeInTheDocument();
  });
});
