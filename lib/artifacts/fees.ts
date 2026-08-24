/**
 * Fee ledger for Luca's silent fee engine (KTD11).
 * Direction `charged` = Tamarindo family bills it.
 * Direction `paid` = a Tamarindo entity owes it.
 * Rates stay null unless a thesis line cites them (R6).
 */

import {
  ENTITY_LABELS,
  PNL_CENTERS,
  TAMARINDO_ENTITIES,
  type CenterCitation,
  type CitationLabel,
  type TamarindoEntity,
} from "@/lib/artifacts/centers";

export type FeeDirection = "charged" | "paid";

export type FeeParty =
  | TamarindoEntity
  | "borrower"
  | "lp"
  | "vendor"
  | "government"
  | "related_party";

export type FeeCadence = "one_time" | "recurring" | "per_event" | "usage";

export type FeeRateUnit =
  | "pct_of_funded"
  | "pct_of_drawdown"
  | "bps_outstanding"
  | "pct_of_interest"
  | "pct_of_net_rental"
  | "pct_yield"
  | "usd_monthly"
  | "usd_per_event"
  | "invoice";

export type FeeLine = {
  id: string;
  direction: FeeDirection;
  name: string;
  earner: FeeParty;
  payer: FeeParty;
  cadence: FeeCadence;
  /** Numeric rate if cited. Null means the cell stays blank. */
  rate: number | null;
  rateUnit: FeeRateUnit;
  pnlCenterId: string | null;
  citation: CenterCitation;
};

const thesis = (file: string, note: string, label: CitationLabel = "OPINION"): CenterCitation => ({
  label,
  path: `knowledge/thesis/${file}`,
  note,
});

const stack = (note: string): CenterCitation => ({
  label: "FACT",
  path: "docs/nico/02-tech-stack.md",
  note,
});

