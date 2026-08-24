import { describe, expect, it } from "vitest";
import { buildCapTable, equityProceedsAt, plannedRounds } from "@/lib/model/equity";
import { defaultValues } from "@/lib/model/variables";

describe("equity raise", () => {
  it("prices three rounds — smallest first — at $10M / $15M / $20M pre-money", () => {
    const rounds = plannedRounds(defaultValues());
    expect(rounds).toHaveLength(3);
    expect(rounds[0]).toMatchObject({
      amountUsd: 2_000_000,
      preMoneyUsd: 10_000_000,
      postMoneyUsd: 12_000_000,
    });
    expect(rounds[1]).toMatchObject({ amountUsd: 2_250_000, preMoneyUsd: 15_000_000 });
    expect(rounds[2]).toMatchObject({ amountUsd: 2_250_000, preMoneyUsd: 20_000_000 });
    expect(rounds[0].amountUsd).toBeLessThan(rounds[1].amountUsd);
    expect(equityProceedsAt(defaultValues(), 0)).toBe(2_000_000);
    expect(equityProceedsAt(defaultValues(), 12)).toBe(2_250_000);
    expect(equityProceedsAt(defaultValues(), 24)).toBe(2_250_000);
    expect(equityProceedsAt(defaultValues(), 1)).toBe(0);
  });

  it("starts five equal partners and dilutes them across the three rounds", () => {
    const table = buildCapTable(defaultValues());
    expect(table.founderCount).toBe(5);
    expect(table.eachFounderStart).toBeCloseTo(0.2, 6);
    expect(table.raisedUsd).toBe(6_500_000);
    expect(table.founderPercentEnd).toBeCloseTo(
      (10 / 12) * (15 / 17.25) * (20 / 22.25),
      5,
    );
    expect(table.eachFounderEnd).toBeCloseTo(table.founderPercentEnd / 5, 6);
    expect(table.holdersEnd.filter((row) => row.klass === "investor")).toHaveLength(3);
  });
});
