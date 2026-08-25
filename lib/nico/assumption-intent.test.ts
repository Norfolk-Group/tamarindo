import { describe, expect, it } from "vitest";
import {
  formatScenarioDiffGlance,
  isAssumptionsAsk,
  matchScenarioByName,
  namedScenarioCount,
  parseScenarioAsk,
  pickScenarioDiffGlanceRows,
} from "@/lib/nico/assumption-intent";

describe("assumption intent", () => {
  it("hears show my assumptions", () => {
    expect(isAssumptionsAsk("show my assumptions")).toBe(true);
    expect(isAssumptionsAsk("what are the inputs")).toBe(true);
    expect(isAssumptionsAsk("set down to 35%")).toBe(false);
  });

  it("hears save this as a named what-if", () => {
    expect(parseScenarioAsk("save this as Rate shock")).toEqual({
      kind: "save",
      name: "Rate shock",
    });
  });

  it("hears load and apply by name", () => {
    expect(parseScenarioAsk("load Rate shock")).toEqual({
      kind: "load",
      name: "Rate shock",
    });
    expect(parseScenarioAsk("apply Rate shock")).toEqual({
      kind: "load",
      name: "Rate shock",
    });
  });

  it("hears compare A and B", () => {
    expect(parseScenarioAsk("compare Rate shock and Base")).toEqual({
      kind: "compare",
      nameA: "Rate shock",
      nameB: "Base",
    });
  });

  it("does not steal set-to, sensitivity, or report loads", () => {
    expect(parseScenarioAsk("set down to 35%")).toBeNull();
    expect(parseScenarioAsk("sensitivity on down")).toBeNull();
    expect(parseScenarioAsk("load the financial statements")).toBeNull();
    expect(parseScenarioAsk("load my assumptions")).toBeNull();
    expect(parseScenarioAsk("apply the ICP catalog")).toBeNull();
  });

  it("matches listed names case-insensitively", () => {
    const rows = [
      { id: "a", name: "Rate shock" },
      { id: "b", name: "Base" },
    ];
    expect(matchScenarioByName(rows, "rate shock")?.id).toBe("a");
    expect(matchScenarioByName(rows, "missing")).toBeUndefined();
  });

  it("takes the newest duplicate name", () => {
    const rows = [
      { id: "new", name: "Rate shock" },
      { id: "old", name: "Rate shock" },
    ];
    expect(matchScenarioByName(rows, "Rate shock")?.id).toBe("new");
    expect(namedScenarioCount(rows, "Rate shock")).toBe(2);
  });

  it("prefers input rows plus FY cash and caps the glance", () => {
    const changed = [
      ...Array.from({ length: 20 }, (_, i) => ({
        key: `input.lever${i}`,
        label: `Lever ${i}`,
        kind: "input",
        fy: null,
        a: 1,
        b: 2,
        delta: 1,
      })),
      {
        key: "summary.fy1ClosingCashUsd",
        label: "FY1 closing cash",
        kind: "derived",
        fy: null,
        a: 10,
        b: 20,
        delta: 10,
      },
      {
        key: "us.activation.fy3",
        label: "Activation",
        kind: "derived",
        fy: 3,
        a: 1,
        b: 9,
        delta: 8,
      },
    ];
    const rows = pickScenarioDiffGlanceRows(changed);
    expect(rows).toHaveLength(12);
    expect(rows.some((row) => row.key === "summary.fy1ClosingCashUsd")).toBe(
      true,
    );
    expect(rows.some((row) => row.key === "us.activation.fy3")).toBe(false);
    const table = formatScenarioDiffGlance({
      scenarioA: { name: "A" },
      scenarioB: { name: "B" },
      changed,
    });
    expect(table).toContain("| Input | A | B | Δ |");
    expect(table).toContain("FY1 closing cash");
    expect(table).not.toContain("Activation");
  });
});
