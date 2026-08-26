import { describe, expect, it } from "vitest";
import {
  aircraftOriginationsThisMonth,
  autoOriginationsThisMonth,
  pickProductQuote,
  productQuote,
  productQuotes,
} from "@/lib/model/products";
import { defaultValues } from "@/lib/model/variables";

describe("product quotes", () => {
  it("prices a mix-weighted auto book from the two ICPs", () => {
    const quote = productQuote("auto", defaultValues());
    expect(quote.ticketUsd).toBe(60_600);
    expect(quote.fundedUsd).toBe(48_480);
    expect(quote.residualUsd).toBe(12_120);
    expect(quote.monthlyLeaseUsd).toBeGreaterThan(0);
    expect(quote.monthlyLeaseUsd).toBeLessThan(quote.fundedUsd / 12);
  });

  it("waits for the auto start month and scales ~3x homes", () => {
    const values = defaultValues();
    expect(autoOriginationsThisMonth(values, 5, 4)).toBe(0);
    expect(autoOriginationsThisMonth(values, 6, 4)).toBe(12);
  });

  it("keeps two named auto ICPs and picks by mix", () => {
    const quotes = productQuotes("auto", defaultValues());
    expect(quotes.map((row) => row.id)).toEqual(["auto1", "auto2"]);
    expect(pickProductQuote(quotes, 0).id).toBe("auto1");
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
