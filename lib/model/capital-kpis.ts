import { cents, d } from "@/lib/model/money";
import { num, type VariableValue } from "@/lib/model/variables";

/**
 * KPI warehouse path to a $150M year-10 book.
 * Intervest $75M (50%) + three simulated vehicles $25M each.
 * Years 1–3 Intervest-only. Cited in knowledge/thesis/10-capital-curve.md.
 */
export const INTERVEST_FY_EOP_M = [
  20, 25, 30, 40, 48, 55, 62, 68, 72, 75,
] as const;

/** Share of the year-10 AUM goal reached by each FY close. */
export const HOME_AUM_FY_WEIGHTS = [
  0.16, 0.28, 0.38, 0.5, 0.6, 0.7, 0.8, 0.88, 0.95, 1,
] as const;
export const AUTO_AUM_FY_WEIGHTS = [
  0.06, 0.16, 0.28, 0.4, 0.53, 0.67, 0.8, 0.9, 0.97, 1,
] as const;
export const AIRCRAFT_AUM_FY_WEIGHTS = [
  0, 0, 0, 0, 0, 0, 0, 0.35, 0.7, 1,
] as const;

export type BookKind = "home" | "auto" | "aircraft";

function fyIndex(monthIndex: number): number {
  return Math.min(9, Math.max(0, Math.floor(monthIndex / 12)));
}

function eopMillions(schedule: readonly number[], monthIndex: number): number {
  return schedule[fyIndex(monthIndex)] ?? 0;
}

export function usesKpiCapitalCurve(values: Record<string, VariableValue>): boolean {
  return Math.round(num(values, "useKpiCapitalCurve")) === 1;
}

/** Intervest committed line on the KPI path. Tranche 1 only until month 6. */
export function kpiIntervestLineUsd(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  const t1 = num(values, "lineTranche1Usd");
  const t2At = Math.round(num(values, "tranche2MonthIndex"));
  if (monthIndex < t2At) return cents(d(t1));
  const fy10 = num(values, "fy10IntervestLineUsd");
  const scale = fy10 / (INTERVEST_FY_EOP_M[9] * 1_000_000);
  return cents(d(eopMillions(INTERVEST_FY_EOP_M, monthIndex) * 1_000_000).times(scale));
}

/**
 * Three simulated vehicles after exclusivity. Each ramps to 1/3 of the
 * non-Intervest half of year-10 capacity.
 */
export function kpiPartnerLineUsd(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  const other = num(values, "fy10PartnerLineUsd");
  const each = other / 3;
  const starts = [
    Math.round(num(values, "partner2StartMonth")),
    Math.round(num(values, "partner3StartMonth")),
    Math.round(num(values, "partner4StartMonth")),
  ];
  // 40% → 70% → 100% of each partner's year-10 line after 0 / 24 / 48 months on book.
  let total = d(0);
  for (const start of starts) {
    if (monthIndex < start) continue;
    const age = monthIndex - start;
    const frac = age < 12 ? 0.4 : age < 24 ? 0.7 : 1;
    total = total.plus(d(each).times(frac));
  }
  return cents(total);
}

export function productAumTargetUsd(
  kind: BookKind,
  monthIndex: number,
  values: Record<string, VariableValue>,
): number {
  const fy10 =
    kind === "home"
      ? num(values, "fy10HomeAumUsd")
      : kind === "auto"
        ? num(values, "fy10AutoAumUsd")
        : num(values, "fy10AircraftAumUsd");
  const weights =
    kind === "home"
      ? HOME_AUM_FY_WEIGHTS
      : kind === "auto"
        ? AUTO_AUM_FY_WEIGHTS
        : AIRCRAFT_AUM_FY_WEIGHTS;
  const fy = fyIndex(monthIndex);
  return cents(d(fy10).times(weights[fy]));
}
