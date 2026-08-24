import { cents, d, monthlyRate, pmt } from "@/lib/model/money";
import type { IcpComputed, IcpId, IcpTemplate } from "@/lib/model/types";
import { num, type VariableValue } from "@/lib/model/variables";

const THESIS_04 = "knowledge/thesis/04-icp-deals.md";

export const ICP_TEMPLATES: IcpTemplate[] = [
  {
    id: "icp1",
    code: "ICP-1",
    name: "Poblado Executive",
    city: "Medellín",
    neighborhood: "El Poblado / Envigado",
    property: "2–3BR apartment, 100–160 m², estrato 6, doorman building",
    persona: "Colombian-American professional, 35–55, family base",
    purchasePriceUsd: 420_000,
    termMonths: 120,
    clientRate: 0.115,
    rentFactor: 1,
    mixWeight: 0.25,
    citation: {
      label: "ASSUMPTION",
      path: THESIS_04,
      note: "Thesis ICP-1; 10-year term",
    },
  },
  {
    id: "icp2",
    code: "ICP-2",
    name: "Cartagena Heritage",
    city: "Cartagena",
    neighborhood: "Old City / Bocagrande / Castillo Grande",
    property: "1–2BR renovated apartment, 60–110 m², historic or tower",
    persona: "US investor-lifestyle buyer, 45–65, rental-first",
    purchasePriceUsd: 650_000,
    termMonths: 120,
    clientRate: 0.115,
    rentFactor: 1,
    mixWeight: 0.18,
    citation: {
      label: "ASSUMPTION",
      path: THESIS_04,
      note: "Thesis ICP-2; 10-year term",
    },
  },
  {
    id: "icp3",
    code: "ICP-3",
    name: "Llanogrande Country",
    city: "Rionegro",
    neighborhood: "Llanogrande / JMC airport corridor",
    property: "Casa campestre, 200–350 m² on 1,000+ m² lot",
    persona: "Retiree or remote-work family, 50–70",
    purchasePriceUsd: 750_000,
    termMonths: 144,
    clientRate: 0.11,
    rentFactor: 0.4,
    mixWeight: 0.12,
    citation: {
      label: "ASSUMPTION",
      path: THESIS_04,
      note: "12-year term — not all leases are 10 years",
    },
  },
  {
    id: "icp4",
    code: "ICP-4",
    name: "Bocagrande Tower",
    city: "Cartagena",
    neighborhood: "Bocagrande",
    property: "2BR coastal tower apartment, 80–130 m², amenities",
    persona: "US professional, 40–60, shorter path to title",
    purchasePriceUsd: 480_000,
    termMonths: 84,
    clientRate: 0.125,
    rentFactor: 1,
    mixWeight: 0.18,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/contracts.ts",
      note: "7-year lifestyle term",
    },
  },
  {
    id: "icp5",
    code: "ICP-5",
    name: "Envigado Family",
    city: "Medellín",
    neighborhood: "Envigado / Zúñiga",
    property: "3BR family apartment, 90–140 m², estrato 5–6",
    persona: "Diaspora family, 30–50, first Colombia home",
    purchasePriceUsd: 310_000,
    termMonths: 96,
    clientRate: 0.12,
    rentFactor: 1,
    mixWeight: 0.17,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/contracts.ts",
      note: "8-year smaller ticket — volume backbone with ICP-1",
    },
  },
  {
    id: "icp6",
    code: "ICP-6",
    name: "Castillo Grande Coastal",
    city: "Cartagena",
    neighborhood: "Castillo Grande",
    property: "2–3BR bay-view apartment, 110–160 m²",
    persona: "Couple 45–65, mixed use and rental",
    purchasePriceUsd: 580_000,
    termMonths: 108,
    clientRate: 0.115,
    rentFactor: 1,
    mixWeight: 0.1,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/contracts.ts",
      note: "9-year coastal",
    },
  },
];

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
