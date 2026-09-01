import { describe, expect, it, vi } from "vitest";
import { runCashflowModel } from "@/lib/model/engine";
import { defaultValues } from "@/lib/model/variables";
import {
  clampFyRange,
  sliceCashflowModel,
  sliceDivision,
} from "@/lib/procedures/reports";

vi.mock("@/lib/model/store", () => ({
  loadModelValues: vi.fn(async () => defaultValues()),
  loadValuesForActor: vi.fn(async () => defaultValues()),
  saveModelValues: vi.fn(async () => defaultValues()),
}));

describe("model.report slice", () => {
  it("clamps the default range to the model years", () => {
    expect(clampFyRange(undefined, undefined, 10)).toEqual({
      fromFy: 1,
      toFy: 10,
    });
    expect(clampFyRange(0, 99, 10)).toEqual({ fromFy: 1, toFy: 10 });
    expect(clampFyRange(4, 2, 10)).toEqual({ fromFy: 2, toFy: 4 });
  });

  it("slices years and line values from the engine without new math", () => {
    const model = runCashflowModel(defaultValues());
    const sliced = sliceDivision(model.consolidated, 3, 4);
    expect(sliced.years.map((year) => year.fy)).toEqual([3, 4]);
    expect(sliced.years[0]).toEqual(model.consolidated.years[2]);
    expect(sliced.years[1]).toEqual(model.consolidated.years[3]);
    const fullLine = model.consolidated.lines.find((row) => row.id === "line");
    const slicedLine = sliced.lines.find((row) => row.id === "line");
    expect(fullLine).toBeTruthy();
    expect(slicedLine?.values).toEqual(fullLine!.values.slice(2, 4));
    expect(sliced.lines).toHaveLength(model.consolidated.lines.length);
  });

  it("keeps ICP year slices aligned with the period", () => {
    const model = runCashflowModel(defaultValues());
    const report = sliceCashflowModel(model, 2, 4);
    expect(report.fromFy).toBe(2);
    expect(report.toFy).toBe(4);
    expect(report.icps).toHaveLength(6);
    expect(report.icps[0]?.id).toBe("icp1");
    expect(report.icps[0]?.years.map((year) => year.fy)).toEqual([2, 3, 4]);
    expect(report.consolidated.years).toHaveLength(3);
    expect(report.us.years).toHaveLength(3);
    expect(report.sucursal.years).toHaveLength(3);
    expect(report.vehicle.years).toHaveLength(3);
  });

  it("invokes model.report through the registry", async () => {
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "model.report",
      { fromFy: 3, toFy: 3 },
      {
        actor: {
          kind: "agent",
          id: "dev-local",
          displayName: "Nico",
          role: "investor",
        },
        traceId: "report-investor",
      },
    )) as {
      fromFy: number;
      toFy: number;
      consolidated: { years: { fy: number }[] };
      icps: unknown[];
    };
    expect(out.fromFy).toBe(3);
    expect(out.toFy).toBe(3);
    expect(out.consolidated.years.map((year) => year.fy)).toEqual([3]);
    expect(out.icps).toHaveLength(6);
    expect((out as { kind?: string }).kind).toBe("statements");
  });

  it("builds the corporate-structure workbook without engine math", async () => {
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "model.report",
      { kind: "structure" },
      {
        actor: {
          kind: "agent",
          id: "dev-local",
          displayName: "Nico",
          role: "investor",
        },
        traceId: "report-structure",
      },
    )) as { kind?: string; workbook?: { title?: string; sheets?: { id: string }[] } };
    expect(out.kind).toBe("structure");
    expect(out.workbook?.title).toMatch(/corporate structure/i);
    expect(out.workbook?.sheets?.map((sheet) => sheet.id)).toEqual(["entities", "flow"]);
  });
});
