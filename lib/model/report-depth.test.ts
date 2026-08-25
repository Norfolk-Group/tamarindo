import { describe, expect, it } from "vitest";
import { runCashflowModel } from "@/lib/model/engine";
import { workbookForDepth } from "@/lib/model/report-depth";
import { incomeWorkbook, statementsWorkbook } from "@/lib/model/report-workbook";
import { defaultValues } from "@/lib/model/variables";

describe("report depth", () => {
  it("drops statement line items in summary and keeps the totals", () => {
    const full = statementsWorkbook(runCashflowModel(defaultValues()));
    const summary = workbookForDepth(full, "summary");
    const sheet = summary.sheets.find((item) => item.id === "consolidated");
    expect(sheet?.rows.some((row) => row.kind === "line")).toBe(false);
    expect(sheet?.rows.some((row) => /closing cash/i.test(row.cells[0]?.text ?? ""))).toBe(
      true,
    );
    expect(sheet?.rows.some((row) => /cash from investing/i.test(row.cells[0]?.text ?? ""))).toBe(
      true,
    );
    expect(workbookForDepth(full, "extended")).toBe(full);
  });

  it("keeps income totals in summary", () => {
    const full = incomeWorkbook(runCashflowModel(defaultValues()));
    const summary = workbookForDepth(full, "summary");
    const labels = summary.sheets[0]?.rows.map((row) => row.cells[0]?.text ?? "") ?? [];
    expect(labels.some((text) => /operating receipts/i.test(text))).toBe(true);
    expect(labels.some((text) => /activation/i.test(text))).toBe(false);
  });
});
