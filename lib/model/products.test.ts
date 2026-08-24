import { describe, expect, it } from "vitest";
import {
  aircraftOriginationsThisMonth,
  autoOriginationsThisMonth,
  productQuote,
} from "@/lib/model/products";
import { defaultValues } from "@/lib/model/variables";

describe("product quotes", () => {
  it("prices an auto below the ticket with a residual", () => {
    const quote = productQuote("auto", defaultValues());
    expect(quote.fundedUsd).toBe(44_000);
    expect(quote.residualUsd).toBe(11_000);
    expect(quote.monthlyLeaseUsd).toBeGreaterThan(0);
    expect(quote.monthlyLeaseUsd).toBeLessThan(quote.fundedUsd / 12);
  });

  it("waits for the auto start month and scales ~3x homes", () => {
    const values = defaultValues();
    expect(autoOriginationsThisMonth(values, 5, 4)).toBe(0);
    expect(autoOriginationsThisMonth(values, 6, 4)).toBe(12);
  });

  it("spreads aircraft originations after the start month", () => {
    const values = defaultValues();
    expect(aircraftOriginationsThisMonth(values, 83)).toBe(0);
    const year = Array.from({ length: 12 }, (_, i) =>
      aircraftOriginationsThisMonth(values, 84 + i),
    );
    expect(year.reduce((sum, n) => sum + n, 0)).toBe(12);
    expect(year[0]).toBeGreaterThan(0);
  });
});
