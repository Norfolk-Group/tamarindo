import { describe, expect, it } from "vitest";
import { ICP_CATALOG, catalogByClass } from "@/lib/model/icp-catalog";
import { computeCatalog } from "@/lib/procedures/icp";
import { defaultValues } from "@/lib/model/variables";

describe("ICP catalog", () => {
  it("has six property, two auto, and two aircraft profiles", () => {
    expect(catalogByClass("property")).toHaveLength(6);
    expect(catalogByClass("auto")).toHaveLength(2);
    expect(catalogByClass("aircraft")).toHaveLength(2);
    expect(ICP_CATALOG.map((row) => row.id)).toEqual([
      "icp1",
      "icp2",
      "icp3",
      "icp4",
      "icp5",
      "icp6",
      "auto1",
      "auto2",
      "air1",
      "air2",
    ]);
  });

  it("explains each profile and cites research", () => {
    for (const row of ICP_CATALOG) {
      expect(row.explanation.length).toBeGreaterThan(40);
      expect(row.researchNote.length).toBeGreaterThan(20);
      expect(row.sources.length).toBeGreaterThan(0);
    }
  });

  it("computes live lease math for all ten", () => {
    const catalog = computeCatalog(defaultValues());
    expect(catalog).toHaveLength(10);
    expect(catalog.find((row) => row.id === "auto1")?.purchasePriceUsd).toBe(102_000);
    expect(catalog.find((row) => row.id === "air1")?.purchasePriceUsd).toBe(2_200_000);
    expect(catalog.every((row) => row.monthlyLeaseUsd > 0)).toBe(true);
  });
});
