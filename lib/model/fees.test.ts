import { describe, expect, it } from "vitest";
import { assertConsolidatedIdentity, runCashflowModel } from "@/lib/model/engine";
import { defaultValues } from "@/lib/model/variables";

describe("ancillary fee book", () => {
  it("books nothing extra at zero defaults", () => {
    const model = runCashflowModel(defaultValues());
    assertConsolidatedIdentity(model);
    const fy1 = model.us.lines.filter((row) => row.id.startsWith("feeIn."));
    expect(fy1.length).toBeGreaterThan(10);
    expect(fy1.every((row) => row.values.every((value) => value === 0))).toBe(true);
    const costs = model.us.lines.filter((row) => row.id.startsWith("feeOut."));
    expect(costs.every((row) => row.values.every((value) => value === 0))).toBe(true);
  });

  it("books application fees when Credit turns the lever on", () => {
    const values = defaultValues();
    values["fee.applicationUsd"] = 500;
    const model = runCashflowModel(values);
    assertConsolidatedIdentity(model);
    const line = model.us.lines.find((row) => row.id === "feeIn.application")!;
    const homes = model.us.lines.find((row) => row.id === "homes")!;
    const autos = model.us.lines.find((row) => row.id === "autos")!;
    const aircraft = model.us.lines.find((row) => row.id === "aircraft")!;
    const expected = (homes.values[0] + autos.values[0] + aircraft.values[0]) * 500;
    expect(line.values[0]).toBe(expected);
    expect(line.values[0]).toBeGreaterThan(0);
  });

  it("books unused-line cost on undrawn commitment", () => {
    const values = defaultValues();
    values["fee.unusedLineBps"] = 0.012;
    const model = runCashflowModel(values);
    assertConsolidatedIdentity(model);
    const line = model.us.lines.find((row) => row.id === "feeOut.unusedLine")!;
    expect(line.values[0]).toBeGreaterThan(0);
  });
});
