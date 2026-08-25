import type { TenYearWorkbookSpec, WorkbookCell, WorkbookSheet } from "@/lib/artifacts/workbook";
import type { CashflowModel, DivisionStatement, VariableValue } from "@/lib/model/types";
import { VARIABLE_DEFS } from "@/lib/model/variables";

function text(value: string): WorkbookCell {
  return { kind: "text", value };
}

function num(value: number): WorkbookCell {
  return {
    kind: "number",
    value,
    label: "ASSUMPTION",
    path: "lib/model/engine.ts",
  };
}

function divisionSheet(division: DivisionStatement, fyLabels: string[]) {
  const headers = ["line", "section", ...fyLabels];
  const rows: WorkbookCell[][] = division.lines.map((line) => [
    text(line.label),
    text(line.section),
    ...line.values.map((value) => num(value)),
  ]);
  rows.push([
    text("Net cash from operations"),
    text("total"),
    ...division.years.map((year) => num(year.cfoUsd)),
  ]);
  rows.push([
    text("Net change in cash"),
    text("total"),
    ...division.years.map((year) => num(year.netChangeUsd)),
  ]);
  rows.push([
    text("Closing cash"),
    text("total"),
    ...division.years.map((year) => num(year.closingCashUsd)),
  ]);
  return { name: division.title.slice(0, 31), headers, rows };
}

export function cashflowWorkbookSpec(
  model: CashflowModel,
  options?: { admin?: boolean; values?: Record<string, VariableValue> },
): TenYearWorkbookSpec {
  const contractRows: WorkbookCell[][] = model.contracts.map((icp) => [
    text(icp.code),
    text(icp.name),
    text(icp.city),
    num(icp.purchasePriceUsd),
    num(icp.fundedUsd),
    num(icp.termMonths),
    num(icp.clientRate),
    num(icp.monthlyLeaseUsd),
    num(icp.residualUsd),
  ]);
  const productRows: WorkbookCell[][] = [
    [
      text("Homes"),
      num(model.summary.homesOriginated),
      text("ICP mix after the Nov/Dec/January stub"),
    ],
    [
      text("Autos"),
      num(model.summary.autosOriginated),
      text("~3× homes after month 12 — ASSUMPTION"),
    ],
    [
      text("Aircraft"),
      num(model.summary.aircraftOriginated),
      text("Last 3 fiscal years — gated ASSUMPTION"),
    ],
  ];
  const sheets: WorkbookSheet[] = [
    {
      name: "ICP contracts",
      headers: [
        "code",
        "name",
        "city",
        "purchase",
        "funded",
        "termMonths",
        "rate",
        "lease",
        "residual",
      ],
      rows: contractRows,
    },
    {
      name: "Products",
      headers: ["product", "originated", "note"],
      rows: productRows,
    },
    divisionSheet(model.us, model.fyLabels),
    divisionSheet(model.sucursal, model.fyLabels),
    divisionSheet(model.consolidated, model.fyLabels),
    divisionSheet(model.vehicle, model.fyLabels),
  ];

  if (options?.admin) {
    const usOpex = model.us.lines.filter((row) => row.id.startsWith("us."));
    const coOpex = model.sucursal.lines.filter((row) => row.id.startsWith("co."));
    sheets.push({
      name: "Admin departments",
      headers: ["desk", "entity", ...model.fyLabels],
      rows: [
        ...usOpex.map((row) => [
          text(row.label),
          text("US"),
          ...row.values.map((value) => num(value)),
        ]),
        ...coOpex.map((row) => [
          text(row.label),
          text("Colombia"),
          ...row.values.map((value) => num(value)),
        ]),
      ],
    });
    sheets.push({
      name: "Admin cap table",
      headers: ["holder", "class", "percent"],
      rows: model.capTable.holdersEnd.map((row) => [
        text(row.name),
        text(row.klass),
        num(row.percent),
      ]),
    });
    sheets.push({
      name: "Admin capital",
      headers: ["line", ...model.fyLabels],
      rows: ["line", "partners", "vehicles"].map((id) => {
        const found = model.consolidated.lines.find((row) => row.id === id);
        return [
          text(found?.label ?? id),
          ...(found?.values ?? model.fyLabels.map(() => 0)).map((value) => num(value)),
        ];
      }),
    });
    if (options.values) {
      sheets.push({
        name: "Admin variables",
        headers: ["key", "label", "group", "visibility", "value", "citation"],
        rows: VARIABLE_DEFS.map((def) => [
          text(def.key),
          text(def.label),
          text(def.group),
          text(def.visibility),
          typeof (options.values?.[def.key] ?? def.defaultValue) === "number"
            ? num(Number(options.values?.[def.key] ?? def.defaultValue))
            : text(String(options.values?.[def.key] ?? def.defaultValue)),
          text(`${def.citation.label} · ${def.citation.note}`),
        ]),
      });
    }
  }

  return {
    entities: ["tamarindo_us"],
    assumptionKeys: ["lineStepUpPct", "useDepartmentOpex", "autoMultipleX10"],
    sheets,
  };
}
