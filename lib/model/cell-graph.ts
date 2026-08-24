import type {
  CashflowModel,
  DivisionStatement,
  VariableValue,
} from "@/lib/model/types";
import { VARIABLE_DEFS } from "@/lib/model/variables";

/**
 * Materialize a model run as a spreadsheet-grade cell graph:
 * cells hold numbers + human-readable formulas; edges are dependencies.
 * The TS engine stays the calculator — this is storage and provenance.
 */

export type GraphCell = {
  key: string;
  sheet: "input" | "us" | "sucursal" | "consolidated" | "summary";
  lineId: string;
  label: string;
  fy: number | null;
  kind: "input" | "derived" | "memo";
  value: number;
  formula: string | null;
};

export type GraphDep = {
  /** Derived cell key. */
  cellKey: string;
  /** Cell it reads from. */
  inputKey: string;
};

export type CellGraph = {
  cells: GraphCell[];
  deps: GraphDep[];
};

/** Which variables drive each statement line, and how — hand-maintained, honest. */
const LINE_RECIPES: Record<string, { formula: string; vars: string[] }> = {
  activation: {
    formula: "new funded this FY × activationFeePct (2% of the draw)",
    vars: ["activationFeePct"],
  },
  origination: {
    formula: "new funded this FY × originationFeePct",
    vars: ["originationFeePct"],
  },
  servicing: {
    formula: "Σ monthly outstanding × servicingBps / 12",
    vars: ["servicingBps"],
  },
  spread: {
    formula: "Σ monthly interest billed × spreadSharePct",
    vars: ["spreadSharePct"],
  },
  rental: {
    formula:
      "Σ live homes × price × rentalMonthlyPctOfValue × rentFactor × (1 − mgmt − costs) × tamarindoShare × rentedTimePct",
    vars: [
      "rentalMonthlyPctOfValue",
      "ashokaMgmtFeePct",
      "rentalCostsPct",
      "rentalTamarindoSharePct",
    ],
  },
  insurance: {
    formula: "new funded this FY × insuranceCommissionPct (40 bps)",
    vars: ["insuranceCommissionPct"],
  },
  seed: {
    formula: "equity round proceeds landing this FY",
    vars: ["equityRound1Usd", "equityRound2Usd", "equityRound3Usd", "equityRound4Usd"],
  },
  collections: {
    formula: "Σ lease payments collected (agency — memo, not revenue)",
    vars: [],
  },
  remit: {
    formula: "collections − spread − servicing, remitted to vehicles",
    vars: ["spreadSharePct", "servicingBps"],
  },
  toSucursal: {
    formula: "usMandateMonthlyUsd × 12 + sucursalClosingFeeUsd × closes",
    vars: ["usMandateMonthlyUsd", "sucursalClosingFeeUsd"],
  },
  coClosing: { formula: "closes × coClosingFeeUsd", vars: ["coClosingFeeUsd"] },
  coInspection: {
    formula: "closes × coInspectionFeeUsd",
    vars: ["coInspectionFeeUsd"],
  },
  coAdmin: {
    formula: "live homes × coAdminPerLeaseUsd × 12",
    vars: ["coAdminPerLeaseUsd"],
  },
  fromUs: {
    formula: "mirror of the US mandate (intercompany)",
    vars: ["usMandateMonthlyUsd", "sucursalClosingFeeUsd"],
  },
  ashokaFee: {
    formula:
      "rented home-months × pool opt-in × ashokaGrossRentUsd × ashokaMgmtFeePct (sister-company memo)",
    vars: ["rentalPoolOptInPct", "ashokaGrossRentUsd", "ashokaMgmtFeePct"],
  },
  "us.leadership": {
    formula: "named loaded pay × founder factor (50% first 8 months)",
    vars: [
      "pay.dovLoadedUsd",
      "pay.rosarioLoadedUsd",
      "pay.ricardoLoadedUsd",
      "pay.tomLoadedUsd",
      "founderPayHalfMonths",
      "founderPayHalfPct",
    ],
  },
  "us.sales": {
    formula: "(base + 1 per salesHomesPerRep closings/mo) × loaded",
    vars: ["dept.us.sales.loadedUsd", "dept.us.sales.fte", "dept.salesHomesPerRep"],
  },
  "us.marketing": {
    formula: "FTE × loaded + monthly paid spend",
    vars: [
      "dept.us.marketing.loadedUsd",
      "dept.us.marketing.fte",
      "dept.us.marketing.spendUsd",
    ],
  },
  "us.accounting": {
    formula: "FTE × loaded",
    vars: ["dept.us.accounting.loadedUsd", "dept.us.accounting.fte"],
  },
  "us.it": { formula: "FTE × loaded", vars: ["dept.us.it.loadedUsd", "dept.us.it.fte"] },
  "us.legal": {
    formula: "FTE × loaded + contractors",
    vars: ["dept.us.legal.loadedUsd", "dept.us.legal.fte", "dept.us.legal.contractorUsd"],
  },
  "us.finance": {
    formula: "FTE × loaded",
    vars: ["dept.us.finance.loadedUsd", "dept.us.finance.fte"],
  },
  "us.credit": {
    formula: "FTE × loaded",
    vars: ["dept.us.credit.loadedUsd", "dept.us.credit.fte"],
  },
  "us.success": {
    formula: "(base + 1 per csHomesPerRep active homes) × loaded + channel",
    vars: ["dept.us.success.loadedUsd", "dept.us.success.fte", "dept.csHomesPerRep"],
  },
  "us.service": {
    formula: "(base + 1 per csHomesPerRep active homes) × loaded + channel",
    vars: ["dept.us.service.loadedUsd", "dept.us.service.fte", "dept.csHomesPerRep"],
  },
};

