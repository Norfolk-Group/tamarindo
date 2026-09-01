import { describe, expect, it } from "vitest";
import { buildReportGlance } from "@/lib/model/report-glance";
import { structureWorkbook } from "@/lib/model/report-workbook";
import { renderReportHtml } from "@/lib/model/sheet-html";
import { renderStructureHtml } from "@/lib/model/structure-html";

describe("corporate structure report", () => {
  it("lists the family without putting Credit over Intervest", () => {
    const workbook = structureWorkbook("2026-09-01T00:00:00.000Z");
    expect(workbook.kind).toBe("structure");
    const names = workbook.sheets[0]?.rows
      .filter((row) => row.kind === "line")
      .map((row) => row.cells[0]?.text ?? "");
    expect(names).toEqual(
      expect.arrayContaining([
        "Tamarindo Credit, LLC",
        "Tamarindo Intervest, LLC",
        "Tamarindo Credit, Sucursal Colombia",
        "Tamarindo Intervest, Sucursal Colombia",
        "Ashoka",
      ]),
    );
    const credit = workbook.sheets[0]?.rows.find((row) =>
      /tamarindo credit, llc/i.test(row.cells[0]?.text ?? ""),
    );
    expect(credit?.cells[4]?.text).toMatch(/does not own/i);
  });

  it("renders an HTML diagram with ownership and sucursales", () => {
    const workbook = structureWorkbook("2026-09-01T00:00:00.000Z");
    const html = renderStructureHtml(workbook);
    expect(html).toContain("<svg");
    expect(html).toContain("DOES NOT OWN");
    expect(html).toContain("Tamarindo Credit, LLC");
    expect(html).toContain("Tamarindo Intervest, LLC");
    expect(html).toContain("Sucursal Colombia");
    expect(html).toContain("Ashoka");
    expect(html).toContain("<table");
    expect(html).toContain("format=pdf&amp;kind=structure");
    expect(renderReportHtml(workbook)).toContain("DOES NOT OWN");
  });

  it("builds a glance that opens the diagram", () => {
    const glance = buildReportGlance({
      kind: "structure",
      workbook: structureWorkbook("2026-09-01T00:00:00.000Z"),
    });
    expect(glance?.title).toMatch(/corporate structure/i);
    expect(glance?.previewPath).toContain("kind=structure");
    expect(glance?.rows.some((row) => /credit, llc/i.test(row.cells[0] ?? ""))).toBe(
      true,
    );
    expect(glance?.extended?.headers).toEqual(
      expect.arrayContaining(["Owns assets", "Relationship"]),
    );
    expect(glance?.takeaway).toMatch(/does not own/i);
  });
});
