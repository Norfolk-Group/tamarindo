import { describe, expect, it } from "vitest";
import { renderWorkbookXlsx } from "@/lib/artifacts/excel";
import { runCashflowModel } from "@/lib/model/engine";
import { computeInvestorReturns } from "@/lib/model/returns";
import { returnsWorkbook } from "@/lib/model/report-workbook";
import { reportWorkbookToSpec } from "@/lib/model/report-xlsx";
import { defaultValues } from "@/lib/model/variables";

describe("report xlsx", () => {
  it("writes a real .xlsx from the live returns report", () => {
    const values = defaultValues();
    const model = runCashflowModel(values);
    const workbook = returnsWorkbook(computeInvestorReturns(values, model));
    const spec = reportWorkbookToSpec(workbook);
    expect(spec.sheets.length).toBeGreaterThan(0);
    const bytes = renderWorkbookXlsx(spec);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    expect(bytes.toString("latin1")).toMatch(/xl\/workbook\.xml/);
  });
});
