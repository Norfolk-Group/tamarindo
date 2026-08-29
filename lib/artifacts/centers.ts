/**
 * P&L centers for the 10-year workbook.
 * One internal engine per center. Engines never speak to users (KTD11).
 * Numbers must carry a citation label — no unlabeled inventing (R6).
 */

export const TAMARINDO_ENTITIES = [
  "tamarindo_us",
  "tamarindo_intervest",
  "tamarindo_colombia",
  "ashoka",
] as const;

export type TamarindoEntity = (typeof TAMARINDO_ENTITIES)[number];

export type CenterKind = "revenue" | "cost";

export type CitationLabel = "FACT" | "OPINION" | "ASSUMPTION";

export type CenterCitation = {
  label: CitationLabel;
  path: string;
  note: string;
};

export type PnlCenter = {
  id: string;
  entity: TamarindoEntity;
  kind: CenterKind;
  name: string;
  functions: string[];
  citation: CenterCitation;
};

export type ManpowerLine = {
  centerId: string;
  year: number;
  fte: number;
  contractors: number;
  /** Annual cash salary per FTE, USD. Null until a cited source exists. */
  avgSalaryUsd: number | null;
  /** Benefits as a fraction of salary (e.g. 0.25). */
  benefitsLoad: number | null;
  /** Annual turnover as a fraction of headcount. */
  turnoverRate: number | null;
  citation: CenterCitation;
};

export const ENTITY_LABELS: Record<TamarindoEntity, string> = {
  tamarindo_us: "Tamarindo US",
  tamarindo_intervest: "Tamarindo-Intervest",
  tamarindo_colombia: "Tamarindo Colombia",
  ashoka: "Ashoka",
};

const thesis = (file: string, note: string, label: CitationLabel = "OPINION"): CenterCitation => ({
  label,
  path: `knowledge/thesis/${file}`,
  note,
});

/** One engine per center. Luca delegates; these never appear on the capability map. */
export const PNL_CENTERS: readonly PnlCenter[] = [
  {
    id: "tus.origination",
    entity: "tamarindo_us",
    kind: "revenue",
    name: "Origination & activation",
    functions: ["origination", "underwriting", "activation billing"],
    citation: thesis("05-fee-engine.md", "Lines 1–2: origination TBD; activation 2% of drawdown", "ASSUMPTION"),
  },
  {
    id: "tus.servicing",
    entity: "tamarindo_us",
    kind: "revenue",
    name: "Servicing & spread",
    functions: ["servicing", "billing", "interest-spread share"],
    citation: thesis("19-platform-economics.md", "Servicing 75 bps seed; spread ~20% of interest", "ASSUMPTION"),
  },
  {
    id: "tus.rental_share",
    entity: "tamarindo_us",
    kind: "revenue",
    name: "Rental share",
    functions: ["rental waterfall accounting"],
    citation: thesis("05-fee-engine.md", "Line 6: ~20% of net rental", "ASSUMPTION"),
  },
  {
    id: "tus.platform",
    entity: "tamarindo_us",
    kind: "cost",
    name: "Platform",
    functions: ["Nico", "servicing/billing software", "infra"],
    citation: thesis("05-fee-engine.md", "Year-1 OpCo burn includes platform build", "OPINION"),
  },
  {
    id: "tus.ga",
    entity: "tamarindo_us",
    kind: "cost",
    name: "G&A",
    functions: ["core US team", "legal templates", "compliance"],
    citation: thesis("02-entities.md", "Lean core ~3 US + 2 Colombia (Aug 19)", "OPINION"),
  },
  {
    id: "tiv.asset_yield",
    entity: "tamarindo_intervest",
    kind: "revenue",
    name: "Asset yield",
    functions: ["lease collections to vehicle", "capital partner yield"],
    citation: thesis("02-entities.md", "Vehicle earns base yield ~9–12%", "ASSUMPTION"),
  },
  {
    id: "tiv.recovery",
    entity: "tamarindo_intervest",
    kind: "cost",
    name: "Recovery & reserves",
    functions: ["default recovery", "re-lease or sale", "reserve admin"],
    citation: thesis("02-entities.md", "Default path sits on the vehicle", "OPINION"),
  },
  {
    id: "tco.closings",
    entity: "tamarindo_colombia",
    kind: "cost",
    name: "Closings",
    functions: ["sourcing support", "notary/title", "comodato admin"],
    citation: thesis("02-entities.md", "Execution arm, not a profit center", "OPINION"),
  },
  {
    id: "tco.compliance",
    entity: "tamarindo_colombia",
    kind: "cost",
    name: "Local compliance",
    functions: ["inspections", "tax/compliance filings"],
    citation: thesis("02-entities.md", "Local filings and inspections", "OPINION"),
  },
  {
    id: "ash.property_management",
    entity: "ashoka",
    kind: "revenue",
    name: "Property management",
    functions: ["management fees", "listing", "pricing"],
    citation: thesis("05-fee-engine.md", "Line 5: market rate + markup", "ASSUMPTION"),
  },
  {
    id: "ash.rental_ops",
    entity: "ashoka",
    kind: "revenue",
    name: "Rental operations",
    functions: ["guest/tenant management", "channel ops"],
    citation: thesis("02-entities.md", "Ashoka executes the rental pool", "OPINION"),
  },
  {
    id: "ash.field_ops",
    entity: "ashoka",
    kind: "cost",
    name: "Field operations",
    functions: ["cleaning", "repairs", "on-site labor", "contractors"],
    citation: thesis("02-entities.md", "Maintenance performed by Ashoka", "OPINION"),
  },
];

