import { describe, expect, it } from "vitest";
import { buildCellGraph } from "@/lib/model/cell-graph";
import { runCashflowModel } from "@/lib/model/engine";
import { defaultValues } from "@/lib/model/variables";

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
