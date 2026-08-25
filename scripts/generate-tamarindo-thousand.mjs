#!/usr/bin/env node
/**
 * Writes 1000+ Tamarindo-business Q&A pairs for Nico retrieval.
 * Grounded in knowledge/thesis 01–13 and knowledge/documents/tamarindo-docs-index.md.
 * Current policy: 11.84% effective, 20% balloon, 30% time rented.
 * Run: node scripts/generate-tamarindo-thousand.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "knowledge/qa");
const FILE = path.join(OUT, "tamarindo-thousand.md");
const README = path.join(OUT, "README.md");

/** @typedef {{ persona: string; q: string; a: string; bucket: string }} QA */

const qa = [];
const seen = new Set();

const P = {
  investor: "investor",
  founder: "founder",
  stakeholder: "stakeholder",
  prospect: "prospect",
  regulator: "regulator",
  friend: "friend",
};

const PERSONAS = Object.values(P);

function money(n) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function add(bucket, persona, q, a) {
  const question = q.replace(/\s+/g, " ").trim();
  const key = question.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  qa.push({
    bucket,
    persona,
    q: question,
    a: a.replace(/\s+/g, " ").trim(),
  });
}

function rotate(i) {
  return PERSONAS[i % PERSONAS.length];
}

// ---------------------------------------------------------------------------
// Current policy (Ricardo 2026-08-23). Do not emit stale 11% / 10% / 85%.
// ---------------------------------------------------------------------------
const RATE = "11.84%";
const BASE = "11.5%";
const BLEND = "33.75 bps";
const BALLOON = "20% of the asset";
const DOWN = "40%";
const FUNDED = "60%";
const RENTED = "30% of the time";
const RENT_PCT = "0.55% of value per month";
const STRIP = "20% of interest billings";
const SERVICING = "75 bps of outstanding";
const ACTIVATION = "2% of capital drawdown";
const ORIGINATION = "about 1% of funded (ASSUMPTION, payer TBD)";
const VEHICLE_IRR = "9.08%";
const US_TAKE = "$75.3k";
const CLIENT_OUTLAY = "$664k";
const BAND = "8.5–11.5%";

const ICPS = [
  {
    id: 1,
    code: "ICP-1",
    name: "Poblado Executive",
    city: "Medellín",
    hood: "El Poblado (Provenza, Los Balsos) and Envigado (Zúñiga)",
    property: "2–3BR apartment, 100–160 m², estrato 6, doorman building, move-in ready",
    persona: "Colombian-American professional, 35–55, family base / eventual retirement, visits 6–10 weeks/yr",
    price: 420_000,
    band: "$350–500k",
    termY: 10,
    termM: 120,
    base: 0.115,
    effective: 0.118375,
    pmt: 3223,
    down: 168_000,
    funded: 252_000,
    balloon: 84_000,
    rent: 2310,
    rentYr: 8300,
    netOcc: 1016,
    netAvg: 305,
    offset: "about 9%",
    tamarindoRent: 254,
    liquidity: "90–150 days",
    cap: "liquidity backbone; about 20 homes / $5.0M funded in the pilot mix",
    rentFactor: 1,
    grade: "FACT as the live ICP-1 sheet in thesis 04 / 13; rents are ASSUMPTION",
  },
  {
    id: 2,
    code: "ICP-2",
    name: "Cartagena Heritage",
    city: "Cartagena",
    hood: "Old City, Bocagrande, Castillo Grande",
    property: "1–2BR renovated apartment, 60–110 m², historic building or premium tower",
    persona: "US investor-lifestyle buyer, 45–65; uses it 4–8 weeks/yr and wants the rental engine the rest of the time",
    price: 650_000,
    band: "$500–800k",
    termY: 10,
    termM: 120,
    base: 0.115,
    effective: 0.118375,
    pmt: 4988,
    down: 260_000,
    funded: 390_000,
    balloon: 130_000,
    rent: 3575,
    rentYr: 12900,
    netOcc: 1573,
    netAvg: 472,
    offset: "about 9% averaged, more in high season",
    tamarindoRent: 393,
    liquidity: "150–270 days; thinner and tourism-correlated",
    cap: "OPINION: cap at ≤40% of any vehicle",
    rentFactor: 1,
    grade: "FACT as the live ICP-2 sheet in thesis 04; rents are ASSUMPTION",
  },
  {
    id: 3,
    code: "ICP-3",
    name: "Llanogrande Country",
    city: "Rionegro / Oriente",
    hood: "Llanogrande / JMC airport corridor",
    property: "casa campestre, 200–350 m² on a 1,000+ m² lot in a gated community",
    persona: "retiree or remote-work family, 50–70; primary or near-primary residence; lifestyle first, rental secondary",
    price: 750_000,
    band: "$600–900k",
    termY: 12,
    termM: 144,
    base: 0.11,
    effective: 0.113375,
    pmt: 5238,
    down: 300_000,
    funded: 450_000,
    balloon: 150_000,
    rent: 1650,
    rentYr: 5900,
    netOcc: 726,
    netAvg: 218,
    offset: "about 4% — underwrite income, not rent",
    tamarindoRent: 182,
    liquidity: "180–300 days",
    cap: "OPINION: cap at ≤25% of any vehicle",
    rentFactor: 0.4,
    grade: "FACT as the live ICP-3 sheet in thesis 04 (12-year term, 11% base + FICO blend); rents ASSUMPTION",
  },
  {
    id: 4,
    code: "ICP-4",
    name: "Bocagrande Tower",
    city: "Cartagena",
    hood: "Bocagrande",
    property: "2BR coastal tower apartment, 80–130 m², amenities",
    persona: "US professional, 40–60, shorter path to title",
    price: 480_000,
    band: "model ticket $480k (ASSUMPTION)",
    termY: 7,
    termM: 84,
    base: 0.125,
    effective: 0.128375,
    pmt: 4503,
    down: 192_000,
    funded: 288_000,
    balloon: 96_000,
    rent: 2640,
    rentYr: 9500,
    netOcc: 1162,
    netAvg: 348,
    offset: "about 8% averaged at 30% time rented (ASSUMPTION)",
    tamarindoRent: 290,
    liquidity: "same Cartagena tourism-thinner book as ICP-2",
    cap: "mix weight 0.18 in the engine; still inside the Cartagena vehicle cap",
    rentFactor: 1,
    grade: "ASSUMPTION from lib/model/contracts.ts — 7-year lifestyle term, not in thesis 04's launch three",
  },
  {
    id: 5,
    code: "ICP-5",
    name: "Envigado Family",
    city: "Medellín",
    hood: "Envigado / Zúñiga",
    property: "3BR family apartment, 90–140 m², estrato 5–6",
    persona: "diaspora family, 30–50, first Colombia home",
    price: 310_000,
    band: "model ticket $310k (ASSUMPTION)",
    termY: 8,
    termM: 96,
    base: 0.12,
    effective: 0.123375,
    pmt: 2676,
    down: 124_000,
    funded: 186_000,
    balloon: 62_000,
    rent: 1705,
    rentYr: 6100,
    netOcc: 750,
    netAvg: 225,
    offset: "about 8% averaged (ASSUMPTION)",
    tamarindoRent: 188,
    liquidity: "Envigado is next to the Poblado liquidity backbone",
    cap: "mix weight 0.17 — volume companion to ICP-1",
    rentFactor: 1,
    grade: "ASSUMPTION from lib/model/contracts.ts — 8-year smaller ticket",
  },
  {
    id: 6,
    code: "ICP-6",
    name: "Castillo Grande Coastal",
    city: "Cartagena",
    hood: "Castillo Grande",
    property: "2–3BR bay-view apartment, 110–160 m²",
    persona: "couple 45–65, mixed use and rental",
    price: 580_000,
    band: "model ticket $580k (ASSUMPTION)",
    termY: 9,
    termM: 108,
    base: 0.115,
    effective: 0.118375,
    pmt: 4646,
    down: 232_000,
    funded: 348_000,
    balloon: 116_000,
    rent: 3190,
    rentYr: 11500,
    netOcc: 1404,
    netAvg: 421,
    offset: "about 9% averaged (ASSUMPTION)",
    tamarindoRent: 351,
    liquidity: "Castillo Grande is in the Cartagena tourism book",
    cap: "mix weight 0.10; keep Cartagena ≤40% of a vehicle",
    rentFactor: 1,
    grade: "ASSUMPTION from lib/model/contracts.ts — 9-year coastal",
  },
];

// ===========================================================================
// 1. Thesis / problem / what Tamarindo is
// ===========================================================================
add(
  "thesis",
  P.investor,
  "What problem does Tamarindo exist to solve?",
  "A prime US borrower — 750+ FICO, strong income — walks into a Colombian bank for a Cartagena or Medellín apartment and is treated as a stranger. Local financing is unavailable or punitive; US banks will not take raw Colombian real estate as mortgage collateral. The result is an all-cash market for the buyers who least need to pay cash. FACT as the founding problem across thesis 01 and the Aug 7 overview.",
);
add(
  "thesis",
  P.friend,
  "What is Tamarindo in one sentence?",
  "A credit translation layer: it turns US creditworthiness into purchasing power for Colombian hard assets through a lease-to-own, not a bank mortgage. FACT as identity in thesis 01.",
);
add(
  "thesis",
  P.founder,
  "Is Tamarindo a lender?",
  "No. OPINION in thesis 01, load-bearing: Tamarindo is a fee machine. Capital partners own the assets and take default/recovery risk. Tamarindo originates, activates, services, takes a spread strip, and runs the service/rental layer. If Tamarindo owns properties on its own balance sheet beyond incidental recovery windows, the model has drifted.",
);
add(
  "thesis",
  P.stakeholder,
  "What are Tamarindo's three identities, in order?",
  "OPINION, thesis 01: (1) a fee machine valued on fee income per dollar of AUM, not a REIT; (2) a rails company whose durable asset is legal-operational machinery — sucursal, comodato + US lease + option, recovery, underwriting, servicing; (3) a lifestyle product: use US credit to control a place in Colombia and let it earn rent when you are not there.",
);
add(
  "thesis",
  P.investor,
  "Why isn't this just a Colombian mortgage with extra steps?",
  "Title sits in the vehicle's Colombian sucursal. The client pays a US-law lease with a material residual and gets use through comodato plus a purchase option. Tamarindo never takes public deposits. Local hipotecario is pesos, local income, often 12–18% E.A., and often closed to non-residents. FACT as design; characterization is still an open legal item.",
);
add(
  "thesis",
  P.prospect,
  "Why would I use Tamarindo instead of wiring the whole price?",
  "You keep sixty percent of the purchase in your US balance sheet and still get use of the home on day one. Down is 40%, funded is 60%, term is about ten years at an effective 11.84% on the funded slice, with a 20%-of-asset balloon. The honest rental credit at 30% time rented offsets about 9% of the payment on ICP-1/2 — not a free house. FACT as structure; willingness-to-pay is the open question.",
);
add(
  "thesis",
  P.regulator,
  "Is Tamarindo a bank, a mortgage lender, or a securities issuer?",
  "The design says none of those. Guardrails in thesis 01: not a mortgage lender, not a bank, not a securities issuer to clients. Legal characterization of the lease (usury, consumer credit, true lease vs disguised financing) is still open in both countries. Say the intent, then say counsel has not closed it.",
);
add(
  "thesis",
  P.investor,
  "What is the actual bet, stated plainly?",
  "OPINION, thesis 01: prime expat/diaspora demand will absorb about 45 homes in 18 months at a 10–12% client rate, and the rental pool — homes rented 30% of the time — offsets enough that the effective cost feels closer to 6–7%. If that clears, rails plus cloned vehicles reach ~$60M AUM by Year 3 in the old phase table, then several hundred million later. Kill it if conversion or recovery fails.",
);
add(
  "thesis",
  P.founder,
  "Where is the moat?",
  "OPINION: legal-operational, not a landing page. Almost no one will assemble Colombian sucursal ownership, bilingual contract stacks, notary/title workflows, and a tested recovery path. Every closed deal deepens that. Technology is the UX on top of Rocket/Better-style familiarity, not the moat.",
);
add(
  "thesis",
  P.stakeholder,
  "Is Tamarindo a property developer?",
  "No. Thesis 01 guardrail: not a developer or speculator. Appreciation accrues mostly to the client via the purchase option. Tamarindo's returns must not depend on price appreciation. FACT as policy intent.",
);
add(
  "thesis",
  P.investor,
  "Should we value Tamarindo like a REIT?",
  "No. OPINION: value it on fee income per dollar of assets under management, like a servicer or a marketplace. It owns no properties. Intervest and later vehicles own the houses.",
);
add(
  "thesis",
  P.friend,
  "Is this just 'get a loan in Colombia'?",
  "The client story is lifestyle, not a loan shop: use your US credit to own your place in Colombia, and let it earn rent when you are not there. Homes are assumed rented 30% of the time because people want to enjoy them — the old 85% occupancy story is retired. FACT as the Aug 19 / 23 Aug rental decision.",
);
add(
  "thesis",
  P.founder,
  "What did Mike Gontar tell us about volume?",
  "FACT from Aug 20: limit the test, keep the box tight, prove the mechanics. Not a volume-at-any-cost originator. The live box is 750+ FICO, 60% LTV, about 45 homes, ICP properties only.",
);
add(
  "thesis",
  P.investor,
  "What are the kill criteria?",
  "Thesis 01 and 03: if pilot conversion at viable 10–12% pricing fails, or the recovery path is unenforceable in practice, the thesis does not scale. The test is sized so failure is affordable. Also watch rental offset materially below ~9% of payment averaged, and whether 5 people can service ~50 homes.",
);
add(
  "thesis",
  P.regulator,
  "Does Tamarindo take deposits from the public in Colombia?",
  "The design is the opposite of captación: a US vehicle buys the house through a sucursal, the client pays a US-law lease, and nobody hands Tamarindo a deposit-like savings product. Whether Superintendencia agrees is an open legal item. Do not declare it clean.",
);
add(
  "thesis",
  P.prospect,
  "When do I actually own the apartment?",
  "Not on day one. The sucursal holds title. You get use through comodato plus a purchase option. You take title when you pay the residual balloon or exercise early. That is the whole point versus a Colombian mortgage in your name.",
);
add(
  "thesis",
  P.investor,
  "Is demand already proven?",
  "The pain point is real and widely evidenced. Willingness-to-pay at 10–12% dollars — model 11.84% effective — is the open question. The $20M / ~45-home pilot is sized to answer it. MIXED: problem FACT, conversion unproven.",
);
add(
  "thesis",
  P.founder,
  "Why Colombia first and not Mexico?",
  "Colombia is where the Intervest test, the sucursal paper, and the three launch ICPs live. Mexico is a Phase-3 ASSUMPTION corridor — same diaspora logic, larger market — after Colombia rails are proven. Do not pitch Mexico as the current book.",
);
add(
  "thesis",
  P.stakeholder,
  "What durable asset do we actually own?",
  "The rails: sucursal structure, comodato + US lease + purchase option stack, recovery playbook, underwriting policy, servicing platform, and capital-partner relationships. Brand sits in Tamarindo US. Houses sit in vehicles. OPINION as the order of importance in thesis 01.",
);
add(
  "thesis",
  P.friend,
  "Who is this for, in human terms?",
  "US people with real FICO — 750 and up, SSN, individuals — who want a Medellín or Cartagena home and cannot get a normal US mortgage on it or a cheap Colombian one without local income. Not a mass-market product. Pilot is cream, not the median borrower.",
);

const thesisMore = [
  [
    P.investor,
    "How does Tamarindo make money if it never owns the house?",
    "Layered fees on every stage: origination, 2% activation on drawdown, 75 bps servicing, 20% of interest billings, insurance commission, and a rental share plus Ashoka management. Recurring take is modeled around 3.5–3.7% of funded AUM at the 11.84% blended client rate. OPINION on the take; FACT on the six-line shape.",
  ],
  [
    P.founder,
    "Why keep the box this tight?",
    "Mike's advice and the Aug 19 operating rule: an ICP is a permission slip. If it is not an active ICP, it is not a deal. Tight box, prime borrowers, prove mechanics, then clone vehicles. FACT as launch discipline.",
  ],
  [
    P.regulator,
    "Could this be recharacterized as consumer credit anyway?",
    "Yes. A US-law consumer lease can still be a consumer-credit product under state law or the federal Consumer Leasing Act / TILA if it looks like financing. The 18 Aug debrief flagged usury and true-lease opinions as blocking. Open. Do not tell a prospect it is blessed.",
  ],
  [
    P.prospect,
    "Is this cheaper than a US mortgage?",
    "No, and do not sell it that way. Freddie Mac's 30-year is CONTEXT around 6.17–6.65% in late August 2026 — on US homes. Tamarindo's 11.84% is a dollar lease on Colombian collateral no US bank will take. Anchor against Colombian non-VIS credit and all-cash, not against Freddie.",
  ],
  [
    P.stakeholder,
    "What happens if we start owning inventory?",
    "Thesis 01: if Tamarindo owns properties on its own balance sheet beyond incidental or recovery timing windows, the model has drifted. Stay asset-light. Vehicles own title.",
  ],
  [
    P.investor,
    "Is the 1,000–1,500 bps spread the profit?",
    "The Aug 7 overview framed US prime 5–7% versus Colombian 15–25% as the arbitrage to validate net of costs. That is CONTEXT for the hole, not Tamarindo's take. Tamarindo keeps about 20% of interest plus servicing and fees; the vehicle earns the base yield. Do not put 1,000 bps in a deck as company margin.",
  ],
  [
    P.friend,
    "Why don't US banks just do this?",
    "They generally will not take raw Colombian real estate as mortgage collateral. That hole is the product. CONTEXT, not a Tamarindo exclusive forever — but it is why a sucursal-plus-US-lease stack exists.",
  ],
  [
    P.founder,
    "What must never depend on home-price appreciation?",
    "Tamarindo's returns. Appreciation is the client's upside via the purchase option. If the fee engine needs 3–4%/yr USD appreciation to work, the thesis is wrong. Thesis 01 guardrail.",
  ],
  [
    P.investor,
    "Is this a marketplace already or a single-GP shop?",
    "Vehicle #1 is Tamarindo-Intervest. No exclusivity, ROFR only, so Years 2–4 are clone vehicles. At scale OPINION is a funding marketplace: capital competes to fund Tamarindo-originated assets. Today it is one test vehicle.",
  ],
  [
    P.regulator,
    "Does the client ever hand Tamarindo savings-like money?",
    "Down payment goes to close the purchase (seller is paid in full day 0). Ongoing payments are US-law lease service, not a deposit account. Design intent is to stay out of captación. Unconfirmed with Superintendencia.",
  ],
];
for (const [p, q, a] of thesisMore) add("thesis", p, q, a);

