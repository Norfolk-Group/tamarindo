/**
 * Luca's typed 10-year workbook spec. The custom OOXML writer consumes
 * this — it does not invent cells. Uncited values stay blank (R6).
 */

import {
  ENTITY_LABELS,
  TAMARINDO_ENTITIES,
  centersFor,
  seedManpower,
  type CitationLabel,
  type TamarindoEntity,
} from "@/lib/artifacts/centers";
import { feesForEntity } from "@/lib/artifacts/fees";

export type WorkbookCell =
  | { kind: "blank" }
  | { kind: "text"; value: string }
  | { kind: "number"; value: number; label: CitationLabel; path: string }
  | { kind: "formula"; formula: string };

export type WorkbookSheet = {
  name: string;
  headers: string[];
  rows: WorkbookCell[][];
};

export type TenYearWorkbookSpec = {
  entities: TamarindoEntity[];
  sheets: WorkbookSheet[];
  assumptionKeys: string[];
};

const SHORT: Record<TamarindoEntity, string> = {
  tamarindo_us: "US",
  tamarindo_intervest: "Intervest",
  tamarindo_colombia: "Colombia",
  ashoka: "Ashoka",
};

export function entitySheetPrefix(entity: TamarindoEntity): string {
  return SHORT[entity];
}

function q(sheet: string, cell: string): string {
  return `'${sheet}'!${cell}`;
}

function ifBlank(refs: string[], otherwise: string): string {
  const missing = refs.map((ref) => `${ref}=""`).join(",");
  return `IF(OR(${missing}),"",${otherwise})`;
}

/** Column C on Assumptions holds the value. */
function assumptionCell(row: number): string {
  return q("Assumptions", `C${row}`);
}

