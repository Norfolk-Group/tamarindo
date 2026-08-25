import { describe, expect, it } from "vitest";
import { runCashflowModel } from "@/lib/model/engine";
import { computeInvestorReturns } from "@/lib/model/returns";
import { buildReportGlance } from "@/lib/model/report-glance";
import {
  incomeWorkbook,
  returnsWorkbook,
  statementsWorkbook,
} from "@/lib/model/report-workbook";
import { runSensitivity } from "@/lib/model/sensitivity";
import { sensitivityWorkbook } from "@/lib/model/report-workbook";
import { defaultValues } from "@/lib/model/variables";

describe("report glance", () => {
  it("keeps a 10-year statement to three year columns", () => {
    const model = runCashflowModel(defaultValues());
    const glance = buildReportGlance({
      kind: "statements",
      workbook: statementsWorkbook(model),
    });
    expect(glance).toBeTruthy();
    expect(glance?.headers.length).toBe(4);
    expect(glance?.rows.some((row) => /closing cash/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
    expect(glance?.previewPath).toContain("format=html");
    expect(glance?.pdfPath).toContain("format=pdf");
    expect(glance?.chart).toBeUndefined();
    expect(glance?.title).toMatch(/cash flows/i);
    expect(glance?.rows.some((row) => /cash from operations/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
    expect(glance?.extended?.rows.length ?? 0).toBeGreaterThan(glance?.rows.length ?? 0);
    expect(glance?.extended?.rows.some((row) => /activation/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
    expect(glance?.defaultDepth).toBe("summary");
  });

  it("builds an income glance with totals in summary and lines in extended", () => {
    const model = runCashflowModel(defaultValues());
    const glance = buildReportGlance({
      kind: "income",
      workbook: incomeWorkbook(model),
    });
    expect(glance?.rows.some((row) => /operating receipts/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
    expect(glance?.rows.some((row) => /cash from operations/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
    expect(glance?.extended?.rows.some((row) => /activation/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
    expect(glance?.chart).toBeUndefined();
  });

  it("surfaces unit IRR and OpCo cash-on-cash", () => {
    const model = runCashflowModel(defaultValues());
    const glance = buildReportGlance({
      kind: "returns",
      workbook: returnsWorkbook(computeInvestorReturns(defaultValues(), model)),
    });
    expect(glance?.rows.length).toBeGreaterThan(2);
    expect(glance?.rows.some((row) => /cash-on-cash/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
  });

  it("shows the base sensitivity row in gold", () => {
    const glance = buildReportGlance({
      kind: "sensitivity",
      workbook: sensitivityWorkbook(runSensitivity(defaultValues())),
    });
    expect(glance?.rows[0]?.tone).toBe("gold");
    expect(glance?.takeaway).toMatch(/FY10/i);
  });
});
