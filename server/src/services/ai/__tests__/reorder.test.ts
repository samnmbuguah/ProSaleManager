import { computeReorderRow } from "../tools/analyticsTools.js";

const base = { name: "Soap", sku: "SP1", quantity: 10, minimum: 5, buyingPrice: 50 };

describe("computeReorderRow", () => {
  it("computes velocity and days of stock left from sales over the window", () => {
    // 60 sold over 30 days = 2/day; 10 in stock → 5 days left.
    const r = computeReorderRow(base, 60, 30, 14);
    expect(r.dailyVelocity).toBe(2);
    expect(r.daysOfStockLeft).toBe(5);
  });

  it("suggests enough to cover the target days minus current stock", () => {
    // 2/day × 14 days = 28 target; have 10 → reorder 18.
    const r = computeReorderRow(base, 60, 30, 14);
    expect(r.suggestedReorderQty).toBe(18);
    expect(r.estimatedCost).toBe(18 * 50);
    expect(r.needsReorder).toBe(true);
  });

  it("flags a min-stock breach even with no recent sales", () => {
    const r = computeReorderRow({ ...base, quantity: 3, minimum: 5 }, 0, 30, 14);
    expect(r.daysOfStockLeft).toBeNull();
    expect(r.needsReorder).toBe(true);
    // No velocity → target 0, but suggestion lifts stock to the minimum.
    expect(r.suggestedReorderQty).toBe(2);
  });

  it("does not flag a well-stocked, fast-enough product", () => {
    // 1/day, 100 in stock → 100 days left, well above 14.
    const r = computeReorderRow({ ...base, quantity: 100 }, 30, 30, 14);
    expect(r.needsReorder).toBe(false);
    expect(r.suggestedReorderQty).toBe(0);
    expect(r.estimatedCost).toBe(0);
  });

  it("never suggests a negative quantity", () => {
    const r = computeReorderRow({ ...base, quantity: 1000, minimum: 5 }, 30, 30, 14);
    expect(r.suggestedReorderQty).toBe(0);
  });
});