export function tenYearWorkbookSpec(entities: TamarindoEntity[]): TenYearWorkbookSpec {
  const unique = [...new Set(entities)];
  const assumptionRows: { key: string; cells: WorkbookCell[] }[] = [];

  const addAssumption = (
    key: string,
    year: number | null,
    value: number | null,
    label: CitationLabel | null,
    path: string,
    note: string,
  ) => {
    assumptionRows.push({
      key,
      cells: [
        { kind: "text", value: key },
        year == null ? { kind: "blank" } : { kind: "number", value: year, label: "FACT", path: "lib/artifacts/workbook.ts" },
        value == null || !label
          ? { kind: "blank" }
          : { kind: "number", value, label, path },
        { kind: "text", value: label ?? "" },
        { kind: "text", value: path },
        { kind: "text", value: note },
      ],
    });
  };

  for (const entity of unique) {
    for (const center of centersFor(entity)) {
      for (let year = 1; year <= 10; year += 1) {
        const line = seedManpower(center, year);
        const citedHeadcount = year <= 2 && line.fte > 0;
        addAssumption(
          `${center.id}.y${year}.fte`,
          year,
          citedHeadcount ? line.fte : null,
          citedHeadcount ? line.citation.label : null,
          line.citation.path,
          citedHeadcount ? line.citation.note : "Uncited later-year headcount stays blank",
        );
        addAssumption(
          `${center.id}.y${year}.salary`,
          year,
          line.avgSalaryUsd,
          line.avgSalaryUsd == null ? null : line.citation.label,
          line.citation.path,
          "Salary unlabeled until cited",
        );
      }
    }
    for (const fee of feesForEntity(entity)) {
      addAssumption(
        `${fee.id}.rate`,
        null,
        fee.rate,
        fee.rate == null ? null : fee.citation.label,
        fee.citation.path,
        fee.citation.note,
      );
    }
  }

  const assumptionIndex = new Map<string, number>();
  assumptionRows.forEach((row, i) => assumptionIndex.set(row.key, i + 2));

  const ref = (key: string): string => {
    const row = assumptionIndex.get(key);
    if (!row) throw new Error(`Missing assumption ${key}`);
    return assumptionCell(row);
  };

  const sheets: WorkbookSheet[] = [
    {
      name: "Assumptions",
      headers: ["key", "year", "value", "label", "path", "note"],
      rows: assumptionRows.map((r) => r.cells),
    },
  ];

  for (const entity of unique) {
    const prefix = SHORT[entity];
    const manpowerName = `${prefix} Manpower`;
    const pnlName = `${prefix} P&L`;
    const feesName = `${prefix} Fees`;

    const manpowerRows: WorkbookCell[][] = [];
    for (const center of centersFor(entity)) {
      for (let year = 1; year <= 10; year += 1) {
        const fte = ref(`${center.id}.y${year}.fte`);
        const salary = ref(`${center.id}.y${year}.salary`);
        manpowerRows.push([
          { kind: "text", value: center.id },
          { kind: "text", value: center.name },
          { kind: "number", value: year, label: "FACT", path: "lib/artifacts/workbook.ts" },
          { kind: "formula", formula: `=${fte}` },
          { kind: "formula", formula: `=${salary}` },
          {
            kind: "formula",
            formula: `=${ifBlank([fte, salary], `${fte}*${salary}`)}`,
          },
        ]);
      }
    }

    sheets.push({
      name: manpowerName,
      headers: ["centerId", "center", "year", "fte", "salary", "cost"],
      rows: manpowerRows,
    });

    const feeRows: WorkbookCell[][] = feesForEntity(entity).map((fee) => {
      const rate = ref(`${fee.id}.rate`);
      return [
        { kind: "text", value: fee.id },
        { kind: "text", value: fee.direction },
        { kind: "text", value: fee.name },
        { kind: "formula", formula: `=${rate}` },
        { kind: "text", value: fee.rateUnit },
        { kind: "text", value: fee.citation.label },
      ];
    });

    sheets.push({
      name: feesName,
      headers: ["id", "direction", "name", "rate", "unit", "label"],
      rows: feeRows,
    });

    const pnlRows: WorkbookCell[][] = [];
    for (const center of centersFor(entity)) {
      for (let year = 1; year <= 10; year += 1) {
        const costRef = q(
          manpowerName,
          `F${manpowerRows.findIndex((row) => row[0]?.kind === "text" && row[0].value === center.id && row[2]?.kind === "number" && row[2].value === year) + 2}`,
        );
        pnlRows.push([
          { kind: "text", value: center.id },
          { kind: "text", value: center.kind },
          { kind: "number", value: year, label: "FACT", path: "lib/artifacts/workbook.ts" },
          { kind: "formula", formula: `=${costRef}` },
        ]);
      }
    }
    for (const fee of feesForEntity(entity)) {
      const rate = ref(`${fee.id}.rate`);
      pnlRows.push([
        { kind: "text", value: fee.id },
        { kind: "text", value: fee.direction === "charged" ? "revenue" : "cost" },
        { kind: "blank" },
        { kind: "formula", formula: `=${rate}` },
      ]);
    }

    sheets.push({
      name: pnlName,
      headers: ["line", "kind", "year", "amount"],
      rows: pnlRows,
    });
  }

  if (unique.length === TAMARINDO_ENTITIES.length) {
    sheets.push(familyRollupSheet(unique));
  }

  return {
    entities: unique,
    sheets,
    assumptionKeys: assumptionRows.map((r) => r.key),
  };
}

function familyRollupSheet(entities: TamarindoEntity[]): WorkbookSheet {
  const headers = ["year", ...entities.map((entity) => SHORT[entity]), "Family"];
  const rows: WorkbookCell[][] = [];
  for (let year = 1; year <= 10; year += 1) {
    const costRefs = entities.map((entity) => {
      const sheet = `${SHORT[entity]} Manpower`;
      return `SUMIF(${q(sheet, "C:C")},${year},${q(sheet, "F:F")})`;
    });
    const rowNumber = year + 1;
    const familySum = entities
      .map((_, i) => `${String.fromCharCode(66 + i)}${rowNumber}`)
      .join("+");
    rows.push([
      { kind: "number", value: year, label: "FACT", path: "lib/artifacts/workbook.ts" },
      ...costRefs.map((formula) => ({ kind: "formula" as const, formula: `=${formula}` })),
      { kind: "formula", formula: `=${familySum}` },
    ]);
  }
  return { name: "Family", headers, rows };
}

export function requireCitedOrBlank(cell: WorkbookCell): void {
  if (cell.kind === "number" && !cell.label) {
    throw new Error("Unlabeled number is not allowed on the workbook spec");
  }
}

export { ENTITY_LABELS };
