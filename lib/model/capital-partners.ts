import {
  kpiIntervestLineUsd,
  kpiPartnerLineUsd,
  usesKpiCapitalCurve,
} from "@/lib/model/capital-kpis";
import { cents, d } from "@/lib/model/money";
import { num, type VariableValue } from "@/lib/model/variables";

/** Legacy 10+10 then X% every N months — only if useKpiCapitalCurve is 0. */
export function legacyIntervestLineUsd(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  const t1 = d(num(values, "lineTranche1Usd"));
  const t2 = d(num(values, "lineTranche2Usd"));
  const t2At = Math.round(num(values, "tranche2MonthIndex"));
  const every = Math.max(1, Math.round(num(values, "lineStepUpEveryMonths")));
  const step = d(num(values, "lineStepUpPct"));
  let line = t1;
  if (monthIndex >= t2At) {
    line = line.plus(t2);
    const after = monthIndex - t2At;
    if (after >= every) {
      const steps = Math.floor(after / every);
      line = line.times(step.plus(1).pow(steps));
    }
  }
  return cents(line);
}

export function intervestLineUsd(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  if (usesKpiCapitalCurve(values)) return kpiIntervestLineUsd(values, monthIndex);
  return legacyIntervestLineUsd(values, monthIndex);
}

export function partnerCapacityUsd(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  if (usesKpiCapitalCurve(values)) return kpiPartnerLineUsd(values, monthIndex);
  let extra = d(0);
  if (monthIndex >= Math.round(num(values, "partner2StartMonth"))) {
    extra = extra.plus(num(values, "partner2Usd"));
  }
  if (monthIndex >= Math.round(num(values, "partner3StartMonth"))) {
    extra = extra.plus(num(values, "partner3Usd"));
  }
  if (monthIndex >= Math.round(num(values, "partner4StartMonth"))) {
    extra = extra.plus(num(values, "partner4Usd"));
  }
  return cents(extra);
}

export function totalCommittedUsd(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  return cents(
    d(intervestLineUsd(values, monthIndex)).plus(partnerCapacityUsd(values, monthIndex)),
  );
}