const thesisAngles = [
  ["the credit-does-not-travel line", "Credit does not travel even when borrower quality does — that is the founding sentence. A 750+ FICO file is a stranger in a Colombian bank and useless as Colombian collateral at a US bank."],
  ["the all-cash-market observation", "Exactly the buyers who least need to pay cash are forced to. Tamarindo finances 60% so they do not have to empty a US brokerage to control a Poblado or Old City unit."],
  ["rails versus technology", "Anyone can copy a landing page. The moat is sucursal title, bilingual contracts, notary workflows, and a recovery path. OPINION, thesis 01."],
  ["why lifestyle is not fluff", "The rental pool (Tamarindo operates, keeps ~20% of net after Ashoka and opex) turns the property from a pure liability into a partially self-funding asset. Emotional core of the pitch and practical affordability. Homes rented 30% of the time, not 85%."],
  ["Ashoka as compounding", "Sister company captures maintenance, PM, and rentals at market rates so the family earns on the asset's whole life, not just financing. Related-party discipline is mandatory."],
  ["replicability of capital", "No exclusivity with Intervest. Each new partner gets Tamarindo-[Partner] LLC on the same rails. That is the Year 2–4 multiply thesis."],
  ["what 'prove the paper' means", "Phase 0: legal opinions, contract stack, financial model, deck, servicing v1, three launch ICPs. Gate: clean-enough opinions + vehicle docs signed + 3 properties under diligence."],
  ["why 45 homes not 5–20", "Early PoC language of $5–20M / 10–30 leases is STALE. Live box is ~45 homes, $20M test, 750+ FICO, 60% LTV."],
  ["platform analogues we are allowed to use", "Rocket/Better for digital UX, LendingTree for capital marketplace, AUTOPAY/RateGenius for auto, specialty-finance originators. Innovation is familiar UX hiding a cross-border ownership structure. CONTEXT as analogues, not comps."],
  ["what 'default rails' means by year 10", "OPINION Phase 4: the answer to 'how do I finance a home abroad with my US credit?' the way specific companies became the answer to cross-border payroll. ~$0.7–1B AUM in the old phase table; the current cash-flow book targets $150M funded ($100M homes / $30M autos / $20M aircraft). Say which table you are using."],
  ["why we do not promise a US write-off", "Meetings said US write-off; personal vs investment use, tax home, and characterization can kill it. Counsel / CPA. Nico is not the CPA."],
  ["why we do not stack TAM figures", "Pew ~1.4M Colombian-origin (2021), MPI ~855k immigrants, meetings 800k–1.0M Tier 1. Debrief: do not derive 800k from 1.4M. Hunt FL / NY / NJ."],
  ["the honest conversion question", "Will a 750+ FICO US person pay ~11–12% dollars — 11.84% blended — to control a Colombian home? First cohort answers it. That is the kill criterion."],
  ["fee machine versus balance-sheet lender", "Tamarindo US earns fees. Vehicles earn yield and take asset risk. Mixing those layers was the 18 Aug debrief failure mode."],
  ["why three identities must stay in that order", "If lifestyle outruns rails, ops break. If rails outrun the fee machine, we become a charity law firm. If we pretend to be a lender, we take risk we are not capitalized for."],
];
thesisAngles.forEach(([topic, a], i) => {
  add("thesis", rotate(i), `Explain ${topic} for Tamarindo.`, a);
  add("thesis", rotate(i + 3), `What should Nico say about ${topic}?`, `${a} Label the grade: problem and structure are FACT; growth path is OPINION; conversion is unproven.`);
});

const thesisWhatIf = [
  "the first twenty closings all come from friends of the founders",
  "a US bank launches a Colombia-collateral program",
  "BanRep cuts and local peso mortgages cheapen",
  "the peso moves twenty percent in a year",
  "Cartagena HOAs ban short-term lets",
  "Medellín luxury inventory floods",
  "we cannot hire bilingual CS",
  "counsel says the lease is a loan",
  "Intervest's LPs hate related-party Ashoka",
  "a newspaper calls us a shadow bank",
];
thesisWhatIf.forEach((s, i) => {
  add(
    "thesis",
    rotate(i),
    `How does the thesis change if ${s}?`,
    `The core remains credit translation: US credit → Colombian hard asset via sucursal title, US-law lease, comodato, 40% down, 60% funded, 11.84% effective, 20% balloon. If ${s}, that is a kill or a pivot on conversion, recovery, or partner appetite — not a reason to quietly become a balance-sheet lender. OPINION on the response; FACT on the current box.`,
  );
});

// ===========================================================================
// 2. Entities
// ===========================================================================
add(
  "entities",
  P.stakeholder,
  "What is Tamarindo US?",
  "The operating company and the entity equity investors buy into. It owns the brand, underwriting policy, servicing/billing, contract templates, and capital-partner relationships. It employs the lean core and carries the tech budget. Earns origination, 2% activation, servicing, ~20% of interest, rental share. Owns no properties, ever. FACT as architecture, thesis 02.",
);
add(
  "entities",
  P.investor,
  "What is Tamarindo-Intervest LLC?",
  "Funding vehicle #1. Intervest capital: $10M committed with $10M more on KPIs (Aug 20), roughly half Medellín / half Cartagena. Through its sucursal it owns the properties, receives the net lease stream, and earns the base yield (capital priced ~9–12%; current ICP-1 vehicle IRR 9.08%, inside the 8.5–11.5% band). Default and recovery sit here, cushioned by 40% down and 60% max LTV.",
);
add(
  "entities",
  P.regulator,
  "What is a sucursal in this structure?",
  "A Colombian branch of the funding vehicle that holds property title. Not Tamarindo US. The client is comodatario (holder); the sucursal is comodante (owner). Recovery is restitution of tenancy, not mortgage foreclosure. FACT as design.",
);
add(
  "entities",
  P.founder,
  "Is Tamarindo Colombia a nonprofit cost center?",
  "No. MODEL OVERRIDE (Ricardo, 2026-08-23): the shipped cash-flow book treats Tamarindo Colombia as a for-profit sucursal. It bills clients for closing, diligence, and monthly administration, plus a US mandate. It may run cash-flow negative while the book is thin. Do not force a wash to zero. This overrides the earlier 'execution arm, not a profit center' OPINION in thesis 02 until that file is rewritten.",
);
add(
  "entities",
  P.stakeholder,
  "What does Ashoka do?",
  "Sister company: property management, maintenance, and rental operations. Executes the Aug 19 decision that Tamarindo rents the home when the client is not using it. Earns market PM (ASSUMPTION 18–22% of gross STR, 20% base) plus repair markup. Related-party pricing must be documented, disclosed, and terminable.",
);
add(
  "entities",
  P.investor,
  "Who owns title during the lease?",
  "The funding vehicle through its Colombian sucursal. Tamarindo US must not own the apartment. Client has use plus option. FACT as architecture.",
);
add(
  "entities",
  P.prospect,
  "Who do I pay each month?",
  "You pay the US-law lease to Tamarindo US (servicer/biller). Tamarindo keeps servicing and about 20% of the interest component and remits the rest to the vehicle. Colombia admin is a separate ~$120/mo line on the ICP-1 walk. You are not paying rent to a Medellín landlord.",
);
add(
  "entities",
  P.friend,
  "How many companies are in the family?",
  "Tamarindo US (OpCo), each funding vehicle (Tamarindo-Intervest first, then Tamarindo-[Partner] clones), each vehicle's Colombian sucursal (title), Tamarindo Colombia (local execution / for-profit sucursal in the model), and Ashoka (sister PM/rentals). Do not collapse them in one sentence.",
);
add(
  "entities",
  P.regulator,
  "Is the sucursal of Tamarindo US or of the vehicle?",
  "Of the funding vehicle. Vehicle owns sucursal; sucursal holds title. Tamarindo US mandates Colombia work and services the US lease. Mixing those is how you accidentally put houses on the OpCo balance sheet.",
);
add(
  "entities",
  P.founder,
  "Should Ashoka and Tamarindo Colombia be the same company?",
  "OPINION: keep them separate. Ashoka may one day serve non-Tamarindo properties; separation keeps vehicle diligence clean. Related-party contracts still need market rates.",
);
add(
  "entities",
  P.investor,
  "Does Intervest sit on the Tamarindo US cap table?",
  "Not unless a later term sheet says so. Thesis 11: Intervest / other vehicles fund leases. Equity funds the venture. Two pots. FACT as current model; names on the cap table are TBD.",
);
add(
  "entities",
  P.stakeholder,
  "Where does client lease cash actually land?",
  "Client → Tamarindo US (billing) → net of Tamarindo fees → vehicle. Rental cash: guest → Ashoka → waterfall (20% mgmt, 25% opex, 20% of remainder to Tamarindo, rest credits the client). FACT as the thesis 02 flow.",
);
add(
  "entities",
  P.prospect,
  "If something breaks in the apartment, who do I call?",
  "Ashoka for maintenance and rentals; Tamarindo Colombia for title/comodato/local; Tamarindo US for billing and the US lease. One throat to choke is the point of a sister operator — if related-party terms stay clean.",
);
add(
  "entities",
  P.regulator,
  "Who is the lessor on the US-law lease?",
  "The funding vehicle / its US contractual face, serviced by Tamarindo US. ToS templates already name 'Financing Partner' as the independent evaluator. Tamarindo Credit LLC is the platform entity named in the templates. Characterization still open.",
);
add(
  "entities",
  P.founder,
  "What is the template point of vehicle one?",
  "Docs, waterfall, and reporting pack should be reusable. Partner #2 gets the same rails with only the economics page changing. Target: weeks, not months, to stand up a clone. OPINION, thesis 02.",
);

const entityPairs = [
  ["Tamarindo US", "OpCo / fee machine / brand / underwriting / servicing. No properties. Equity investors buy this."],
  ["Tamarindo-Intervest LLC", "Vehicle #1. $10M + $10M on KPIs. Owns assets via sucursal. Earns vehicle yield. Takes default risk."],
  ["a future Tamarindo-[Partner] LLC", "Clone vehicle on identical rails. No exclusivity, so this is allowed. Economics page changes; rails do not."],
  ["the vehicle sucursal", "Colombian branch that holds title. Comodante. Recovery hook. Not the OpCo."],
  ["Tamarindo Colombia", "For-profit sucursal in the shipped model: closing, diligence, monthly admin, US mandate. May be cash-flow negative while thin. Not a nonprofit."],
  ["Ashoka", "Sister PM / maintenance / rentals. 20% of gross STR in the base case. Related-party, terminable, market rates."],
  ["the client", "Comodatario + US lessee + purchase-option holder. Pays 40% down, monthly lease, 20% balloon. Never holds title until option."],
  ["the seller", "Paid in full on day 0. On ICP-1 that is $420k. Seller is out of the story after escritura."],
  ["Intervest the manager", "NY specialty-finance GP. Not the same legal person as Tamarindo-Intervest LLC. Mike Gontar CEO. Do not put $25B funds/accounts and $10.4B AUM on one slide."],
  ["Mechanical Art Capital / the watch book", "A separate Intervest LP-conflict thread. Not vehicle one for homes. Keep them in different sentences."],
];
entityPairs.forEach(([name, a], i) => {
  add("entities", rotate(i), `What role does ${name} play?`, `${a} Grade: FACT as the family map in thesis 02 unless labeled otherwise.`);
  add("entities", rotate(i + 2), `Who should not be confused with ${name}?`, `${a} Common mix-up: calling Tamarindo a bank, calling Intervest the OpCo, or calling Colombia a nonprofit.`);
  add("entities", rotate(i + 4), `Where does money touch ${name} on one deal?`, `On the ICP-1 walk: seller gets $420k day 0; vehicle funds $252k; Tamarindo US takes activation $5,040, origination $2,520, then strip + servicing + rental share (life ~$75.3k); Colombia bills closing/admin; Ashoka takes 20% of gross when rented; client outlay ~$664k for the $420k home. ${a}`);
});

const entityMoney = [
  ["activation fee", "Tamarindo US, 2% of draw, once. ICP-1: $5,040 on $252k. FACT."],
  ["origination fee", "Tamarindo US, ~1% of funded ASSUMPTION, payer TBD. ICP-1: $2,520."],
  ["servicing fee", "Tamarindo US, 75 bps of outstanding, declining. ICP-1 life ~$13.9k. ASSUMPTION on the bps."],
  ["spread strip", "Tamarindo US, 20% of interest billings. ICP-1 ~$43.8k of ~$218.8k lifetime interest. FACT as structure."],
  ["insurance commission", "Tamarindo US, ~40 bps of new funded in the model. ICP-1 $1,008."],
  ["Colombia closing + inspection", "Sucursal: $2,200 + $400 on the ICP-1 walk, plus $1,000 US mandate."],
  ["Colombia monthly admin", "Client pays ~$120/mo on the ICP-1 walk. For-profit local revenue, not a wash."],
  ["Ashoka management fee", "20% of gross rent when occupied. Related-party, market band 15–25% STR."],
  ["Tamarindo rental share", "20% of the remainder after 20% mgmt and 25% opex — 11% of gross. ICP-1 $254 occupied ≈ $76 averaged."],
  ["vehicle residual / balloon", "Client pays 20% of asset at term; vehicle balance goes to 0; capital recycles. ICP-1 $84k."],
];
entityMoney.forEach(([line, a], i) => {
  add("entities", rotate(i), `Which entity earns or pays the ${line}?`, a);
});

// ===========================================================================
// 3. ICPs 1–6
// ===========================================================================
add(
  "icps",
  P.founder,
  "Why only three active ICPs at a time?",
  "OPINION, thesis 04: three covers distinct personas and rental profiles and stays standardizable for underwriting and Ashoka. An ICP is a permission slip. Review quarterly; retire when data disappoints or the market saturates. The engine also carries ICP-4/5/6 as additional contract shapes — still not a license to do off-box deals.",
);
add(
  "icps",
  P.investor,
  "How is the $20M pilot mixed across ICPs?",
  "OPINION mix in thesis 04: ~20 Poblado homes / $5.0M funded, ~15 Cartagena / $5.9M, ~9 Llanogrande / $4.1M → ~44 homes, ~$15M funded, ~$25M of assets at 60% LTV. The extra $5M of the $20M is fees, reserves, furnishing float. Caps: Cartagena ≤40%, Llanogrande ≤25%.",
);
add(
  "icps",
  P.prospect,
  "Do homes rent the whole year?",
  "No. MODEL OVERRIDE 2026-08-23: people want to enjoy their homes. Default share-of-time-rented is 30%, user-editable per ICP. All rentals are short-term but never shorter than one month — no nightly stays. Rent is 0.55%/mo of value, scaled by a rental-strength factor (ICP-3 is 0.4). The old 85% occupancy / nightly-ADR story is retired.",
);

for (const icp of ICPS) {
  const tag = `${icp.code} ${icp.name}`;
  const p0 = rotate(icp.id);
  add(
    "icps",
    p0,
    `What is ${tag}?`,
    `${icp.grade}. ${icp.property} in ${icp.hood}, ${icp.city}. Price band ${icp.band}, anchor ${money(icp.price)}. Buyer: ${icp.persona}. Financing: ${DOWN} down (${money(icp.down)}), ${FUNDED} funded (${money(icp.funded)}), ${icp.termY}-year term, effective ${(icp.effective * 100).toFixed(2)}% (base ${(icp.base * 100).toFixed(1)}% + FICO blend), lease ≈ ${money(icp.pmt)}/mo, balloon ${money(icp.balloon)} (${BALLOON}).`,
  );
  add(
    "icps",
    P.prospect,
    `What property does ${icp.code} buy?`,
    `${icp.property} in ${icp.hood}. ${icp.grade}.`,
  );
  add(
    "icps",
    P.prospect,
    `Who is the ${icp.code} buyer persona?`,
    `${icp.persona}. Location: ${icp.city} — ${icp.hood}. ${icp.grade}.`,
  );
  add(
    "icps",
    P.investor,
    `What is the ${icp.code} price band and anchor?`,
    `Band ${icp.band}; model/thesis anchor ${money(icp.price)}. ${icp.grade}. CONTEXT: 2026 luxury sketches put El Poblado roughly $0.22–0.76M and Cartagena towers from the high-$100ks into $1M+ — Tamarindo $350–900k is the international-buyer slice, not the city median.`,
  );
  add(
    "icps",
    P.prospect,
    `How much down is ${icp.code}?`,
    `${DOWN} wired, not yankable after it hits. On the ${money(icp.price)} anchor that is ${money(icp.down)}. Vehicle funds ${money(icp.funded)} (${FUNDED} LTV). FACT as the live 40/60 box.`,
  );
  add(
    "icps",
    P.investor,
    `How much does the vehicle fund on ${icp.code}?`,
    `${money(icp.funded)} on the ${money(icp.price)} anchor at 60% LTV. That funded amount is what activation (2%), origination (~1%), and the 11.84%-class rate apply to — not the purchase price.`,
  );
  add(
    "icps",
    P.prospect,
    `What is the monthly lease on ${icp.code}?`,
    `Model output ≈ ${money(icp.pmt)}/mo for ${icp.termM} months at ${(icp.effective * 100).toFixed(2)}% effective with a ${money(icp.balloon)} balloon. That is debt service on the funded slice, not 'rent.' ${icp.grade}.`,
  );
  add(
    "icps",
    P.investor,
    `What balloon does ${icp.code} use?`,
    `${money(icp.balloon)} — ${BALLOON} (the true-lease floor, thesis 07). At 60% LTV that is 33% of funded. Not the stale 10% meeting number and not 15% of funded.`,
  );
  add(
    "icps",
    P.prospect,
    `What is the ${icp.code} term?`,
    `${icp.termY} years (${icp.termM} months). Not every ICP is 10 years: ICP-3 is 12, ICP-4 is 7, ICP-5 is 8, ICP-6 is 9. ${icp.grade}.`,
  );
  add(
    "icps",
    P.founder,
    `What base rate does ${icp.code} start from?`,
    `${(icp.base * 100).toFixed(1)}% ICP base, then the FICO blend (+75 / 0 / −25 bps, book-weighted ≈ +${BLEND}) → ${(icp.effective * 100).toFixed(2)}% effective. FACT as current policy; ICP-3's 11% base is the retiree/longer-term step.`,
  );
  add(
    "icps",
    P.prospect,
    `What rent does ${icp.code} earn when occupied?`,
    `ASSUMPTION: ${RENT_PCT} × rental-strength ${icp.rentFactor} → about ${money(icp.rent)}/mo when occupied. Units are rented ${RENTED}, so actual gross is about ${money(icp.rentYr)}/year, not twelve times the occupied rent. No nightly stays.`,
  );
  add(
    "icps",
    P.investor,
    `What rental credit should we quote on ${icp.code}?`,
    `Sell the average, not the occupied month. Net to client ≈ ${money(icp.netOcc)}/mo when occupied and ≈ ${money(icp.netAvg)}/mo averaged at 30% time rented — ${icp.offset} of the ${money(icp.pmt)} lease. Quoting only the occupied number is how you lose a client in year two. OPINION on the sales rule; ASSUMPTION on the rents.`,
  );
  add(
    "icps",
    P.stakeholder,
    `How does the ${icp.code} rental waterfall split?`,
    `On occupied gross ${money(icp.rent)}: −20% Ashoka mgmt −25% operating costs → remainder; −20% Tamarindo share (≈ ${money(icp.tamarindoRent)}) → client keeps 44% of gross when occupied. Averaged across the year at 30% time rented, Tamarindo's share is about 30% of that monthly figure. ASSUMPTION as model, not a signed lease clause until it is in the docs.`,
  );
  add(
    "icps",
    P.investor,
    `What is ${icp.code} liquidity if we recover the asset?`,
    `${icp.liquidity}. ${icp.cap}. Liquidity days are ASSUMPTION until a broker panel prices them.`,
  );
  add(
    "icps",
    P.founder,
    `Why does ${icp.code} exist in the box?`,
    `${icp.cap}. Persona: ${icp.persona}. ${icp.grade}.`,
  );
  add(
    "icps",
    P.regulator,
    `Is ${icp.code} a Colombian mortgage product?`,
    `No. Same stack as the rest of the book: sucursal title, US-law lease, comodato use, ${DOWN} down, ${BALLOON} option, ${(icp.effective * 100).toFixed(2)}% dollar rate. ${icp.city} location does not make it leasing habitacional.`,
  );
  add(
    "icps",
    P.friend,
    `Explain ${tag} like I do not do finance.`,
    `A ${money(icp.price)} home in ${icp.city}. You put ${money(icp.down)} down. Tamarindo's partner pays the other ${money(icp.funded)}. You pay about ${money(icp.pmt)} a month for ${icp.termY} years, then ${money(icp.balloon)} to take the deed. If you rent it out ${RENTED}, you might net about ${money(icp.netAvg)} a month averaged — nice, not a miracle.`,
  );
}

