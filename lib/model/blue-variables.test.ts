import { describe, expect, it } from "vitest";
import { blueVariableDefs } from "@/lib/model/blue-variables";

/**
 * The member what-if kit is a product decision (Aug 26 oracle): a small
 * comfortable range, not the full book. Changing this list is fine — but it
 * must be a deliberate diff here, not a side effect of a visibility edit.
 */
const MEMBER_KIT = [
  "lineTranche1Usd",
  "lineTranche2Usd",
  "tranche2MonthIndex",
  "downPaymentPct",
  "minResidualOfAssetPct",
  "activationFeePct",
  "originationFeePct",
  "servicingBps",
  "spreadSharePct",
  "rentalMonthlyPctOfValue",
  "rentalTamarindoSharePct",
  "postPilotAnnualGrowthPct",
  "autoStartMonth",
  "aircraftStartMonth",
];

describe("member blue-variable kit", () => {
  it("is exactly the 14 approved levers", () => {
    expect(blueVariableDefs().map((def) => def.key)).toEqual(MEMBER_KIT);
  });
});
