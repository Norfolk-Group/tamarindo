import { formatUsd } from "@/lib/model/format";
import {
  bodyRowsForDepth,
  type ReportDepth,
  visibleCells,
} from "@/lib/model/report-depth";
import type {
  ReportKind,
  ReportSheet,
  ReportWorkbook,
  SheetRow,
} from "@/lib/model/report-workbook";
export type GlanceTone = "gold" | "blue" | "dim" | "plain";
export type { ReportDepth };

export type GlanceChart = {
  title?: string;
  type?: "bar" | "hbar" | "line" | "area" | "pie";
  labels: string[];
  values: number[];
  unit?: string;
};

export type GlanceRow = {
  cells: string[];
  tone?: GlanceTone;
};

export type GlanceTable = {
  headers: string[];
  rows: GlanceRow[];
};

export type ReportGlance = {
  kind: ReportKind;
  title: string;
  takeaway: string;
  headers: string[];
  rows: GlanceRow[];
  /** Same numbers, every line / extra column. Omitted when summary is the whole story. */
  extended?: GlanceTable;
  defaultDepth?: ReportDepth;
  chart?: GlanceChart;
  previewPath: string;
  pdfPath: string;
  csvPath: string;
  xlsxPath?: string;
};

type ConsolidatedYear = {
  fy: number;
  label: string;
  closingCashUsd: number;
  byIcp?: Array<{ originated: number }>;
};

export function exportPaths(kind: ReportKind): {
  previewPath: string;
  pdfPath: string;
  csvPath: string;
  xlsxPath: string;
} {
  return {
    previewPath: `/api/nico/model/export?format=html&kind=${kind}`,
    pdfPath: `/api/nico/model/export?format=pdf&kind=${kind}&depth=extended`,
    csvPath: `/api/nico/model/export?format=csv&kind=${kind}&depth=extended`,
    xlsxPath: `/api/nico/model/export?format=xlsx&kind=${kind}&depth=extended`,
  };
}

export function formatReportFence(glance: ReportGlance): string {
  return `\n\`\`\`report\n${JSON.stringify(glance)}\n\`\`\`\n`;
}

export function parseReportGlance(raw: string): ReportGlance | null {
  try {
    const json = JSON.parse(raw) as ReportGlance;
    if (!json || typeof json.title !== "string") return null;
    if (!Array.isArray(json.headers) || !Array.isArray(json.rows)) return null;
    if (!json.previewPath || !json.pdfPath || !json.csvPath) return null;
    if (json.extended) {
      if (!Array.isArray(json.extended.headers) || !Array.isArray(json.extended.rows)) {
        return null;
      }
    }
    return json;
  } catch {
    return null;
  }
}

/** Investor glance: a few meaning rows, not the 10-year book. */
export function buildReportGlance(input: {
  kind: ReportKind;
  fromFy?: number;
  toFy?: number;
  workbook?: ReportWorkbook | null;
  consolidated?: { years: ConsolidatedYear[] };
  depth?: ReportDepth;
}): ReportGlance | null {
  const paths = exportPaths(input.kind);
  const depth = input.depth ?? "summary";
  if (input.kind === "returns") {
    return withDepth(returnsGlance(input.workbook, paths), depth);
  }
  if (input.kind === "sensitivity") {
    return withDepth(sensitivityGlance(input.workbook, paths), depth);
  }
  if (input.kind === "income") {
    return withDepth(incomeGlance(input.workbook, paths), depth);
  }
  if (input.kind === "structure") {
    return withDepth(structureGlance(input.workbook, paths), depth);
  }
  return withDepth(statementsGlance(input, paths), depth);
}

function withDepth(glance: ReportGlance | null, depth: ReportDepth): ReportGlance | null {
  if (!glance) return null;
  return { ...glance, defaultDepth: glance.extended ? depth : "summary" };
}