add(
  "icps",
  P.investor,
  "Which ICP is the liquidity backbone?",
  "ICP-1 Poblado Executive. Deepest resale, 90–150 days ASSUMPTION, ~20 homes / $5.0M funded in the pilot opinion mix. ICP-5 Envigado is the smaller-ticket volume companion in the engine.",
);
add(
  "icps",
  P.investor,
  "Which ICP is the yield / rental proof?",
  "ICP-2 Cartagena Heritage — strongest gross rent ($3,575/mo occupied) but seasonal and ops-heavy. Cap ≤40%. ICP-4 Bocagrande and ICP-6 Castillo Grande sit in the same coastal book.",
);
add(
  "icps",
  P.investor,
  "Which ICP must be underwritten on income, not rent?",
  "ICP-3 Llanogrande Country. Rental-strength 0.4, ~4% payment offset, many clients will not pool. Cap ≤25%. FACT as thesis 04 policy.",
);
add(
  "icps",
  P.founder,
  "Are ICP-4, ICP-5, and ICP-6 in the thesis launch set?",
  "No. Thesis 04's rotating three are Poblado, Cartagena Heritage, Llanogrande. ICP-4 Bocagrande (7y), ICP-5 Envigado (8y), ICP-6 Castillo Grande (9y) are engine contract shapes in lib/model/contracts.ts so not every lease is ten years. Label ASSUMPTION. Still 40% down, 20% balloon, 30% rented, FICO blend on top of each base.",
);
add(
  "icps",
  P.prospect,
  "Can I do a nightly Airbnb on a Tamarindo home?",
  "No. Policy: short-term but never shorter than one month. The old ICP-2 ADR ~$210 × 62% occupancy framing is superseded by monthly-minimum pricing at 0.55% of value. FACT as the 23 Aug model override.",
);
add(
  "icps",
  P.stakeholder,
  "What fields must every ICP define?",
  "Thesis 04 template: property, price band, state/neighborhood, buyer persona, financing shape (down, funded, term, residual), rental profile, rental offset, liquidity test (days-to-resell). If a field is blank it is not an ICP.",
);

const icpCompare = [
  ["ICP-1 vs ICP-2 payment", "ICP-1 ≈ $3,223/mo on $420k/10y; ICP-2 ≈ $4,988/mo on $650k/10y. Same 11.84% effective and 20% balloon policy. Different tickets."],
  ["ICP-2 vs ICP-3 payment", "ICP-2 ≈ $4,988/mo (10y, 11.84%); ICP-3 ≈ $5,238/mo on a $750k house over 12 years at 11.34% effective. ICP-3 is longer and weaker on rent."],
  ["ICP-1 vs ICP-5", "Both Medellín family/liquidity. ICP-1 $420k/10y/$3,223; ICP-5 $310k/8y/$2,676 (ASSUMPTION engine). ICP-5 is the smaller, shorter volume ticket."],
  ["ICP-2 vs ICP-4 vs ICP-6", "All Cartagena coastal. $650k/10y/$4,988 vs $480k/7y/$4,503 vs $580k/9y/$4,646. Shorter terms and higher ICP-4 base (12.5%) change the payment more than the neighborhood name."],
  ["why ICP-3 is 12 years", "Retiree / near-primary casa campestre. Longer term, 11% base, same 20% balloon ($150k). Underwrite income. Thesis 04."],
  ["why ICP-4 is 7 years", "Shorter path to title for a 40–60 US professional. 12.5% base + blend ≈ 12.84%. ASSUMPTION engine shape."],
];
icpCompare.forEach(([q, a], i) => add("icps", rotate(i), `Compare ${q}.`, a));

// ===========================================================================
// 4. Fees
// ===========================================================================
add(
  "fees",
  P.investor,
  "Walk the six revenue lines.",
  "1 Origination ~1% of funded, ASSUMPTION, payer TBD, Tamarindo US. 2 Activation 2% of drawdown, FACT, Tamarindo US. 3 Servicing ~75 bps of outstanding, ASSUMPTION, Tamarindo US. 4 Interest spread share ~20% of interest billings, FACT, Tamarindo US. 5 Property-management charge-through at Ashoka, market + markup. 6 Rental revenue share ~20% of net rental if pooled, FACT. Insurance commission (~40 bps of new funded in the model) sits next to origination as a seventh cash line on the ICP-1 walk.",
);
add(
  "fees",
  P.investor,
  "What is the activation fee?",
  "FACT: 2% of capital drawdown, once, when the vehicle draws. $252k draw → $5,040; $450k draw → $9,000. It is not Intervest 2-and-20 and not an annual management fee.",
);
add(
  "fees",
  P.investor,
  "What is the origination fee?",
  "ASSUMPTION: about 1% of funded. Payer unset (client vs vehicle vs split). ICP-1: $2,520. US brokers often 0–2%. Until cited, leave payer blank in a deck.",
);
add(
  "fees",
  P.investor,
  "What is the spread strip?",
  "FACT: Tamarindo keeps about 20% of interest billings. At an 11.84% client rate that is about 237 bps of outstanding on this line, and it declines as principal amortizes toward the balloon. Month-1 ICP-1 interest ≈ $2,486; Tamarindo 20% ≈ $497 that month.",
);
add(
  "fees",
  P.investor,
  "What is the servicing fee?",
  "ASSUMPTION: 75 bps of outstanding per year (placeholder; US residential servicing often 25–50+ bps). On ICP-1 life ≈ $13.9k. Keep it distinct from the 20% strip. Equipment-finance forward-flow servicing CONTEXT is 75–200 bps — supports the placeholder, does not prove it.",
);
add(
  "fees",
  P.investor,
  "What does Tamarindo take on rental?",
  "FACT as structure: after Ashoka's 20% mgmt and 25% opex, Tamarindo takes 20% of the remainder (11% of gross); client gets 44% of gross as a credit when occupied. At 30% time rented, quote the average. ICP-1 Tamarindo share $254 occupied ≈ $76/mo averaged.",
);
add(
  "fees",
  P.founder,
  "Who pays origination?",
  "Unset. Could be client, vehicle, or split. Thesis 05 lists it as a model-must-nail item. Do not invent a payer in a live client conversation.",
);
add(
  "fees",
  P.investor,
  "What take rate should I underwrite on $1 of funded AUM?",
  "OPINION, thesis 05/06, at ~11.84% blended client rate: 237 bps strip + 75 bps servicing + 40–60 bps rental/mgmt blend ≈ 3.5–3.7% recurring, plus ~3% one-time (activation + origination) in the deploy year. Not investor-grade until the model is a signed case.",
);
add(
  "fees",
  P.investor,
  "Dov said $30k a month. Is that company revenue?",
  "That Aug 19 sketch on the $20M pilot (~$360k/yr) matches the spread-share line alone: 237 bps × ~$15M funded ≈ $355k. The full stack is modeled as roughly 3× that. Do not put $360k in a deck as total revenue. FACT as sketch; OPINION on the multiple.",
);
add(
  "fees",
  P.stakeholder,
  "Is Tamarindo 2 and 20?",
  "No. Intervest 2+20 is GP vs their LPs. Tamarindo 2% is a one-time activation on drawdown. Tamarindo ~20% is a share of interest billings, not carry. Mixing those three layers was the 18 Aug debrief failure mode.",
);
add(
  "fees",
  P.investor,
  "What is the insurance line?",
  "Model: ~40 bps of new funded as an intermediation commission on forced-place and GAP. ICP-1 $1,008 at close. ASSUMPTION. Sits in the $75.3k US take on ICP-1.",
);
add(
  "fees",
  P.founder,
  "What did the Aug 7 overview list as eight revenue lines?",
  "Borrower origination, capital-provider placement, servicing, spread participation, appraisal coordination, legal/closing coordination, insurance/hedging admin, purchase-option fees. The live six-line engine collapsed some of those. Appraisal is $700–800 client-paid, no markup. Do not double-count.",
);
add(
  "fees",
  P.prospect,
  "Do I pay Tamarindo a fee to apply?",
  "Title + appraisal about $700–800, client-paid, no markup (FACT). Origination ~1% may or may not be on you (unset). Activation is on the vehicle draw, not a consumer application fee. Hard pull only after you confirm intent.",
);
add(
  "fees",
  P.regulator,
  "Are these fees disclosed as consumer credit charges?",
  "They must be, if counsel concludes this is a consumer-credit or CLA/TILA product. That opinion is open. Until then, list the lines honestly and do not hide origination inside 'activation.'",
);

const feeLines = [
  ["activation", "2% of draw, once, FACT, Tamarindo US"],
  ["origination", "~1% of funded, ASSUMPTION, payer TBD, Tamarindo US"],
  ["servicing", "75 bps outstanding, ASSUMPTION, Tamarindo US, declines"],
  ["spread share", "20% of interest billings, FACT, ~237 bps at 11.84%, declines"],
  ["insurance commission", "~40 bps of new funded, ASSUMPTION, Tamarindo US"],
  ["Ashoka PM", "20% of gross STR base, market 15–25%, related-party"],
  ["rental share", "20% of remainder after PM and 25% opex, FACT as structure"],
  ["Colombia closing", "$2,200 on the ICP-1 walk to the for-profit sucursal"],
  ["Colombia inspection", "$400 on the ICP-1 walk"],
  ["Colombia admin", "~$120/mo client bill, sucursal revenue"],
  ["US mandate to Colombia", "$1,000 on the ICP-1 walk — OpCo pays sucursal, not a full opex wash"],
  ["repair markup", "Ashoka ~15% on charge-through repairs, must be market"],
];
feeLines.forEach(([name, a], i) => {
  add("fees", rotate(i), `What is Tamarindo's ${name} fee?`, `${a}. Never call the stack '2 and 20.'`);
  add("fees", rotate(i + 3), `Is the ${name} line a FACT or an assumption?`, `${a}. If the grade is ASSUMPTION, do not paste it into a deck as a signed term.`);
  add("fees", rotate(i + 1), `Who receives the ${name} cash?`, `${a}. Tamarindo US, Ashoka, or the Colombia sucursal — not Intervest's 2-and-20.`);
});

add(
  "fees",
  P.investor,
  "How much of ICP-2 lifetime value is the service layer?",
  "Illustrative ICP-2 10-year family take ~$140–145k (ASSUMPTION, thesis 04). About 45% from servicing, rental share, Ashoka mgmt, and insurance — which is why Ashoka is strategic, not incidental. The old ~$190–210k figure assumed the retired high-occupancy rental model.",
);
add(
  "fees",
  P.investor,
  "What is spread share in month one versus year ten?",
  "It declines. Month-1 ICP-1: interest ≈ $2,486, strip ≈ $497. By the balloon, outstanding is $84k so monthly interest is much smaller. Servicing 75 bps declines on the same outstanding. Do not multiply month-1 by 120.",
);

const feeMisreads = [
  ["calling activation an annual 2%", "Activation is once on drawdown, not a 2% AUM management fee."],
  ["calling the strip carry", "20% of interest billings is a coupon share, not 20% of profits."],
  ["using Dov's $30k as total revenue", "That is the strip on ~$15M funded, not the company."],
  ["quoting 3.5% take as FACT", "It is OPINION at 11.84% plus placeholders for servicing and rental blend."],
  ["putting origination in the client teaser without a payer", "Payer is TBD."],
  ["burying Ashoka opex inside the 20% PM", "25% operating costs sit outside the management percentage. Disclose both."],
  ["treating Colombia as a wash", "For-profit sucursal; it bills. Do not force zero."],
  ["double-counting 2 and 20 on the vehicle", "Do not add Intervest fund 2+20 on top of 9–12% vehicle yield unless signed docs say so."],
];
feeMisreads.forEach(([q, a], i) => add("fees", rotate(i), `Why is ${q} wrong?`, a));

// ===========================================================================
// 5. One-deal waterfall
// ===========================================================================
add(
  "waterfall",
  P.investor,
  "Walk one ICP-1 deal start to finish.",
  "Thesis 13, engine math. $420k Poblado apartment. Client wires $168k (40%); vehicle draws $252k; seller gets $420k day 0. Title to the sucursal. Client signs US-law lease + comodato + option. 120 months at 11.84% effective, $3,223/mo, $84k balloon (20% of asset). At month 120 the client pays $84k and owns the home. Vehicle balance → 0.",
);
add(
  "waterfall",
  P.investor,
  "Who makes what on ICP-1?",
  "Engine math, thesis 13. Client puts in ~$664k over 10 years and owns the $420k home. Intervest vehicle puts in $252k day 0 and takes out ~$413k ≈ 9.08% IRR (inside 8.5–11.5%). Tamarindo US takes ~$75.3k (activation, origination, spread, servicing, insurance, rental share). Colombia sucursal ~$17k client fees + $1k mandate. Seller gets $420k day 0.",
);
add(
  "waterfall",
  P.founder,
  "Why is Tamarindo US take $75.3k and not just the $57.6k spread-plus-servicing?",
  "Thesis 12's grid isolates spread+servicing at $57.6k on the current 11.84% / 20% strip / 75 bps row. Thesis 13's $75.3k adds activation $5,040, origination $2,520, insurance $1,008, and rental share over the life. Do not treat the two figures as a contradiction — they are different stacks.",
);
add(
  "waterfall",
  P.prospect,
  "What do I actually write checks for on a $420k Poblado deal?",
  "Day 0: $168k down plus closing/inspection/title lines. Months 1–120: $3,223 lease + about $120 Colombia admin. When the unit is rented you get a credit (~$1,016 that month, ~$305 averaged). Month 120: $84,000 option. Engine total client outlay ≈ $664k for the home, owned. FACT as the ICP-1 walk; plan the balloon — it is not a token.",
);
add(
  "waterfall",
  P.investor,
  "What IRR does the vehicle earn on ICP-1?",
  "≈ 9.08% after Tamarindo's 20% strip and 75 bps servicing. That is why the rate moved: 11.0% flat IRR'd 8.35%, below Intervest's 8.5% floor. 11.5% base + FICO blend = 11.84% lands inside the 8.5–11.5% band. FACT as engine math.",
);
add(
  "waterfall",
  P.stakeholder,
  "What happens to cash when the unit is in the rental pool?",
  "Default 30% of time rented. Gross 0.55% of value when occupied (ICP-1 $2,310). −20% Ashoka −25% costs → $1,270 remainder; −20% Tamarindo ($254) → $1,016 credits the client that month. Averaged ~$305/mo, ~9% of the $3,223 lease. FACT as model waterfall; ASSUMPTION on the rent.",
);
add(
  "waterfall",
  P.regulator,
  "Where does title sit on day 0 versus month 120?",
  "Day 0: sucursal. Month 120 after the $84k option: client. Until then the client is tenedor under comodato, not owner. That is the enforcement advantage on default.",
);
add(
  "waterfall",
  P.founder,
  "What are closing fees on ICP-1?",
  "Activation $5,040 (2% of $252k) and origination $2,520 to Tamarindo US; insurance commission $1,008; Colombia closing $2,200 + inspection $400 to the sucursal; US pays the sucursal a $1,000 mandate. Thesis 13.",
);
add(
  "waterfall",
  P.investor,
  "How much lifetime interest is on ICP-1 and who keeps it?",
  "Lifetime interest ≈ $218.8k. About 80% to the vehicle, 20% ($43.8k) to Tamarindo, plus servicing $13.9k. FACT as engine math on the current 11.84% / $84k balloon shape.",
);
add(
  "waterfall",
  P.friend,
  "If I put $168k down, do I only pay $3,223 until I own it?",
  "Monthly, yes, plus Colombia admin, minus any rental credit. Then you still owe the $84k balloon. Total cash the engine prints is about $664k over ten years for a $420k home — because you are buying the funded slice on time plus fees plus the residual. Not a trick; say it plainly.",
);
add(
  "waterfall",
  P.investor,
  "What does the vehicle recycle at exit?",
  "Client exercises the option; title transfers; vehicle balance is zero; capital goes into the next property. That is how $20M supports more than one vintage over ten years. Default path is the other exit: terminate comodato, re-lease or sell, keep the down as cushion.",
);
add(
  "waterfall",
  P.regulator,
  "What is the default path on one deal?",
  "Cure period → comodato termination → recovery by the sucursal (it already holds title) → re-lease or sell. Meetings: 2 months on the US lease, 1 month on the comodato versus a long rental desahucio. Deposit/down is the vehicle's cushion. Unlitigated. Not self-help eviction.",
);