const SUMMARY_FIELDS: Array<{ id: keyof CashflowModel["summary"]; label: string }> = [
  { id: "homesOriginated", label: "Homes originated (10y)" },
  { id: "homesActiveEnd", label: "Homes active at end" },
  { id: "autosOriginated", label: "Autos originated (10y)" },
  { id: "aircraftOriginated", label: "Aircraft originated (10y)" },
  { id: "fundedAumEndUsd", label: "Funded AUM at end" },
  { id: "homeAumEndUsd", label: "Property AUM at end" },
  { id: "autoAumEndUsd", label: "Auto AUM at end" },
  { id: "aircraftAumEndUsd", label: "Aircraft AUM at end" },
  { id: "intervestLineEndUsd", label: "Intervest line at end" },
  { id: "partnerLineEndUsd", label: "Other partner lines at end" },
  { id: "fy1ClosingCashUsd", label: "FY1 closing cash" },
  { id: "fy10ClosingCashUsd", label: "FY10 closing cash" },
];

function inputKey(variableKey: string): string {
  return `input.${variableKey}`;
}

function lineKey(division: string, lineId: string, fy: number): string {
  return `${division}.${lineId}.fy${fy}`;
}

function divisionCells(
  statement: DivisionStatement,
  fyCount: number,
  cells: GraphCell[],
  deps: GraphDep[],
  knownInputs: Set<string>,
): void {
  const division = statement.id;
  const operatingIds: string[] = [];

  for (const line of statement.lines) {
    const recipe = LINE_RECIPES[line.id];
    const kind = line.section === "memo" ? "memo" : "derived";
    if (line.section === "operatingIn" || line.section === "operatingOut") {
      operatingIds.push(line.id);
    }
    for (let fy = 1; fy <= fyCount; fy += 1) {
      const key = lineKey(division, line.id, fy);
      cells.push({
        key,
        sheet: division,
        lineId: line.id,
        label: line.label,
        fy,
        kind,
        value: line.values[fy - 1] ?? 0,
        formula: recipe?.formula ?? null,
      });
      if (recipe) {
        for (const variable of recipe.vars) {
          if (knownInputs.has(variable)) {
            deps.push({ cellKey: key, inputKey: inputKey(variable) });
          }
        }
      }
    }
  }

  for (const year of statement.years) {
    const cfoKey = lineKey(division, "cfo", year.fy);
    const closeKey = lineKey(division, "closingCash", year.fy);
    cells.push(
      {
        key: cfoKey,
        sheet: division,
        lineId: "cfo",
        label: "Cash from operations",
        fy: year.fy,
        kind: "derived",
        value: year.cfoUsd,
        formula: "Σ operating receipts − Σ operating payments",
      },
      {
        key: closeKey,
        sheet: division,
        lineId: "closingCash",
        label: "Closing cash",
        fy: year.fy,
        kind: "derived",
        value: year.closingCashUsd,
        formula: "opening cash + CFO + CFI + CFF",
      },
    );
    for (const id of operatingIds) {
      deps.push({ cellKey: cfoKey, inputKey: lineKey(division, id, year.fy) });
    }
    deps.push({ cellKey: closeKey, inputKey: cfoKey });
    if (year.fy > 1) {
      deps.push({
        cellKey: closeKey,
        inputKey: lineKey(division, "closingCash", year.fy - 1),
      });
    }
  }
}

export function buildCellGraph(
  model: CashflowModel,
  values: Record<string, VariableValue>,
): CellGraph {
  const cells: GraphCell[] = [];
  const deps: GraphDep[] = [];

  const knownInputs = new Set<string>();
  for (const def of VARIABLE_DEFS) {
    const raw = values[def.key] ?? def.defaultValue;
    if (typeof raw !== "number") continue;
    knownInputs.add(def.key);
    cells.push({
      key: inputKey(def.key),
      sheet: "input",
      lineId: def.group,
      label: def.label,
      fy: null,
      kind: "input",
      value: raw,
      formula: null,
    });
  }

  divisionCells(model.us, model.fyCount, cells, deps, knownInputs);
  divisionCells(model.sucursal, model.fyCount, cells, deps, knownInputs);
  divisionCells(model.consolidated, model.fyCount, cells, deps, knownInputs);

  // Consolidated lines read from the entity statements where ids match.
  const usIds = new Set(model.us.lines.map((line) => line.id));
  const sucIds = new Set(model.sucursal.lines.map((line) => line.id));
  for (const line of model.consolidated.lines) {
    for (let fy = 1; fy <= model.fyCount; fy += 1) {
      const key = lineKey("consolidated", line.id, fy);
      if (usIds.has(line.id)) {
        deps.push({ cellKey: key, inputKey: lineKey("us", line.id, fy) });
      }
      if (sucIds.has(line.id)) {
        deps.push({ cellKey: key, inputKey: lineKey("sucursal", line.id, fy) });
      }
    }
  }

  for (const field of SUMMARY_FIELDS) {
    const value = model.summary[field.id];
    if (typeof value !== "number") continue;
    cells.push({
      key: `summary.${String(field.id)}`,
      sheet: "summary",
      lineId: String(field.id),
      label: field.label,
      fy: null,
      kind: "derived",
      value,
      formula: null,
    });
  }

  // Guard: every dep endpoint must resolve to a real cell.
  const keys = new Set(cells.map((cell) => cell.key));
  const validDeps = deps.filter(
    (dep) => keys.has(dep.cellKey) && keys.has(dep.inputKey),
  );

  return { cells, deps: validDeps };
}
