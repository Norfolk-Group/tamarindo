import type {
  AircraftIcpId,
  AssetClass,
  AutoIcpId,
  CatalogIcpId,
  CitationLabel,
  IcpId,
  IcpSource,
  IcpTemplate,
} from "@/lib/model/types";
import { AIRCRAFT_ICP_IDS, AUTO_ICP_IDS, ICP_IDS } from "@/lib/model/types";

const THESIS_04 = "knowledge/thesis/04-icp-deals.md";

export type CatalogProfile = {
  id: CatalogIcpId;
  assetClass: AssetClass;
  code: string;
  name: string;
  city: string;
  neighborhood: string;
  asset: string;
  persona: string;
  explanation: string;
  researchNote: string;
  sources: IcpSource[];
  purchasePriceUsd: number;
  termMonths: number;
  clientRate: number;
  rentFactor: number;
  mixWeight: number;
  citation: {
    label: CitationLabel;
    path: string;
    note: string;
  };
};

const FX = "COP prices converted at about 4,000 per USD (mid-2026 street rate).";

export const ICP_CATALOG: CatalogProfile[] = [
  {
    id: "icp1",
    assetClass: "property",
    code: "ICP-1",
    name: "Poblado Executive",
    city: "Medellín",
    neighborhood: "El Poblado / Envigado",
    asset: "2–3BR apartment, 100–160 m², estrato 6, doorman building",
    persona: "Colombian-American professional, 35–55, family base",
    explanation:
      "The volume-and-quality home. A move-in estrato 6 apartment in El Poblado or the Envigado edge — Provenza, Los Balsos, Zúñiga — that a US-based professional can visit a few weeks a year and eventually retire into. Deepest resale market of the six.",
    researchNote: `TheLatinvestor (Jun 2026) puts El Poblado at about USD 2,330–4,110/m². A 120–130 m² unit lands in the $350–500k band. Seed $420k sits in the middle of that and matches the thesis. ${FX}`,
    sources: [
      {
        label: "TheLatinvestor — Medellín apartments 2026",
        url: "https://thelatinvestor.com/blogs/news/medellin-how-much-apartment",
      },
    ],
    purchasePriceUsd: 420_000,
    termMonths: 120,
    clientRate: 0.115,
    rentFactor: 1,
    mixWeight: 0.25,
    citation: {
      label: "ASSUMPTION",
      path: THESIS_04,
      note: "Thesis ICP-1; 10-year term. Poblado $/m² band confirmed Jun 2026.",
    },
  },
  {
    id: "icp2",
    assetClass: "property",
    code: "ICP-2",
    name: "Cartagena Heritage",
    city: "Cartagena",
    neighborhood: "Old City / Bocagrande / Castillo Grande",
    asset: "1–2BR renovated apartment, 60–110 m², historic or tower",
    persona: "US investor-lifestyle buyer, 45–65, rental-first",
    explanation:
      "The rental-first coastal ticket. A renovated Centro Histórico flat or a smaller premium tower unit. The lessee uses it a few weeks a year and wants the furnished engine running the rest of the time — still a one-month minimum, never nightly.",
    researchNote:
      "TheLatinvestor (2026) prices Centro Histórico at about USD 3,900–6,300/m² ($439k–$1.46M for listed stock). An 80–100 m² renovated unit clusters $400–630k. Seed $650k is the high-quality end of that band, not the median Cartagena home ($207k).",
    sources: [
      {
        label: "TheLatinvestor — Cartagena housing 2026",
        url: "https://thelatinvestor.com/blogs/news/cartagena-housing-prices",
      },
    ],
    purchasePriceUsd: 650_000,
    termMonths: 120,
    clientRate: 0.115,
    rentFactor: 1,
    mixWeight: 0.18,
    citation: {
      label: "ASSUMPTION",
      path: THESIS_04,
      note: "Thesis ICP-2; 10-year term. Coastal $/m² band confirmed 2026.",
    },
  },
  {
    id: "icp3",
    assetClass: "property",
    code: "ICP-3",
    name: "Llanogrande Country",
    city: "Rionegro",
    neighborhood: "Llanogrande / JMC airport corridor",
    asset: "Casa campestre, 200–350 m² on 1,000+ m² lot",
    persona: "Retiree or remote-work family, 50–70",
    explanation:
      "The country house off José María Córdova. Larger lot, weaker furnished-rent story (rent factor 0.4), longer 12-year term. Launch geography from the kickoff still includes this corridor with Poblado and Cartagena.",
    researchNote:
      "Public comps for furnished campestres are thin. Estrato 5–6 country houses on the Rionegro/El Retiro side still clear $500k–$1M when the lot is real. Seed $750k is the thesis midpoint until a local broker tape replaces it.",
    sources: [
      {
        label: "Property valuation — Colombia zones 2026",
        url: "https://mikezapata.realestate/property-valuation-colombia",
      },
    ],
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
    assetClass: "property",
    code: "ICP-4",
    name: "Bocagrande Tower",
    city: "Cartagena",
    neighborhood: "Bocagrande",
    asset: "2BR coastal tower apartment, 80–130 m², amenities",
    persona: "US professional, 40–60, shorter path to title",
    explanation:
      "A 7-year lifestyle lease on a Bocagrande tower — beach, amenities, easier resale than a Centro renovation. Shorter term, slightly higher client rate.",
    researchNote:
      "Bocagrande 2026 listings run about USD 3,400–5,400/m² ($341k–$1.1M). A 100 m² mid-tower unit is ~$440k. Seed $480k is a finished 2BR with amenities, not a view penthouse.",
    sources: [
      {
        label: "TheLatinvestor — Cartagena housing 2026",
        url: "https://thelatinvestor.com/blogs/news/cartagena-housing-prices",
      },
    ],
    purchasePriceUsd: 480_000,
    termMonths: 84,
    clientRate: 0.125,
    rentFactor: 1,
    mixWeight: 0.18,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/icp-catalog.ts",
      note: "7-year lifestyle term; Bocagrande $/m² band 2026",
    },
  },
  {
    id: "icp5",
    assetClass: "property",
    code: "ICP-5",
    name: "Envigado Family",
    city: "Medellín",
    neighborhood: "Envigado / Zúñiga",
    asset: "3BR family apartment, 90–140 m², estrato 5–6",
    persona: "Diaspora family, 30–50, first Colombia home",
    explanation:
      "The first-home ticket. Quieter than Provenza, still estrato 5–6, 8-year term. With ICP-1 this is the volume backbone.",
    researchNote:
      "Envigado trades below El Poblado. Citywide mid-range 2–3BR stock is roughly $150–300k; a 110 m² estrato 5–6 family unit clusters ~$260–320k. Seed $310k is that family apartment, not a Poblado amenity tower.",
    sources: [
      {
        label: "TheLatinvestor — Medellín apartments 2026",
        url: "https://thelatinvestor.com/blogs/news/medellin-how-much-apartment",
      },
    ],
    purchasePriceUsd: 310_000,
    termMonths: 96,
    clientRate: 0.12,
    rentFactor: 1,
    mixWeight: 0.17,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/icp-catalog.ts",
      note: "8-year smaller ticket — volume backbone with ICP-1",
    },
  },
  {
    id: "icp6",
    assetClass: "property",
    code: "ICP-6",
    name: "Castillo Grande Coastal",
    city: "Cartagena",
    neighborhood: "Castillo Grande",
    asset: "2–3BR bay-view apartment, 110–160 m²",
    persona: "Couple 45–65, mixed use and rental",
    explanation:
      "The quieter bay side of Cartagena. Larger than Bocagrande Tower, 9-year term, mixed own-use and rental. Castillo Grande is the luxury beach band, not the Centro renovation story.",
    researchNote:
      "Castillogrande 2026: about USD 4,400–6,800/m² ($537k–$1.59M). A 120–130 m² bay-view 2–3BR is $530–880k. Seed $580k is a solid mid-tower, not the $1.5M penthouse.",
    sources: [
      {
        label: "TheLatinvestor — Cartagena housing 2026",
        url: "https://thelatinvestor.com/blogs/news/cartagena-housing-prices",
      },
    ],
    purchasePriceUsd: 580_000,
    termMonths: 108,
    clientRate: 0.115,
    rentFactor: 1,
    mixWeight: 0.1,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/icp-catalog.ts",
      note: "9-year coastal; Castillo Grande $/m² band 2026",
    },
  },
  {
    id: "auto1",
    assetClass: "auto",
    code: "AUTO-1",
    name: "Andes Family Prado",
    city: "Colombia",
    neighborhood: "Medellín / national dealer",
    asset: "Toyota Land Cruiser Prado TX-L 2.4 gasoline 4×4 (or Fortuner SRV diesel)",
    persona: "Same US-FICO lessee as the home book; family SUV for Colombia roads",
    explanation:
      "The car that actually gets leased in Colombia for a diaspora household: a mid-spec Prado or a Fortuner diesel. Bancolombia vehicle leasing runs 12–72 months; 36–48 is the payment sweet spot. Tamarindo still prices the US-law lease (seed 14.5%), not the 13.8–18% EA bank book.",
    researchNote: `Toyota list (Mar 2026): Prado TX-L 2.4 gas COP 406.5M ≈ $102k; Prado TX from COP 314.5M; Fortuner SRV diesel from COP 326.9M (Aug 2026). Seed $102k is the TX-L gas sticker. ${FX}`,
    sources: [
      {
        label: "Autos de Primera — Prado 2026 list",
        url: "https://autosdeprimera.com/noticias/noticias-nacionales/toyota-land-cruiser-prado-colombia-2026/",
      },
      {
        label: "Auto Roble — Fortuner list Aug 2026",
        url: "https://autoroble.com.co/vehiculo/fortuner/",
      },
      {
        label: "Bancolombia — vehicle leasing terms",
        url: "https://leasing.grupobancolombia.com/productos-servicios/arrendamiento-vehiculos-leasing-bancolombia",
      },
    ],
    purchasePriceUsd: 102_000,
    termMonths: 48,
    clientRate: 0.145,
    rentFactor: 0,
    mixWeight: 0.4,
    citation: {
      label: "FACT",
      path: "lib/model/icp-catalog.ts",
      note: "Prado TX-L list Mar 2026; 48-month lease",
    },
  },
  {
    id: "auto2",
    assetClass: "auto",
    code: "AUTO-2",
    name: "City Hybrid CX-30",
    city: "Colombia",
    neighborhood: "Medellín / Bogotá dealer",
    asset: "Mazda CX-30 2.0 Gran Touring hybrid (or Corolla Cross class)",
    persona: "Same lessee, second car or first vehicle — city crossover",
    explanation:
      "The volume auto. Compact crossover that Colombian banks actually book on 36-month leases. Mix is heavier than the Prado so the auto book stays near the old $55k blended ticket.",
    researchNote: `Alciautos Mazda 2026: CX-30 from COP 112.6M (Touring) to COP 150.9M (AWD GT 2.5). Gran Touring hybrid COP 131.3M ≈ $33k. Seed $33k. Colombian crédito vehicular 2026 typically 20% down and 36–72 months at 13.8–18% EA — Tamarindo keeps 14.5% US-law. ${FX}`,
    sources: [
      {
        label: "Alciautos Mazda — CX-30 2026",
        url: "https://alciautosmazda.com/modelos/mazda-cx-30/",
      },
      {
        label: "Granautos — crédito vehicular 2026",
        url: "https://granautos.com.co/blog/credito-vehicular-colombia-2026/",
      },
    ],
    purchasePriceUsd: 33_000,
    termMonths: 36,
    clientRate: 0.145,
    rentFactor: 0,
    mixWeight: 0.6,
    citation: {
      label: "FACT",
      path: "lib/model/icp-catalog.ts",
      note: "CX-30 GT hybrid list 2026; 36-month lease",
    },
  },
  {
    id: "air1",
    assetClass: "aircraft",
    code: "AIR-1",
    name: "Andes Caravan",
    city: "Rionegro",
    neighborhood: "JMC / domestic utility",
    asset: "Cessna 208B Grand Caravan EX (used, 9 seats / cargo)",
    persona: "Colombian air-taxi, medevac, or cargo operator — not a tourist hour-charter",
    explanation:
      "The in-country airplane. A used Grand Caravan is what operators actually put on a finance lease in the Andes: short strips, payload, Medellín–coast–llanos. Charter ads quote hourly rates; this ICP is the hull they finance.",
    researchNote:
      "Used Caravan / 208B: about $1.4–3.2M; new Grand Caravan EX ~$2.7–3.2M as-equipped (FLYING Finance; broker guides). Seed $2.2M is a mid used EX. Dry-lease ballpark $15–25k/mo on a financed hull. Mix 80% of the aircraft book.",
    sources: [
      {
        label: "FLYING Finance — Caravan financing",
        url: "https://flyingfinance.com/caravan-financing/",
      },
      {
        label: "PJC — Grand Caravan EX buy guide",
        url: "https://private-jets-connect.com/en/private-jets/turboprop/grand-caravan-ex/buy/",
      },
    ],
    purchasePriceUsd: 2_200_000,
    termMonths: 84,
    clientRate: 0.095,
    rentFactor: 0,
    mixWeight: 0.8,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/icp-catalog.ts",
      note: "Used Grand Caravan mid-band 2026; 7-year term",
    },
  },
  {
    id: "air2",
    assetClass: "aircraft",
    code: "AIR-2",
    name: "Caribbean Light Jet",
    city: "Miami / Cartagena",
    neighborhood: "US–Colombia corridor",
    asset: "Embraer Phenom 300E (used light jet, 7–8 seats)",
    persona: "UHNW diaspora or a Part 135 charter that flies MIA–MDE/CTG",
    explanation:
      "The airplane that actually flies people to Colombia. Light-jet charter on Bogotá–Cartagena starts around COP 14M (piston COP 5.5M; midsize COP 24M) per Fly Flapper / Pulzo 2025–26. This ICP is the hull: a used Phenom 300E, not an hourly quote. Sparse mix — one of these moves the book.",
    researchNote:
      "The Jet Agent (Aug 2026): Phenom 300E asks $11.0–14.35M; six-month sold $9.9–15.4M. Seed $11.5M is a mid ask. Hourly charter light jet in Colombia ~$3,500–4,800 (Air Charter Advisors). Mix 20% of aircraft originations.",
    sources: [
      {
        label: "The Jet Agent — Phenom 300E Aug 2026",
        url: "https://thejetagent.com/market-report/embraer-phenom-300e-market-update-august-2026/",
      },
      {
        label: "Fly Flapper — Colombia charter 2026",
        url: "https://flyflapper.com/stories/es/cuanto-cuesta-alquilar-un-avion-privado-en-colombia/",
      },
      {
        label: "Air Charter Advisors — Colombia hourly",
        url: "https://www.aircharteradvisors.com/private-jet-charter/colombia/",
      },
    ],
    purchasePriceUsd: 11_500_000,
    termMonths: 120,
    clientRate: 0.095,
    rentFactor: 0,
    mixWeight: 0.2,
    citation: {
      label: "ASSUMPTION",
      path: "lib/model/icp-catalog.ts",
      note: "Phenom 300E mid-ask Aug 2026; 10-year term",
    },
  },
];

