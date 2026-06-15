import { resolvePeriod, PERIOD_NAMES } from "../tools/period.js";

// Fixed reference instant: Wed 2026-06-17 09:00 UTC (12:00 Nairobi).
const NOW = new Date("2026-06-17T09:00:00.000Z");

describe("resolvePeriod", () => {
  it("returns a half-open window for every named period", () => {
    for (const name of PERIOD_NAMES) {
      const { start, end } = resolvePeriod(name, undefined, undefined, NOW);
      expect(start.getTime()).toBeLessThan(end.getTime());
    }
  });

  it("today starts at Nairobi midnight (21:00 UTC previous day)", () => {
    const { start, end } = resolvePeriod("today", undefined, undefined, NOW);
    expect(start.toISOString()).toBe("2026-06-16T21:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-17T21:00:00.000Z");
  });

  it("yesterday is the 24h window before today", () => {
    const today = resolvePeriod("today", undefined, undefined, NOW);
    const yest = resolvePeriod("yesterday", undefined, undefined, NOW);
    expect(yest.end.getTime()).toBe(today.start.getTime());
    expect(today.start.getTime() - yest.start.getTime()).toBe(24 * 3600 * 1000);
  });

  it("this_week begins on Monday", () => {
    // 2026-06-17 is a Wednesday → Monday is the 15th (00:00 Nairobi = 16th 21:00 UTC prev).
    const { start } = resolvePeriod("this_week", undefined, undefined, NOW);
    expect(start.toISOString()).toBe("2026-06-14T21:00:00.000Z");
  });

  it("last_7_days spans exactly 7 days", () => {
    const { start, end } = resolvePeriod("last_7_days", undefined, undefined, NOW);
    expect((end.getTime() - start.getTime()) / (24 * 3600 * 1000)).toBe(7);
  });

  it("honours an explicit ISO range", () => {
    const { start, end, label } = resolvePeriod(undefined, "2026-01-01", "2026-02-01", NOW);
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(label).toContain("2026-01-01");
  });

  it("defaults to this_month when nothing is provided", () => {
    const { label } = resolvePeriod(undefined, undefined, undefined, NOW);
    expect(label).toBe("this month");
  });

  it("throws on an invalid explicit range", () => {
    expect(() => resolvePeriod(undefined, "not-a-date", "2026-02-01", NOW)).toThrow();
  });

  it("throws on an unknown period name", () => {
    expect(() => resolvePeriod("last_century", undefined, undefined, NOW)).toThrow(/Unknown period/);
  });
});
