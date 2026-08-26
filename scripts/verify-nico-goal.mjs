/**
 * Runtime check of the Nico goal doors against the live engine.
 * Not a signed-in chat walk — proves calculate + export paths.
 */
import { runCashflowModel } from "../lib/model/engine.ts";
import { defaultValues } from "../lib/model/variables.ts";
import { computeInvestorReturns } from "../lib/model/returns.ts";
import { runSensitivity } from "../lib/model/sensitivity.ts";
import {
  incomeWorkbook,
  returnsWorkbook,
  sensitivityWorkbook,
  statementsWorkbook,
} from "../lib/model/report-workbook.ts";
import { buildReportGlance } from "../lib/model/report-glance.ts";
import { reportWorkbookToSpec } from "../lib/model/report-xlsx.ts";
import { renderWorkbookXlsx } from "../lib/artifacts/excel.ts";
import { calcTicketEconomics } from "../lib/model/unit-economics.ts";
import { parseReportAsk } from "../lib/nico/report-intent.ts";
import { parseBusinessExplainAsk } from "../lib/nico/business-intent.ts";
import { parseUnitCalcAsk } from "../lib/nico/unit-intent.ts";

const values = defaultValues();
const model = runCashflowModel(values);
const returns = computeInvestorReturns(values, model);
const shock = runSensitivity(values);

const doors = {
  explain: parseBusinessExplainAsk("how does Tamarindo work"),
  statements: parseReportAsk("show me the books"),
  income: parseReportAsk("show me the income statement"),
  returns: parseReportAsk("what's the IRR"),
  sensitivity: parseReportAsk("run a stress test"),
  ticket: parseUnitCalcAsk("what do we make on a $500k lease"),
};

if (!doors.explain) throw new Error("explain intent missed");
if (doors.statements?.kind !== "statements") throw new Error("statements intent missed");
if (doors.income?.kind !== "income") throw new Error("income intent missed");
if (doors.returns?.kind !== "returns") throw new Error("returns intent missed");
if (doors.sensitivity?.kind !== "sensitivity") throw new Error("sensitivity intent missed");
if (doors.ticket?.kind !== "ticket") throw new Error("ticket intent missed");

const statements = statementsWorkbook(model);
const income = incomeWorkbook(model);
const returnsBook = returnsWorkbook(returns);
const sensBook = sensitivityWorkbook(shock);

for (const [kind, workbook] of [
  ["statements", statements],
  ["income", income],
  ["returns", returnsBook],
  ["sensitivity", sensBook],
]) {
  const glance = buildReportGlance({ kind, workbook });
  if (!glance) throw new Error(`${kind} glance missing`);
  if (!glance.previewPath.includes("format=html")) throw new Error(`${kind} missing new tab`);
  if (!glance.pdfPath.includes("format=pdf")) throw new Error(`${kind} missing PDF`);
  if (!glance.csvPath.includes("format=csv")) throw new Error(`${kind} missing CSV`);
  if (!glance.xlsxPath?.includes("format=xlsx")) throw new Error(`${kind} missing Excel`);
}

const ticket = calcTicketEconomics({
  fundedUsd: 500_000,
  drawUsd: 500_000,
  originationFeePct: Number(values.originationFeePct),
  servicingBps: Number(values.servicingBps),
  activationFeePct: Number(values.activationFeePct),
  spreadSharePct: Number(values.spreadSharePct),
  clientRate: Number(values["icp.icp1.clientRate"]),
});
if (ticket.originationUsd <= 0 || ticket.platformY1Usd <= 0) {
  throw new Error("ticket math empty");
}

const xlsx = renderWorkbookXlsx(reportWorkbookToSpec(returnsBook));
if (xlsx.subarray(0, 2).toString() !== "PK") throw new Error("returns xlsx is not OOXML");

console.log(
  JSON.stringify(
    {
      ok: true,
      homes: model.summary.homesOriginated,
      fy1: model.summary.fy1ClosingCashUsd,
      fy10: model.summary.fy10ClosingCashUsd,
      ticketPlatformY1: ticket.platformY1Usd,
      unitIrrs: returns.units.filter((u) => u.vehicleIrrAnnual != null).length,
      xlsxBytes: xlsx.length,
    },
    null,
    2,
  ),
);
