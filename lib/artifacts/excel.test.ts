import { describe, expect, it } from "vitest";
import { renderWorkbookXlsx } from "@/lib/artifacts/excel";
import { tenYearWorkbookSpec } from "@/lib/artifacts/workbook";

describe("excel engine", () => {
  it("writes a real .xlsx for Tamarindo US and Ashoka with formula cells (AE6)", () => {
    const spec = tenYearWorkbookSpec(["tamarindo_us", "ashoka"]);
    const bytes = renderWorkbookXlsx(spec);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    const asText = bytes.toString("latin1");
    expect(asText).toContain("US P&amp;L");
    expect(asText).toContain("Ashoka Manpower");
    expect(asText).toContain("Assumptions");
    expect(asText).toContain("<f>");
    expect(asText).toContain("chg.activation.rate");
  });

  it("writes a Family sheet for the whole business", () => {
    const spec = tenYearWorkbookSpec([
      "tamarindo_us",
      "tamarindo_intervest",
      "tamarindo_colombia",
      "ashoka",
    ]);
    const asText = renderWorkbookXlsx(spec).toString("latin1");
    expect(asText).toContain("Family");
    expect(asText).toContain("SUMIF");
  });

  it("keeps a single-entity job on that entity", () => {
    const spec = tenYearWorkbookSpec(["tamarindo_intervest"]);
    const asText = renderWorkbookXlsx(spec).toString("latin1");
    expect(asText).toContain("Intervest P&amp;L");
    expect(asText).not.toContain("Ashoka P&amp;L");
  });
});