const waterSteps = [
  ["intent and soft pull", "Hard pull only after confirmed intent. Two-stage consent: account docs never authorize a credit pull."],
  ["offer window", "5–7 business days. FACT as the product box."],
  ["40% wire", "Client wires down. After it hits, no walk. Closing 30–45 days after the wire. FACT."],
  ["vehicle draw", "Vehicle funds 60%. Activation 2% fires. Seller paid in full."],
  ["escritura / title", "Title to sucursal. Client signs US lease + comodato + option. It is a US deal until the option is exercised."],
  ["month 1 payment split", "ICP-1 $3,223 = interest ≈ $2,486 + principal. Strip 20% of interest. Servicing 75 bps/12 on outstanding. Rest to vehicle."],
  ["rental month", "If pooled and occupied: Ashoka 20%, opex 25%, Tamarindo 20% of remainder, client credit 44% of gross."],
  ["empty month", "No rental credit. Client still pays the full lease. This is why we quote 30% time rented, not 85% occupancy."],
  ["prepay", "Allowed, no penalty. Buyout is residual plus remaining principal, not a leave-early fine. FACT as described."],
  ["month 120", "Pay $84k (ICP-1). Own the home. Vehicle recycles."],
  ["default month 2", "Lease default → repossess path; deposit forfeited. FACT as meeting script; unlitigated."],
  ["recovery sale", "Sucursal sells or re-leases. 40% down is the first-loss cushion. Days-to-resell is the ICP liquidity test."],
];
waterSteps.forEach(([step, a], i) => {
  add("waterfall", rotate(i), `What happens at ${step} on a Tamarindo deal?`, a);
  add("waterfall", rotate(i + 2), `Walk ${step} for an investor.`, `${a} On ICP-1 the money numbers are $420k / $168k / $252k / $3,223 / $84k / 11.84% / $75.3k US / 9.08% vehicle.`);
});

const waterWho = [
  ["the client", "Pays ~$664k life, uses the home, optional rental credit, owns at balloon."],
  ["Intervest's vehicle", "Funds $252k, collects ~80% of interest plus principal to a $84k residual, IRR ≈ 9.08%."],
  ["Tamarindo US", "Underwrites and services; keeps ~$75.3k life on ICP-1."],
  ["Tamarindo Colombia / sucursal", "Closes, inspects, administers; ~$17k client fees + $1k mandate; holds title until option."],
  ["Ashoka", "Rents and maintains when pooled; 20% of gross + repair markup."],
  ["the seller", "$420k day 0, done."],
  ["Mike / Intervest GP", "Sets rate policy ('be reasonable'); does not take the $75.3k OpCo stack."],
  ["equity holders of Tamarindo US", "Own the fee machine, not this apartment."],
];
waterWho.forEach(([who, a], i) => {
  add("waterfall", rotate(i), `What does ${who} put in and take out on ICP-1?`, a);
});

add(
  "waterfall",
  P.investor,
  "Walk ICP-2 dollars the same way.",
  "Anchor $650k; down $260k; funded $390k; lease ≈ $4,988/mo; balloon $130k; 11.84% effective; 10 years. Activation 2% ≈ $7.8k. Occupied rent $3,575; averaged credit ~$472; honest effective ≈ $4,516/mo. Family 10-year take ~$140–145k ASSUMPTION. Sell $4,516 not $3,415.",
);
add(
  "waterfall",
  P.investor,
  "Walk ICP-3 dollars the same way.",
  "Anchor $750k; down $300k; funded $450k; 12 years; 11.34% effective; lease ≈ $5,238/mo; balloon $150k. Rent is weak (factor 0.4, $1,650 occupied, ~$218 averaged, ~4% offset). Underwrite the retiree's income. Entities file's $750k Cartagena round number with $9k activation is a different $750k shape — say which.",
);

// ===========================================================================
// 6. Rates / FICO / comparables
// ===========================================================================
add(
  "rates",
  P.investor,
  "What is the current client rate?",
  "Effective blended property rate ≈ 11.84% = 11.5% ICP-1/2 base + a FICO-tier blend of about +33.75 bps. ICP-3 uses an 11% base → ~11.34% effective. Tests still include 9/11/13% for conversion sensitivity. MIXED: structure FACT, willingness-to-pay open.",
);
add(
  "rates",
  P.prospect,
  "What FICO do I need and what rate do I get?",
  "Admission gate: 750+ / Tier 1 / SSN / individuals at launch. Then three pricing tiers on the ICP base: 750–779 +75 bps (50% of book ASSUMPTION), 780–809 base (35%), 810+ −25 bps (15%). Blend ≈ +33.75 bps. Hard pull only after intent.",
);
add(
  "rates",
  P.founder,
  "Why did the rate move off 11% flat?",
  "At 11.0% flat with the 20% strip and 75 bps servicing, Intervest's ICP-1 IRR was 8.35% — below the 8.5–11.5% band. 11.5% + FICO blend = 11.84% → vehicle 9.08%, strip stays 20%. Payment $3,084 → $3,223, still below the pre-balloon-raise $3,278. FACT as engine math, thesis 12.",
);
add(
  "rates",
  P.investor,
  "What is Intervest's stated appetite band?",
  "8.5–11.5% vehicle yield (thesis 09/12). 9.5% client rate does not work for the vehicle at any strip we would accept. Discounting below base costs Tamarindo, not Intervest — deliver 'excellent credit' as the 810+ −25 bps tier, not a strip cut.",
);
add(
  "rates",
  P.investor,
  "Where does 11.84% sit versus a defensible band?",
  "OPINION, thesis 12: the realistic band for this borrower/structure is 9.5–11.5% (Mexico cross-border USD 8–10% plus a Colombia premium of ~100–150 bps). 11.84% is ~35 bps over that band on purpose so the vehicle clears 8.5%. Against Colombian leasing habitacional 14%+ EA in pesos, 11.84% USD still wins. Against US 6.65% conventional it needs the story told right.",
);
add(
  "rates",
  P.prospect,
  "Why would I pay 11.84% if US mortgages are six percent?",
  "Because a US bank will not take your Cartagena apartment as collateral. Freddie Mac 30-year prints (CONTEXT, not ours): ~6.17% the week of 21 Aug 2026 (thesis 06) and 6.65% on 20 Aug 2026 (thesis 12). Those are US homes, 30-year amortizing. Colombian non-VIS mortgages mid-2026 printed roughly 12–18% E.A. and often want local income. Tamarindo is the unproven dollar alternative, not a cheap Freddie clone.",
);
add(
  "rates",
  P.regulator,
  "Are you using Freddie Mac's number as your rate?",
  "No. Freddie is CONTEXT — the client's mental anchor. Our live rate is 11.84% effective on a US-law lease against a Colombian asset. Never rewrite PMMS into a Tamarindo term sheet.",
);
add(
  "rates",
  P.investor,
  "What is the Mexico comparable?",
  "CONTEXT, thesis 12: Mexico cross-border USD mortgages (MoXi / Intercam / Sabadell) around 8–10%, 65% LTV, 760+ FICO, title via fideicomiso. Closest structural comparable to vehicle + comodato. We add a Colombia premium. Not our product.",
);
add(
  "rates",
  P.investor,
  "What do Colombian banks charge for housing credit?",
  "CONTEXT, mid-2026: Superintendencia / La República non-VIS mortgages roughly 11.8–17.7% E.A., weighted average ~15.2%; housing leasing non-VIS ~14.7%; thesis 12 cites leasing habitacional No VIS 14.25–14.69% EA, BBVA best 13.54%, needs Colombian credit standing. BanRep intervention 9.25% as of 17 Jul 2026 (thesis 06) — quote the date; it moves. These are pesos, local files, not our 11.84% dollar lease.",
);
add(
  "rates",
  P.founder,
  "What are the three FICO tiers in bps?",
  "750–779 +75 bps, 50% of book; 780–809 base, 35%; 810+ −25 bps, 15%. Blend +33.75 bps. All shares and spreads are model variables. Gate stays 750+. FACT as Ricardo 23 Aug policy.",
);
add(
  "rates",
  P.investor,
  "If Intervest wants more than 9.1% vehicle IRR, what moves?",
  "Thesis 12 negotiation floor: 12% flat (client pays ~$27/mo more on ICP-1) or a strip cut to 15% (costs Tamarindo ~$11k per deal). Do not give both at once.",
);
add(
  "rates",
  P.stakeholder,
  "What are the three money-rate layers?",
  "Never mix: (1) vehicle capital ~9–12% (ICP-1 IRR 9.08%); (2) client lease 11.84% effective; (3) Tamarindo take — 20% of interest (~237 bps) + 75 bps servicing + fees. Intervest 2+20 is a fourth thing, fund vs LPs.",
);

const rateRows = [
  ["11.0% flat, 20% strip, 75 bps", "$3,084/mo", "8.35% IRR — below band", "$54.2k spread+svc"],
  ["11.0%, 15% strip, 75 bps", "$3,084/mo", "8.95% IRR", "$44.1k"],
  ["11.0%, 12% strip, 50 bps", "$3,084/mo", "9.58% IRR", "$33.4k"],
  ["11.5%, 20% strip, 75 bps", "$3,167/mo", "8.79% IRR", "$56.2k"],
  ["11.5%, 15% strip, 75 bps", "$3,167/mo", "9.41% IRR", "$45.6k"],
  ["11.84% current base, 20% strip, 75 bps", "$3,223/mo", "9.08% IRR — CURRENT", "$57.6k spread+svc; $75.3k full US stack"],
  ["11.84%, 15% strip, 75 bps", "$3,223/mo", "9.72% IRR", "$46.7k"],
  ["12.0% flat, 20% strip, 75 bps", "$3,250/mo", "9.22% IRR", "$58.3k"],
  ["12.0%, 15% strip, 75 bps", "$3,250/mo", "9.87% IRR", "$47.2k"],
];
rateRows.forEach(([scen, pmt, irr, take], i) => {
  add(
    "rates",
    rotate(i),
    `What does the ICP-1 grid say at ${scen}?`,
    `Engine math, thesis 12, $84k balloon shape: payment ${pmt}, vehicle ${irr}, Tamarindo ${take}. Current policy is 11.84% / 20% strip / 75 bps. Other rows are what-ifs.`,
  );
});

const comps = [
  ["US 30-year conventional", "Freddie Mac PMMS CONTEXT ~6.17% week of 21 Aug 2026 and 6.65% on 20 Aug 2026. US collateral. Not our rate."],
  ["US domestic DSCR 760+ ≤75% LTV", "CONTEXT 6.1–6.5%. Investor product, US property."],
  ["foreign-national DSCR on US property", "CONTEXT 7.75–9.0%, 65–70% LTV, up to 10.5%."],
  ["Mexico cross-border USD mortgage", "CONTEXT 8–10%. Closest structure. Fideicomiso, not comodato."],
  ["Colombia leasing habitacional No VIS", "CONTEXT 14.25–14.69% EA pesos. Requires Colombian standing."],
  ["Colombia peso mortgage No VIS", "CONTEXT ~15.2% EA average."],
  ["Colombia UVR mortgage", "CONTEXT ~6.5% + IPC. Cuota rises with CPI."],
  ["US hard money", "CONTEXT 10–16%. Ricardo: we sit close to this band but packaged as a lease, not a loan."],
  ["US exotic car lease", "CONTEXT money factors 0.0011–0.0035 → 2.6–8.4% APR. Do not use this to price Colombia autos."],
  ["Colombia vehicle credit", "CONTEXT July 2026 17–28.8% E.A. Anchor our 14.5% auto rate here, not against a Porsche at 7%."],
];
comps.forEach(([name, a], i) => {
  add("rates", rotate(i), `What is the ${name} comparable?`, `${a} Never present CONTEXT as a Tamarindo promise or as Intervest's number.`);
  add("rates", rotate(i + 3), `Why isn't ${name} our coupon?`, `${a} Our live property coupon is 11.84% effective on a dollar lease with a 20% balloon.`);
});

const ficoQs = [
  ["750–779", "+75 bps over ICP base", "half the book in the model"],
  ["780–809", "ICP base", "35% of book"],
  ["810 and above", "−25 bps", "15% of book — this is the 'excellent credit' discount, not a strip cut"],
];
ficoQs.forEach(([tier, spread, share], i) => {
  add("rates", P.prospect, `What rate does a ${tier} FICO get?`, `${spread}. Share of book ASSUMPTION: ${share}. Gate is still 750+ / SSN / individual. Effective book blend ≈ 11.84% on an 11.5% ICP base.`);
  add("rates", P.investor, `What share of the book is FICO ${tier}?`, `${share}. Spread ${spread}. Variables are user-editable.`);
});

add(
  "rates",
  P.founder,
  "What is autoClientRate versus aircraftClientRate?",
  "Model: autos 14.5% USD (justified by Colombian recovery risk and 17–28% local bank EA, not by the car). Aircraft 9.5% (prime aviation). Sales copy must never anchor autos against US exotic leases at 2.6–8.4%.",
);

// ===========================================================================
// 7. True lease / balloon / residual
// ===========================================================================
add(
  "lease",
  P.regulator,
  "Why is there a balloon at all?",
  "If you amortize the funded amount to zero it looks like a loan. A material residual keeps more economics with the lessor and is the commercial hook for 'this is a lease.' Current floor is 20% of asset (33% of funded at 60% LTV). The old 10% meeting number sat below Rev. Proc. 2001-28's 20% residual guideline, which is why it moved.",
);
add(
  "lease",
  P.regulator,
  "Does a 20% residual make this an IRS true lease?",
  "No. Nico must not say that. Rev. Proc. 2001-28 / 2001-29 is equipment guidance: no bargain option, residual ≥20% of cost, remaining life ≥20%, lessor equity/profit tests. Real estate ≠ equipment. In re Super Feeders: a percent alone does not save a nominal-in-substance option. Counsel writes the memo. UCC 1-203 is the commercial 'not a disguised security interest' test — 20% of asset / 33% of funded is plainly non-nominal, still not a blessing.",
);
add(
  "lease",
  P.investor,
  "What is the residual floor now?",
  "FACT as policy (23 Aug): 20% of asset (`minResidualOfAssetPct`). ICP-1 $84k on $420k, ICP-2 $130k on $650k, ICP-3 $150k on $750k. At 60% LTV that is 33% of funded. STALE: 10% of asset, 15% of funded.",
);
add(
  "lease",
  P.prospect,
  "What do I pay at the end to take title?",
  "The purchase option / balloon: 20% of the asset, not a $1 bargain. ICP-1 $84k, ICP-2 $130k, ICP-3 $150k. You can also prepay any time with no penalty; the buyout is residual plus remaining principal. Plan to fund or refinance the balloon — it is the true-lease floor, not a token.",
);
add(
  "lease",
  P.founder,
  "Which residual number goes in the model?",
  "Current policy: 20% of asset, enforced as max(residual-of-funded setting, minResidualOfAssetPct × price). At 60% LTV the 20% asset floor binds (33% of funded). STALE conventions: meetings' 10% of asset, ICP workbooks' 15% of funded. Use 20% of asset or you will fight UCC 1-203 and Rev. Proc. 2001-28 in the same sentence.",
);
add(
  "lease",
  P.regulator,
  "What is comodato and why is it free?",
  "Código Civil art. 2200: préstamo de uso, gratuitous, same thing returned, perfected by delivery. Courts treat paid use as arrendamiento. Tamarindo's money rides on the US-law lease; comodato is the use-right and recovery hook while the sucursal holds title. Sucursal = comodante; client = comodatario / tenedor, not owner.",
);
add(
  "lease",
  P.regulator,
  "Is the one-month lock-out in the Civil Code?",
  "No. Precario (no term, callable at will) is arts. 2219–2220 family. Tamarindo's one-month overdue lock-out is a commercial target versus desahucio, not a statute that says 'one month.' Faster than a rental eviction is the design; it is not self-help eviction. Procedure still goes through counsel's restitution path.",
);
add(
  "lease",
  P.prospect,
  "If I remodel the Cartagena apartment, do I get that money back?",
  "Ordinary upkeep is on the comodatario. Useful improvements are generally not reimbursed (art. 2216 family). Ask before you pour money into a remodel you do not yet own.",
);
add(
  "lease",
  P.regulator,
  "US lease versus Colombian leasing habitacional — same product?",
  "No. Local banks already sell housing leases, often higher LTV than mortgages, mid-teens pesos. Tamarindo is dollar, US-law payment, sucursal title, comodato use, 60% LTV, 20% balloon. Do not analogize them into one regulated product without opinions.",
);
add(
  "lease",
  P.regulator,
  "Does ASC 842 care about our 20% balloon?",
  "CONTEXT: finance vs operating is a different test (ownership transfer, reasonably certain option, term majority of life, PV substantially all of FMV, specialized asset). A 20% balloon does not automatically make an operating lease. Accounting ≠ tax ≠ UCC.",
);
add(
  "lease",
  P.regulator,
  "What does UCC 1-203 have to do with the balloon?",
  "It is the US commercial test for lease versus disguised security interest. A plainly non-nominal option — 20% of asset, 33% of funded — is the commercial hook. Still not a court holding. Counsel owns characterization.",
);
add(
  "lease",
  P.investor,
  "What is the payment formula?",
  "PMT = [PV − FV/(1+r)^n] × r / [1 − (1+r)^(−n)] with r = i/12. Excel =PMT(i/12, n, -PV, FV). Worked ICP-1: PV $252k, i 11.8375%, n 120, FV $84k → PMT ≈ $3,223. FACT on the algebra; FACT as current inputs (not the stale 11% / $37.8k balloon / ~$3,300 PMT).",
);
add(
  "lease",
  P.friend,
  "Is the monthly payment rent?",
  "No. It is lease service on the 60% Tamarindo funds, with a 20% residual left at the end. If the home is in the rental pool, a net credit can offset part of it. You are not paying Medellín market rent to a landlord.",
);
add(
  "lease",
  P.prospect,
  "Is there a prepayment penalty?",
  "Meetings say you can prepay any time with no penalty. FACT as described. The buyout math is residual plus remaining principal, not a charge for leaving early.",
);
add(
  "lease",
  P.prospect,
  "Can I deduct the lease on my US return?",
  "Meetings said US write-off. That is a meeting claim, not a tax opinion. Personal versus investment use, characterization, and tax home can kill the deduction. Use a CPA. Nico is not the CPA.",
);
add(
  "lease",
  P.founder,
  "What is the framing: buying money in the US?",
  "Thesis 07: the client is buying money in the US from Intervest's vehicle; Intervest buys the asset in Colombia. It is a US deal until the purchase option is exercised. OPINION as framing; still needs the characterization memo.",
);
add(
  "lease",
  P.regulator,
  "What true-lease tests do lessors still quote?",
  "Rev. Proc. 2001-28 / 2001-29: (1) no bargain purchase option — FMV, not $1; (2) expected residual ≥20% of cost, lessor bears residual risk; (3) remaining useful life at expiry ≥20% of original; (4) lessor profit, cash-flow, and minimum equity tests. Our 20% floor is now level with (2). Real property is not equipment. Do not tell a prospect the IRS blessed any number.",
);
add(
  "lease",
  P.investor,
  "Why move the residual from 10% to 20%?",
  "The old 10% sat below the equipment true-lease guideline and looked more like a loan leftover. 20% of asset is level with Rev. Proc. 2001-28 and plainly non-nominal under UCC 1-203. Side effect: monthly PMT fell versus a tiny balloon (more leftover at the end). ICP-1 still $3,223 after the rate step-up — below the pre-balloon-raise $3,278.",
);

