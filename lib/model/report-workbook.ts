import { formatPct, formatUsd } from "@/lib/model/format";
import type { CashflowModel, DivisionStatement, StatementLine } from "@/lib/model/types";
import type { InvestorReturns } from "@/lib/model/returns";
import type { SensitivityReport } from "@/lib/model/sensitivity";

export const REPORT_KINDS = ["statements", "returns", "sensitivity", "income"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export function isReportKind(value: string): value is ReportKind {
  return (REPORT_KINDS as readonly string[]).includes(value);
}

export type SheetFormat = "text" | "usd" | "pct" | "number";
export type SheetTone = "blue" | "gold" | "dim" | "plain";

export type SheetCell = {
  text: string;
  value?: number;
  formula?: string;
  format: SheetFormat;
  tone?: SheetTone;
  /** Extra column — hidden when the sheet is in summary. */
  hideInSummary?: boolean;
};

export type SheetRow = {
  kind: "header" | "section" | "line" | "total";
  cells: SheetCell[];
};

export type ReportSheet = {
  id: string;
  title: string;
  caption?: string;
  rows: SheetRow[];
};

export type ReportCellRecord = {
  key: string;
  sheet: string;
  label: string;
  value: number;
  formula: string | null;
  format: SheetFormat;
  tone: SheetTone;
};

export type ReportWorkbook = {
  kind: ReportKind;
  title: string;
  generatedAt: string;
  theme: "tamarindo-sheet";
  sheets: ReportSheet[];
  cells: ReportCellRecord[];
};

function cell(
  text: string,
  opts: Partial<SheetCell> = {},
): SheetCell {
  return { text, format: "text", tone: "plain", ...opts };
}

function usd(value: number, tone: SheetTone = "plain", formula?: string): SheetCell {
  return { text: formatUsd(value), value, format: "usd", tone, formula };
}

function pct(value: number | null, tone: SheetTone = "gold"): SheetCell {
  if (value == null) return cell("—", { tone: "dim" });
  return { text: formatPct(value), value, format: "pct", tone };
}

function record(
  sheet: string,
  key: string,
  label: string,
  value: number,
  formula: string | null,
  format: SheetFormat,
  tone: SheetTone,
): ReportCellRecord {
  return { key, sheet, label, value, formula, format, tone };
}

function statementSheet(division: DivisionStatement): ReportSheet {
  const headers = ["Line", ...division.years.map((year) => year.label.split(" · ")[0] ?? "")];
  const rows: SheetRow[] = [
    {
      kind: "header",
      cells: headers.map((text) => cell(text, { tone: "dim" })),
    },
    {
      kind: "total",
      cells: [
        cell("Opening cash", { tone: "gold" }),
        ...division.years.map((year) => usd(year.openingCashUsd, "gold", "prior close")),
      ],
    },
  ];
  const sections: Array<{ key: StatementLine["section"]; title: string }> = [
    { key: "operatingIn", title: "Cash from operations — receipts" },
    { key: "operatingOut", title: "Cash from operations — payments" },
    { key: "investing", title: "Cash from investing" },
    { key: "financing", title: "Cash from financing" },
    { key: "memo", title: "Supplementary" },
  ];
  for (const section of sections) {
    const lines = division.lines.filter((line) => line.section === section.key);
    if (lines.length === 0) continue;
    rows.push({
      kind: "section",
      cells: [cell(section.title, { tone: "dim" }), ...division.years.map(() => cell(""))],
    });
    for (const line of lines) {
      rows.push({
        kind: "line",
        cells: [
          cell(line.label, { tone: section.key === "memo" ? "dim" : "plain" }),
          ...line.values.map((value) => usd(value, section.key === "memo" ? "dim" : "plain", line.id)),
        ],
      });
    }
  }
  rows.push({
    kind: "total",
    cells: [
      cell("Cash from operations", { tone: "gold" }),
      ...division.years.map((year) =>
        usd(year.cfoUsd, "gold", "Σ operating receipts − Σ operating payments"),
      ),
    ],
  });
  rows.push({
    kind: "total",
    cells: [
      cell("Cash from investing", { tone: "gold" }),
      ...division.years.map((year) => usd(year.cfiUsd, "gold", "Σ investing")),
    ],
  });
  rows.push({
    kind: "total",
    cells: [
      cell("Cash from financing", { tone: "gold" }),
      ...division.years.map((year) => usd(year.cffUsd, "gold", "Σ financing")),
    ],
  });
  rows.push({
    kind: "total",
    cells: [
      cell("Net change in cash", { tone: "gold" }),
      ...division.years.map((year) => usd(year.netChangeUsd, "gold", "CFO + CFI + CFF")),
    ],
  });
  rows.push({
    kind: "total",
    cells: [
      cell("Closing cash", { tone: "gold" }),
      ...division.years.map((year) =>
        usd(year.closingCashUsd, "gold", "opening + CFO + CFI + CFF"),
      ),
    ],
  });
  return {
    id: division.id,
    title: division.title,
    caption: "Live from runCashflowModel · IAS 7 / ASC 230 direct method",
    rows,
  };
}

export function statementsWorkbook(model: CashflowModel): ReportWorkbook {
  const sheets = [
    statementSheet(model.us),
    statementSheet(model.sucursal),
    statementSheet(model.consolidated),
    statementSheet(model.vehicle),
  ];
  const cells: ReportCellRecord[] = [];
  for (const division of [model.us, model.sucursal, model.consolidated, model.vehicle]) {
    for (const line of division.lines) {
      line.values.forEach((value, i) => {
        cells.push(
          record(
            division.id,
            `${division.id}.${line.id}.fy${i + 1}`,
            line.label,
            value,
            line.id,
            "usd",
            "plain",
          ),
        );
      });
    }
  }
  return {
    kind: "statements",
    title: "Tamarindo · statement of cash flows",
    generatedAt: model.generatedAt,
    theme: "tamarindo-sheet",
    sheets,
    cells,
  };
}

/** Cash-basis operating P&L built from the live engine. Not an accrual accountant's book. */
export function incomeWorkbook(model: CashflowModel): ReportWorkbook {
  const sheet = incomeSheet(model.us);
  const cells: ReportCellRecord[] = [];
  for (const line of model.us.lines.filter((row) =>
    row.section === "operatingIn" || row.section === "operatingOut",
  )) {
    line.values.forEach((value, i) => {
      cells.push(
        record(
          "income-us",
          `income.us.${line.id}.${i + 1}`,
          line.label,
          value,
          null,
          "usd",
          "plain",
        ),
      );
    });
  }
  return {
    kind: "income",
    title: "Tamarindo · income statement (cash-basis OpCo)",
    generatedAt: model.generatedAt,
    theme: "tamarindo-sheet",
    sheets: [sheet],
    cells,
  };
}

function incomeSheet(division: DivisionStatement): ReportSheet {
  const headers = ["Line", ...division.years.map((year) => year.label.split(" · ")[0] ?? "")];
  const rows: SheetRow[] = [
    {
      kind: "header",
      cells: headers.map((text) => cell(text, { tone: "dim" })),
    },
    {
      kind: "section",
      cells: [cell("Receipts", { tone: "dim" }), ...division.years.map(() => cell(""))],
    },
  ];
  for (const line of division.lines.filter((row) => row.section === "operatingIn")) {
    rows.push({
      kind: "line",
      cells: [cell(line.label), ...line.values.map((value) => usd(value))],
    });
  }
  rows.push({
    kind: "total",
    cells: [
      cell("Operating receipts", { tone: "gold" }),
      ...division.years.map((_, i) =>
        usd(
          division.lines
            .filter((line) => line.section === "operatingIn")
            .reduce((sum, line) => sum + (line.values[i] ?? 0), 0),
          "gold",
        ),
      ),
    ],
  });
  rows.push({
    kind: "section",
    cells: [cell("Payments", { tone: "dim" }), ...division.years.map(() => cell(""))],
  });
  for (const line of division.lines.filter((row) => row.section === "operatingOut")) {
    if (!line.values.some((value) => value !== 0)) continue;
    rows.push({
      kind: "line",
      cells: [cell(line.label), ...line.values.map((value) => usd(value))],
    });
  }
  rows.push({
    kind: "total",
    cells: [
      cell("Operating payments", { tone: "gold" }),
      ...division.years.map((_, i) =>
        usd(
          division.lines
            .filter((line) => line.section === "operatingOut")
            .reduce((sum, line) => sum + (line.values[i] ?? 0), 0),
          "gold",
        ),
      ),
    ],
  });
  rows.push({
    kind: "total",
    cells: [
      cell("Cash from operations", { tone: "gold" }),
      ...division.years.map((year) => usd(year.cfoUsd, "gold", "receipts − payments")),
    ],
  });
  return {
    id: "income-us",
    title: division.title,
    caption:
      "Built live from runCashflowModel. Cash-basis operating P&L — not an accrual income statement.",
    rows,
  };
}

export function returnsWorkbook(returns: InvestorReturns): ReportWorkbook {
  const unitRows: SheetRow[] = [
    {
      kind: "header",
      cells: ["ICP", "Funded", "Lease / mo", "Balloon", "Remitted", "Vehicle IRR"].map(
        (text, i) => cell(text, { tone: "dim", hideInSummary: i >= 1 && i <= 4 }),
      ),
    },
    ...returns.units.map((unit) => ({
      kind: "line" as const,
      cells: [
        cell(`${unit.code} ${unit.name}`),
        { ...usd(unit.fundedUsd), hideInSummary: true },
        { ...usd(unit.monthlyLeaseUsd), hideInSummary: true },
        { ...usd(unit.residualUsd), hideInSummary: true },
        { ...usd(unit.totalRemittedUsd), hideInSummary: true },
        pct(unit.vehicleIrrAnnual),
      ],
    })),
  ];
  const bookRows: SheetRow[] = [
    {
      kind: "header",
      cells: ["Metric", "Value"].map((text) => cell(text, { tone: "dim" })),
    },
    {
      kind: "line",
      cells: [cell("Vehicle book net cash (10y)"), usd(returns.vehicleBookNetUsd)],
    },
    {
      kind: "total",
      cells: [cell("Vehicle book IRR (annual CFs)", { tone: "gold" }), pct(returns.vehicleBookIrrAnnual)],
    },
    {
      kind: "line",
      cells: [cell("OpCo priced equity in"), usd(returns.opCoEquityInUsd, "blue")],
    },
    {
      kind: "line",
      cells: [cell("US cash from operations (10y)"), usd(returns.opCoCfoUsd)],
    },
    {
      kind: "total",
      cells: [cell("OpCo cash-on-cash", { tone: "gold" }), pct(returns.opCoCashOnCash)],
    },
  ];
  const cells: ReportCellRecord[] = returns.units.map((unit) =>
    record(
      "returns",
      `returns.${unit.icpId}.irr`,
      `${unit.code} vehicle IRR`,
      unit.vehicleIrrAnnual ?? 0,
      "IRR of monthly vehicle cash (funded + fees out; remittance + balloon in)",
      "pct",
      "gold",
    ),
  );
  return {
    kind: "returns",
    title: "Tamarindo · investor returns",
    generatedAt: returns.generatedAt,
    theme: "tamarindo-sheet",
    sheets: [
      { id: "units", title: "Unit vehicle returns", caption: returns.note, rows: unitRows },
      { id: "book", title: "Book returns", rows: bookRows },
    ],
    cells,
  };
}

export function sensitivityWorkbook(report: SensitivityReport): ReportWorkbook {
  const rows: SheetRow[] = [
    {
      kind: "header",
      cells: ["Lever", "Shock", "Input", "FY1 cash", "FY10 cash", "ICP-1 lease", "ICP-1 vehicle IRR"].map(
        (text, i) => cell(text, { tone: "dim", hideInSummary: i === 2 || i === 3 || i === 5 || i === 6 }),
      ),
    },
    ...report.rows.map((row) => ({
      kind: (row.shock === "base" ? "total" : "line") as SheetRow["kind"],
      cells: [
        cell(row.label, { tone: row.shock === "base" ? "gold" : "blue" }),
        cell(row.shock, { tone: "dim" }),
        row.key === "base"
          ? cell("current", { tone: "blue", hideInSummary: true })
          : {
              text: formatPct(row.input),
              value: row.input,
              format: "pct" as const,
              tone: "blue" as const,
              hideInSummary: true,
            },
        { ...usd(row.fy1CashUsd, row.shock === "base" ? "gold" : "plain"), hideInSummary: true },
        usd(row.fy10CashUsd, row.shock === "base" ? "gold" : "plain"),
        { ...usd(row.icp1LeaseUsd), hideInSummary: true },
        { ...pct(row.icp1VehicleIrr), hideInSummary: true },
      ],
    })),
  ];
  const cells = report.rows.map((row) =>
    record(
      "sensitivity",
      `sensitivity.${row.key}.${row.shock}.fy1`,
      `${row.label} ${row.shock} FY1 cash`,
      row.fy1CashUsd,
      "runCashflowModel with one blue lever shocked; other seeds held",
      "usd",
      row.shock === "base" ? "gold" : "plain",
    ),
  );
  return {
    kind: "sensitivity",
    title: "Tamarindo · sensitivity",
    generatedAt: report.generatedAt,
    theme: "tamarindo-sheet",
    sheets: [
      {
        id: "grid",
        title: "Blue-variable shocks",
        caption:
          "Each row reruns the engine. Shocks are not saved. Balloon floor and down payment are the meeting levers.",
        rows,
      },
    ],
    cells,
  };
}
