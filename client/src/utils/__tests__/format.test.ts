import { describe, it, expect } from "vitest";
import { formatCurrency } from "../format";

describe("formatCurrency (Intl)", () => {
  it("should format a number as KES currency", () => {
    expect(formatCurrency(100)).toContain("100.00");
    expect(formatCurrency(99.99)).toContain("99.99");
  });

  it("should handle null and undefined", () => {
    expect(formatCurrency(null)).toBe("N/A");
    expect(formatCurrency(undefined)).toBe("N/A");
  });

  it("should handle zero", () => {
    expect(formatCurrency(0)).toContain("0.00");
  });

  it("should handle negative numbers", () => {
    const result = formatCurrency(-50);
    expect(result).toContain("50.00");
    expect(result).toContain("-");
  });

  it("should handle large numbers", () => {
    expect(formatCurrency(1000000)).toContain("1,000,000.00");
  });

  it("should always show 2 decimal places", () => {
    expect(formatCurrency(100.5)).toContain("100.50");
    expect(formatCurrency(100)).toContain("100.00");
  });
});
