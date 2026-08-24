import { describe, expect, it } from "vitest";
import { FEE_LINES } from "@/lib/artifacts/fees";
import {
  entitySheetPrefix,
  requireCitedOrBlank,
  tenYearWorkbookSpec,
} from "@/lib/artifacts/workbook";

describe("10-year workbook spec", () => {
  it("builds P&L, manpower, and fee sheets for Tamarindo US and Ashoka (AE6)", () => {
    const spec = tenYearWorkbookSpec(["tamarindo_us", "ashoka"]);
    const names = spec.sheets.map((s) => s.name);
    expect(names).toContain("Assumptions");
    expect(names).toContain("US P&L");
    expect(names).toContain("US Manpower");
    expect(names).toContain("US Fees");
    expect(names).toContain("Ashoka P&L");
    expect(names).toContain("Ashoka Manpower");
    expect(names).toContain("Ashoka Fees");
    expect(names.filter((n) => n.startsWith("Intervest")).length).toBe(0);
  });

  it("keeps a single-entity job on that entity plus Assumptions", () => {
    const spec = tenYearWorkbookSpec(["tamarindo_intervest"]);
    const names = spec.sheets.map((s) => s.name);
    expect(names).toEqual([
      "Assumptions",
      "Intervest Manpower",
      "Intervest Fees",
      "Intervest P&L",
    ]);
    expect(entitySheetPrefix("tamarindo_intervest")).toBe("Intervest");
  });

  it("cites the 2% activation fee and leaves salaries blank", () => {
    const spec = tenYearWorkbookSpec(["tamarindo_us"]);
    const assumptions = spec.sheets.find((s) => s.name === "Assumptions");
    if (!assumptions) throw new Error("missing Assumptions");
    const activation = assumptions.rows.find(
      (row) => row[0]?.kind === "text" && row[0].value === "chg.activation.rate",
    );
    expect(activation?.[2]).toMatchObject({
      kind: "number",
      value: 0.02,
      label: "FACT",
    });
    const salary = assumptions.rows.find(
      (row) => row[0]?.kind === "text" && row[0].value === "tus.ga.y1.salary",
    );
    expect(salary?.[2]).toEqual({ kind: "blank" });
    for (const sheet of spec.sheets) {
      for (const row of sheet.rows) {
        for (const cell of row) requireCitedOrBlank(cell);
      }
    }
  });

  it("drives manpower cost and P&L amounts from formulas, not pasted values", () => {
    const spec = tenYearWorkbookSpec(["tamarindo_us"]);
    const manpower = spec.sheets.find((s) => s.name === "US Manpower");
    const pnl = spec.sheets.find((s) => s.name === "US P&L");
    if (!manpower || !pnl) throw new Error("missing US sheets");
    const costCell = manpower.rows[0]?.[5];
    expect(costCell?.kind).toBe("formula");
    if (costCell?.kind === "formula") {
      expect(costCell.formula).toContain("Assumptions");
      expect(costCell.formula).toContain("IF(OR(");
    }
    expect(pnl.rows.every((row) => row[3]?.kind === "formula")).toBe(true);
  });

  it("adds a Family rollup only for the whole business", () => {
    const family = tenYearWorkbookSpec([
      "tamarindo_us",
      "tamarindo_intervest",
      "tamarindo_colombia",
      "ashoka",
    ]);
    expect(family.sheets.map((s) => s.name)).toContain("Family");
    const rollup = family.sheets.find((s) => s.name === "Family");
    expect(rollup?.headers).toEqual([
      "year",
      "US",
      "Intervest",
      "Colombia",
      "Ashoka",
      "Family",
    ]);
    expect(rollup?.rows[0]?.[5]).toMatchObject({
      kind: "formula",
      formula: "=B2+C2+D2+E2",
    });
    expect(tenYearWorkbookSpec(["tamarindo_us", "ashoka"]).sheets.map((s) => s.name)).not.toContain(
      "Family",
    );
  });

  it("does not invent an unpublished raise ask", () => {
    const spec = tenYearWorkbookSpec(["tamarindo_us"]);
    const dumped = JSON.stringify(spec);
    expect(dumped.includes("seedAskUsd")).toBe(false);
    expect(dumped.includes("2.5")).toBe(false);
    const feeIds = FEE_LINES.filter((f) => f.earner === "tamarindo_us" || f.payer === "tamarindo_us").map(
      (f) => f.id,
    );
    expect(feeIds.length).toBeGreaterThan(0);
  });
});
