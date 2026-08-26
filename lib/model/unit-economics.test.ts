import { describe, expect, it } from "vitest";
import {
  calcTicketEconomics,
  formatTicketTable,
} from "@/lib/model/unit-economics";

describe("ticket economics", () => {
  it("calculates the WhatsApp $500k sketch at 1.50% / 40 bps", () => {
    const calc = calcTicketEconomics({
      fundedUsd: 500_000,
      drawUsd: 500_000,
      originationFeePct: 0.015,
      servicingBps: 0.004,
      activationFeePct: 0.02,
      spreadSharePct: 0.2,
      clientRate: 0.1184,
    });
    expect(calc.originationUsd).toBe(7_500);
    expect(calc.servicingY1Usd).toBe(2_000);
    expect(calc.platformY1Usd).toBe(9_500);
    expect(calc.activationUsd).toBe(10_000);
  });

  it("calculates the live research seeds at 1% / 75 bps", () => {
    const calc = calcTicketEconomics({
      fundedUsd: 500_000,
      drawUsd: 500_000,
      originationFeePct: 0.01,
      servicingBps: 0.0075,
      activationFeePct: 0.02,
      spreadSharePct: 0.2,
      clientRate: 0.115,
    });
    expect(calc.originationUsd).toBe(5_000);
    expect(calc.servicingY1Usd).toBe(3_750);
    expect(calc.platformY1Usd).toBe(8_750);
    expect(formatTicketTable(calc)).toMatch(/\$5,000/);
  });
});
