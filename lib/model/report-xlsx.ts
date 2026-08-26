import type { TenYearWorkbookSpec, WorkbookCell } from "@/lib/artifacts/workbook";
import type { ReportWorkbook, SheetCell } from "@/lib/model/report-workbook";

function sheetName(title: string): string {
  const trimmed = title.replace(/[\\/*?:[\]]/g, " ").trim() || "Sheet";
  return trimmed.slice(0, 31);
}

function toCell(cell: SheetCell): WorkbookCell {
  if (cell.formula) {
    return { kind: "formula", formula: cell.formula };
  }
  if (typeof cell.value === "number" && Number.isFinite(cell.value)) {
    return {
      kind: "number",
      value: cell.value,
      label: "ASSUMPTION",
      path: "lib/model/report-workbook.ts",
    };
  }
  if (!cell.text || cell.text === "—") return { kind: "blank" };
  return { kind: "text", value: cell.text };
}

/** Live report → the same OOXML writer Artifacts uses. */
export function reportWorkbookToSpec(workbook: ReportWorkbook): TenYearWorkbookSpec {
  return {
    entities: ["tamarindo_us"],
    assumptionKeys: [],
    sheets: workbook.sheets.map((sheet) => {
      const header = sheet.rows.find((row) => row.kind === "header");
      const headers = header?.cells.map((cell) => cell.text) ?? ["Line"];
      return {
        name: sheetName(sheet.title),
        headers,
        rows: sheet.rows
          .filter((row) => row.kind !== "header")
          .map((row) => row.cells.map(toCell)),
      };
    }),
  };
}