const leaseTopics = [
  ["bargain purchase option", "There is none. Option is 20% of asset, intended to approximate a conservative FMV, not $1. Rev. Proc. 2001-28 test 1."],
  ["remaining useful life", "Equipment guideline wants ≥20% life left at expiry. Real estate life is long; still not an IRS blessing. CONTEXT."],
  ["Frank Lyon", "1978: substance over label — who has benefits and burdens of ownership. CONTEXT, not a Tamarindo holding."],
  ["In re Super Feeders", "A percent residual does not save a nominal-in-substance option. Balloon should approximate conservative FMV. CONTEXT."],
  ["Consumer Leasing Act / TILA", "A US-law consumer lease can still be financing. Open. 18 Aug debrief blocking item."],
  ["state usury", "Open. If recharacterized as a loan, usury/licensing attach. Do not declare clean."],
  ["captación", "Taking public money as a deposit-like product is a third rail. Design: client pays a US lessor; vehicle owns the house. Unconfirmed with Superintendencia."],
  ["escritura timing", "Colombian escritura often takes weeks. Product box: close 30–45 days after the 40% wire; no walk."],
  ["offer window", "5–7 business days. FACT."],
  ["hard pull timing", "After intent only. Two-stage consent: account creation never authorizes a credit pull."],
  ["lease default clock", "Meetings: 2 months → repossess; deposit forfeited. FACT as described; unlitigated."],
  ["comodato default clock", "Meetings: 1 month eviction versus rental desahucio. Commercial claim, not art. 2200."],
  ["title and appraisal cost", "$700–800, client-paid, no markup. FACT. Not a US domestic appraisal comp."],
  ["precario versus term comodato", "Counsel must pick. Precario is callable at will. Term comodato plus default is the other path. MinJusticia still tells people to write term, use, and return conditions."],
  ["tenedor versus possessor", "Client is tenedor, not a strong possessor. Recovery is framed as restitution of tenancy, not mortgage foreclosure."],
  ["improvements on comodato", "Ordinary upkeep on the client; useful improvements generally not reimbursed."],
  ["PMT versus rent language", "Never quote PMT as rent. It is debt service on the funded slice."],
  ["early exercise", "Allowed via prepay. Pay residual plus remaining principal. No penalty as described."],
  ["assignment in year three", "Possible if docs allow assignment of the option. Residual and remaining payments still matter. Not a flip product."],
  ["peso versus dollar obligation", "Client obligation is described in dollars. Local bills may be pesos. FX is residual risk, not a priced hedge yet."],
];
leaseTopics.forEach(([topic, a], i) => {
  add("lease", rotate(i), `What should we say about ${topic}?`, a);
  add("lease", rotate(i + 2), `Is ${topic} settled law for Tamarindo?`, `${a} If this is a statute or IRS guideline it is CONTEXT. Tamarindo's 20% balloon / US-lease + comodato stack is FACT as design, not a closed opinion.`);
});

const balloonByIcp = ICPS.map((icp) => [
  P.prospect,
  `What residual does ${icp.code} leave?`,
  `${money(icp.balloon)} — 20% of the ${money(icp.price)} asset (${((icp.balloon / icp.funded) * 100).toFixed(0)}% of the ${money(icp.funded)} funded). Current floor, not 10%.`,
]);
for (const [p, q, a] of balloonByIcp) add("lease", p, q, a);

// ===========================================================================
// 8. Equity rounds / dilution
// ===========================================================================
add(
  "equity",
  P.investor,
  "How much equity is Tamarindo US raising?",
  "OPINION, thesis 11: three priced rounds totaling $6.5M — $2.00M, $2.25M, $2.25M. A fourth slot exists and is off ($0). This is OpCo working capital, not Intervest warehouse cash. Round 1 is the smallest so the start is the easiest raise, but it cannot go below FY1 burn (~$1.65M) without the consolidated close going negative.",
);
add(
  "equity",
  P.investor,
  "What are the three priced rounds?",
  "Round 1 month 0: $10M pre, $2.00M raise, $12.0M post, 16.7% sold. Round 2 month 12: $15M pre, $2.25M, $17.25M post, 13.0% sold. Round 3 month 24: $20M pre, $2.25M, $22.25M post, 10.1% sold. Timing of 2 and 3 is ASSUMPTION until Ricardo dates them. Intervest is not on this cap table.",
);
add(
  "equity",
  P.founder,
  "Who owns Tamarindo at t=0 and after dilution?",
  "ASSUMPTION: five partners, equal 20% at t=0. Names not assigned. After three rounds the founders own about 65.2% together (~13.0% each). New shareholders can be anyone.",
);
add(
  "equity",
  P.founder,
  "How is founder pay treated in the raise window?",
  "OPINION: the four named US roles (Dov, Rosario, Ricardo, Tom) run at 50% of loaded pay for the first 8 months, then 100%. Other desks stay full. Colombia GM stays full unless separately changed.",
);
add(
  "equity",
  P.investor,
  "Does Intervest's $20M count as our seed?",
  "No. Two pots: vehicle capital buys properties and earns yield; OpCo equity pays salaries, legal, platform, sales. Intervest is not on the cap table unless a later term sheet says so. Saying 'we raised $20M' about the warehouse is the 18 Aug confusion again.",
);
add(
  "equity",
  P.investor,
  "What did thesis 05 used to say about the seed?",
  "Older OPINION: $2.5–3.5M seed for 24 months. Thesis 11 replaced that with three rounds $2M / $2.25M / $2.25M = $6.5M because year-1 desks burned through a $1M start. Say 11 when talking cap table; 05 when talking take-rate logic.",
);
add(
  "equity",
  P.stakeholder,
  "What does equity buy that warehouse does not?",
  "Payroll, desks, WhatsApp, legal paper, marketing, sales, accounting, Nico, servicing v1. Vehicle cash cannot pay Dov, Rosario, Ricardo, or Tom. Thesis 11.",
);
add(
  "equity",
  P.friend,
  "If I invest in Tamarindo, do I own the apartments?",
  "No. You own a slice of the fee machine — Tamarindo US. The apartments belong to Intervest's vehicle (and later clone vehicles). That is why equity investors win if AUM scales: they do not take property risk.",
);

const rounds = [
  [1, 0, 10_000_000, 2_000_000, 12_000_000, "16.7%", "start ops; smallest check; must clear ~$1.65M FY1 burn"],
  [2, 12, 15_000_000, 2_250_000, 17_250_000, "13.0%", "month 12 ASSUMPTION; through the pilot"],
  [3, 24, 20_000_000, 2_250_000, 22_250_000, "10.1%", "month 24 ASSUMPTION; doorstep of later CFO-positive years"],
];
rounds.forEach(([n, mo, pre, amt, post, sold, why]) => {
  add(
    "equity",
    P.investor,
    `What is equity round ${n}?`,
    `Month ${mo}: ${money(pre)} pre-money, ${money(amt)} raise, ${money(post)} post, ${sold} sold. ${why}. OPINION/ASSUMPTION, thesis 11. Intervest does not buy this paper.`,
  );
  add(
    "equity",
    P.founder,
    `Why is round ${n} sized ${money(amt)}?`,
    `${why}. Checks were raised from $1M after year-1 desks still burned the first million. Round 1 stays the easiest start without going below FY1 burn.`,
  );
  add(
    "equity",
    P.stakeholder,
    `How much dilution is round ${n}?`,
    `${sold} of the company at that close (${money(amt)} / ${money(post)}). Cumulative after three rounds: founders ~65.2% / ~13.0% each. ASSUMPTION.`,
  );
});

const equityAngles = [
  ["five equal partners", "20% each at t=0, names TBD. After three rounds ~13.0% each, 65.2% together."],
  ["the empty fourth round", "A slot exists and is $0. Do not invent a Series C in the model."],
  ["half pay for eight months", "Named US four at 50% loaded, then 100%. Other desks full. Colombia GM full."],
  ["Dov loaded pay", "ASSUMPTION $26,973/mo loaded on $25k cash + FICA/Medicare + single health (thesis 09 §3)."],
  ["Rosario loaded pay", "ASSUMPTION $16,805/mo loaded on $15k cash — Finance."],
  ["Ricardo loaded pay", "ASSUMPTION $26,973/mo loaded on $25k cash — Ops."],
  ["Tom loaded pay", "ASSUMPTION $16,805/mo loaded on $15k cash — CTO, 5–10 hrs/week near-term in meetings."],
  ["pre-money path $10 / $15 / $20", "OPINION marks, not a term sheet. Do not treat as a 409A."],
  ["why not one $6.5M cheque", "Smallest first so starting is easier; later rounds price the pilot."],
  ["cap table versus warehouse", "Equity holders own OpCo. Intervest owns / funds the lease book. Never one slide without both labels."],
  ["new money can come from anyone", "Thesis 11: shareholders can be anyone. Intervest is not required on the cap table."],
  ["FY1 burn versus round 1", "Round 1 cannot go below ~$1.65M FY1 burn without the consolidated close going negative."],
  ["seed milestones from thesis 05", "Legal opinions closed; 40–50 homes deployed; rental offset demonstrated; ≥1 recovery fire-drill; vehicle #2 signed."],
  ["why equity wins at Phase 4", "Old phase table: $0.7–1B AUM × ~3% take ≈ $20–30M revenue at servicer margins. Current book is $150M funded at FY10 — say which."],
  ["2 and 20 is not the raise", "GP language is Intervest vs LPs. Our take remains activation, servicing, ~20% of interest."],
];
equityAngles.forEach(([topic, a], i) => {
  add("equity", rotate(i), `Explain ${topic}.`, a);
  add("equity", rotate(i + 3), `What is easy to get wrong about ${topic}?`, `${a} Do not mix this with Intervest's $10M+$10M test.`);
});

// ===========================================================================
// 9. Ten-year plan / AUM / FY6 CFO
// ===========================================================================
add(
  "tenYear",
  P.investor,
  "What is the ten-year AUM path in the thesis phase table?",
  "OPINION, thesis 03/06: Phase 1 years 1–2 ~$20M / ~45 homes / 1 vehicle / ~$0.8–1.2M OpCo revenue. Phase 2 years 2–4 $60–80M / 150–180 homes / 2–3 vehicles / ~$2–2.5M, OpCo breakeven zone. Phase 3 years 4–7 $150–400M / 350–900 / 4–6 vehicles / $5–12M. Phase 4 years 7–10 $0.7–1B / 1,500+ / 8–10 vehicles / $20–30M. Forward numbers are OPINION/ASSUMPTION.",
);
add(
  "tenYear",
  P.investor,
  "What is the year-10 book in the cash-flow model?",
  "OPINION, thesis 10 / engine: $100M properties + $30M autos + $20M aircraft = $150M funded AUM. Intervest $75M (50%); three other vehicles $75M combined. This is a different table than thesis 03's $0.7–1B cartoon. Say which you are using. Live engine lands near $98M / $29M / $19M.",
);
add(
  "tenYear",
  P.investor,
  "When does Tamarindo US cash from operations turn positive?",
  "In the shipped cash-flow book, US CFO is negative FY1–FY5 and turns positive in FY6 (about +$408k in the default run). That is model output / ASSUMPTION, not a signed plan. Do not confuse it with thesis 03/05's older OPINION that OpCo breakeven sits near $50–60M funded AUM in Year 3 — different metric (fee-take math vs cash-flow CFO) and different book.",
);
add(
  "tenYear",
  P.founder,
  "Why is Year-3 'breakeven' not the same as FY6 CFO-positive?",
  "Thesis 05 take-rate math: ~3.6% recurring × $50–60M funded AUM ≈ OpCo breakeven on a lean cost base. The department-level cash-flow book pays named desks, half-pay, three equity rounds, autos, and Colombia as a for-profit sucursal — and US CFO prints positive in FY6. Quote both, labeled. Do not hide the later date.",
);
add(
  "tenYear",
  P.investor,
  "What is Intervest's KPI line by fiscal year?",
  "ASSUMPTION until Mike's term sheet, thesis 10 (millions EOP): FY1 $20, FY2 $25, FY3 $30 (still Intervest-only), FY4 $40 (partner 2 may enter), FY5 $48, FY6 $55 (partner 3; auto book material), FY7 $62, FY8 $68 (aircraft offer opens), FY9 $72, FY10 $75. First $10M only until tranche 2 / agreed KPIs.",
);
add(
  "tenYear",
  P.investor,
  "When can partner 2 enter?",
  "KPI path: years 1–3 Intervest-only (an exclusivity window in the model even though meetings said no exclusivity, ROFR only — say both). Partner 2 start month 36 (FY4). Partner 3 month 60 (FY6). Partner 4 month 84 (FY8). Each other vehicle ramps 40% → 70% → 100% of a $25M year-10 line.",
);
add(
  "tenYear",
  P.founder,
  "What must Phase 1 prove?",
  "1 Conversion at 10–12% (live 11.84%). 2 Delinquency inside assumptions. 3 At least one recovery path exercised or fire-drilled. 4 Rental offset ~9% of payment averaged at 30% time rented (not the old 30–55% full-occupancy band). 5 Five people + platform can service ~50 homes. End state ~$20M AUM, ~45 homes.",
);
add(
  "tenYear",
  P.stakeholder,
  "What are the two kinds of capital on the ten-year path?",
  "Vehicle capital buys properties, belongs to funding partners, target $20M → $150M in the current book ($1B in the old phase cartoon). OpCo capital funds Tamarindo US, $6.5M across three equity rounds. Never confuse them.",
);
add(
  "tenYear",
  P.investor,
  "What is Phase 0?",
  "Prove the paper, now → ~Q1 2027: legal opinions, contract stack, financial model, deck, servicing v1, first 3 ICPs. Gate: clean-enough opinions + vehicle docs signed + 3 properties under diligence.",
);
add(
  "tenYear",
  P.investor,
  "What opens in Phase 3?",
  "OPINION: funding marketplace, 4–6 vehicles, $150–400M in the old table. Second corridor ASSUMPTION Mexico. Ashoka scales; may take external properties. Structured-finance options appear (warehouse, forward-flow, later securitization) — take deliberately.",
);

const fyLines = [
  [1, 20, "Second $10M after first closings / KPIs", "US CFO deeply negative (~−$1.7M in the default run); $2M equity lands"],
  [2, 25, "Utilization and on-plan originations", "US CFO still negative; $2.25M round 2"],
  [3, 30, "Exclusivity window complete; book still Intervest-only", "US CFO still negative; $2.25M round 3"],
  [4, 40, "Partner 2 may enter; Intervest still majority", "US CFO still negative but narrower"],
  [5, 48, "Delinquency and servicing SLAs hold", "Last negative US CFO year in the default book"],
  [6, 55, "Partner 3; auto book is material", "US CFO turns positive (~+$408k default)"],
  [7, 62, "Repeat vintage performance", "US CFO more positive"],
  [8, 68, "Aircraft offer opens", "Aircraft AUM leaves zero"],
  [9, 72, "Partner 4 at full step", "CFO compounding"],
  [10, 75, "50% of the $150M book", "FY10 funded book target $100M / $30M / $20M"],
];
fyLines.forEach(([fy, line, gate, cfo]) => {
  add(
    "tenYear",
    P.investor,
    `What is the FY${fy} Intervest line and gate?`,
    `$${line}M EOP ASSUMPTION (thesis 10). Gate: ${gate}. ${cfo}. Do not treat the line as drawn AUM.`,
  );
  add(
    "tenYear",
    P.founder,
    `What should a board pack say about FY${fy}?`,
    `Intervest committed line $${line}M. ${gate}. ${cfo}. Homes / autos / aircraft follow year-10 weights, not an unbounded ramp. Model output, not a term sheet.`,
  );
  add(
    "tenYear",
    rotate(fy),
    `Does Tamarindo US print positive CFO in FY${fy}?`,
    fy < 6
      ? `No in the default cash-flow book. US CFO turns positive in FY6. FY${fy}: ${cfo}. Thesis 03's Year-3 breakeven is a different (take-rate) OPINION.`
      : `FY6 is the first positive US CFO year in the default book. FY${fy}: ${cfo}. ASSUMPTION / engine output.`,
  );
});

const aumWeights = [
  ["homes", "16%, 28%, 38%, 50%, 60%, 70%, 80%, 88%, 95%, 100% of the $100M FY10 goal"],
  ["autos", "6%, 16%, 28%, 40%, 53%, 67%, 80%, 90%, 97%, 100% of the $30M FY10 goal — starts after month 6"],
  ["aircraft", "0 through FY7, then 35%, 70%, 100% of the $20M FY10 goal"],
];
aumWeights.forEach(([book, a], i) => {
  add("tenYear", rotate(i), `How does the ${book} book ramp to year 10?`, `${a}. Originations are capped so funded outstanding follows the goal. Thesis 10 / capital-kpis.ts.`);
});

add(
  "tenYear",
  P.investor,
  "Why would a $25B manager stay at $20M then walk to $75M?",
  "OPINION, thesis 10: Intervest underwrites endpoint control. Tamarindo is an AI-first fintech that owns the US credit box and the Colombia close (sucursal, notary, comodato, WhatsApp servicing). They buy and scale platforms (Kapitus, Twain JV are CONTEXT 2026 activity), not one-off loans. Stay at $20M until KPIs print.",
);

const phaseQs = [
  ["Phase 1 cities", "Medellín and Cartagena only, tight ICP box. Third Colombian market (Bogotá or coffee axis) is Phase 2 ASSUMPTION after data."],
  ["Phase 2 team", "Seed consumed here — team to ~10–12, platform hardening, multi-vehicle reporting templates."],
  ["Phase 4 strategic options", "Not plans: bank partnership or charter, other hard assets on the same rails, or exit to a specialty-finance acquirer who values the fee stream."],
  ["useKpiCapitalCurve", "Default 1 uses the KPI path. 0 restores the old X% step-up for comparison. Do not pitch both as the plan."],
  ["January 2027 cohort", "Engine originates two in Nov 2026, two in Dec, one in Jan 2027 (ICP-1, 5, 2, 4, 6). Stub year is real."],
  ["homes originated by FY10", "Default engine ~485 originated, ~467 still active. ASSUMPTION."],
  ["consolidated FY1 cash", "Default engine FY1 close is slightly positive because $2M equity lands against a negative CFO. Do not call FY1 profitable."],
  ["consolidated FY10 cash", "Default engine ~$8.3M consolidated close. Model output."],
];
phaseQs.forEach(([q, a], i) => add("tenYear", rotate(i), `Ten-year plan: ${q}?`, a));

