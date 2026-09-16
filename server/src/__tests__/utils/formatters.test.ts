import { formatDate, formatNumber } from "../../utils/formatters.js";

describe("formatDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatDate(new Date("2026-09-16T10:30:00.000Z"))).toBe("2026-09-16");
  });

  it("pads single digit months and days", () => {
    expect(formatDate(new Date("2026-01-05T00:00:00.000Z"))).toBe("2026-01-05");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("leaves small numbers unchanged", () => {
    expect(formatNumber(42)).toBe("42");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});