/** One silent engine owns this catalog. Luca delegates; it never talks to users. */
export const FEE_LINES: readonly FeeLine[] = [
  {
    id: "chg.origination",
    direction: "charged",
    name: "Origination fee",
    earner: "tamarindo_us",
    payer: "borrower",
    cadence: "one_time",
    rate: 0.01,
    rateUnit: "pct_of_funded",
    pnlCenterId: "tus.origination",
    citation: thesis("05-fee-engine.md", "Line 1: TBD; assume ~1% of funded", "ASSUMPTION"),
  },
  {
    id: "chg.activation",
    direction: "charged",
    name: "Activation fee",
    earner: "tamarindo_us",
    payer: "borrower",
    cadence: "one_time",
    rate: 0.02,
    rateUnit: "pct_of_drawdown",
    pnlCenterId: "tus.origination",
    citation: thesis("05-fee-engine.md", "Line 2: 2% of capital drawdown (sourced)", "FACT"),
  },
  {
    id: "chg.servicing",
    direction: "charged",
    name: "Servicing fee",
    earner: "tamarindo_us",
    payer: "borrower",
    cadence: "recurring",
    rate: 75,
    rateUnit: "bps_outstanding",
    pnlCenterId: "tus.servicing",
    citation: thesis("05-fee-engine.md", "Line 3: assume 75 bps of outstanding", "ASSUMPTION"),
  },
  {
    id: "chg.interest_spread",
    direction: "charged",
    name: "Interest spread share",
    earner: "tamarindo_us",
    payer: "tamarindo_intervest",
    cadence: "recurring",
    rate: 0.2,
    rateUnit: "pct_of_interest",
    pnlCenterId: "tus.servicing",
    citation: thesis("05-fee-engine.md", "Line 4: ~20% of interest billings (sourced)", "ASSUMPTION"),
  },
  {
    id: "chg.rental_share",
    direction: "charged",
    name: "Rental revenue share",
    earner: "tamarindo_us",
    payer: "ashoka",
    cadence: "recurring",
    rate: 0.2,
    rateUnit: "pct_of_net_rental",
    pnlCenterId: "tus.rental_share",
    citation: thesis("05-fee-engine.md", "Line 6: ~20% of net rental (sourced)", "ASSUMPTION"),
  },
  {
    id: "chg.ashoka_pm",
    direction: "charged",
    name: "Property management",
    earner: "ashoka",
    payer: "tamarindo_intervest",
    cadence: "recurring",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "ash.property_management",
    citation: thesis("05-fee-engine.md", "Line 5: market rate + markup — no cited dollar", "ASSUMPTION"),
  },
  {
    id: "pay.lp_yield",
    direction: "paid",
    name: "Capital partner yield",
    earner: "lp",
    payer: "tamarindo_intervest",
    cadence: "recurring",
    rate: null,
    rateUnit: "pct_yield",
    pnlCenterId: "tiv.asset_yield",
    citation: thesis("02-entities.md", "Vehicle pays LPs a base yield ~9–12%; band is not a single rate", "ASSUMPTION"),
  },
  {
    id: "pay.notary_title",
    direction: "paid",
    name: "Notary, title, and closing",
    earner: "vendor",
    payer: "tamarindo_colombia",
    cadence: "per_event",
    rate: null,
    rateUnit: "usd_per_event",
    pnlCenterId: "tco.closings",
    citation: thesis("02-entities.md", "Colombia execution pays local closing costs; amount unlabeled", "OPINION"),
  },
  {
    id: "pay.sucursal_tax",
    direction: "paid",
    name: "Sucursal and local tax",
    earner: "government",
    payer: "tamarindo_colombia",
    cadence: "recurring",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tco.compliance",
    citation: thesis("02-entities.md", "Local filings sit on Colombia; rate unlabeled until counsel cites it", "OPINION"),
  },
  {
    id: "pay.legal_opinions",
    direction: "paid",
    name: "Legal opinions and templates",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "per_event",
    rate: null,
    rateUnit: "usd_per_event",
    pnlCenterId: "tus.ga",
    citation: thesis("05-fee-engine.md", "Raise buys legal opinions closed; fee unlabeled", "OPINION"),
  },
  {
    id: "pay.recovery",
    direction: "paid",
    name: "Default recovery cost",
    earner: "vendor",
    payer: "tamarindo_intervest",
    cadence: "per_event",
    rate: null,
    rateUnit: "usd_per_event",
    pnlCenterId: "tiv.recovery",
    citation: thesis("05-fee-engine.md", "Model must nail recovery cost per event; no cited dollar", "OPINION"),
  },
  {
    id: "pay.ashoka_field",
    direction: "paid",
    name: "Ashoka field ops (related party)",
    earner: "related_party",
    payer: "tamarindo_intervest",
    cadence: "recurring",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "ash.field_ops",
    citation: thesis("02-entities.md", "Ashoka bills market rates to the vehicle; amount unlabeled", "OPINION"),
  },
  {
    id: "pay.cloudflare",
    direction: "paid",
    name: "Cloudflare (Workers, R2, Gateway, WAF)",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "usage",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tus.platform",
    citation: stack("Host, agent runtime, files, and security"),
  },
  {
    id: "pay.neon",
    direction: "paid",
    name: "Neon Postgres + Hyperdrive path",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "usage",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tus.platform",
    citation: stack("Database"),
  },
  {
    id: "pay.workos",
    direction: "paid",
    name: "WorkOS AuthKit",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "usage",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tus.platform",
    citation: stack("Identity"),
  },
  {
    id: "pay.recall",
    direction: "paid",
    name: "Recall.ai meetings",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "usage",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tus.platform",
    citation: stack("Meetings"),
  },
  {
    id: "pay.twilio",
    direction: "paid",
    name: "Twilio ConversationRelay / SMS",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "usage",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tus.platform",
    citation: stack("Phone"),
  },
  {
    id: "pay.resend",
    direction: "paid",
    name: "Resend email",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "usage",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tus.platform",
    citation: stack("Email out"),
  },
  {
    id: "pay.models",
    direction: "paid",
    name: "Model providers via AI Gateway",
    earner: "vendor",
    payer: "tamarindo_us",
    cadence: "usage",
    rate: null,
    rateUnit: "invoice",
    pnlCenterId: "tus.platform",
    citation: stack("Claude / Grok / Gemini / GPT behind AI Gateway"),
  },
];

export function feesCharged(): FeeLine[] {
  return FEE_LINES.filter((f) => f.direction === "charged");
}

export function feesPaid(): FeeLine[] {
  return FEE_LINES.filter((f) => f.direction === "paid");
}

export function feesForEntity(entity: TamarindoEntity): FeeLine[] {
  return FEE_LINES.filter((f) => f.earner === entity || f.payer === entity);
}

export function parseFeeDirection(raw: string): FeeDirection | null {
  const key = raw.trim().toLowerCase();
  if (key === "charged" || key === "earn" || key === "inbound") return "charged";
  if (key === "paid" || key === "pay" || key === "outbound") return "paid";
  return null;
}

export function feeWorkbookSpec(entities: TamarindoEntity[]) {
  return entities.map((entity) => ({
    entity,
    label: ENTITY_LABELS[entity],
    charged: feesForEntity(entity).filter((f) => f.direction === "charged"),
    paid: feesForEntity(entity).filter((f) => f.direction === "paid"),
  }));
}

export function assertFeeCentersExist(): string[] {
  const known = new Set(PNL_CENTERS.map((c) => c.id));
  return FEE_LINES.filter((f) => f.pnlCenterId && !known.has(f.pnlCenterId)).map((f) => f.id);
}

export { TAMARINDO_ENTITIES };
