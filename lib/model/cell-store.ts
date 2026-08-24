import { prisma } from "@/lib/db";
import { buildCellGraph } from "@/lib/model/cell-graph";
import { runCashflowModel } from "@/lib/model/engine";
import type { VariableValue } from "@/lib/model/types";
import type { Prisma } from "@/lib/generated/prisma";

export type ScenarioSummary = {
  id: string;
  name: string;
  description: string | null;
  isBase: boolean;
  cellCount: number;
  createdAt: string;
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

  const scenario = await prisma.modelScenario.create({
    data: {
      name: options.name,
      description: options.description ?? null,
      variables: options.values as Prisma.InputJsonValue,
      isBase: options.isBase ?? false,
      createdById: options.createdById ?? null,
    },
  });

  await prisma.modelCell.createMany({
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

  const rows = await prisma.modelCell.findMany({
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
    await prisma.modelCellDep.createMany({
      data: depData.slice(i, i + 5_000),
      skipDuplicates: true,
    });
  }

  return {
    scenarioId: scenario.id,
    cellCount: graph.cells.length,
    depCount: depData.length,
  };
}

export async function listScenarios(): Promise<ScenarioSummary[]> {
  const rows = await prisma.modelScenario.findMany({
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
  }));
}

export async function latestScenarioId(): Promise<string | null> {
  const row = await prisma.modelScenario.findFirst({
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
  limit = 40,
): Promise<ScenarioDiff> {
  const [a, b] = await Promise.all([
    prisma.modelScenario.findUniqueOrThrow({
      where: { id: aId },
      select: { id: true, name: true },
    }),
    prisma.modelScenario.findUniqueOrThrow({
      where: { id: bId },
      select: { id: true, name: true },
    }),
  ]);
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
  changed.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  return {
    scenarioA: a,
    scenarioB: b,
    changed: changed.slice(0, limit),
    totalChanged: changed.length,
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