// ===========================================================================
// 10. Legal / NDA / two-stage consent
// ===========================================================================
add(
  "legal",
  P.regulator,
  "What is the two-stage consent architecture?",
  "FACT as the A2–A5 templates (docs index, ingested 21 Aug 2026). Stage 1 account creation: ToS + Privacy Policy + Registration & Marketing Consent, all checkbox-acknowledged — explicitly does NOT authorize any credit pull. Stage 2 financing request: separate Consumer Credit Report Authorization, soft-inquiry-first, express hard-inquiry consent, identity/fraud/sanctions screening, ongoing authorization for servicing/collections, e-sign clause.",
);
add(
  "legal",
  P.founder,
  "What entity do the legal templates name?",
  "ToS names 'Tamarindo Credit LLC' and enumerates roles: technology provider, platform operator, referral source, marketplace, originator, broker, lessor, lender, servicer, administrator. The paper is already written for the marketplace thesis and mentions automotive/mortgage products even though autos were deferred. 'Financing Partner' maps to the funding vehicles.",
);
add(
  "legal",
  P.regulator,
  "What does Privacy Policy §12 cover?",
  "Colombian data protection: habeas data principles, SIC complaint rights, cross-border transfer safeguards. The cross-border ops assumption is already in the paper. CONTEXT/FACT as template text, not a Superintendencia ruling.",
);
add(
  "legal",
  P.stakeholder,
  "How does investor NDA differ from client consent?",
  "Different doors. Client two-stage consent is ToS/privacy/marketing then a later FCRA-style credit auth. Investor/team intake is invite → interview → bio → click-wrap NDA (nda-v1) → data room. Confidential knowledge, artifacts, and data-room files check a current-template NDA inside the procedure. Admins do not sign their own NDA.",
);
add(
  "legal",
  P.investor,
  "What do I sign before I see the data room?",
  "The current Tamarindo mutual NDA (template nda-v1). Click-wrap: review, type legal name, draw signature, check consent. We hash the document, store timestamp/IP/UA, embed the signature in a PDF, keep it in R2. Until signed, investors see only the public tier. FACT as product design, docs/nico/06.",
);
add(
  "legal",
  P.regulator,
  "What makes the NDA click-wrap worth anything?",
  "Identity + intent + record retention: document hash, typed name, signature image, timestamp, IP, user agent, template version. Design intent is ESIGN/UETA enforceability — same legal basis e-sign vendors rely on. Not a court holding. Certificate-grade signing is an upgrade path, not the current stack.",
);
add(
  "legal",
  P.founder,
  "Does editing a bio reset the NDA?",
  "No. Bio edit after draft does not reset NDA. Setting ndaSignedAt without a matching NdaSignature for the current template still denies confidential reads. FACT as access rules.",
);
add(
  "legal",
  P.regulator,
  "What is still open legally before launch?",
  "Lease characterization (true lease vs disguised financing) in the US and Colombia; usury / consumer-credit / CLA/TILA; Superintendencia / captación; sucursal tax and cross-border flows; origination payer; whether paid US lease + free comodato is respected as two contracts. 18 Aug debrief: usury and true-lease opinions are blocking.",
);
add(
  "legal",
  P.regulator,
  "What is the ToS liability cap?",
  "Greater of US$250 or 12 months of fees; platform 'AS IS.' FACT as template text. Consent records (SMS opt-in/out, marketing prefs, acknowledgments) must be stored — a schema requirement.",
);
add(
  "legal",
  P.prospect,
  "Will you pull my credit when I create an account?",
  "No. Stage 1 explicitly does not authorize any credit pull. Soft inquiry first, hard pull only after you confirm a financing request. FACT as the two-stage design.",
);
add(
  "legal",
  P.regulator,
  "What Colombian tax headline should we use?",
  "CONTEXT 2025–26: CIT 35% (PwC/Deloitte). Financial institutions may owe +5% surcharge through 2027. Branch remittances can add 20% after CIT. Meetings' '19% pre-Petro' is history. Client Colombian tax / US write-off: counsel.",
);
add(
  "legal",
  P.founder,
  "What five framing questions does Rosario's deck skeleton ask?",
  "A1: (1) Friction — what problem, for whom, why now; (2) Infrastructure & data; (3) Economics & adoption; (4) Risk, trust & regulation; (5) The next move — the ask and what would make you pivot. Plus a standard 15-slide fintech spine.",
);

const legalDocs = [
  ["D4 Aug 7 business overview", "Founding thesis. Tier 1 behavioral claim: prime defaults 2–5× less. Rate-arbitrage framing. Eight revenue lines. Channel partnerships over paid digital."],
  ["A1 slide skeleton", "Rosario's 15 slides + 5 framing questions. Matches the debrief playbook."],
  ["A2 credit authorization", "FCRA-style. Stage 2 only. Soft first, express hard-inquiry consent."],
  ["A3 privacy policy", "US state + Colombian habeas data. §12 SIC rights and cross-border safeguards."],
  ["A4 registration and marketing consent", "Stage 1. SMS/marketing prefs must be stored."],
  ["A5 terms of service", "Names Tamarindo Credit LLC; broad role list; Financing Partner; liability cap."],
  ["18 Aug investor debrief", "Evidence rules, source register, warning against unsourced TAM and mixed 2-and-20 language."],
  ["12-month tech cost model", "People, AWS placeholders, SOC 2 $35k month 9, pen test $15k month 8. Input to OpCo budget. Open items for the CFO."],
];
legalDocs.forEach(([doc, a], i) => {
  add("legal", rotate(i), `What is ${doc}?`, `${a} Source: knowledge/documents/tamarindo-docs-index.md.`);
  add("legal", rotate(i + 2), `What must Nico not invent from ${doc}?`, `${a} Templates are not signed opinions. Do not treat ToS role laundry-list as a license to call Tamarindo a bank.`);
});

const legalOpen = [
  ["US true-lease opinion", "Blocking. 20% residual helps the story, does not close the memo."],
  ["Colombia characterization", "Two contracts (US lease + comodato) vs one financing. Open."],
  ["usury / licensing", "State and federal consumer-credit overlay. Open."],
  ["Superintendencia captación", "Design stays out; confirmation missing."],
  ["sucursal PE / CIT", "35% headline CONTEXT; cross-border flows open."],
  ["client US tax deduction", "Meeting claim; CPA/counsel."],
  ["origination payer", "Unset."],
  ["related-party Ashoka", "Must be market, disclosed, terminable — diligence item, not a statute."],
  ["self-help eviction", "Not allowed. Recovery is a court/contractual restitution path."],
  ["NDA current template", "Confidential reads need nda-v1 signature, not a stale timestamp."],
];
legalOpen.forEach(([item, a], i) => {
  add("legal", rotate(i), `Is ${item} closed?`, `No, or only as internal design. ${a}`);
  add("legal", P.regulator, `What does a regulator ask first about ${item}?`, `${a} Answer with the design, then the open memo. Never 'we are approved.'`);
});

// ===========================================================================
// 11. Intervest relationship
// ===========================================================================
add(
  "intervest",
  P.investor,
  "How much did Intervest commit?",
  "FACT: $20M as a test, not a blank check. Kickoff: $10M Medellín + $10M Cartagena. Later precision: first $10M provisional, second $10M on agreed KPIs. Do not tell LPs it is one unconditional $20M cheque.",
);
add(
  "intervest",
  P.investor,
  "Is the second ten million guaranteed?",
  "No. Contingent on KPIs that are not in a signed term sheet in the corpus. Treat vehicle one as a $10M start with an option on another $10M. FACT as structure, open as documentation.",
);
add(
  "intervest",
  P.stakeholder,
  "Does Intervest have exclusivity?",
  "Meetings (Aug 19–20): no exclusivity, ROFR only. That is load-bearing for Year 2–4 clone vehicles. The cash-flow model still treats years 1–3 as Intervest-only (an exclusivity window in the KPI path). Say both: legal/commercial posture is ROFR; the model does not open partner 2 until month 36.",
);
add(
  "intervest",
  P.investor,
  "What yield does Intervest need?",
  "Meetings price vehicle capital ~9–12%. Stated appetite band 8.5–11.5%. Current ICP-1 vehicle IRR 9.08% after 20% strip and 75 bps servicing. That is the vehicle's cost of funds, not the 11.84% client rate and not Tamarindo's take.",
);
add(
  "intervest",
  P.investor,
  "How big is Intervest, and can we put $25B on a slide?",
  "CONTEXT, retrieved 23 Aug 2026: site markets 26+ years, 160+ vehicles, $25B+ funds/accounts, 100% employee-owned, Mike Gontar CEO; specialty-finance page also cites 23 platform investments and $21.3B+ annual originations. Commercial Observer to 1 Mar 2025: ~$10.4B AUM and $2.5B originated. Those yardsticks do not match. Do not stack them. Meetings said '~$25B fund' — treat as marketing until a current fact sheet.",
);
add(
  "intervest",
  P.founder,
  "Who is Mike Gontar in this story?",
  "CEO of Intervest, counterpart on vehicle one. Advice Aug 20: limit the test, keep the box tight. Sets rate policy and asked us to 'be reasonable.' Week-after-Labor-Day 2026 target (~8 Sep) for the working session. Not on the Tamarindo US cap table.",
);
add(
  "intervest",
  P.stakeholder,
  "Is the watch business the same deal?",
  "No. Mechanical Art Capital / watches is a separate Intervest relationship. Tamarindo-Intervest LLC is vehicle one for homes. Different sentences.",
);
add(
  "intervest",
  P.investor,
  "What did conversations sketch beyond the $20M test?",
  "A $50–100M scale raise. A $75M Intervest line at year 10 sits in that band (KPI path). FACT as conversation, not a signed accordion.",
);
add(
  "intervest",
  P.founder,
  "What ROFR design should we grant later partners?",
  "OPINION, thesis 09: narrow ROFR, not blanket exclusivity. Limit to an agreed credit box, corridor, and short match window. Release unallocated production automatically. Step down exclusivity if the partner misses deployment, approval-time, or renewal targets.",
);
add(
  "intervest",
  P.investor,
  "What vehicle yields do later partners get in the model?",
  "ASSUMPTION: partner 2 (years 4–5) 8.5–11.5%; partner 3 (years 6–7) 8.0–11.0%; partner 4 (years 8–10) 7.5–10.5%. Tighten only 25–75 bps per proven cohort. Keep activation, servicing, and strip flat in the base case.",
);
add(
  "intervest",
  P.regulator,
  "Is Intervest depositing public money in Colombia through Tamarindo?",
  "No by design. A US vehicle buys the house through a sucursal; the client pays a US-law lease. Not captación. Unconfirmed with Superintendencia.",
);
add(
  "intervest",
  P.friend,
  "Who writes the big check?",
  "Intervest, a New York specialty-finance manager run by Mike Gontar, is testing about $20M into Colombian homes Tamarindo originates. Tamarindo itself is raising a few million ($2M then $2.25M then $2.25M) to run the company. Two different wallets.",
);

const intervestMore = [
  ["Wafra heritage", "In press (formerly Wafra Capital Partners). Do not write religious or ethnic identity into investor copy. Write risk appetite: leased hard assets, specialty-finance platforms, AI-visible servicing."],
  ["Kapitus acquisition", "CONTEXT 2026: Intervest affiliate acquired Kapitus (SMB specialty finance). They buy platforms."],
  ["Twain bridge-lending JV", "CONTEXT 2026: Twain Capital Partners JV. Same 'scale a platform' pattern."],
  ["employee-owned", "Public marketing: 100% employee-owned. CONTEXT, not a Tamarindo diligence item we audited."],
  ["160+ vehicles", "Marketing line. Tamarindo-Intervest is vehicle #1 of N for us, not their 161st certified count."],
  ["2 and 20 versus our 2% and 20%", "Theirs is fund vs LPs. Ours is activation + coupon strip. Never one phrase."],
  ["Medellín / Cartagena 10 and 10", "Kickoff split so the test is not a one-neighborhood anecdote. Medellín = liquidity backbone; Cartagena = yield/rental proof, capped."],
  ["no signed SPA", "Capital price, KPIs, ROFR — working facts from meetings, not a closed SPA in the corpus."],
  ["rate policy owner", "Intervest sets rate policy. Ricardo's posture: close to hard money (10–16%) but not quite, packaged as a lease."],
  ["MAC / watches", "Separate LP-conflict thread. Do not put it in the home-vehicle waterfall."],
];
intervestMore.forEach(([topic, a], i) => {
  add("intervest", rotate(i), `What should we say about Intervest and ${topic}?`, a);
  add("intervest", rotate(i + 2), `Is ${topic} a Tamarindo FACT?`, `${a} If it is a public Intervest page or press clip, it is CONTEXT — not our audit.`);
});

const partnerYields = [
  ["partner 2", "8.5–11.5%", "years 4–5 / month 36"],
  ["partner 3", "8.0–11.0%", "years 6–7 / month 60"],
  ["partner 4", "7.5–10.5%", "years 8–10 / month 84"],
];
partnerYields.forEach(([who, band, when]) => {
  add("intervest", P.investor, `What yield band does ${who} get?`, `${band} ASSUMPTION (thesis 09). Timing ${when}. Do not cut Tamarindo's 20% strip to win the meeting.`);
});

// ===========================================================================
// 12. Ops / Ashoka / departments
// ===========================================================================
add(
  "ops",
  P.stakeholder,
  "Who is actually on the team?",
  "Intent: ~3 US + ~2 Colombia (Aug 19), now modeled as named desks. Named: Dov Tuzman MD, Rosario Davi Finance/CFO-COO, Ricardo Cidale Ops, Tom Herman CTO (meetings: 5–10 hrs/week near-term), Natalia Carvajal marketing, Boris Mulett Colombia ops, Andrés Sierra commercial, Ivan Arias government/sales, Mike Gontar Intervest counterpart. Five equal partners at t=0, names TBD on the remaining seat.",
);
add(
  "ops",
  P.founder,
  "What US departments does the model carry?",
  "Leadership (Dov, Rosario, Ricardo, Tom), Credit, Customer Success, Customer Service, Legal/paperwork + contractors, IT (ex-CTO), Finance (ex-Rosario), Accounting, Sales/origination, Marketing + paid acquisition, Auto desk (after month 6), Aircraft desk (after month 84), office seats, WFH stipends. Toggle useDepartmentOpex=1 replaces the old $130k US lump.",
);
add(
  "ops",
  P.founder,
  "What Colombia desks does the model carry?",
  "GM (salario integral loaded ~$18,150/mo ASSUMPTION on $15k), closings, field inspections + contractor overflow, CS/WhatsApp (~$1,750 all-in ASSUMPTION), legal logistics, office seats. For-profit sucursal, not a wash.",
);
add(
  "ops",
  P.investor,
  "What is Ashoka's fee and why the related-party fuss?",
  "ASSUMPTION 20% of gross STR (market guides 15–25% in Medellín/Cartagena). Long-term PM 8–10% if used. Repairs charge-through + ~15% markup. Vehicle LPs will scrutinize sister-company contracts. Price at documented market, disclose, make terminable for non-performance. Done sloppily it is a diligence red flag.",
);
add(
  "ops",
  P.stakeholder,
  "How do we staff customer success as the book grows?",
  "Base FTE plus a homes-per-rep adder (default 40 active homes per CS/service rep). WhatsApp + voice reserve $100/rep/month (thesis 09 §5). Colombia bilingual agents $1,500–$1,750 loaded ASSUMPTION. Do not assume five people can run 1,500 homes.",
);
add(
  "ops",
  P.founder,
  "What does the tech cost model put on Rosario's desk?",
  "12-month xlsx: CTO, VP Eng, Head of DevOps (50% of $10k), PM, outsourced QA $50/hr × 40 hrs. No IC engineers — open item: AI agents vs hiring ramp. SOC 2 $35k month 9, pen test $15k month 8. AWS placeholders. Benefits load 0% (assumed in G&A). Excludes WordPress/HubSpot/Vercel/office build-out by instruction.",
);
add(
  "ops",
  P.friend,
  "When is the weekly working call?",
  "4pm Eastern / 3pm Colombia. Mike target week after Labor Day 2026 (~8 Sep) as of the Aug notes.",
);
add(
  "ops",
  P.investor,
  "What is US loaded leadership cost?",
  "ASSUMPTION thesis 09 §3: MD $26,973/mo, Finance $16,805, Corp Ops $26,973, CTO $16,805 → $87,555/mo or ~$1.05M/yr for the four, including employer FICA/Medicare and $7,885 single health. Family-health sensitivity +$1,022/role. First 8 months those four run at 50%.",
);
add(
  "ops",
  P.founder,
  "WFH versus office?",
  "ASSUMPTION: US WFH stipend $200/person/month; flex office $350/person/month. Model default 60% US WFH, 30% Colombia WFH (field roles on-site). CONTEXT: 2025–26 US flex-desk medians ~$220, Manhattan ~$339.",
);
add(
  "ops",
  P.stakeholder,
  "What is the rental-pool opt-in assumption?",
  "Model `rentalPoolOptInPct` default 55% of units pooled — different from time-rented 30%. A pooled home still sits empty 70% of the year because owners use it. Do not multiply 55% by 85% occupancy; that world is retired.",
);

const depts = [
  ["US Credit", "1 FTE to start, ~$8,500 loaded/mo ASSUMPTION. Underwriter / analyst. Gate is 750+ / SSN / ICP box."],
  ["US Customer Success", "2 base FTE, ~$7,200 loaded, grows at 40 homes/rep. Phones, email, WhatsApp — founder channel."],
  ["US Customer Service", "1 base FTE, ~$6,400 loaded. Collections and inbound."],
  ["US Legal", "1 FTE ~$12,000 + $4,000 contractors. AI-first still needs paper."],
  ["US IT ex-CTO", "2 FTE ~$12,000 — VP Eng / PM style seats from the tech Excel."],
  ["US Finance extra", "1 FTE ~$8,000 on top of Rosario. Controller / AP."],
  ["US Accounting", "1 FTE ~$5,500. Bookkeeper / close — was missing from the lump."],
  ["US Sales", "1 base closer ~$8,000, grows at 8 new homes/rep/month."],
  ["US Marketing", "1 FTE ~$7,200 plus $4,000 paid acquisition. Natalia's lane in the named list."],
  ["Colombia GM", "~$18,150 loaded salario integral on $15k. Stays full pay."],
  ["Colombia closings", "1 FTE ~$2,400. Title / comodato desk."],
  ["Colombia field", "1 FTE ~$2,200; overflow inspections $180 contractor; 12 inspects/FTE/month capacity."],
  ["Colombia CS", "2 base FTE ~$1,750 all-in bilingual WhatsApp-first."],
  ["Colombia legal logistics", "1 FTE ~$3,200. Filings, local counsel."],
];
depts.forEach(([name, a], i) => {
  add("ops", rotate(i), `What is the ${name} desk?`, `${a} ASSUMPTION pay until payroll quotes exist.`);
  add("ops", rotate(i + 3), `Can we cut the ${name} desk in year one?`, `${a} Cutting below the lean box is how FY1 close goes negative or SLAs break. OPINION.`);
});

