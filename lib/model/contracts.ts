import { propertyTemplates } from "@/lib/model/icp-catalog";
import { cents, d, monthlyRate, pmt } from "@/lib/model/money";
import type { IcpComputed, IcpId, IcpTemplate } from "@/lib/model/types";
import { num, type VariableValue } from "@/lib/model/variables";

export const ICP_TEMPLATES: IcpTemplate[] = propertyTemplates();

/**
 * Portfolio-blended FICO-tier rate spread: share-weighted sum of the three
 * tier spreads. With defaults this lands ≈ +34 bps on top of the base rate.
 */
export function blendedFicoSpread(values: Record<string, VariableValue>) {
  return d(num(values, "ficoTier1SharePct"))
    .times(num(values, "ficoTier1SpreadPct"))
    .plus(d(num(values, "ficoTier2SharePct")).times(num(values, "ficoTier2SpreadPct")))
    .plus(d(num(values, "ficoTier3SharePct")).times(num(values, "ficoTier3SpreadPct")));
}

export function computeContracts(
  values: Record<string, VariableValue>,
): IcpComputed[] {
  const downPct = d(num(values, "downPaymentPct"));
  const residualOfFunded = d(num(values, "residualOfFundedPct"));
  const minResidualOfAsset = d(num(values, "minResidualOfAssetPct"));
  const rentPctOfValue = d(num(values, "rentalMonthlyPctOfValue"));
  const mgmtFee = d(num(values, "ashokaMgmtFeePct"));
  const rentalCosts = d(num(values, "rentalCostsPct"));
  const tamarindoShare = d(num(values, "rentalTamarindoSharePct"));
  const ficoSpread = blendedFicoSpread(values);

  return ICP_TEMPLATES.map((template) => {
    const id = template.id;
    const purchase = d(num(values, `icp.${id}.purchasePriceUsd`));
    const termMonths = Math.round(num(values, `icp.${id}.termMonths`));
    const baseClientRate = d(num(values, `icp.${id}.clientRate`));
    const clientRate = baseClientRate.plus(ficoSpread);
    const rentFactor = d(num(values, `icp.${id}.rentFactor`));
    const grossRent = purchase.times(rentPctOfValue).times(rentFactor);
    const rentalShareUsdPerMonth = cents(
      grossRent.times(d(1).minus(mgmtFee).minus(rentalCosts)).times(tamarindoShare),
    );
    const mixWeight = num(values, `icp.${id}.mixWeight`);
    const downPayment = moneyCents(purchase.times(downPct));
    const funded = moneyCents(purchase.minus(d(downPayment)));
    const residual = moneyCents(
      DecimalMax(
        d(funded).times(residualOfFunded),
        purchase.times(minResidualOfAsset),
      ),
    );
    const monthlyLease = cents(
      pmt(monthlyRate(clientRate), termMonths, d(funded), d(residual)),
    );
    return {
      ...template,
      purchasePriceUsd: cents(purchase),
      termMonths,
      clientRate: clientRate.toNumber(),
      baseClientRate: baseClientRate.toNumber(),
      rentFactor: rentFactor.toNumber(),
      grossRentUsdPerMonth: cents(grossRent),
      rentalShareUsdPerMonth,
      mixWeight,
      downPaymentUsd: downPayment,
      fundedUsd: funded,
      residualUsd: residual,
      monthlyLeaseUsd: monthlyLease,
    };
  });
}

export function contractById(
  contracts: IcpComputed[],
  id: IcpId,
): IcpComputed {
  const found = contracts.find((row) => row.id === id);
  if (!found) throw new Error(`Unknown ICP ${id}`);
  return found;
}

function moneyCents(value: ReturnType<typeof d>): number {
  return cents(value);
}

function DecimalMax(a: ReturnType<typeof d>, b: ReturnType<typeof d>) {
  return a.greaterThan(b) ? a : b;
}