function structureGlance(
  workbook: ReportWorkbook | null | undefined,
  paths: ReturnType<typeof exportPaths>,
): ReportGlance {
  const sheet = workbook?.sheets.find((item) => item.id === "entities") ?? workbook?.sheets[0];
  const lines = (sheet?.rows ?? []).filter((row) => row.kind === "line");
  const headers = ["Entity", "Role"];
  const extendedHeaders = ["Entity", "Jurisdiction", "Role", "Owns assets", "Relationship"];
  const rows: GlanceRow[] = lines.map((row) => ({
    cells: [row.cells[0]?.text ?? "—", row.cells[2]?.text ?? "—"],
    tone: /credit, llc/i.test(row.cells[0]?.text ?? "") ? "gold" : "plain",
  }));
  const extendedRows: GlanceRow[] = lines.map((row) => ({
    cells: [
      row.cells[0]?.text ?? "—",
      row.cells[1]?.text ?? "—",
      row.cells[2]?.text ?? "—",
      row.cells[3]?.text ?? "—",
      row.cells[4]?.text ?? "—",
    ],
    tone: /credit, llc/i.test(row.cells[0]?.text ?? "") ? "gold" : "plain",
  }));
  return {
    kind: "structure",
    title: "Corporate structure — Tamarindo family",
    takeaway:
      "Two Delaware LLCs, each with its own Colombian sucursal. Credit manages Intervest — it does not own it. Ashoka is a sister operator. The diagram opens in a new tab.",
    headers,
    rows: rows.length
      ? rows
      : [{ cells: ["Tamarindo Credit, LLC", "OpCo — manages, does not own"], tone: "gold" }],
    extended: extendedRows.length ? { headers: extendedHeaders, rows: extendedRows } : undefined,
    ...paths,
  };
}

function statementsGlance(
  input: {
    fromFy?: number;
    toFy?: number;
    workbook?: ReportWorkbook | null;
    consolidated?: { years: ConsolidatedYear[] };
  },
  paths: ReturnType<typeof exportPaths>,
): ReportGlance | null {
  const sheet = input.workbook?.sheets.find((item) => item.id === "consolidated");
  if (sheet) return statementsFromSheet(sheet, paths);
  const years = input.consolidated?.years ?? [];
  if (years.length === 0) return null;
  const first = years[0];
  const last = years[years.length - 1];
  if (!first || !last) return null;
  const originated = years.reduce(
    (sum, year) =>
      sum + (year.byIcp ?? []).reduce((n, row) => n + (row.originated ?? 0), 0),
    0,
  );
  const cols = pickIndexes(years.length);
  const headers = ["Line", ...cols.map((i) => yearLabel(years[i]?.label ?? `FY${years[i]?.fy}`))];
  const cashRow = cols.map((i) => formatUsd(years[i]?.closingCashUsd ?? 0));
  return {
    kind: "statements",
    title: "Statement of cash flows — consolidated",
    takeaway: `${first.label} close ${formatUsd(first.closingCashUsd)}; ${last.label} close ${formatUsd(last.closingCashUsd)}. Homes originated in this slice: ${originated}. This is cash flow, not a P&L.`,
    headers,
    rows: [{ cells: ["Closing cash", ...cashRow], tone: "gold" }],
    ...paths,
  };
}

function statementsFromSheet(
  sheet: ReportSheet,
  paths: ReturnType<typeof exportPaths>,
): ReportGlance {
  const { headers, summary, extended } = yearSheetTables(sheet, "statements");
  const closing = findRow(sheet, /closing cash/i);
  const lastClose = closing?.cells[closing.cells.length - 1]?.text ?? "—";
  const firstClose = closing?.cells[1]?.text ?? "—";
  return {
    kind: "statements",
    title: "Statement of cash flows — consolidated",
    takeaway: `First year close ${firstClose}; last year close ${lastClose}. This is cash flow, not a P&L. Summary first; Extended has every line.`,
    headers,
    rows: summary,
    extended: { headers, rows: extended },
    ...paths,
  };
}

