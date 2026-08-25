import { describe, expect, it } from "vitest";
import { annualizeMonthlyIrr, irr } from "@/lib/model/money";
import { runCashflowModel } from "@/lib/model/engine";
import { computeInvestorReturns } from "@/lib/model/returns";
import { renderReportCsv } from "@/lib/model/sheet-csv";
import { returnsWorkbook, statementsWorkbook } from "@/lib/model/report-workbook";
import { runSensitivity } from "@/lib/model/sensitivity";
import { defaultValues } from "@/lib/model/variables";
import { blueVariableDefs, isBlueVariable } from "@/lib/model/blue-variables";

describe("blue variables", () => {
  it("treats user-visibility keys as blue and keeps seeds", () => {
    const blues = blueVariableDefs();
    expect(blues.every(isBlueVariable)).toBe(true);
    expect(blues.some((row) => row.key === "downPaymentPct")).toBe(true);
    expect(blues.some((row) => row.key === "minResidualOfAssetPct")).toBe(true);
    expect(blues.find((row) => row.key === "downPaymentPct")?.defaultValue).toBe(0.4);
  });
});

describe("IRR", () => {
  it("solves a one-period 10% return", () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 6);
  });

  it("annualizes a monthly rate", () => {
    expect(annualizeMonthlyIrr(0.01)).toBeCloseTo((1.01) ** 12 - 1, 8);
  });
});

describe("investor returns", () => {
  it("puts ICP-1 vehicle IRR in the Intervest band", () => {
    const values = defaultValues();
    const model = runCashflowModel(values);
    const report = computeInvestorReturns(values, model);
    expect(report.icp1).toBeDefined();
    expect(report.icp1?.vehicleIrrAnnual).toBeGreaterThan(0.07);
    expect(report.icp1?.vehicleIrrAnnual).toBeLessThan(0.14);
    expect(report.opCoEquityInUsd).toBeGreaterThan(0);
  });
});

describe("sensitivity", () => {
  it("moves FY cash when down payment is shocked", { timeout: 20_000 }, () => {
    const report = runSensitivity(defaultValues());
    const base = report.rows.find((row) => row.shock === "base");
    const lowDown = report.rows.find(
      (row) => row.key === "downPaymentPct" && row.shock === "low",
    );
    expect(base).toBeDefined();
    expect(lowDown).toBeDefined();
    expect(lowDown?.icp1LeaseUsd).not.toBe(base?.icp1LeaseUsd);
  });
});

describe("report workbook", () => {
  it("writes Excel-like CSV with live statement lines", () => {
    const model = runCashflowModel(defaultValues());
    const csv = renderReportCsv(statementsWorkbook(model));
    expect(csv).toContain("Tamarindo US");
    expect(csv).toContain("Closing cash");
    const returns = renderReportCsv(returnsWorkbook(computeInvestorReturns(defaultValues(), model)));
    expect(returns).toContain("Vehicle IRR");
  });
});
