import type { ReportKind, ReportSheet, ReportWorkbook, SheetRow } from "@/lib/model/report-workbook";

export const REPORT_DEPTHS = ["summary", "extended"] as const;
export type ReportDepth = (typeof REPORT_DEPTHS)[number];

export function isReportDepth(value: string): value is ReportDepth {
  return (REPORT_DEPTHS as readonly string[]).includes(value);
}

/** Cash-flow and income hide line items in summary. Returns and sensitivity hide extra columns. */
export function sheetHidesLinesInSummary(kind: ReportKind): boolean {
  return kind === "statements" || kind === "income";
}

export function workbookForDepth(
  workbook: ReportWorkbook,
  depth: ReportDepth,
): ReportWorkbook {
  if (depth === "extended") return workbook;
  const hideLines = sheetHidesLinesInSummary(workbook.kind);
  return {
    ...workbook,
    sheets: workbook.sheets.map((sheet) => ({
      ...sheet,
      rows: sheet.rows
        .filter((row) => {
          if (!hideLines) return true;
          return row.kind !== "line" && row.kind !== "section";
        })
        .map((row) => ({
          ...row,
          cells: row.cells.filter((item) => !item.hideInSummary),
        })),
    })),
  };
}

export function visibleCells(row: SheetRow, depth: ReportDepth) {
  if (depth === "extended") return row.cells;
  return row.cells.filter((item) => !item.hideInSummary);
}

export function bodyRowsForDepth(sheet: ReportSheet, kind: ReportKind, depth: ReportDepth): SheetRow[] {
  const rows = sheet.rows.filter((row) => row.kind !== "header");
  if (depth === "extended" || !sheetHidesLinesInSummary(kind)) return rows;
  return rows.filter((row) => row.kind === "total");
}