const ashokaOps = [
  ["STR fee band", "CONTEXT 15–25% of gross in Medellín/Cartagena guides; we model 20%."],
  ["operating costs", "25% of gross in the waterfall (HOA, predial, utilities, cleaning, wear). Outside the PM fee."],
  ["one-month minimum", "No nightly stays. Monthly-minimum pricing at 0.55% of value."],
  ["time rented versus pool opt-in", "30% time rented per home; 55% of homes in the pool. Different knobs."],
  ["furnishing float", "Part of why $20M deploys only ~$15M into funded homes."],
  ["external properties later", "Phase 3 OPINION: Ashoka may densify cities with non-Tamarindo units."],
  ["terminability", "Contract must be terminable for non-performance or LPs will call conflict."],
  ["repair markup", "~15% on charge-through. Must be market, not a hidden dividend."],
];
ashokaOps.forEach(([q, a], i) => add("ops", rotate(i), `Ashoka ops: ${q}?`, a));

const comms = [
  ["WhatsApp utility/auth Colombia", "CONTEXT Meta Jul 2026 card ~$0.0008 per delivered. Verify at each budget refresh."],
  ["WhatsApp marketing Colombia", "CONTEXT ~$0.0125 per delivered. Campaigns can dominate cost."],
  ["Twilio Colombia voice", "CONTEXT outbound mobile $0.0377/min, local out $0.0700, inbound $0.0945 + $14/mo, recording $0.0025/min."],
  ["CS channel reserve", "ASSUMPTION $100/agent/month for telephony + WhatsApp at launch."],
];
comms.forEach(([q, a], i) => add("ops", rotate(i), `What do we budget for ${q}?`, a));

// ===========================================================================
// 13. Autos / aircraft
// ===========================================================================
add(
  "laterProducts",
  P.founder,
  "Were autos rejected?",
  "No. Deliberately deferred, not rejected (thesis 01/03). The cash-flow book starts auto leases after month 6 (after tranche 2) so fee income arrives faster, and targets a $30M FY10 auto book. Still a later product versus the home rails we must prove first.",
);
add(
  "laterProducts",
  P.investor,
  "What is the auto product in the model?",
  "ASSUMPTION/OPINION: ticket ~$55k (mix of new SUVs / light trucks so a $30M book is reachable), 60-month term (top of 36–60), client rate 14.5% USD, start month 6, ~3× vehicle contracts versus homes, cap 25/month. Local bank CONTEXT is 17–28.8% E.A. Anchor sales against Colombian banks, never a US Porsche lease at ~7%.",
);
add(
  "laterProducts",
  P.investor,
  "What is the aircraft product in the model?",
  "ASSUMPTION: start month 84 (FY8), ~12 originations/year, ticket ~$1.2M light piston / VLJ, 84-month term, 9.5% client rate, $20M FY10 book. Thesis 09: aircraft leasing is rare for Tamarindo's proposed retail customer — require a separate aviation vehicle, diligence, insurance, registry, maintenance-reserve, and residual model before launch. Enter no aircraft volume in a home-only pitch.",
);
add(
  "laterProducts",
  P.prospect,
  "Can I finance a car or a plane with Tamarindo today?",
  "Homes first. Autos are in the engine from month 6 as a what-if book, not a live offer. Aircraft is FY8. ToS language already mentions automotive because the marketplace paper was written wide — that is not a product launch.",
);
add(
  "laterProducts",
  P.regulator,
  "Why is 14.5% on a car not abusive if Ferraris lease at 3%?",
  "US exotic leases are cheap because of US title, weekend repossession, 50–60% residuals, and a deep auction market (CONTEXT 2.6–8.4% APR). Colombia recovery risk and 17–28% local bank EA justify 14.5% USD. A client who leased a Porsche at ~7% will feel the gap — say so and re-anchor.",
);
add(
  "laterProducts",
  P.founder,
  "What Colombian car tickets did research show?",
  "CONTEXT 2025–26: mainstream new COP 60–100M (~$19.7–32.8k at TRM 3,048 on 23 Aug 2026), used COP 40–50M (~$13.1–16.4k). The model's $55k average is a richer SUV/light-truck mix so the $30M book is reachable — label ASSUMPTION, not the street median.",
);
add(
  "laterProducts",
  P.investor,
  "How do autos and aircraft share the year-10 $150M?",
  "Homes $100M, autos $30M, aircraft $20M. Intervest funds half the combined book. Originations capped so each product follows its weight path. Aircraft is zero until FY8.",
);
add(
  "laterProducts",
  P.stakeholder,
  "What extra desks turn on with later products?",
  "Auto desk after month 6 (costed like a credit FTE). Aircraft desk after month 84 (~$12k/mo in the department engine). Do not run those costs in a home-only Phase 1 narrative.",
);

const laterAngles = [
  ["auto term 36–60 months", "Thesis 09 band; model uses 60 to hold a $30M book."],
  ["auto residual / recovery", "Must be separate lines: FX, insurance, registration, recovery, residual. Not a home comodato copy-paste."],
  ["auto multiple versus homes", "User asked ~3× vehicle contracts vs homes (`autoMultipleX10` = 30)."],
  ["auto growth extra", "10% faster than the home curve in the model."],
  ["aircraft diligence list", "Separate vehicle, insurance, registry, maintenance reserve, residual-value model. No retail volume until that exists."],
  ["ToS already mentions autos", "Marketplace paper is wide. Product is deferred. Do not sell the ToS."],
  ["boats / equipment / franchise assets", "Aug 7 scalability list. Not in the 10-year book. OPINION later."],
  ["Mexico / Panama / Spain corridors", "Aug 7 geography list. Mexico is the only named Phase-3 ASSUMPTION. Do not stack a 12-country TAM."],
  ["commercial RE on the same rails", "Possible later. Current ICPs are residential. Permission-slip rule still applies."],
  ["why aircraft is 9.5%", "Consistent with prime aviation finance (thesis 12 OPINION), not with 14.5% autos."],
];
laterAngles.forEach(([q, a], i) => {
  add("laterProducts", rotate(i), `Later products: ${q}?`, a);
  add("laterProducts", rotate(i + 2), `What is the honest status of ${q}?`, `${a} Homes remain the thing we must prove at 11.84% / 20% balloon / 30% rented.`);
});

const laterCities = [
  "Mexico",
  "Panama",
  "Costa Rica",
  "Dominican Republic",
  "Brazil",
  "Peru",
  "Chile",
  "Spain",
  "Portugal",
  "Italy",
  "Israel",
];
laterCities.forEach((c, i) => {
  add(
    "laterProducts",
    rotate(i),
    `Is ${c} a current Tamarindo market?`,
    `${c} appears on the Aug 7 scalability list. It is not a live ICP and not in the $20M pilot. Mexico is the only Phase-3 corridor named in thesis 03 (ASSUMPTION). Do not originate ${c} because a ToS or overview mentioned it.`,
  );
});

// ===========================================================================
// 14. Objections / what if we're wrong
// ===========================================================================
add(
  "objections",
  P.investor,
  "What if nobody pays 11.84%?",
  "Then the thesis fails on the conversion kill criterion. The pilot is sized (~45 homes, $20M) so that failure is affordable. Sensitivity still includes 9/11/13%. 9.5% does not clear Intervest's 8.5% floor without giving up the strip. Do not silently cut residual to 10% to lower PMT — that reopens true-lease.",
);
add(
  "objections",
  P.investor,
  "What if recovery is unenforceable?",
  "Kill criterion. The sucursal-already-has-title story is the design, not a court win. Phase 1 must fire-drill at least one full recovery path. If comodato + US lease is recharacterized as a mortgage, we are in Colombian foreclosure time, not a one-month commercial target.",
);
add(
  "objections",
  P.prospect,
  "This is more expensive than my US mortgage.",
  "Yes. Freddie is CONTEXT 6.17–6.65% on US homes. A US bank will not take your Poblado collateral. The local alternative is often 14%+ pesos or all-cash. Tamarindo is 11.84% dollars, 40% down, 20% balloon. If that sentence does not work for you, do not sign.",
);
add(
  "objections",
  P.investor,
  "What if rental occupancy is worse than 30%?",
  "Then the already-modest ~9% payment offset shrinks. ICP-3 is already ~4%. We retired 85% occupancy because owners use the homes. Sell the average. If time-rented is 10%, Tamarindo's rental share is not the business — the strip and servicing still have to carry the take rate.",
);
add(
  "objections",
  P.regulator,
  "What if Superintendencia calls this captación?",
  "We stop or restructure. Design is the opposite of taking public deposits, but that is unconfirmed. Do not operate as if the memo exists.",
);
add(
  "objections",
  P.founder,
  "What if Intervest walks after $10M?",
  "That is why there is no exclusivity and why the second ten is KPI-gated. Painful, not fatal if the rails and ICP data exist to clone a partner. Fatal if we spent the $10M on off-box homes and have no recovery playbook.",
);
add(
  "objections",
  P.investor,
  "What if 20% balloon kills conversion?",
  "Possible. A token balloon would convert easier and look like a loan. We chose characterization over a cheaper-looking PMT. If conversion dies on the $84k / $130k / $150k option, that is a board decision — not a silent 10% residual in the sales deck.",
);
add(
  "objections",
  P.stakeholder,
  "What if Ashoka is a conflict?",
  "Price at market, disclose, make terminable, benchmark annually. If we cannot, outsource PM and keep only the 20% net rental share. Related-party sloppiness is a diligence red flag, not a rounding error.",
);
add(
  "objections",
  P.investor,
  "What if we are just a thin servicer on one GP?",
  "Then the marketplace thesis is late or dead. Vehicle one must be a reusable template. ROFR not exclusivity is the option value. If we grant blanket exclusivity to get the second ten, we sell that option.",
);
add(
  "objections",
  P.friend,
  "What if the peso blows up?",
  "Client obligation is in dollars; local costs and resale are in pesos. FX is a residual risk, not a priced hedge. A peso crash can help a dollar buyer and hurt peso resale. Do not pretend we have a FX desk.",
);

const objectionList = [
  ["FICO 750 is too tight and we will not fill 45 homes", "Then the box was honest and the TAM was a wish. Do not open 700 FICO to hit a slide."],
  ["Cartagena tourism dies for two seasons", "That is why ICP-2 is capped at 40% and why we quote 30% time rented. Liquidity 150–270 days gets worse. Backbone is Poblado."],
  ["Llanogrande does not resell", "Cap 25%, underwrite income, 180–300 day ASSUMPTION. If data disappoints, retire the ICP."],
  ["five people cannot service 50 homes", "Kill/scale test. Add CS on the 40-homes-per-rep curve; do not hero-path it."],
  ["counsel says it is a loan", "Usury, licensing, true-lease memos were blocking for a reason. Pause originations."],
  ["a client sues over the balloon surprise", "We failed the sales rule: always quote $84k / $130k / $150k. Never hide the option."],
  ["we quoted occupied rent as the payment", "Fastest way to lose a client in year two. Lead with the 30% average."],
  ["Mexico launches a cleaner fideicomiso USD product", "That is the closest comparable already. Compete on Colombia rails or go to Mexico in Phase 3 — do not pretend we are cheaper than 8–10% Mexico."],
  ["US hard-money shops offer 10% on foreign assets", "CONTEXT 10–16%. We sit close and add a lease + comodato + PM stack. If they truly fund Colombia title, our hole shrinks."],
  ["Intervest wants 15% strip and 12% client", "Do not give both. 12% flat or 15% strip. Thesis 12."],
  ["founders take full pay from month 1", "FY1 close math assumed 50% for 8 months. Full pay without a larger round 1 risks a negative consolidated close."],
  ["we skip NDA because the deck leaked", "Confidential reads still need nda-v1. Leak ≠ waiver."],
  ["we hard-pull at signup", "Breaks two-stage consent and FCRA-style design. Soft first, intent first."],
  ["we call ourselves a bank in ToS marketing", "ToS role list is defensive paper, not a slogan. Guardrail: not a bank."],
  ["we stack 1.4M Colombians as TAM", "Debrief forbade deriving 800k from 1.4M. Hunt FL/NY/NJ with a sourced funnel."],
  ["we put $25B AUM next to $10.4B", "Different Intervest yardsticks. CONTEXT, not a slide."],
  ["autos first because cars are easier", "US cars are easier. Colombia cars are 17–28% banks and messy recovery. Homes are the rails we chose to prove."],
  ["aircraft in year 2 for prestige", "Model: FY8. No residual/registry/insurance stack yet. Prestige is not a vintage."],
  ["we need appreciation to make client ROI work", "Then we are speculators. Thesis 01 forbids it. Client upside is theirs; our fees cannot depend on it."],
  ["Colombia sucursal should be nonprofit to look clean", "Model override: for-profit, bills clients, may run negative. Forcing a wash hides the real cash."],
  ["nightly Airbnb will juice returns", "Forbidden. One-month minimum. Old ADR story retired."],
  ["60% LTV is too conservative versus 70% local", "On purpose. Dollar credit, foreign collateral, 20% residual. Cushion is the product."],
  ["we should amortize to zero to cut PMT", "Looks like a loan. Residual is the lease story."],
  ["OpCo should own a few show units", "Drift. Vehicles own title. Incidental recovery windows only."],
  ["second vehicle before one recovery drill", "Phase 2 gate fails. Do not clone a fantasy."],
];
objectionList.forEach(([q, a], i) => {
  add("objections", rotate(i), `Objection: ${q}.`, a);
  add("objections", rotate(i + 2), `What if we are wrong and ${q}?`, `${a} Current policy stays 11.84% effective, 20% balloon, 30% time rented until a board changes those knobs.`);
});

const stale = [
  ["client rate is 11% flat", "STALE. Live blended effective is 11.84% (11.5% base + 33.75 bps FICO blend). 11% flat IRR'd the vehicle at 8.35%."],
  ["residual is 10% of asset", "STALE. Floor is 20% of asset. ICP-1 balloon $84k not $42k."],
  ["residual is 15% of funded", "STALE workbook convention. 15% of $252k is $37.8k — below the 20% asset floor. Do not use it."],
  ["homes rent at 85% occupancy", "STALE. Default 30% of time rented. People enjoy their homes."],
  ["ICP-2 is $210 ADR at 62% occupancy", "STALE nightly framing. Monthly minimum at 0.55% of value, $3,575 occupied, 30% of the year."],
  ["rental offsets 30–55% of the payment", "STALE full-occupancy band. Live averaged offset is ~9% on ICP-1/2 and ~4% on ICP-3."],
  ["first deals are 5–20 homes / FICO 760", "STALE. Live box ~45 homes, 750+, 60% LTV."],
  ["LTV is 50–65%", "STALE. Aug 20 box is 60%."],
  ["seed is $2.5–3.5M only", "Superseded as the raise shape by three rounds $2M / $2.25M / $2.25M. 05 is still useful for take-rate logic."],
  ["Colombia is a nonprofit execution arm", "Superseded. For-profit sucursal in the shipped book."],
  ["US CFO breakeven in year 3", "Take-rate OPINION in 05. Cash-flow CFO turns positive FY6 in the default engine."],
  ["family take on ICP-2 is $190–210k", "STALE high-occupancy. Live illustrative $140–145k."],
];
stale.forEach(([q, a], i) => {
  add("objections", rotate(i), `Someone said ${q}. Is that current?`, a);
  add("objections", P.founder, `Why did we retire '${q}'?`, a);
});

const friendObjections = [
  "this sounds like a timeshare",
  "this sounds like a bank",
  "this sounds like a slumlord REIT",
  "this sounds like crypto yield",
  "this sounds like a construction Ponzi",
  "this sounds like you keep the house forever",
  "this sounds like I am just a renter",
  "this sounds too good versus 15% peso mortgages",
  "this sounds too expensive versus 6% US mortgages",
  "this sounds like Mike is doing you a favor",
];
friendObjections.forEach((s, i) => {
  add(
    "objections",
    P.friend,
    `A friend said ${s}.`,
    `It is a US-law lease-to-own on a Colombian home the vehicle already bought. You put 40% down, pay about 11.84% on the 60% they fund, rent it 30% of the time if you want, and pay 20% of the price at the end to take the deed. Tamarindo is a fee company, not a bank and not a REIT. If any of those words slipped, correct them.`,
  );
});

// Extra coverage so each bucket stays dense and retrieval has paraphrases.
const extraThesis = [
  ["credit translation layer", "US credit → Colombian hard-asset purchasing power via lease-to-own."],
  ["fee income per dollar of AUM", "How the OpCo should be valued. Not NAV of apartments."],
  ["legal-operational moat", "Sucursal + contracts + notary + recovery. Not the website."],
  ["lifestyle product", "Use the home; rent it 30% of the time; do not sell 85% occupancy."],
  ["asset-light rule", "Tamarindo US owns no properties, ever."],
  ["ICP permission slip", "Off-box deals are not done, even for volume."],
  ["pilot sized to fail affordably", "~45 homes, $20M test, KPI-gated second ten."],
  ["conversion is the open question", "Pain is evidenced; 10–12% WTP is not."],
];
extraThesis.forEach(([q, a], i) => {
  add("thesis", rotate(i), `Define '${q}' the Tamarindo way.`, a);
});

const extraLegal = [
  ["habeas data", "Colombian privacy principles already in Privacy Policy §12."],
  ["SIC complaint rights", "Template tells people they can complain to SIC. Cross-border ops assumption."],
  ["Financing Partner", "Defined term for vehicles. Independent evaluation of applications."],
  ["soft inquiry first", "Stage 2 credit auth. Hard pull needs express consent after intent."],
  ["consent record rows", "SMS, marketing, acknowledgments — schema requirement, not a nice-to-have."],
  ["nda-v1", "Current NDA template version. Stale signatures do not unlock the room."],
  ["admin NDA exception", "Admins own the corpus and do not sign their own NDA."],
  ["ESIGN/UETA intent", "Hash + typed name + drawn signature + timestamp/IP/UA."],
];
extraLegal.forEach(([q, a], i) => add("legal", rotate(i), `Legal detail: ${q}?`, a));

const extraOps = [
  ["Natalia", "Marketing. Named in thesis 06."],
  ["Boris Mulett", "Colombia ops. Still owed local opex in older notes; model now has desks."],
  ["Andrés Sierra", "Commercial."],
  ["Ivan Arias", "Government / sales."],
  ["Tom Herman", "CTO, 5–10 hours/week near-term in meetings; loaded $16,805 if at the 09 seat."],
  ["Rosario Davi", "CFO/COO / Finance loaded $16,805. Open Items for the CFO tab in the tech model."],
  ["Ricardo Cidale", "Ops / model owner. 23 Aug overrides: 20% balloon, 30% rented, for-profit Colombia, FICO blend."],
  ["Dov Tuzman", "MD. $30k/mo sketch was strip-only. Loaded $26,973 in 09."],
];
extraOps.forEach(([q, a], i) => add("ops", rotate(i), `Who is ${q}?`, a));