export const CATALOG_BY_ID = Object.fromEntries(
  ICP_CATALOG.map((row) => [row.id, row]),
) as Record<CatalogIcpId, CatalogProfile>;

export function isPropertyIcpId(id: string): id is IcpId {
  return (ICP_IDS as readonly string[]).includes(id);
}

export function isAutoIcpId(id: string): id is AutoIcpId {
  return (AUTO_ICP_IDS as readonly string[]).includes(id);
}

export function isAircraftIcpId(id: string): id is AircraftIcpId {
  return (AIRCRAFT_ICP_IDS as readonly string[]).includes(id);
}

export function catalogByClass(assetClass: AssetClass): CatalogProfile[] {
  return ICP_CATALOG.filter((row) => row.assetClass === assetClass);
}

export function propertyTemplates(): IcpTemplate[] {
  return catalogByClass("property").map((row) => ({
    id: row.id as IcpId,
    code: row.code,
    name: row.name,
    city: row.city,
    neighborhood: row.neighborhood,
    property: row.asset,
    persona: row.persona,
    explanation: row.explanation,
    researchNote: row.researchNote,
    sources: row.sources,
    purchasePriceUsd: row.purchasePriceUsd,
    termMonths: row.termMonths,
    clientRate: row.clientRate,
    rentFactor: row.rentFactor,
    mixWeight: row.mixWeight,
    citation: row.citation,
  }));
}

export function icpVariableMaxUsd(assetClass: AssetClass): number {
  if (assetClass === "aircraft") return 20_000_000;
  if (assetClass === "auto") return 250_000;
  return 2_000_000;
}
