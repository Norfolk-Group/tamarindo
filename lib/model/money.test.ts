import { describe, expect, it } from "vitest";
import { cents, d, monthlyRate, pmt } from "@/lib/model/money";

describe("money", () => {
  it("matches Excel PMT for ICP-1 with residual floor", () => {
    const payment = pmt(monthlyRate(d(0.11)), 120, d(252_000), d(42_000));
    expect(cents(payment)).toBeGreaterThan(2800);
    expect(cents(payment)).toBeLessThan(3400);
  });

  it("is deterministic to the cent", () => {
    const a = cents(pmt(monthlyRate(d(0.12)), 84, d(288_000), d(48_000)));
    const b = cents(pmt(monthlyRate(d(0.12)), 84, d(288_000), d(48_000)));
    expect(a).toBe(b);
  });
});