// Extra density for thinner buckets (need ≥1000 total).
const intervestGaps = [
  ["right of first refusal versus exclusivity", "ROFR lets Intervest match a new partner on an agreed box and window. Exclusivity would block clones. Meetings granted ROFR only. The model still waits until month 36 to open partner 2 — operational, not a signed lock-up in the corpus."],
  ["the first ten million being provisional", "FACT as later precision. Do not run a $20M originations plan as if both tens are wired."],
  ["KPIs for the second ten", "Not in a signed term sheet in the corpus. Treat as open. Closings, utilization, delinquency, and a recovery drill are the Phase 1 gates we would expect."],
  ["9–12% versus 8.5–11.5%", "Meetings said 9–12% capital price. Thesis 09/12 appetite band is 8.5–11.5%. Current ICP-1 IRR 9.08% sits inside both. Client 11.84% is a different layer."],
  ["why we will not cut the strip first", "Discounting below base costs Tamarindo. Excellent credit is the 810+ −25 bps tier. A 15% strip is a negotiation chip, not a default."],
  ["clone speed", "Target weeks not months to stand up Tamarindo-[Partner] LLC on the same rails. That is the marketplace thesis."],
  ["reporting pack as the product", "Vehicle-one docs, waterfall, and reporting should be the template partner 2 buys. OPINION, thesis 02."],
  ["half Medellín half Cartagena", "Kickoff split of the $20M test. Not a permanent 50/50 law. Cartagena still capped ≤40% of a vehicle."],
  ["Mike week after Labor Day", "Working target ~8 Sep 2026 as of the Aug notes. Weekly 4pm Eastern."],
  ["Intervest specialty-finance fit", "CONTEXT: they fund direct structured finance on leased/rented physical assets and private credit into specialty-finance platforms. Tamarindo is meant to look like the latter plus the former."],
  ["23 platform investments", "CONTEXT from Intervest specialty-finance page 23 Aug 2026. Not a Tamarindo count."],
  ["$21.3B+ originations", "CONTEXT annual-originations marketing line. Different from $10.4B AUM and $25B funds/accounts."],
  ["employee-owned GP", "CONTEXT. Does not put Mike on our cap table."],
  ["forward-flow norms", "CONTEXT (Weil 2025): funders want minimum volumes, allocation rights, sometimes ROFRs. Originators must preserve room for multiple funders — which is why we kept ROFR narrow."],
  ["warehouse SOFR plus", "CONTEXT equipment-finance 2025–26: starter warehouses SOFR+225–450, scaling SOFR+150–350, forward-flow servicing 75–200 bps, asset yields 8.5–13.5%. Supports 9–12%, does not prove our deal."],
];
intervestGaps.forEach(([q, a], i) => {
  add("intervest", rotate(i), `Intervest relationship: ${q}?`, a);
  add("intervest", rotate(i + 3), `What is load-bearing about ${q}?`, `${a} No exclusivity + ROFR only is what lets Year 2–4 multiply.`);
});

const waterGaps = [
  ["day 0 seller cash", "Seller receives the full purchase price. ICP-1 $420k. Client + vehicle together fund it ($168k + $252k)."],
  ["day 0 title", "Escritura into the vehicle sucursal, not the client and not Tamarindo US."],
  ["day 0 contracts", "US-law lease + comodato + purchase option. Two countries, two instruments, one economic deal."],
  ["activation firing", "2% of the draw when capital is drawn. ICP-1 $5,040."],
  ["month-1 interest split", "ICP-1 interest ≈ $2,486; Tamarindo 20% ≈ $497; vehicle the rest; plus 75 bps/12 servicing on $252k."],
  ["principal versus balloon", "Payments amortize the funded amount toward $84k, not toward zero."],
  ["rental credit mechanics", "Credit offsets the client's lease, it does not reduce the vehicle's coupon. Tamarindo still takes its 11% of occupied gross."],
  ["Colombia $120 admin", "For-profit sucursal line on the ICP-1 walk. Separate from the US lease PMT."],
  ["insurance at close", "$1,008 commission on ICP-1 (40 bps of $252k). Not the client's full premium."],
  ["US $1,000 mandate", "OpCo pays Colombia per close. Not a full opex wash."],
  ["year-10 option exercise", "Client pays $84k; title moves; vehicle recycles $84k-equivalent capital into the next home."],
  ["early buyout math", "Remaining principal + residual, no prepay penalty as described."],
  ["default cushion", "40% down is first loss. 60% LTV plus a 20% residual is how the vehicle survives a bad file."],
  ["re-lease after default", "Sucursal already has title. Re-lease or sell. Days-to-resell is the ICP liquidity test."],
  ["who does not get paid from the lease", "Equity holders of Tamarindo US do not take this apartment's rent. They take fees."],
  ["ICP-2 family take stack", "Activation $7.8k + origination $3.9k + insurance ~$1.6k + strip ~$67.7k + servicing ~$21.5k + rental share ~$14.2k + Ashoka mgmt ~$25.7k ≈ $140–145k. ASSUMPTION. 30% time rented."],
  ["do not mix the $750k shapes", "Thesis 02's illustrative $750k Cartagena ($9k activation, $5.8k/mo old math) is not ICP-3 Llanogrande $750k / $5,238 / 12y / $150k balloon."],
  ["client ROI table", "The single most important sales artifact still to build and validate (thesis 04). Appreciation 3–4%/yr USD is ASSUMPTION, not a promise."],
];
waterGaps.forEach(([q, a], i) => {
  add("waterfall", rotate(i), `Waterfall detail: ${q}?`, a);
  add("waterfall", rotate(i + 1), `On one deal, ${q}.`, `${a} Current ICP-1 policy numbers: 11.84%, $3,223, $84k balloon, $75.3k US, 9.08% vehicle, ~$664k client.`);
});

const equityGaps = [
  ["round 1 cannot be $1M", "Year-1 desks burned a $1M start. Floor is ~$1.65M FY1 burn."],
  ["post-money after three rounds", "$22.25M. Founders 65.2% together."],
  ["percent sold across three rounds", "16.7% + 13.0% + 10.1% are sequential, not additive on the same base. End state ~34.8% sold, ~65.2% founders."],
  ["names TBD", "Five seats, equal 20%, names not assigned. Do not invent a cap table."],
  ["Intervest not a shareholder", "Unless a later term sheet says so. Warehouse ≠ equity."],
  ["what round 1 buys", "Legal opinions, servicing v1, first closings, 24 months of lean desks through the pilot doorstep."],
  ["what rounds 2 and 3 buy", "Pilot completion, vehicle-two template, team toward 10–12, platform hardening."],
  ["409A versus model marks", "$10 / $15 / $20 pre are OPINION marks, not appraisals."],
  ["half-pay window versus desks", "Only the four named US roles half-pay 8 months. CS, sales, Colombia GM stay full."],
  ["equity versus 2 and 20", "Investors in Tamarindo US are not LPs in Intervest's fund."],
];
equityGaps.forEach(([q, a], i) => {
  add("equity", rotate(i), `Equity: ${q}?`, a);
  add("equity", P.investor, `Cap table question: ${q}.`, `${a} Rounds are $2M / $2.25M / $2.25M.`);
});

const rateGaps = [
  ["BanRep 9.25%", "CONTEXT intervention rate as of 17 Jul 2026. Not our coupon. Quote the date."],
  ["thesis 12 saying BanRep 12%", "That line in 12 conflicts with 06's 9.25% dated print. Use 06 with the date; treat 12's Colombia product rates (14%+ leasing) as the housing CONTEXT."],
  ["UVR mortgages", "CONTEXT ~6.5% + IPC. Cuota rises with inflation. Not a dollar lease."],
  ["foreign-national DSCR", "CONTEXT 7.75–9% on US property. Inverse of us: they finance US homes for foreigners; we finance Colombian homes for US people."],
  ["810+ is not a mass tier", "15% of book ASSUMPTION. 800+ is a thin tail of US scores. Pilot is cream."],
  ["750 is already very good", "CONTEXT. We are not mass-market."],
  ["hard-money posture", "Ricardo: close to 10–16% but not quite, packaged as a lease with a 20% option."],
  ["Mexico 8–10% plus Colombia premium", "OPINION 100–150 bps. Lands a 9.5–11.5% defensible band. We sit 35 bps above it on purpose."],
  ["client WTP tests 9 / 11 / 13", "Still required. 9.5% does not work for the vehicle at a strip we accept."],
  ["do not give 12% and 15% strip together", "Negotiation floor for Mike. One lever at a time."],
  ["auto 14.5% versus property 11.84%", "Different collateral, recovery, and local alternatives. Do not average them into one 'Tamarindo rate.'"],
  ["aircraft 9.5%", "Prime aviation ASSUMPTION. Not a home rate."],
];
rateGaps.forEach(([q, a], i) => {
  add("rates", rotate(i), `Rate detail: ${q}?`, a);
  add("rates", rotate(i + 2), `How do we talk about ${q} without making it ours?`, `${a} Our live property rate is 11.84% effective. External prints stay CONTEXT.`);
});

const laterGaps = [
  ["month 6 auto start", "After tranche 2, faster fee income. Not a Phase 0 offer."],
  ["$30M FY10 autos", "Ricardo goal 23 Aug. Capped originations, not an unbounded car lot."],
  ["$20M FY10 aircraft", "Last three fiscal years only."],
  ["$55k auto ticket", "Richer than street-median COP 60–100M new cars. Needed to reach $30M. ASSUMPTION."],
  ["60-month auto term", "Top of 36–60 so the book holds. Residual risk is real."],
  ["3× autos versus homes", "Contract count, not AUM. AUM target is still $30M versus $100M homes."],
  ["no nightly cars either", "Joke aside: auto recovery is registry and insurance, not comodato."],
  ["aviation vehicle", "Do not stuff aircraft into Tamarindo-Intervest home docs. Separate vehicle required."],
  ["maintenance reserve", "Aircraft must have one before launch. Homes do not use this line."],
  ["ToS automotive language", "Written wide for the marketplace. Not a launch announcement."],
];
laterGaps.forEach(([q, a], i) => {
  add("laterProducts", rotate(i), `Autos/aircraft: ${q}?`, a);
  add("laterProducts", rotate(i + 1), `Why is ${q} not Phase 1?`, `${a} Prove homes at 11.84% / 20% balloon / 30% rented first.`);
});

const entityGaps = [
  ["OpCo never holds title", "If it does, the model drifted."],
  ["vehicle never pays OpCo salaries", "Two pots. Activation is a fee, not a payroll transfer of the $20M."],
  ["sucursal is not Ashoka", "Title versus brooms. Keep separate."],
  ["Ashoka is not the vehicle", "Sister operator. Related-party."],
  ["client is not the owner until option", "Tenedor + lessee + option holder."],
  ["Tamarindo Credit LLC versus Tamarindo US", "Templates name Credit LLC. Thesis talks Tamarindo US OpCo. Same family; do not invent a third GP."],
  ["for-profit Colombia override", "Bills closing, diligence, monthly admin, US mandate. May be negative. Not nonprofit."],
  ["clone vehicle naming", "Tamarindo-[Partner] LLC. Economics page changes."],
  ["money flow on a rented month", "Guest → Ashoka → 20/25/20 waterfall → client credit against US lease."],
  ["money flow on an empty month", "Client pays full $3,223-class PMT. No credit. This is the 30% story."],
];
entityGaps.forEach(([q, a], i) => {
  add("entities", rotate(i), `Entity rule: ${q}?`, a);
  add("entities", rotate(i + 2), `What breaks if we ignore '${q}'?`, `${a} Keep US OpCo, vehicle, sucursal, Colombia, and Ashoka in different chairs.`);
});

const feeGaps = [
  ["237 bps", "20% × 11.84% ≈ 237 bps of outstanding to Tamarindo on the strip line."],
  ["3.5–3.7% recurring take", "237 + 75 + 40–60 bps. OPINION at current rate."],
  ["~3% one-time in deploy year", "2% activation + ~1% origination."],
  ["Dov $360k/yr", "Strip on ~$15M funded, not company revenue."],
  ["full stack ~3× Dov", "Servicing + service layer. OPINION."],
  ["45% of ICP-2 LTV from services", "Servicing, rental, Ashoka, insurance — why Ashoka is strategic. ASSUMPTION $140–145k family take."],
  ["payer TBD", "Origination. Do not invent."],
  ["75 bps is a placeholder", "US residential often 25–50+. Equipment forward-flow 75–200 CONTEXT."],
];
feeGaps.forEach(([q, a], i) => {
  add("fees", rotate(i), `Fee math: ${q}?`, a);
  add("fees", P.investor, `Underwrite '${q}'.`, `${a} Do not call any of this 2 and 20.`);
});

const tenYearGaps = [
  ["$150M versus $1B", "Current cash-flow goal is $150M funded. Thesis 03 Phase 4 cartoon is $0.7–1B. Different tables."],
  ["Intervest 50% at year 10", "$75M of $150M. Conversations sketched $50–100M scale."],
  ["other vehicles $75M", "Three simulated $25M lines, months 36/60/84, ramp 40/70/100."],
  ["FY6 line $55M", "Partner 3; auto book material; first positive US CFO year in the default book."],
  ["home AUM weight year 6", "70% of the $100M goal — not 70% occupancy."],
  ["do not compound 20% every six months", "KPI path replaced that mechanical step-up. useKpiCapitalCurve=1."],
  ["Phase 1 rental proof", "Demonstrate offset with real statements, not a pitch. 30% time rented, ~9% of PMT averaged."],
  ["Phase 2 third city", "Bogotá or coffee axis ASSUMPTION, only after ICP data."],
  ["structured finance later", "Warehouse, forward-flow, rated securitization — deliberately, not opportunistically."],
  ["engine ~485 homes originated", "Default run. ~467 active at FY10. ASSUMPTION."],
];
tenYearGaps.forEach(([q, a], i) => {
  add("tenYear", rotate(i), `Ten-year: ${q}?`, a);
  add("tenYear", P.investor, `Path question: ${q}.`, `${a} US CFO turns positive FY6 in the shipped book.`);
});

const legalGaps = [
  ["stage 1 never pulls credit", "ToS + privacy + marketing consent only."],
  ["stage 2 is a separate document", "Consumer Credit Report Authorization. Soft then hard."],
  ["data-room after NDA", "Investor door, not the client door."],
  ["current template version", "nda-v1. Old signatures do not count."],
  ["R2 signed PDF", "Stored with hash. Copy emailed via Resend in the design."],
  ["Turnstile on signup", "Invite flow is bot-gated. Not a credit decision."],
  ["agent cannot sign NDA", "Humans only. Nico never decides approvals or signs."],
  ["public tier pre-NDA", "Unsigned investors see public knowledge only."],
];
legalGaps.forEach(([q, a], i) => {
  add("legal", rotate(i), `Consent/NDA: ${q}?`, a);
  add("legal", P.regulator, `Why does ${q} matter?`, `${a} Two-stage client consent and investor NDA are different machines.`);
});

const opsGaps = [
  ["40 homes per CS rep", "Adder on top of base FTE. How 5 people fail at 200 homes."],
  ["8 homes per sales FTE per month", "Closer capacity. Not CS."],
  ["$4,000 paid acquisition", "Ads and partner referrals, not Natalia's salary."],
  ["SOC 2 month 9 $35k", "Tech model lump. Open item for Rosario."],
  ["pen test month 8 $15k", "Same workbook."],
  ["0% benefits load in the tech xlsx", "Assumed in G&A. 09 already loads FICA/health on named seats — do not double-count blindly."],
  ["salario integral versus ordinary", "Integral $15k loaded ~$18.2k; ordinary at same headline is heavier after prima/cesantías. Thesis 09 §4."],
  ["COP 22.8M integral minimum 2026", "CONTEXT. Our GM seat is well above it."],
];
opsGaps.forEach(([q, a], i) => {
  add("ops", rotate(i), `Ops: ${q}?`, a);
  add("ops", rotate(i + 2), `Budget note on ${q}.`, a);
});

const leaseGaps = [
  ["20% of asset = 33% of funded", "At 60% LTV. Both ways of saying the floor."],
  ["no $1 option", "Would fail bargain-option and UCC 1-203 in the same breath."],
  ["real estate is not equipment", "Rev. Proc. 2001-28 is a guideline we sit level with, not a blessing."],
  ["ASC 842 is another test", "20% balloon ≠ operating lease."],
  ["PMT Excel sign convention", "=PMT(i/12,n,-PV,FV) so the payment comes out positive."],
  ["outstanding at term equals FV", "Check: after 120 months ICP-1 outstanding should be $84k."],
  ["interest in month k", "r × prior outstanding. Strip is 20% of that."],
  ["net to client is 44% of gross", "After 20% PM and 25% opex, 80% of the remainder. Occupied months only."],
];
leaseGaps.forEach(([q, a], i) => {
  add("lease", rotate(i), `Lease/balloon: ${q}?`, a);
  add("lease", P.regulator, `True-lease point: ${q}.`, `${a} Counsel still writes the memo.`);
});

// ---------------------------------------------------------------------------
// Write markdown + patch README last (generate-qa-corpus.mjs overwrites it).
// ---------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });

const parts = ["# Tamarindo thousand", "", "Generated business Q&A for Nico. Current policy: 11.84% effective client rate, 20% residual balloon, 30% of time rented. Grades: FACT / CONTEXT / OPINION / ASSUMPTION.", ""];
for (const row of qa) {
  parts.push(`### [${row.persona}] ${row.q}`);
  parts.push(row.a);
  parts.push("");
}
writeFileSync(FILE, parts.join("\n"));

const counts = new Map();
for (const row of qa) counts.set(row.bucket, (counts.get(row.bucket) ?? 0) + 1);

const thousandLine = `- tamarindo-thousand.md: ${qa.length} Tamarindo-business Qs from \`scripts/generate-tamarindo-thousand.mjs\` (current policy 11.84% / 20% balloon / 30% rented)`;
let readme = readFileSync(README, "utf8");
if (!readme.includes("tamarindo-thousand.md")) {
  if (!readme.endsWith("\n")) readme += "\n";
  readme += `\n${thousandLine}\n`;
  writeFileSync(README, readme);
} else {
  writeFileSync(
    README,
    readme.replace(/^- tamarindo-thousand\.md:.*$/m, thousandLine),
  );
}

console.log(`Wrote ${qa.length} Q&As to knowledge/qa/tamarindo-thousand.md`);
for (const [bucket, n] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${bucket}: ${n}`);
}
