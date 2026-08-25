import { prisma } from "@/lib/db";
import { buildCellGraph } from "@/lib/model/cell-graph";
import { runCashflowModel } from "@/lib/model/engine";
import type { VariableValue } from "@/lib/model/types";
import { VARIABLE_DEFS } from "@/lib/model/variables";
import type { Prisma } from "@prisma/client";

/** Auto-saved by model.explain — hidden from the what-if picker. */
export const AUTO_BASE_SCENARIO_NAME = "Base case (auto)";

export type ScenarioSummary = {
  id: string;
  name: string;
  description: string | null;
  isBase: boolean;
  cellCount: number;
  createdAt: string;
  variables: Record<string, VariableValue>;
};

export type ExplainNode = {
  key: string;
  label: string;
  sheet: string;
  fy: number | null;
  kind: string;
  value: number;
  formula: string | null;
  inputs: ExplainNode[];
};

/** Run the engine and materialize the whole book as cells + deps. */
export async function saveScenario(options: {
  name: string;
  description?: string;
  values: Record<string, VariableValue>;
  isBase?: boolean;
  createdById?: string | null;
}): Promise<{ scenarioId: string; cellCount: number; depCount: number }> {
  const model = runCashflowModel(options.values);
  const graph = buildCellGraph(model, options.values);

  // One transaction: a partial failure must not leave a scenario row without
  // its cells or dependency edges — the book is all-or-nothing.
  return prisma.$transaction(
    async (tx) => {
      const scenario = await tx.modelScenario.create({
        data: {
          name: options.name,
          description: options.description ?? null,
          variables: options.values as Prisma.InputJsonValue,
          isBase: options.isBase ?? false,
          createdById: options.createdById ?? null,
        },
      });

      await tx.modelCell.createMany({
        data: graph.cells.map((cell) => ({
          scenarioId: scenario.id,
          key: cell.key,
          sheet: cell.sheet,
          lineId: cell.lineId,
          label: cell.label,
          fy: cell.fy,
          kind: cell.kind,
          value: cell.value,
          formula: cell.formula,
        })),
      });

      const rows = await tx.modelCell.findMany({
        where: { scenarioId: scenario.id },
        select: { id: true, key: true },
      });
      const idByKey = new Map(rows.map((row) => [row.key, row.id]));
      const depData = graph.deps.flatMap((dep) => {
        const cellId = idByKey.get(dep.cellKey);
        const inputId = idByKey.get(dep.inputKey);
        return cellId && inputId ? [{ cellId, inputId }] : [];
      });
      // Chunk to keep parameter counts inside Postgres limits.
      for (let i = 0; i < depData.length; i += 5_000) {
        await tx.modelCellDep.createMany({
          data: depData.slice(i, i + 5_000),
          skipDuplicates: true,
        });
      }

      return {
        scenarioId: scenario.id,
        cellCount: graph.cells.length,
        depCount: depData.length,
      };
    },
    // A full book over Hyperdrive can outlive the 5s interactive default.
    { timeout: 30_000 },
  );
}

function asVariableRecord(value: Prisma.JsonValue): Record<string, VariableValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, VariableValue>;
}

/** Grey (admin-visibility) input cells, e.g. input.targetUtilizationPct. */
export function isMemberHiddenInputCell(key: string): boolean {
  if (!key.startsWith("input.")) return false;
  const variableKey = key.slice("input.".length);
  const def = VARIABLE_DEFS.find((row) => row.key === variableKey);
  return def?.visibility === "admin";
}

export function pickAllowedVariables(
  values: Record<string, VariableValue>,
  allowed: Set<string>,
): Record<string, VariableValue> {
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => allowed.has(key)),
  );
}

export function filterDiffRowsForRole<T extends { key: string }>(
  rows: T[],
  role: string,
): T[] {
  if (role === "admin") return rows;
  return rows.filter((row) => !isMemberHiddenInputCell(row.key));
}

