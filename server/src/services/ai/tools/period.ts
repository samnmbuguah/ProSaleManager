/**
 * Resolve a named period (or explicit ISO date range) into a UTC [start, end)
 * window. Day boundaries are computed in Nairobi time (UTC+3) to match the
 * existing reports, then converted to UTC. Pure function — unit-tested.
 */
export type PeriodName =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_7_days"
  | "last_30_days"
  | "this_year";

export const PERIOD_NAMES: PeriodName[] = [
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "last_7_days",
  "last_30_days",
  "this_year",
];

const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Midnight (Nairobi) of the given instant, expressed as a UTC Date. */
function nairobiMidnight(utc: Date): Date {
  const n = new Date(utc.getTime() + NAIROBI_OFFSET_MS);
  const midNairobi = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
  return new Date(midNairobi - NAIROBI_OFFSET_MS);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export interface ResolvedPeriod {
  start: Date;
  end: Date;
  label: string;
}

export function resolvePeriod(
  period?: string,
  startDate?: string,
  endDate?: string,
  now: Date = new Date(),
): ResolvedPeriod {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid startDate or endDate");
    }
    return { start, end, label: `${startDate} to ${endDate}` };
  }

  const todayStart = nairobiMidnight(now);
  const n = new Date(now.getTime() + NAIROBI_OFFSET_MS);

  switch ((period || "this_month") as PeriodName) {
    case "today":
      return { start: todayStart, end: addDays(todayStart, 1), label: "today" };
    case "yesterday":
      return { start: addDays(todayStart, -1), end: todayStart, label: "yesterday" };
    case "this_week": {
      // Monday-based week.
      const dow = (n.getUTCDay() + 6) % 7; // 0 = Monday
      const start = addDays(todayStart, -dow);
      return { start, end: addDays(start, 7), label: "this week" };
    }
    case "last_week": {
      const dow = (n.getUTCDay() + 6) % 7;
      const thisMonday = addDays(todayStart, -dow);
      return { start: addDays(thisMonday, -7), end: thisMonday, label: "last week" };
    }
    case "this_month": {
      const start = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1) - NAIROBI_OFFSET_MS);
      const end = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 1) - NAIROBI_OFFSET_MS);
      return { start, end, label: "this month" };
    }
    case "last_month": {
      const start = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - 1, 1) - NAIROBI_OFFSET_MS);
      const end = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1) - NAIROBI_OFFSET_MS);
      return { start, end, label: "last month" };
    }
    case "last_7_days":
      return { start: addDays(todayStart, -6), end: addDays(todayStart, 1), label: "last 7 days" };
    case "last_30_days":
      return { start: addDays(todayStart, -29), end: addDays(todayStart, 1), label: "last 30 days" };
    case "this_year": {
      const start = new Date(Date.UTC(n.getUTCFullYear(), 0, 1) - NAIROBI_OFFSET_MS);
      const end = new Date(Date.UTC(n.getUTCFullYear() + 1, 0, 1) - NAIROBI_OFFSET_MS);
      return { start, end, label: "this year" };
    }
    default:
      throw new Error(`Unknown period: ${period}`);
  }
}
