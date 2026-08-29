import { describe, expect, it } from "vitest";
import { blueVariableDefs } from "@/lib/model/blue-variables";
import { FEE_BLUE_KEYS } from "@/lib/model/variables-fees";

/**
 * Member what-if kit (Aug 26) plus the complete Credit LLC fee book
 * (Aug 27). Changing this list is fine — but it must be a deliberate
 * diff here, not a side effect of a visibility edit.
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
  "coClosingFeeUsd",
  "coInspectionFeeUsd",
  "coAdminPerLeaseUsd",
  "postPilotAnnualGrowthPct",
  "autoStartMonth",
  "aircraftStartMonth",
  "insuranceCommissionPct",
  ...FEE_BLUE_KEYS,
];

describe("member blue-variable kit", () => {
  it("is the approved levers plus the complete fee book", () => {
    expect(blueVariableDefs().map((def) => def.key)).toEqual(MEMBER_KIT);
  });
});
