import { formatDate, formatNumber } from "../../server/src/utils/formatters.js";

describe("formatDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const date = new Date("2023-01-15T12:00:00Z");
    expect(formatDate(date)).toBe("2023-01-15");
  });

  it("handles different date formats", () => {
    const date1 = new Date("2023-12-31T23:59:59Z");
    expect(formatDate(date1)).toBe("2023-12-31");

    const date2 = new Date("2024-02-29T00:00:00Z");
    expect(formatDate(date2)).toBe("2024-02-29");
  });

  it("handles edge cases", () => {
    const date = new Date("1970-01-01T00:00:00Z");
    expect(formatDate(date)).toBe("1970-01-01");
  });
});

describe("formatNumber", () => {
  it("formats a number with commas for thousands", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(1234567.89)).toBe("1,234,567.89");
  });

  it("handles small numbers", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1)).toBe("1");
    expect(formatNumber(999)).toBe("999");
  });

  it("handles decimal numbers", () => {
    expect(formatNumber(123.45)).toBe("123.45");
    expect(formatNumber(1000.01)).toBe("1,000.01");
    expect(formatNumber(0.123)).toBe("0.123");
  });

  it("handles negative numbers", () => {
    expect(formatNumber(-1000)).toBe("-1,000");
    expect(formatNumber(-1234567.89)).toBe("-1,234,567.89");
  });

  it("handles very large numbers", () => {
    expect(formatNumber(999999999)).toBe("999,999,999");
    expect(formatNumber(1000000000)).toBe("1,000,000,000");
  });
});