export async function listScenarios(createdById: string): Promise<ScenarioSummary[]> {
  const rows = await prisma.modelScenario.findMany({
    where: {
      createdById,
      NOT: { name: AUTO_BASE_SCENARIO_NAME },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { cells: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    isBase: row.isBase,
    cellCount: row._count.cells,
    createdAt: row.createdAt.toISOString(),
    variables: asVariableRecord(row.variables),
  }));
}

export async function getOwnedScenario(
  id: string,
  createdById: string,
): Promise<{ id: string; name: string; variables: Record<string, VariableValue> }> {
  const row = await prisma.modelScenario.findFirst({
    where: { id, createdById },
    select: { id: true, name: true, variables: true },
  });
  if (!row) {
    throw new Error("Scenario not found");
  }
  return {
    id: row.id,
    name: row.name,
    variables: asVariableRecord(row.variables),
  };
}

export async function latestScenarioId(createdById: string): Promise<string | null> {
  const row = await prisma.modelScenario.findFirst({
    where: { createdById },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return row?.id ?? null;
}

export type ScenarioDiffRow = {
  key: string;
  label: string;
  sheet: string;
  fy: number | null;
  kind: string;
  a: number;
  b: number;
  delta: number;
};

export type ScenarioDiff = {
  scenarioA: { id: string; name: string };
  scenarioB: { id: string; name: string };
  changed: ScenarioDiffRow[];
  totalChanged: number;
};

/** Compare two stored scenarios cell by cell, largest moves first. */
export async function diffScenarios(
  aId: string,
  bId: string,
  createdById: string,
  limit = 40,
  role = "admin",
): Promise<ScenarioDiff> {
  const [a, b] = await Promise.all([
    prisma.modelScenario.findFirst({
      where: { id: aId, createdById },
      select: { id: true, name: true },
    }),
    prisma.modelScenario.findFirst({
      where: { id: bId, createdById },
      select: { id: true, name: true },
    }),
  ]);
  if (!a || !b) {
    throw new Error("Scenario not found");
  }
  const [aCells, bCells] = await Promise.all([
    prisma.modelCell.findMany({
      where: { scenarioId: aId },
      select: { key: true, label: true, sheet: true, fy: true, kind: true, value: true },
    }),
    prisma.modelCell.findMany({
      where: { scenarioId: bId },
      select: { key: true, value: true },
    }),
  ]);
  const bByKey = new Map(bCells.map((cell) => [cell.key, Number(cell.value)]));
  const changed: ScenarioDiffRow[] = [];
  for (const cell of aCells) {
    const bValue = bByKey.get(cell.key);
    if (bValue === undefined) continue;
    const aValue = Number(cell.value);
    if (Math.abs(aValue - bValue) < 0.005) continue;
    changed.push({
      key: cell.key,
      label: cell.label,
      sheet: cell.sheet,
      fy: cell.fy,
      kind: cell.kind,
      a: aValue,
      b: bValue,
      delta: bValue - aValue,
    });
  }
  const visible = filterDiffRowsForRole(changed, role);
  visible.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  return {
    scenarioA: a,
    scenarioB: b,
    changed: visible.slice(0, limit),
    totalChanged: visible.length,
  };
}

/** Walk the dependency graph downward from one cell. */
export async function explainCell(
  scenarioId: string,
  key: string,
  depth = 2,
): Promise<ExplainNode | null> {
  const cell = await prisma.modelCell.findUnique({
    where: { scenarioId_key: { scenarioId, key } },
  });
  if (!cell) return null;

  const node: ExplainNode = {
    key: cell.key,
    label: cell.label,
    sheet: cell.sheet,
    fy: cell.fy,
    kind: cell.kind,
    value: Number(cell.value),
    formula: cell.formula,
    inputs: [],
  };
  if (depth <= 0) return node;

  const edges = await prisma.modelCellDep.findMany({
    where: { cellId: cell.id },
    include: { input: true },
    orderBy: { input: { key: "asc" } },
    take: 40,
  });
  for (const edge of edges) {
    const child = await explainCell(scenarioId, edge.input.key, depth - 1);
    if (child) node.inputs.push(child);
  }
  return node;
}