function incomeGlance(
  workbook: ReportWorkbook | null | undefined,
  paths: ReturnType<typeof exportPaths>,
): ReportGlance | null {
  const sheet = workbook?.sheets.find((item) => item.id === "income-us") ?? workbook?.sheets[0];
  if (!sheet) {
    return {
      kind: "income",
      title: "Income statement (cash-basis OpCo)",
      takeaway:
        "Built live from the cash-flow engine. Receipts and payments, not an accrual P&L.",
      headers: ["Line", "See full book"],
      rows: [{ cells: ["Cash from operations", "Open the book"], tone: "gold" }],
      ...paths,
    };
  }
  const { headers, summary, extended } = yearSheetTables(sheet, "income");
  return {
    kind: "income",
    title: "Income statement — cash-basis OpCo",
    takeaway:
      "Just built from the live model. Cash-basis operating P&L, not accrual. Summary is the totals; Extended is every receipt and payment.",
    headers,
    rows: summary,
    extended: { headers, rows: extended },
    ...paths,
  };
}

function returnsGlance(
  workbook: ReportWorkbook | null | undefined,
  paths: ReturnType<typeof exportPaths>,
): ReportGlance | null {
  const units = workbook?.sheets.find((sheet) => sheet.id === "units");
  const book = workbook?.sheets.find((sheet) => sheet.id === "book");
  if (!units && !book) {
    return {
      kind: "returns",
      title: "Investor returns",
      takeaway:
        "Unit vehicle IRR is the Intervest-style lease return. OpCo has cash-on-cash, not a fake exit IRR.",
      headers: ["Metric", "Read"],
      rows: [
        { cells: ["Unit vehicle IRR", "See full book"], tone: "gold" },
        { cells: ["OpCo cash-on-cash", "See full book"], tone: "gold" },
      ],
      ...paths,
    };
  }
  const unitLines = (units?.rows ?? []).filter((row) => row.kind === "line").slice(0, 6);
  const headers = ["Vehicle", "IRR"];
  const extendedHeaders = ["Vehicle", "Funded", "Lease / mo", "Balloon", "Remitted", "IRR"];
  const rows: GlanceRow[] = unitLines.map((row) => ({
    cells: [row.cells[0]?.text ?? "—", row.cells[5]?.text ?? "—"],
    tone: "gold",
  }));
  const extendedRows: GlanceRow[] = unitLines.map((row) => ({
    cells: [
      row.cells[0]?.text ?? "—",
      row.cells[1]?.text ?? "—",
      row.cells[2]?.text ?? "—",
      row.cells[3]?.text ?? "—",
      row.cells[4]?.text ?? "—",
      row.cells[5]?.text ?? "—",
    ],
    tone: "gold",
  }));
  const bookIrr = findRow(book, /vehicle book irr/i);
  const coc = findRow(book, /cash-on-cash/i);
  if (bookIrr) {
    rows.push({
      cells: [bookIrr.cells[0]?.text ?? "Book IRR", bookIrr.cells[1]?.text ?? "—"],
      tone: "gold",
    });
    extendedRows.push({
      cells: [bookIrr.cells[0]?.text ?? "Book IRR", "—", "—", "—", "—", bookIrr.cells[1]?.text ?? "—"],
      tone: "gold",
    });
  }
  if (coc) {
    rows.push({
      cells: [coc.cells[0]?.text ?? "OpCo cash-on-cash", coc.cells[1]?.text ?? "—"],
      tone: "gold",
    });
    extendedRows.push({
      cells: [coc.cells[0]?.text ?? "OpCo cash-on-cash", "—", "—", "—", "—", coc.cells[1]?.text ?? "—"],
      tone: "gold",
    });
  }
  const chartValues = unitLines.map((row) => {
    const raw = row.cells[5]?.value;
    return raw == null ? 0 : Math.round(raw * 1000) / 10;
  });
  return {
    kind: "returns",
    title: "Investor returns — vehicles and OpCo",
    takeaway:
      "Unit IRR is the lease vehicle. OpCo cash-on-cash is not an exit IRR. Summary is the IRRs; Extended adds funded, lease, balloon, remittance.",
    headers,
    rows,
    extended: { headers: extendedHeaders, rows: extendedRows },
    chart:
      chartValues.length > 0
        ? {
            title: "Unit vehicle IRR",
            type: "bar",
            labels: unitLines.map((row) => row.cells[0]?.text.split(" ")[0] ?? "ICP"),
            values: chartValues,
            unit: "%",
          }
        : undefined,
    ...paths,
  };
}

