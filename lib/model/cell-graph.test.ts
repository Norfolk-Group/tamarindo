import { describe, expect, it, vi } from "vitest";
import { buildCellGraph } from "@/lib/model/cell-graph";
import { runCashflowModel } from "@/lib/model/engine";
import { defaultValues } from "@/lib/model/variables";
import {
  AUTO_BASE_SCENARIO_NAME,
  filterDiffRowsForRole,
  isMemberHiddenInputCell,
  pickAllowedVariables,
} from "@/lib/model/cell-store";

const findManyScenarios = vi.fn();
const findFirstScenario = vi.fn();
const findManyCells = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    modelScenario: {
      findMany: (...args: unknown[]) => findManyScenarios(...args),
      findFirst: (...args: unknown[]) => findFirstScenario(...args),
    },
    modelCell: {
      findMany: (...args: unknown[]) => findManyCells(...args),
    },
  },
}));

describe("cell graph", () => {
  const values = defaultValues();
  const model = runCashflowModel(values);
  const graph = buildCellGraph(model, values);

  it("gives every cell a unique key and every dep two real endpoints", () => {
    const keys = new Set(graph.cells.map((cell) => cell.key));
    expect(keys.size).toBe(graph.cells.length);
    for (const dep of graph.deps) {
      expect(keys.has(dep.cellKey)).toBe(true);
      expect(keys.has(dep.inputKey)).toBe(true);
    }
  });

  it("stores statement cells with values matching the engine", () => {
    const spreadFy3 = graph.cells.find((cell) => cell.key === "us.spread.fy3");
    const engineRow = model.us.lines.find((line) => line.id === "spread")!;
    expect(spreadFy3).toBeTruthy();
    expect(spreadFy3!.value).toBe(engineRow.values[2]);
    expect(spreadFy3!.formula).toContain("spreadSharePct");

    const balloon = graph.cells.find((cell) => cell.key === "vehicle.balloon.fy10");
    const vehicleRow = model.vehicle.lines.find((line) => line.id === "balloon")!;
    expect(balloon).toBeTruthy();
    expect(balloon!.value).toBe(vehicleRow.values[9]);
  });

  it("links derived cells to their variable inputs and totals", () => {
    const spreadDeps = graph.deps.filter((dep) => dep.cellKey === "us.spread.fy3");
    expect(spreadDeps.some((dep) => dep.inputKey === "input.spreadSharePct")).toBe(true);

    const cfoDeps = graph.deps.filter((dep) => dep.cellKey === "us.cfo.fy1");
    expect(cfoDeps.some((dep) => dep.inputKey === "us.spread.fy1")).toBe(true);

    const closeDeps = graph.deps.filter(
      (dep) => dep.cellKey === "consolidated.closingCash.fy2",
    );
    expect(
      closeDeps.some((dep) => dep.inputKey === "consolidated.closingCash.fy1"),
    ).toBe(true);
  });

  it("keeps memo lines marked memo and inputs marked input", () => {
    const collections = graph.cells.find(
      (cell) => cell.key === "us.collections.fy1",
    )!;
    expect(collections.kind).toBe("memo");
    const input = graph.cells.find((cell) => cell.key === "input.spreadSharePct")!;
    expect(input.kind).toBe("input");
    expect(input.value).toBe(0.2);
  });
});

describe("owned scenario shelf", () => {
  it("treats grey input cells as member-hidden and keeps blue inputs plus statement totals", () => {
    expect(isMemberHiddenInputCell("input.targetUtilizationPct")).toBe(true);
    expect(isMemberHiddenInputCell("input.downPaymentPct")).toBe(false);
    expect(isMemberHiddenInputCell("us.cfo.fy1")).toBe(false);
    const allowed = new Set(["downPaymentPct"]);
    expect(
      pickAllowedVariables(
        { downPaymentPct: 0.35, targetUtilizationPct: 0.99 },
        allowed,
      ),
    ).toEqual({ downPaymentPct: 0.35 });
    const rows = [
      { key: "input.targetUtilizationPct" },
      { key: "input.downPaymentPct" },
      { key: "consolidated.closingCash.fy1" },
    ];
    expect(filterDiffRowsForRole(rows, "member").map((row) => row.key)).toEqual([
      "input.downPaymentPct",
      "consolidated.closingCash.fy1",
    ]);
    expect(filterDiffRowsForRole(rows, "admin")).toHaveLength(3);
  });

  it("lists only this profile's named what-ifs and excludes the auto base case", async () => {
    const { listScenarios } = await import("@/lib/model/cell-store");
    findManyScenarios.mockResolvedValueOnce([
      {
        id: "s1",
        name: "Rate shock",
        description: null,
        isBase: false,
        createdAt: new Date("2026-08-25T00:00:00.000Z"),
        variables: { downPaymentPct: 0.35 },
        _count: { cells: 2 },
      },
    ]);
    const rows = await listScenarios("prof_1");
    expect(findManyScenarios).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdById: "prof_1",
          NOT: { name: AUTO_BASE_SCENARIO_NAME },
        },
      }),
    );
    expect(rows.map((row) => row.name)).toEqual(["Rate shock"]);
    expect(rows[0]?.variables.downPaymentPct).toBe(0.35);
  });

  it("refuses to diff a snapshot this profile does not own", async () => {
    const { diffScenarios } = await import("@/lib/model/cell-store");
    findFirstScenario
      .mockResolvedValueOnce({ id: "a", name: "A" })
      .mockResolvedValueOnce(null);
    await expect(diffScenarios("a", "foreign", "prof_1")).rejects.toThrow(/not found/i);
    expect(findFirstScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "foreign", createdById: "prof_1" },
      }),
    );
  });

  it("scopes the latest explain snapshot to this profile", async () => {
    const { latestScenarioId } = await import("@/lib/model/cell-store");
    findFirstScenario.mockResolvedValueOnce({ id: "mine" });
    await expect(latestScenarioId("prof_1")).resolves.toBe("mine");
    expect(findFirstScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdById: "prof_1" },
      }),
    );
  });
});
