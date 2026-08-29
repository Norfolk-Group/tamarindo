import type { ReportWorkbook } from "@/lib/model/report-workbook";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function renderReportCsv(workbook: ReportWorkbook): string {
  const banner = [
    `# ${workbook.title}`,
    `# generated ${workbook.generatedAt}`,
    "",
  ].join("\n");
  const blocks = workbook.sheets.map((sheet) => {
    const lines = [`# ${sheet.title}`];
    if (sheet.caption) lines.push(`# ${sheet.caption}`);
    for (const row of sheet.rows) {
      lines.push(row.cells.map((cell) => csvEscape(cell.text)).join(","));
    }
    return lines.join("\n");
  });
  return `${banner}${blocks.join("\n\n")}`;
}
