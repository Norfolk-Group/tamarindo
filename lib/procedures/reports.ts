import { z } from "zod";
import { runCashflowModel } from "@/lib/model/engine";
import { computeInvestorReturns } from "@/lib/model/returns";
import {
  incomeWorkbook,
  returnsWorkbook,
  sensitivityWorkbook,
  statementsWorkbook,
  type ReportKind,
  type ReportWorkbook,
} from "@/lib/model/report-workbook";
import { saveReportWorkbook } from "@/lib/model/report-store";
import { runSensitivity } from "@/lib/model/sensitivity";
import { loadValuesForActor } from "@/lib/model/store";
import type { CashflowModel, DivisionStatement } from "@/lib/model/types";
import { toIcpCatalog } from "@/lib/procedures/icp";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

export function clampFyRange(
  fromFy: number | undefined,
  toFy: number | undefined,
  fyCount: number,
): { fromFy: number; toFy: number } {
  const hi = Math.max(1, fyCount);
  let from = fromFy === undefined ? 1 : Math.round(fromFy);
  let to = toFy === undefined ? hi : Math.round(toFy);
  from = Math.min(hi, Math.max(1, from));
  to = Math.min(hi, Math.max(1, to));
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  return { fromFy: from, toFy: to };
}

export function sliceDivision(
  statement: DivisionStatement,
  fromFy: number,
  toFy: number,
): DivisionStatement {
  const start = fromFy - 1;
  const end = toFy;
  return {
    ...statement,
    years: statement.years.slice(start, end),
    lines: statement.lines.map((line) => ({
      ...line,
      values: line.values.slice(start, end),
    })),
  };
}

export function sliceCashflowModel(
  model: CashflowModel,
  fromFy: number,
  toFy: number,
) {
  const consolidated = sliceDivision(model.consolidated, fromFy, toFy);
  const us = sliceDivision(model.us, fromFy, toFy);
  const sucursal = sliceDivision(model.sucursal, fromFy, toFy);
  const vehicle = sliceDivision(model.vehicle, fromFy, toFy);
  const icps = model.contracts.map((icp) => ({
    ...toIcpCatalog(icp),
    years: consolidated.years.map((year) => {
      const slice = year.byIcp.find((row) => row.icpId === icp.id);
      return {
        fy: year.fy,
        label: year.label,
        icpId: icp.id,
        originated: slice?.originated ?? 0,
        fundedNewUsd: slice?.fundedNewUsd ?? 0,
        activationUsd: slice?.activationUsd ?? 0,
        originationUsd: slice?.originationUsd ?? 0,
        servicingUsd: slice?.servicingUsd ?? 0,
        spreadUsd: slice?.spreadUsd ?? 0,
        rentalUsd: slice?.rentalUsd ?? 0,
        leaseCollectedUsd: slice?.leaseCollectedUsd ?? 0,
        remittedUsd: slice?.remittedUsd ?? 0,
        colombiaClientUsd: slice?.colombiaClientUsd ?? 0,
      };
    }),
  }));
  return { fromFy, toFy, consolidated, us, sucursal, vehicle, icps };
}

export function buildReportWorkbook(
  kind: ReportKind,
  model: CashflowModel,
  values: Record<string, import("@/lib/model/types").VariableValue>,
  fromFy: number,
  toFy: number,
): ReportWorkbook {
  if (kind === "returns") return returnsWorkbook(computeInvestorReturns(values, model));
  if (kind === "sensitivity") return sensitivityWorkbook(runSensitivity(values));
  const sliced = sliceCashflowModel(model, fromFy, toFy);
  if (kind === "income") {
    return incomeWorkbook({
      ...model,
      fyCount: toFy - fromFy + 1,
      fyLabels: model.fyLabels.slice(fromFy - 1, toFy),
      us: sliced.us,
      sucursal: sliced.sucursal,
      consolidated: sliced.consolidated,
      vehicle: sliced.vehicle,
    });
  }
  return statementsWorkbook({
    ...model,
    fyCount: toFy - fromFy + 1,
    fyLabels: model.fyLabels.slice(fromFy - 1, toFy),
    us: sliced.us,
    sucursal: sliced.sucursal,
    consolidated: sliced.consolidated,
    vehicle: sliced.vehicle,
  });
}

export const modelReport = defineProcedure({
  name: "model.report",
  description:
    "Recalculate from current blue variables and return a live report workbook: statements (FY slice), investor returns, or sensitivity. Cells and formulas are stored in the database.",
  input: z.object({
    kind: z.enum(["statements", "returns", "sensitivity", "income"]).optional(),
    fromFy: z.number().optional(),
    toFy: z.number().optional(),
  }),
  output: z.object({
    kind: z.enum(["statements", "returns", "sensitivity", "income"]),
    fromFy: z.number(),
    toFy: z.number(),
    consolidated: z.unknown(),
    us: z.unknown(),
    sucursal: z.unknown(),
    vehicle: z.unknown(),
    icps: z.array(z.unknown()),
    workbook: z.unknown(),
    previewPath: z.string(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const kind = input.kind ?? "statements";
    const values = await loadValuesForActor(ctx.actor);
    const model = runCashflowModel(values);
    const range = clampFyRange(input.fromFy, input.toFy, model.fyCount);
    const sliced = sliceCashflowModel(model, range.fromFy, range.toFy);
    const workbook = buildReportWorkbook(kind, model, values, range.fromFy, range.toFy);
    try {
      const createdById = await profileIdFor(ctx.actor.id);
      await saveReportWorkbook(workbook, createdById);
    } catch {
      /* Preview still works if the workbook row cannot persist. */
    }
    return {
      kind,
      ...sliced,
      workbook,
      previewPath: `/api/nico/model/export?format=html&kind=${kind}`,
    };
  },
});
