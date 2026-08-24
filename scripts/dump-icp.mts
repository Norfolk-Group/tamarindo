import { computeContracts } from "@/lib/model/contracts";
import { defaultValues } from "@/lib/model/variables";

const values = defaultValues();
const rows = computeContracts(values);

for (const r of rows) {
  const rented = Number(values[`icp.${r.id}.rentedTimePct`]);
  console.log(
    [
      r.code,
      `price ${r.purchasePriceUsd}`,
      `down ${r.downPaymentUsd}`,
      `funded ${r.fundedUsd}`,
      `term ${r.termMonths}`,
      `base ${(r.baseClientRate * 100).toFixed(3)}%`,
      `eff ${(r.clientRate * 100).toFixed(4)}%`,
      `lease ${r.monthlyLeaseUsd}`,
      `balloon ${r.residualUsd}`,
      `grossRent ${r.grossRentUsdPerMonth}`,
      `tamShare ${r.rentalShareUsdPerMonth}`,
      `rented ${(rented * 100).toFixed(0)}%`,
      `effRentedShare ${(r.rentalShareUsdPerMonth * rented).toFixed(2)}`,
    ].join(" | "),
  );
}

console.log("\nrental policy:", {
  pctOfValuePerMonth: values.rentalMonthlyPctOfValue,
  mgmtFee: values.ashokaMgmtFeePct,
  costs: values.rentalCostsPct,
  tamarindoShare: values.rentalTamarindoSharePct,
});