export function centersFor(entity: TamarindoEntity): PnlCenter[] {
  return PNL_CENTERS.filter((c) => c.entity === entity);
}

const FAMILY_KEYS = new Set([
  "all",
  "family",
  "tamarindo",
  "business",
  "whole",
  "whole_business",
  "tamarindo_family",
]);

export function isFamilyAlias(raw: string): boolean {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return FAMILY_KEYS.has(key);
}

export function parseEntity(raw: string): TamarindoEntity | null {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace("tamarindo_intervest_llc", "tamarindo_intervest")
    .replace("tamarindo_credit_llc", "tamarindo_us")
    .replace("tamarindo_credit", "tamarindo_us");
  if ((TAMARINDO_ENTITIES as readonly string[]).includes(key)) {
    return key as TamarindoEntity;
  }
  const aliases: Record<string, TamarindoEntity> = {
    us: "tamarindo_us",
    opco: "tamarindo_us",
    intervest: "tamarindo_intervest",
    colombia: "tamarindo_colombia",
    ashoka: "ashoka",
  };
  return aliases[key] ?? null;
}

/** Empty list, or a family alias, means the whole Tamarindo family. */
export function parseEntityList(raws: string[] | undefined): TamarindoEntity[] {
  if (!raws || raws.length === 0 || raws.some(isFamilyAlias)) {
    return [...TAMARINDO_ENTITIES];
  }
  return raws.map((raw) => {
    const entity = parseEntity(raw);
    if (!entity) throw new Error(`Unknown entity: ${raw}`);
    return entity;
  });
}

/**
 * Headcount seeds from cited thesis only. Salaries/benefits/turnover stay
 * null until a labeled source exists — the workbook must show the gap.
 */
export function seedManpower(center: PnlCenter, year: number): ManpowerLine {
  const y1Team = thesis("02-entities.md", "Lean core ~3 US + 2 Colombia (Aug 19)", "OPINION");
    let fte = 0;
    const contractors = 0;
  if (center.id === "tus.ga" && year <= 2) {
    fte = 3;
  } else if ((center.id === "tco.closings" || center.id === "tco.compliance") && year <= 2) {
    fte = 1;
  }
  return {
    centerId: center.id,
    year,
    fte,
    contractors,
    avgSalaryUsd: null,
    benefitsLoad: null,
    turnoverRate: null,
    citation: year <= 2 ? y1Team : thesis("03-ten-year-plan.md", "Later-year headcount is a model output, not a source", "OPINION"),
  };
}

export function manpowerWorkbookSpec(entities: TamarindoEntity[]) {
  return entities.map((entity) => ({
    entity,
    label: ENTITY_LABELS[entity],
    centers: centersFor(entity).map((center) => ({
      center,
      years: Array.from({ length: 10 }, (_, i) => seedManpower(center, i + 1)),
    })),
  }));
}
