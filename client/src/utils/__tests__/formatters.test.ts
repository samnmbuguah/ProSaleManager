import { describe, it, expect } from "vitest";
import { formatCurrency } from "../formatters";

describe("formatCurrency", () => {
  it("should format a number as currency", () => {
    expect(formatCurrency(100)).toBe("KSh 100.00");
    expect(formatCurrency(99.99)).toBe("KSh 99.99");
    expect(formatCurrency(0)).toBe("KSh 0.00");
  });

  it("should handle negative numbers", () => {
    expect(formatCurrency(-50)).toBe("KSh -50.00");
    expect(formatCurrency(-0.01)).toBe("KSh -0.01");
  });

  it("should handle large numbers", () => {
    expect(formatCurrency(1000000)).toBe("KSh 1000000.00");
    expect(formatCurrency(999999.99)).toBe("KSh 999999.99");
  });

  it("should handle decimal precision correctly", () => {
    expect(formatCurrency(100.5)).toBe("KSh 100.50");
    expect(formatCurrency(100.123)).toBe("KSh 100.12");
    expect(formatCurrency(100.999)).toBe("KSh 101.00");
  });

  it("should handle NaN and Infinity gracefully", () => {
    expect(formatCurrency(NaN)).toBe("KSh NaN");
    expect(formatCurrency(Infinity)).toBe("KSh Infinity");
  });
});
