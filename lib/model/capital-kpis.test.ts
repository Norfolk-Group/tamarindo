import { describe, expect, it } from "vitest";
import { kpiIntervestLineUsd, kpiPartnerLineUsd, productAumTargetUsd } from "@/lib/model/capital-kpis";
import { defaultValues } from "@/lib/model/variables";

describe("KPI capital curve", () => {
  it("keeps Intervest at $10M until tranche 2, then the FY schedule", () => {
    const values = defaultValues();
    expect(kpiIntervestLineUsd(values, 0)).toBe(10_000_000);
    expect(kpiIntervestLineUsd(values, 6)).toBe(20_000_000);
    expect(kpiIntervestLineUsd(values, 23)).toBe(25_000_000);
    expect(kpiIntervestLineUsd(values, 119)).toBe(75_000_000);
  });

  it("adds no other vehicles in years 1–3 and $75M by year 10", () => {
    const values = defaultValues();
    expect(kpiPartnerLineUsd(values, 35)).toBe(0);
    expect(kpiPartnerLineUsd(values, 36)).toBeGreaterThan(0);
    expect(kpiPartnerLineUsd(values, 119)).toBe(75_000_000);
  });

  it("walks property AUM toward $100M", () => {
    const values = defaultValues();
    expect(productAumTargetUsd("home", 0, values)).toBe(16_000_000);
    expect(productAumTargetUsd("home", 119, values)).toBe(100_000_000);
    expect(productAumTargetUsd("auto", 0, values)).toBe(1_800_000);
    expect(productAumTargetUsd("aircraft", 83, values)).toBe(0);
  });
});
