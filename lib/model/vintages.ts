import type { IcpComputed, IcpId, Vintage } from "@/lib/model/types";
import { num, type VariableValue } from "@/lib/model/variables";

const RAMP_MONTHS = [
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

const FIRST_FIVE: IcpId[] = ["icp1", "icp5", "icp2", "icp4", "icp6"];

export function addMonths(
  year: number,
  month: number,
  offset: number,
): { year: number; month: number } {
  const absolute = year * 12 + (month - 1) + offset;
  return { year: Math.floor(absolute / 12), month: (absolute % 12) + 1 };
}

export function plannedOriginations(
  values: Record<string, VariableValue>,
  year: number,
  month: number,
): number {
  const startYear = Math.round(num(values, "planStartYear"));
  const startMonth = Math.round(num(values, "planStartMonth"));
  const januaryYear = Math.round(num(values, "januaryCohortYear"));
  if (year === startYear && month === startMonth) {
    return Math.round(num(values, "stubNovCount"));
  }
  if (year === startYear && month === startMonth + 1) {
    return Math.round(num(values, "stubDecCount"));
  }
  if (year === januaryYear && month === 1) {
    return Math.round(num(values, "januaryCount"));
  }
  if (year === 2027 && month >= 2 && month <= 12) {
    const key = `ramp2027.${RAMP_MONTHS[month - 2]}`;
    return Math.round(num(values, key));
  }
  if (year < 2028) return 0;
  const yearsAfter = year - 2028;
  const grown =
    num(values, "postPilotMonthlyBase") *
    (1 + num(values, "postPilotAnnualGrowthPct")) ** yearsAfter;
  const capped = Math.min(
    Math.round(num(values, "maxOriginationsPerMonth")),
    Math.round(grown),
  );
  return Math.max(0, capped);
}

export function pickIcp(originatedIndex: number, contracts: IcpComputed[]): IcpId {
  if (originatedIndex < FIRST_FIVE.length) return FIRST_FIVE[originatedIndex];
  const weights = contracts.map((row) => Math.max(0, row.mixWeight));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return contracts[originatedIndex % contracts.length].id;
  const slot = originatedIndex % 100;
  let cumulative = 0;
  for (let i = 0; i < contracts.length; i += 1) {
    cumulative += (weights[i] / total) * 100;
    if (slot < cumulative) return contracts[i].id;
  }
  return contracts[contracts.length - 1].id;
}

export function buildPlannedVintages(
  values: Record<string, VariableValue>,
  contracts: IcpComputed[],
): Vintage[] {
  const horizon = Math.round(num(values, "horizonMonths"));
  const startYear = Math.round(num(values, "planStartYear"));
  const startMonth = Math.round(num(values, "planStartMonth"));
  const vintages: Vintage[] = [];
  let originatedIndex = 0;
  for (let monthIndex = 0; monthIndex < horizon; monthIndex += 1) {
    const { year, month } = addMonths(startYear, startMonth, monthIndex);
    const count = plannedOriginations(values, year, month);
    for (let i = 0; i < count; i += 1) {
      vintages.push({
        monthIndex,
        year,
        month,
        icpId: pickIcp(originatedIndex, contracts),
      });
      originatedIndex += 1;
    }
  }
  return vintages;
}
