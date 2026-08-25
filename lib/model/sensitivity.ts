import { runCashflowModel } from "@/lib/model/engine";
import { computeInvestorReturns } from "@/lib/model/returns";
import type { VariableValue } from "@/lib/model/types";
import { VARIABLE_DEFS, num } from "@/lib/model/variables";

export type SensitivityPoint = {
  key: string;
  label: string;
  shock: "low" | "base" | "high";
  input: number;
  fy1CashUsd: number;
  fy10CashUsd: number;
  icp1LeaseUsd: number;
  icp1VehicleIrr: number | null;
};

export type SensitivityReport = {
  generatedAt: string;
  base: SensitivityPoint;
  rows: SensitivityPoint[];
};

export const SENSITIVITY_LEVERS = [
  { key: "downPaymentPct", low: 0.35, high: 0.45 },
  { key: "minResidualOfAssetPct", low: 0.15, high: 0.25 },
  { key: "spreadSharePct", low: 0.15, high: 0.25 },
  { key: "activationFeePct", low: 0.01, high: 0.03 },
] as const;

function metrics(
  values: Record<string, VariableValue>,
  key: string,
  label: string,
  shock: SensitivityPoint["shock"],
  input: number,
): SensitivityPoint {
  const model = runCashflowModel(values);
  const returns = computeInvestorReturns(values, model);
  const icp1 = model.contracts.find((row) => row.id === "icp1");
  return {
    key,
    label,
    shock,
    input,
    fy1CashUsd: model.summary.fy1ClosingCashUsd,
    fy10CashUsd: model.summary.fy10ClosingCashUsd,
    icp1LeaseUsd: icp1?.monthlyLeaseUsd ?? 0,
    icp1VehicleIrr: returns.icp1?.vehicleIrrAnnual ?? null,
  };
}

export function runSensitivity(
  values: Record<string, VariableValue>,
): SensitivityReport {
  const baseModel = runCashflowModel(values);
  const base = metrics(values, "base", "Current blue set", "base", 0);
  const rows: SensitivityPoint[] = [base];
  for (const lever of SENSITIVITY_LEVERS) {
    const def = VARIABLE_DEFS.find((row) => row.key === lever.key);
    const label = def?.label ?? lever.key;
    const current = num(values, lever.key);
    for (const shock of ["low", "high"] as const) {
      const input = shock === "low" ? lever.low : lever.high;
      if (Math.abs(input - current) < 1e-9) continue;
      const shocked = { ...values, [lever.key]: input };
      rows.push(metrics(shocked, lever.key, label, shock, input));
    }
  }
  return {
    generatedAt: baseModel.generatedAt,
    base,
    rows,
  };
}
