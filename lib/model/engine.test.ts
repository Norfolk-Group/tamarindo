import { describe, expect, it } from "vitest";
import { assertConsolidatedIdentity, runCashflowModel } from "@/lib/model/engine";
import { defaultValues } from "@/lib/model/variables";

describe("cashflow engine", () => {
  it("originates the Nov / Dec / January stub and stays consolidated", () => {
    const model = runCashflowModel(defaultValues());
    assertConsolidatedIdentity(model);
    const firstFive = model.vintages.slice(0, 5);
    expect(firstFive.map((row) => `${row.year}-${row.month}:${row.icpId}`)).toEqual([
      "2026-11:icp1",
      "2026-11:icp5",
      "2026-12:icp2",
      "2026-12:icp4",
      "2027-1:icp6",
    ]);
    expect(model.summary.januaryCohortYear).toBe(2027);
    expect(model.contracts).toHaveLength(6);
    expect(model.us.years).toHaveLength(10);
    expect(model.sucursal.years).toHaveLength(10);
    expect(model.consolidated.years).toHaveLength(10);
  });

  it("keeps US+sucursal net cash equal to consolidated every year", () => {
    const model = runCashflowModel(defaultValues());
    for (let i = 0; i < 10; i += 1) {
      const us = model.us.years[i].netChangeUsd;
      const sucursal = model.sucursal.years[i].netChangeUsd;
      expect(Number((us + sucursal).toFixed(2))).toBe(
        model.consolidated.years[i].netChangeUsd,
      );
    }
  });

  it("steps the Intervest line after the second tranche", () => {
    const model = runCashflowModel(defaultValues());
    const line = model.consolidated.lines.find((row) => row.id === "line");
    expect(line).toBeTruthy();
    expect(line!.values[0]).toBe(20_000_000);
    expect(line!.values[1]).toBe(25_000_000);
    expect(line!.values[9]).toBe(75_000_000);
  });

  it("books three priced equity rounds and keeps Intervest off the cap table", () => {
    const model = runCashflowModel(defaultValues());
    const equity = model.us.lines.find((row) => row.id === "seed")!;
    expect(equity.values[0]).toBe(2_000_000);
    expect(equity.values[1]).toBe(2_250_000);
    expect(equity.values[2]).toBe(2_250_000);
    expect(model.capTable.raisedUsd).toBe(6_500_000);
    expect(model.capTable.founderCount).toBe(5);
    expect(model.capTable.holdersEnd.some((row) => /intervest/i.test(row.name))).toBe(
      false,
    );
    expect(model.summary.fy1ClosingCashUsd).toBeGreaterThan(0);
  });

  it("gives Colombia its own client revenue and does not force a wash", () => {
    const model = runCashflowModel(defaultValues());
    const closing = model.sucursal.lines.find((row) => row.id === "coClosing");
    const mandate = model.sucursal.lines.find((row) => row.id === "fromUs");
    expect(closing).toBeTruthy();
    expect(closing!.values.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0);
    expect(mandate!.values[0]).toBeGreaterThan(0);
    expect(model.sucursal.years[0].cfoUsd).not.toBe(0);
  });

  it("uses department desks instead of the US lump", () => {
    const model = runCashflowModel(defaultValues());
    expect(model.us.lines.find((row) => row.id === "us.leadership")).toBeTruthy();
    expect(model.us.lines.find((row) => row.id === "us.success")).toBeTruthy();
    expect(model.us.lines.find((row) => row.id === "us.marketing")).toBeTruthy();
    expect(model.us.lines.find((row) => row.id === "us.sales")).toBeTruthy();
    expect(model.us.lines.find((row) => row.id === "us.accounting")).toBeTruthy();
    expect(model.sucursal.lines.find((row) => row.id === "co.gm")).toBeTruthy();
    const leadership = model.us.lines.find((row) => row.id === "us.leadership")!.values[0];
    expect(leadership).toBeCloseTo((26_973 + 16_805 + 26_973 + 16_805) * 8, 0);
  });

  it("falls back to opex lumps when useDepartmentOpex is 0", () => {
    const model = runCashflowModel({ ...defaultValues(), useDepartmentOpex: 0 });
    expect(model.us.lines.find((row) => row.id === "us.lump")!.values[0]).toBe(130_000 * 12);
  });

  it("starts autos in FY1 after month 6 and aircraft in FY8", () => {
    const model = runCashflowModel(defaultValues());
    const autos = model.consolidated.lines.find((row) => row.id === "autos")!;
    const aircraft = model.consolidated.lines.find((row) => row.id === "aircraft")!;
    expect(autos.values[0]).toBeGreaterThan(0);
    expect(autos.values[1]).toBeGreaterThan(0);
    expect(aircraft.values.slice(0, 6).every((value) => value === 0)).toBe(true);
    expect(aircraft.values[7]).toBeGreaterThan(0);
  });

  it("lands the year-10 book near $100M / $30M / $20M with Intervest at half", () => {
    const model = runCashflowModel(defaultValues());
    expect(model.summary.homeAumEndUsd).toBeGreaterThan(80_000_000);
    expect(model.summary.homeAumEndUsd).toBeLessThan(110_000_000);
    expect(model.summary.autoAumEndUsd).toBeGreaterThan(18_000_000);
    expect(model.summary.autoAumEndUsd).toBeLessThan(36_000_000);
    expect(model.summary.aircraftAumEndUsd).toBeGreaterThan(12_000_000);
    expect(model.summary.aircraftAumEndUsd).toBeLessThan(24_000_000);
    expect(model.summary.intervestLineEndUsd).toBe(75_000_000);
    expect(model.summary.partnerLineEndUsd).toBe(75_000_000);
  });

  it("keeps Intervest exclusive for the first three fiscal years", () => {
    const model = runCashflowModel(defaultValues());
    const partners = model.consolidated.lines.find((row) => row.id === "partners")!;
    expect(partners.values[0]).toBe(0);
    expect(partners.values[1]).toBe(0);
    expect(partners.values[2]).toBe(0);
    expect(partners.values[3]).toBeGreaterThan(0);
    expect(partners.values[3]).toBeLessThan(25_000_000);
  });

  it("recomputes when the year-10 Intervest line changes and stays deterministic", () => {
    const a = runCashflowModel({ ...defaultValues(), fy10IntervestLineUsd: 60_000_000 });
    const b = runCashflowModel({ ...defaultValues(), fy10IntervestLineUsd: 60_000_000 });
    expect(a.summary.fy10ClosingCashUsd).toBe(b.summary.fy10ClosingCashUsd);
    const base = runCashflowModel(defaultValues());
    expect(a.consolidated.lines.find((row) => row.id === "line")!.values[9]).not.toBe(
      base.consolidated.lines.find((row) => row.id === "line")!.values[9],
    );
  });
});