function sensitivityGlance(
  workbook: ReportWorkbook | null | undefined,
  paths: ReturnType<typeof exportPaths>,
): ReportGlance | null {
  const grid = workbook?.sheets.find((sheet) => sheet.id === "grid");
  const dataRows = (grid?.rows ?? []).filter((row) => row.kind !== "header").slice(0, 6);
  if (dataRows.length === 0) {
    return {
      kind: "sensitivity",
      title: "Sensitivity",
      takeaway: "Each shock reruns the engine. Shocks are not saved.",
      headers: ["Lever", "FY10 cash"],
      rows: [{ cells: ["Base", "See full book"], tone: "gold" }],
      ...paths,
    };
  }
  const headers = ["Lever", "Shock", "FY10 cash"];
  const extendedHeaders = ["Lever", "Shock", "Input", "FY1 cash", "FY10 cash", "ICP-1 lease", "ICP-1 IRR"];
  const rows: GlanceRow[] = dataRows.map((row) => ({
    cells: [row.cells[0]?.text ?? "—", row.cells[1]?.text ?? "—", row.cells[4]?.text ?? "—"],
    tone: row.kind === "total" ? "gold" : "blue",
  }));
  const extendedRows: GlanceRow[] = dataRows.map((row) => ({
    cells: [
      row.cells[0]?.text ?? "—",
      row.cells[1]?.text ?? "—",
      row.cells[2]?.text ?? "—",
      row.cells[3]?.text ?? "—",
      row.cells[4]?.text ?? "—",
      row.cells[5]?.text ?? "—",
      row.cells[6]?.text ?? "—",
    ],
    tone: row.kind === "total" ? "gold" : "blue",
  }));
  const base = dataRows.find((row) => /base/i.test(row.cells[1]?.text ?? ""));
  return {
    kind: "sensitivity",
    title: "Sensitivity — meeting levers",
    takeaway: base
      ? `Base FY10 cash ${base.cells[4]?.text ?? "—"}. Summary is the close; Extended is every lever column. Shocks are not saved.`
      : "Each shock reruns the engine. Shocks are not saved.",
    headers,
    rows,
    extended: { headers: extendedHeaders, rows: extendedRows },
    chart: {
      title: "FY10 cash by shock",
      type: "hbar",
      labels: dataRows.map((row) => row.cells[0]?.text ?? "—"),
      values: dataRows.map((row) => Math.round(row.cells[4]?.value ?? 0)),
      unit: "$",
    },
    ...paths,
  };
}

function yearSheetTables(
  sheet: ReportSheet,
  kind: "statements" | "income",
): { headers: string[]; summary: GlanceRow[]; extended: GlanceRow[] } {
  const header = sheet.rows.find((row) => row.kind === "header");
  const yearCells = header?.cells.slice(1) ?? [];
  const cols = pickIndexes(yearCells.length);
  const headers = ["Line", ...cols.map((i) => yearCells[i]?.text ?? `Y${i + 1}`)];
  return {
    headers,
    summary: glanceRows(bodyRowsForDepth(sheet, kind, "summary"), cols),
    extended: glanceRows(bodyRowsForDepth(sheet, kind, "extended"), cols),
  };
}

function glanceRows(rows: SheetRow[], cols: number[]): GlanceRow[] {
  return rows.map((row) => {
    const cells = visibleCells(row, "extended");
    return {
      cells: [cells[0]?.text ?? "—", ...cols.map((i) => cells[i + 1]?.text ?? "—")],
      tone: row.kind === "total" ? "gold" : row.kind === "section" ? "dim" : "plain",
    };
  });
}

function findRow(sheet: ReportSheet | undefined, pattern: RegExp): SheetRow | undefined {
  return sheet?.rows.find((row) => pattern.test(row.cells[0]?.text ?? ""));
}

function pickIndexes(count: number): number[] {
  if (count <= 0) return [];
  if (count <= 4) return Array.from({ length: count }, (_, i) => i);
  const mid = Math.floor((count - 1) / 2);
  return [0, mid, count - 1];
}

function yearLabel(label: string): string {
  return label.split(" · ")[0] ?? label;
}
