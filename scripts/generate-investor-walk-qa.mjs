#!/usr/bin/env node
/**
 * Investor-walk Q&As for Nico: ICP catalog origin, the 10-year horizon,
 * and the autos / aircraft verticals.
 * Grounded in knowledge/thesis 01 / 06 / 09 / 13 / 19, lib/model/icp-catalog.ts,
 * and docs/nico/12-blue-variables.md (as of 26 Aug 2026).
 * Run: node scripts/generate-investor-walk-qa.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "knowledge/qa");
const FILE = path.join(OUT, "investor-walk.md");
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
// ICP origin — what the catalog is, where it came from, gating, what-ifs
// ---------------------------------------------------------------------------

add(
  "icp-origin",
  P.investor,
  "What exactly is an ICP?",
  "FACT, catalog: an Ideal Contract Profile is a curated seed contract — asset, city, persona, purchase price, term, client rate, rent factor, and mix weight — that the model uses as a representative deal. Ten live in lib/model/icp-catalog.ts: six property, two auto, two aircraft, each with a research note, public sources, and its own citation grade.",
);

add(
  "icp-origin",
  P.founder,
  "Where did the ICP catalog come from?",
  "CONTEXT, thesis 01/06 and the catalog: the profiles were distilled from team meetings and the thesis deal sheets (ICP-1 through 3 trace to thesis 04), then curated by admins with public price checks — TheLatinvestor $/m² bands for Medellín and Cartagena, dealer list prices for the autos, market reports for the aircraft. It is a curated book, not a scraped listing feed.",
);

add(
  "icp-origin",
  P.stakeholder,
  "Why are ICP prices admin-gated instead of member levers?",
  "FACT, docs/nico 12: Ideal Contract Profiles are admin-only. They live under Admin → ICPs behind the admin-catalog contract, not as blue member inputs, because the catalog defines what the company sells. Changing it changes the shared story, so it goes through admin curation and Publish, not a personal what-if.",
);

add(
  "icp-origin",
  P.prospect,
  "If I cannot touch ICP prices, how do I run my own what-ifs?",
  "FACT, docs/nico 12: through the ~14 blue levers — down payment / LTV, the purchase-option floor, activation, origination, servicing, US share of interest, warehouse tranches and second-tranche month, rental pricing share, post-pilot growth, and the auto and aircraft start months. The engine recalculates on the server from your personal case.",
);

add(
  "icp-origin",
  P.friend,
  "What is a blue variable in plain English?",
  "FACT, docs/nico 12: it is the Excel convention — blue is what the analyst types, black is a formula. A blue variable is a user-facing input with a seed default; members may change every blue key, admins may change every key including grey operating detail.",
);

add(
  "icp-origin",
  P.regulator,
  "Which model inputs are deliberately kept away from members?",
  "FACT, docs/nico 12: payroll and department seats, equity rounds and pre-money, year-10 targets, FICO internals, opex lumps, Ashoka detail, the ramp, and the horizon are all grey — admin-only. Ask and pre-money come from published Deal Terms, never from a member edit.",
);

add(
  "icp-origin",
  P.investor,
  "How do ICPs end up in a deck or an investor report?",
  "FACT, docs/nico 12: all math runs server-side through the cash-flow engine. Nico builds statements, income, returns, and sensitivity live from the current blue set and exports HTML, PDF, CSV, or the full 10-year XLSX. Numbers are never frozen in a template, so a deck line always traces to the live catalog plus levers.",
);

add(
  "icp-origin",
  P.prospect,
  "Walk me through ICP-1 in numbers.",
  "FACT, thesis 13: ICP-1 Poblado Executive is a $420k El Poblado apartment. Client wires $168k down (40%), the vehicle funds $252k (60% LTV), the lease is $3,223/month for 120 months at an 11.84% effective rate, and the purchase option at month 120 is $84,000 — 20% of the asset.",
);

add(
  "icp-origin",
  P.founder,
  "Name the six property ICPs.",
  "FACT, catalog: ICP-1 Poblado Executive ($420k, 10y), ICP-2 Cartagena Heritage ($650k, 10y), ICP-3 Llanogrande Country ($750k, 12y), ICP-4 Bocagrande Tower ($480k, 7y), ICP-5 Envigado Family ($310k, 8y), ICP-6 Castillo Grande Coastal ($580k, 9y). Each carries its own persona, rent factor, and mix weight.",
);

add(
  "icp-origin",
  P.investor,
  "What is ICP-2 and who is it for?",
  "FACT, catalog: ICP-2 Cartagena Heritage — a renovated 1–2BR in the Old City, Bocagrande, or Castillo Grande, seed $650k, 120 months at an 11.5% base rate. Persona: a US investor-lifestyle buyer, 45–65, rental-first — uses it a few weeks a year and wants the furnished engine running the rest of the time, one-month minimum, never nightly.",
);

add(
  "icp-origin",
  P.stakeholder,
  "Why does ICP-3 look different from the other homes?",
  "FACT, catalog: ICP-3 Llanogrande Country is a casa campestre off the JMC airport corridor — seed $750k, a longer 144-month term at 11%, and a rent factor of 0.4 because furnished country-house rental is structurally weaker than a Poblado apartment. Not every lease in the book is 10 years.",
);

add(
  "icp-origin",
  P.friend,
  "What is the cheapest way into the book?",
  "FACT, catalog: ICP-5 Envigado Family — a 3BR estrato 5–6 family apartment, seed $310k on an 8-year term at 12%. The catalog calls it the first-home ticket and, with ICP-1, the volume backbone.",
);

add(
  "icp-origin",
  P.investor,
  "Are the catalog prices facts or guesses?",
  "CONTEXT, catalog: each entry carries its own citation grade. Property seeds are graded as assumptions checked against 2026 public $/m² bands — ICP-1's $420k sits mid-band for El Poblado. The two auto seeds carry dealer list prices and are graded as facts. The grade travels with the entry, so Nico never has to guess.",
);

add(
  "icp-origin",
  P.prospect,
  "Who is the ICP-1 persona?",
  "FACT, catalog: a Colombian-American professional, 35–55, with a family base — someone who visits a few weeks a year and can eventually retire into the unit. The catalog calls El Poblado the deepest resale market of the six.",
);

add(
  "icp-origin",
  P.founder,
  "Does the $20M pilot mix trace back to the ICPs?",
  "OPINION, thesis 06: yes as a plan — roughly 20 ICP-1 homes (~$5.0M funded), 15 ICP-2 (~$5.9M), and 9 ICP-3 (~$4.1M), about 44 homes and ~$15M funded on ~$25M of assets, with the $20M including fees, reserves, and furnishing. The home counts are planning numbers, not commitments.",
);

add(
  "icp-origin",
  P.stakeholder,
  "What is the difference between my case and the company case?",
  "FACT, docs/nico 12: seeds live in code and the shared company case is the published artifact. The first time you save, you get a personal case; reports, chat, and export use it. Reset drops your row and you inherit the company case again. Admin Publish writes the shared case and is human-only.",
);

add(
  "icp-origin",
  P.friend,
  "Can I save a scenario without changing my live numbers?",
  "FACT, docs/nico 12: yes — named what-ifs are snapshots of the live case, not a second working set. Save as, Load, Compare. Sensitivity shocks do not save unless you explicitly say save this as something.",
);

add(
  "icp-origin",
  P.prospect,
  "Do I type 40 or 0.40 for the down payment?",
  "FACT, docs/nico 12: percents are typed as 40, not 0.40. The seed down payment is 40%, which implies 60% LTV.",
);

add(
  "icp-origin",
  P.regulator,
  "Can a member ask Nico to change an ICP purchase price?",
  "No. FACT, docs/nico 12: ICPs are admin-only and live under Admin → ICPs. A member can move the ~14 blue levers — down, balloon floor, fees, tranches, start months — and the engine reprices the same catalog. Editing the catalog itself needs the admin gate.",
);

add(
  "icp-origin",
  P.investor,
  "Is there a cap on what an ICP price can be set to?",
  "FACT, catalog: yes — the variable bound is $2M for property, $250k for autos, and $20M for aircraft. Even an admin edit lives inside those rails.",
);

add(
  "icp-origin",
  P.founder,
  "Are the mix weights commitments to buy in those proportions?",
  "ASSUMPTION, catalog: no — mix weights are model inputs for blending the book (for example 60% CX-30 / 40% Prado on autos, 80% Caravan / 20% Phenom on aircraft). They shape projections and must be replaced by actual origination data as deals close.",
);

add(
  "icp-origin",
  P.stakeholder,
  "Why keep the member lever kit so small?",
  "OPINION, docs/nico 12: the member kit is deliberately ~14 keys so a what-if session is a comfortable range, not the full book. The company's forward story — ramp, horizon, year-10 targets, payroll — stays grey so a casual session cannot quietly rewrite it.",
);

add(
  "icp-origin",
  P.friend,
  "Where do the ICP personas and explanations actually live?",
  "FACT, docs/nico 12: seeds and explanations are in lib/model/icp-catalog.ts, surfaced under Admin → ICPs. Each profile ships with a persona line, a plain-English explanation, a research note, and the public sources behind the seed price.",
);

add(
  "icp-origin",
  P.prospect,
  "How does the catalog handle pesos versus dollars?",
  "CONTEXT, catalog: COP prices in the research notes are converted at about 4,000 per USD — the mid-2026 street rate — and the seeds are stated in USD. Quote the conversion date; FX moves.",
);

add(
  "icp-origin",
  P.investor,
  "What fee lines does one ICP deal generate for Tamarindo?",
  "FACT, thesis 19: six lines exist — origination, activation, servicing, spread share, Ashoka PM, and rental share. Activation is 2% of drawdown and spread share is ~20% of interest billings; the live model seeds are 1% origination and 75 bps servicing until a signed schedule.",
);

add(
  "icp-origin",
  P.regulator,
  "Is Tamarindo's origination take a middleman commission?",
  "No. FACT, thesis 19: Tamarindo frames itself as an outsourced origination and servicing platform — acquisition, intake, package, verification, closing, post-close — not a referral. Its own origination take is platform revenue, and Nico never describes it with referral language.",
);

add(
  "icp-origin",
  P.founder,
  "What does the 30% rented default mean on an ICP sheet?",
  "FACT, thesis 13: each ICP has its own percentage of time rented, default 30%. On ICP-1 that produces roughly $2,310/month when occupied, ~$8.3k/year gross, netting to about $305/month averaged — around 9% of the lease payment.",
);

add(
  "icp-origin",
  P.investor,
  "Why is every property ICP at 40% down?",
  "FACT, thesis 06: 40% minimum down is the product box, implying 60% max LTV. Colombian non-VIS mortgages often cap near 70% LTV, so Tamarindo is deliberately stricter — that seed is the downPaymentPct blue lever members can stress.",
);

add(
  "icp-origin",
  P.stakeholder,
  "Who can publish a catalog or assumption change to everyone?",
  "FACT, docs/nico 12: only an admin, through Publish, which writes the shared company case — and that procedure is human-only. Member saves only ever touch their personal case.",
);

add(
  "icp-origin",
  P.friend,
  "Is ICP-4 just a smaller ICP-2?",
  "Not quite. FACT, catalog: ICP-4 Bocagrande Tower is a 7-year lifestyle lease on a $480k amenity tower at a 12.5% rate — shorter path to title, easier resale than a Centro renovation. ICP-2 is the rental-first Old City renovation at $650k over 10 years.",
);

add(
  "icp-origin",
  P.investor,
  "What is ICP-6 in the mix for?",
  "FACT, catalog: ICP-6 Castillo Grande Coastal — a 2–3BR bay-view apartment, seed $580k, 108 months at 11.5%, mixed own-use and rental. It covers the quieter luxury beach band of Cartagena; mix weight 10%, the smallest of the six.",
);

add(
  "icp-origin",
  P.prospect,
  "Does Nico show me a saved chart when I ask about an ICP?",
  "No. FACT, docs/nico 12: Nico does not paste a stale image. Chat and Model recalculate from the current blue set through the server engine, so what you see reflects your case at that moment.",
);

add(
  "icp-origin",
  P.regulator,
  "If a catalog research note cites a market source, is that a Tamarindo promise?",
  "CONTEXT, thesis 06 and the catalog: no — outside price bands (TheLatinvestor, dealer lists, jet market reports) are market context used to sanity-check seeds. Do not paste them into a deck as if the capital partner produced them.",
);

add(
  "icp-origin",
  P.founder,
  "Which blue levers does sensitivity shock by default?",
  "FACT, docs/nico 12: the same four the member kit centers on — down payment, balloon floor, spread, and activation — showing FY cash and ICP-1 IRR under each shock.",
);

const PROPERTY_ONE_LINERS = [
  ["ICP-1 Poblado Executive", "$420k El Poblado 2–3BR, 10-year lease, the volume-and-quality home with the deepest resale market."],
  ["ICP-2 Cartagena Heritage", "$650k renovated Old City / Bocagrande flat, 10 years, rental-first coastal ticket."],
  ["ICP-3 Llanogrande Country", "$750k casa campestre near JMC, 12 years, rent factor 0.4 — weak furnished-rent story."],
  ["ICP-4 Bocagrande Tower", "$480k amenity tower 2BR, 7-year lifestyle lease at a slightly higher rate."],
  ["ICP-5 Envigado Family", "$310k 3BR family apartment, 8 years — the first-home volume backbone with ICP-1."],
  ["ICP-6 Castillo Grande Coastal", "$580k bay-view 2–3BR, 9 years, mixed own-use and rental on the quieter beach band."],
];

PROPERTY_ONE_LINERS.forEach(([name, line], i) => {
  add(
    "icp-origin",
    rotate(i),
    `In one line, what is ${name}?`,
    `FACT, catalog: ${line}`,
  );
});

// ---------------------------------------------------------------------------
// 10-year horizon — why 10 years, ramp, fy10 targets, grading discipline
// ---------------------------------------------------------------------------

add(
  "horizon",
  P.investor,
  "Why is the flagship lease 10 years and not 30?",
  "CONTEXT, thesis 06: the ~10-year term is the product box — closer to a finance lease than a 30-year mortgage. Ten years amortizes the funded 60% down to a material 20%-of-asset balloon at a payment a prime client can carry, and the balloon must stay material so the contract reads as a lease, not a loan.",
);

add(
  "horizon",
  P.friend,
  "Is every lease exactly 10 years?",
  "No. FACT, catalog: terms range across the book — ICP-4 is 7 years, ICP-5 is 8, ICP-6 is 9, ICP-1 and ICP-2 are 10, ICP-3 is 12; autos run 36–48 months; the Caravan is 7 years and the Phenom is 10. Ten years is the anchor, not a rule.",
);

add(
  "horizon",
  P.investor,
  "What does the 10-year ramp look like?",
  "OPINION, thesis 06: four phases — Pilot (years 1–2, $20M AUM, ~45 homes, 1 vehicle), Multiply (years 2–4, $60–80M, 2–3 vehicles), Marketplace (years 4–7, $150–400M, 4–6 vehicles), and Rails (years 7–10, $0.7–1B, 1,500+ homes, 8–10 vehicles). The whole table is a forward view, graded accordingly.",
);

add(
  "horizon",
  P.prospect,
  "What happens in the pilot phase?",
  "OPINION, thesis 06: years 1–2 target $20M of vehicle capital, roughly 45 homes on one Intervest vehicle, and $0.8–1.2M of OpCo revenue. The pilot exists to answer one question: will a 750+ FICO US client pay 10–12% dollars to control a Colombian home?",
);

add(
  "horizon",
  P.stakeholder,
  "What is the multiply phase?",
  "OPINION, thesis 06: years 2–4 — $60–80M AUM, ~150–180 homes, 2–3 vehicles, ~$2–2.5M OpCo revenue. It works because Tamarindo kept no exclusivity with the first capital partner, only a ROFR, so each new partner gets a clone vehicle on the same rails.",
);

add(
  "horizon",
  P.investor,
  "What does the marketplace phase mean?",
  "OPINION, thesis 01/06: years 4–7 — $150–400M AUM across 4–6 vehicles. At that point capital competes to fund Tamarindo-originated assets, which compresses Tamarindo's cost of capital and raises its spread. That funding-marketplace claim is the bet, not an observation.",
);

add(
  "horizon",
  P.founder,
  "What is the year-10 end state?",
  "OPINION, thesis 06: the Rails phase — $0.7–1B AUM, 1,500+ homes, 8–10 vehicles, $20–30M OpCo revenue by years 7–10, with the same legal-operational rails carrying other asset classes and other countries. It is the forward story, never quoted as settled.",
);

add(
  "horizon",
  P.investor,
  "Are the fy10 targets promises?",
  "No. ASSUMPTION, thesis 09 and docs/nico 12: year-10 targets are admin-only model inputs — grey keys, not member levers — and every projection input must eventually be replaced by a quote, contract, or payroll calculation. Nico presents them as the company's forward view, never as commitments.",
);

add(
  "horizon",
  P.stakeholder,
  "Why are the fy10 targets admin-only instead of blue?",
  "FACT, docs/nico 12: year-10 targets sit with payroll, equity rounds, ramp, and horizon in the grey set. They are the company's published forward story; letting every what-if session rewrite them would dissolve the shared case. Members stress the 14 levers; admins own the story.",
);

add(
  "horizon",
  P.investor,
  "When does the operating company break even?",
  "OPINION, thesis 06: at roughly $50–60M funded AUM — the higher interest spread pulled it in from the earlier $55–65M view. Thesis 01 puts that around Year 3 on the ramp. It is a model view, not a covenant.",
);

add(
  "horizon",
  P.founder,
  "What is the steady-state take on a dollar of AUM?",
  "OPINION, thesis 06/19: about 3.5–3.7% recurring on funded AUM at the current 11.84% client rate — roughly 237 bps of spread share, 75 bps servicing, and 40–60 bps of rental/PM — plus ~3% one-time in the deploy year. Thesis 01 rounds the long-run story to roughly 3% of AUM annually.",
);

add(
  "horizon",
  P.regulator,
  "What are the kill criteria over the horizon?",
  "FACT, thesis 06 as stated tests: conversion at a 10–12% client rate fails; the recovery path proves unenforceable; the rental offset lands materially below ~9% of the payment averaged; or 5 people cannot run ~50 homes. Thesis 01 adds that the pilot was sized so failure is affordable.",
);

add(
  "horizon",
  P.investor,
  "How does Nico decide whether a projection number is FACT or something weaker?",
  "CONTEXT, thesis 09: the discipline is explicit — a cited observation with a source is graded highest, a recommended policy is an opinion, and any model input that still needs a quote, contract, or payroll calculation is an assumption. Ramp tables and year-10 numbers are forward inputs, so they never get the top grade.",
);

add(
  "horizon",
  P.friend,
  "So if I ask what AUM will be in year 10, what do you say?",
  "OPINION, thesis 06: the model's Rails phase points at $0.7–1B AUM in years 7–10. That is a target on admin-only assumptions — worth walking through, never worth stating as if it already happened.",
);

add(
  "horizon",
  P.investor,
  "What does capital cost over the ten years?",
  "ASSUMPTION, thesis 09: vehicle #1 pays 9–12%; the model then uses 8.5–11.5% for partner 2 (years 4–5), 8.0–11.0% for partner 3 (years 6–7), and 7.5–10.5% for partner 4 (years 8–10) — tightening only 25–75 bps per proven cohort and never below live benchmark funding plus required credit enhancement.",
);

add(
  "horizon",
  P.stakeholder,
  "Why does the modeled vehicle yield tighten so slowly?",
  "OPINION, thesis 09: the recommendation is discipline — tighten 25–75 bps per proven cohort, keep activation, servicing, and spread flat in the base case, and show any fee give-up only in a downside case. Cheaper capital is earned by performance data, not assumed.",
);

add(
  "horizon",
  P.founder,
  "When does vehicle #2 arrive?",
  "OPINION, thesis 06: in the multiply phase, years 2–4. The enabling term is contractual: no exclusivity with the first partner, ROFR only, so a second vehicle is allowed. Its timing is the plan, not a signed fact.",
);

add(
  "horizon",
  P.investor,
  "Is the $20M test one unconditional cheque?",
  "No. FACT, thesis 06: the kickoff is $10M Medellín + $10M Cartagena — structured as a first $10M provisional and a second $10M on KPIs. The capital price of 9–12% is the vehicle yield, not the client rate.",
);

add(
  "horizon",
  P.regulator,
  "What does year one cost to run?",
  "OPINION, thesis 06: burn of $150–180k/month with a seed of $2.5–3.5M lasting about 24 months. Salaries are unset; the detailed loaded-payroll math in thesis 09 is an admin-only input, not a signed payroll.",
);

add(
  "horizon",
  P.stakeholder,
  "What does the loaded US team cost in the model?",
  "ASSUMPTION, thesis 09: about $87,555/month ($1.05M/year) for four roles — MD, Finance, Corp Ops, CTO — including salary, employer FICA/Medicare, and single health coverage, before the 3–5% payroll-overhead adder. It is a base-case input to be replaced by real payroll, and it stays admin-only.",
);

add(
  "horizon",
  P.investor,
  "Do the projections run on the current policy numbers?",
  "Yes. FACT, thesis 13: current policy as of late Aug 2026 is an 11.84% effective client rate (11.5% base plus FICO blend), a 20%-of-asset balloon floor, and a 30% default share of time rented per ICP. The engine recalculates the horizon from those levers, so a policy change reprices the whole ramp.",
);

add(
  "horizon",
  P.founder,
  "What if pilot conversion at 10–12% fails?",
  "FACT, thesis 01 as the stated bet: that is a kill criterion. The thesis does not scale on cheaper pricing hopes, and the test was sized so that failure is affordable. Willingness-to-pay at 10–12% is the open question the pilot exists to answer.",
);

add(
  "horizon",
  P.investor,
  "Is the 9.08% vehicle IRR on ICP-1 a projection?",
  "FACT, thesis 13, in a narrow sense: 9.08% is the engine's output on ICP-1's stated inputs — inside the 8.5–11.5% band, fixed from 8.35% by the 50 bps base step-up and tier blend without cutting Tamarindo's 20% strip. The inputs behind it are graded model assumptions, so the IRR inherits their softness.",
);

add(
  "horizon",
  P.prospect,
  "What does a client put in and get out over the 10 years?",
  "FACT, thesis 13 engine math on ICP-1: about $664k in over ten years — down payment, 120 lease payments, and the $84k option — and out comes the $420k home, owned. The vehicle takes back $413k on its $252k, and Tamarindo earns about $75.3k across its fee lines.",
);

add(
  "horizon",
  P.friend,
  "What does 'vehicle #1 of N' mean for the long run?",
  "OPINION, thesis 01: Tamarindo-Intervest is the first warehouse, not the product. Because there is no exclusivity, each new capital partner gets a clone vehicle on the same rails, and at scale capital competes to fund the origination flow. The N is the whole point of the 10-year shape.",
);

add(
  "horizon",
  P.regulator,
  "What is the rental-offset kill line?",
  "FACT, thesis 06 as a stated test: if the rental offset lands materially below ~9% of the payment averaged — about 30% in a month the unit is actually rented — the affordability story breaks. The old 30–55% band assumed near-full occupancy and is retired.",
);

add(
  "horizon",
  P.stakeholder,
  "Why is there an ops kill test about five people?",
  "FACT, thesis 06 as a stated test: if 5 people cannot run ~50 homes, the servicing economics do not scale. The 10-year story leans on a lean ops layer; the pilot measures whether that layer holds.",
);

add(
  "horizon",
  P.investor,
  "What OpCo revenue does the model want by year 10?",
  "OPINION, thesis 06: $20–30M in the Rails phase, on $0.7–1B AUM. That is consistent with the roughly-3%-of-AUM fee story in thesis 01, and it lives in the admin-only target set.",
);

add(
  "horizon",
  P.founder,
  "Can a member move the ramp or the horizon in a what-if?",
  "No. FACT, docs/nico 12: ramp and horizon are grey, admin-only keys. A member session stresses the ~14 blue levers — including post-pilot growth and the auto/aircraft start months — but the ramp shape itself belongs to the published company case.",
);

add(
  "horizon",
  P.prospect,
  "Why should I believe a 10-year plan from a company in its pilot?",
  "OPINION, thesis 01: you should not believe it as prediction — the honest position is that the pain point is real and widely evidenced while willingness-to-pay at 10–12% is unproven. The 10-year table shows what the rails are worth if the pilot clears; the kill criteria show what happens if it does not.",
);

add(
  "horizon",
  P.investor,
  "Why does the balloon floor matter to the 10-year shape?",
  "FACT, thesis 06 as policy: the floor is 20% of asset — 33% of funded at 60% LTV — because the balloon must stay material for the contract to keep reading as a lease. The floor sits level with the IRS equipment true-lease residual guideline, but real estate is not equipment and counsel owns characterization, so Nico never claims the guideline settles it.",
);

add(
  "horizon",
  P.friend,
  "Give me the effective-cost story a client hears.",
  "OPINION, thesis 01: the bet is that the rental pool offsets enough of the payment that a 10–12% headline feels closer to 6–7% effective. That framing depends on the ~30% rented default holding up, so it is pitched as the thesis, not a guarantee.",
);

const PHASES = [
  ["Pilot", "years 1–2, $20M AUM, ~45 homes, 1 vehicle, ~$0.8–1.2M OpCo revenue."],
  ["Multiply", "years 2–4, $60–80M AUM, ~150–180 homes, 2–3 vehicles, ~$2–2.5M revenue."],
  ["Marketplace", "years 4–7, $150–400M AUM, 350–900 homes, 4–6 vehicles, $5–12M revenue."],
  ["Rails", "years 7–10, $0.7–1B AUM, 1,500+ homes, 8–10 vehicles, $20–30M revenue."],
];

PHASES.forEach(([phase, line], i) => {
  add(
    "horizon",
    rotate(i),
    `One-liner: the ${phase} phase.`,
    `OPINION, thesis 06: ${line} Forward table, admin-only targets.`,
  );
});

// ---------------------------------------------------------------------------
// Autos / aircraft — why the verticals, the specific ICPs, economics vs homes
// ---------------------------------------------------------------------------

add(
  "autos-aircraft",
  P.investor,
  "Why does a home-financing company have an auto vertical at all?",
  "OPINION, thesis 01: the durable asset is the rails — the legal and operational machinery — and autos were deliberately deferred, not rejected. Once the machinery is proven on homes, the same US-law lease against a Colombian hard asset carries other classes. Autos are the first extension, aircraft the stress test of the same idea.",
);

add(
  "autos-aircraft",
  P.founder,
  "When do autos and aircraft turn on in the model?",
  "FACT, docs/nico 12: autoStartMonth and aircraftStartMonth are blue levers — member-visible inputs. Any member can run a what-if with autos starting earlier or later; the catalog entries themselves stay admin-gated.",
);

add(
  "autos-aircraft",
  P.prospect,
  "What is AUTO-1?",
  "FACT, catalog: AUTO-1 Andes Family Prado — a Toyota Land Cruiser Prado TX-L 2.4 gasoline 4×4 (or Fortuner SRV diesel), seed $102k from the March 2026 Colombian list price, 48-month lease at a 14.5% seed rate, 40% of the auto mix. The persona is the same US-FICO lessee as the home book, needing a family SUV for Colombia roads.",
);

add(
  "autos-aircraft",
  P.friend,
  "And the smaller car?",
  "FACT, catalog: AUTO-2 City Hybrid CX-30 — a Mazda CX-30 2.0 Gran Touring hybrid, seed $33k from the 2026 dealer list, 36 months at 14.5%, and 60% of the mix so the auto book stays near the old $55k blended ticket. It is the volume auto: the class Colombian banks actually book on 36-month leases.",
);

add(
  "autos-aircraft",
  P.investor,
  "What is AIR-1?",
  "ASSUMPTION, catalog: AIR-1 Andes Caravan — a used Cessna 208B Grand Caravan EX (9 seats / cargo), seed $2.2M in the middle of the $1.4–3.2M used band, 84 months at a 9.5% seed rate, 80% of the aircraft mix. The seed grade is explicit in the entry: a mid used EX, not a quoted deal.",
);

add(
  "autos-aircraft",
  P.stakeholder,
  "Who is the Caravan for?",
  "FACT, catalog persona: a Colombian air-taxi, medevac, or cargo operator — explicitly not a tourist hour-charter. The Caravan is what operators actually put on a finance lease in the Andes: short strips, payload, Medellín–coast–llanos routes.",
);

add(
  "autos-aircraft",
  P.investor,
  "What is AIR-2?",
  "ASSUMPTION, catalog: AIR-2 Caribbean Light Jet — a used Embraer Phenom 300E (7–8 seats), seed $11.5M as a mid ask against Aug 2026 asks of $11.0–14.35M and six-month solds of $9.9–15.4M, 120 months at 9.5%, 20% of the aircraft mix. Sparse by design: one of these moves the book.",
);

add(
  "autos-aircraft",
  P.founder,
  "Who is the Phenom persona?",
  "FACT, catalog persona: UHNW diaspora or a Part 135 charter operator flying the Miami–Medellín/Cartagena corridor. The ICP is the hull they finance — a used Phenom 300E — not an hourly charter quote.",
);

add(
  "autos-aircraft",
  P.prospect,
  "How do auto economics differ from home economics?",
  "FACT, catalog: shorter terms (36–48 months vs 7–12 years), a higher seed rate (14.5% vs 11–12.5% on homes), a zero rent factor — no furnished rental pool line — and vehicle registration through RUNT instead of an escritura on a property folio. Residual value, insurance, FX, and recovery are separate model lines per thesis 09.",
);

add(
  "autos-aircraft",
  P.investor,
  "How do aircraft economics differ from homes?",
  "CONTEXT, thesis 09 and the catalog: much bigger tickets ($2.2M–$11.5M seeds), a lower 9.5% seed rate, zero rent factor, and a hard precondition — thesis 09 requires a separate aviation vehicle, diligence, insurance, registry, maintenance-reserve, and residual-value model before launch. Aircraft are a designed extension, not a live book.",
);

add(
  "autos-aircraft",
  P.friend,
  "Why is the rent factor zero on cars and planes?",
  "FACT, catalog: rentFactor is 0 on both auto and both aircraft ICPs. The furnished rental pool is a homes story — Ashoka-managed units, one-month minimums. Nobody pools a family Prado, and the Caravan's operator revenue belongs to the operator, not to a Tamarindo rental line.",
);

add(
  "autos-aircraft",
  P.regulator,
  "How does a leased car get registered in Colombia?",
  "FACT, catalog and the auto book: vehicle title and transfers run through RUNT and the organismo de tránsito — registration is a registry act, not a notarial escritura like a home. That is one reason the auto vertical reuses the rails but needs its own closing checklist.",
);

add(
  "autos-aircraft",
  P.investor,
  "Is the 14.5% auto rate in line with the Colombian market?",
  "CONTEXT, catalog research notes: Colombian crédito vehicular in July 2026 ranged about 17–28.8% E.A. and Bancolombia books vehicle leases at 12–72 months, typically 20% down. Tamarindo prices its own US-law lease at a 14.5% seed — below the peso market a diaspora client would face, above the US prime anchor.",
);

add(
  "autos-aircraft",
  P.founder,
  "What in the auto catalog is fact and what is assumption?",
  "CONTEXT, catalog: the price seeds are graded as facts — Prado TX-L at the March 2026 list, CX-30 Gran Touring hybrid at the 2026 dealer list. Demand, mix weights, the 14.5% seed rate, and residual behavior are model inputs awaiting real originations. The entry-level citation grades carry that split.",
);

add(
  "autos-aircraft",
  P.stakeholder,
  "What is fact versus assumption on the aircraft side?",
  "CONTEXT, catalog: both aircraft entries are explicitly graded as assumptions — the seeds sit inside real 2026 market bands (used Caravans $1.4–3.2M; Phenom 300E asks $11.0–14.35M), but the demand, the 9.5% rate, and the mix are unvalidated inputs. Thesis 09 goes further and enters no aircraft volume in the base case.",
);

add(
  "autos-aircraft",
  P.investor,
  "Is the aircraft ICP basically a charter business?",
  "No. CONTEXT, catalog: charter ads quote hourly rates — light-jet Bogotá–Cartagena from about COP 14M, hourly $3,500–4,800 — but the ICP is the hull the operator finances, not the hourly quote. Tamarindo would hold the finance-lease position on the airframe; flying it is the client's business.",
);

add(
  "autos-aircraft",
  P.friend,
  "Why a Cessna Caravan specifically?",
  "FACT, catalog explanation: the used Grand Caravan is what operators actually put on a finance lease in the Andes — short strips, payload, Medellín to the coast and the llanos. It is the in-country utility airplane, and it takes 80% of the modeled aircraft mix.",
);

add(
  "autos-aircraft",
  P.prospect,
  "What would a financed Caravan rent for?",
  "ASSUMPTION, catalog research note: the dry-lease ballpark is $15–25k/month on a financed hull. That is a sketch from market guides, not a signed rate card.",
);

add(
  "autos-aircraft",
  P.regulator,
  "Does the base case actually book aircraft volume?",
  "No. FACT, thesis 09: the instruction is to enter no aircraft volume in the base case and to require a separate aviation vehicle, diligence, insurance, registry, maintenance-reserve, and residual-value model before launch. The catalog carries the two aircraft ICPs so the extension can be modeled, not because it is live.",
);

add(
  "autos-aircraft",
  P.investor,
  "The catalog has aircraft mix weights but thesis 09 says no aircraft volume. Which wins?",
  "CONTEXT, thesis 09 vs the catalog: both are true at different layers. Thesis 09 sets the base case to zero aircraft volume; the catalog defines what an aircraft deal looks like if aircraftStartMonth is pulled forward in a what-if. Nico should present aircraft as a modeled extension gated on thesis 09's preconditions, never as booked demand.",
);

add(
  "autos-aircraft",
  P.founder,
  "Thesis 09 sketches a $15k used / $25k new auto ticket. The catalog seeds are $33k and $102k. Why?",
  "CONTEXT, thesis 09 vs the catalog: thesis 09's ticket was a mass-market Colombian average from 2025 price ranges; the catalog was rebuilt around what the actual Tamarindo lessee — a US-FICO diaspora household — leases: a $33k CX-30 and a $102k Prado. The 60/40 mix keeps the blended ticket near the old $55k. Quote the catalog for the product, thesis 09 for the market backdrop.",
);

add(
  "autos-aircraft",
  P.stakeholder,
  "Can a member turn aircraft on in month one?",
  "Yes, in a what-if. FACT, docs/nico 12: aircraftStartMonth is a blue lever, so a member can model an early aviation start against their personal case. That changes their scenario, not the company case and not the thesis 09 launch preconditions.",
);

add(
  "autos-aircraft",
  P.friend,
  "Why is the aircraft rate lower than the home rate?",
  "ASSUMPTION, catalog: the 9.5% seed reflects bigger tickets, operator counterparties, and aviation-collateral pricing — a modeling choice, not a quoted market rate. The home book carries 11–12.5% seeds and the current 11.84% effective policy rate.",
);

add(
  "autos-aircraft",
  P.investor,
  "How big can an aircraft ICP get in the admin screen?",
  "FACT, catalog: the variable bound is $20M for aircraft — against $250k for autos and $2M for property. The Phenom's $11.5M seed sits comfortably inside it.",
);

add(
  "autos-aircraft",
  P.prospect,
  "Is there proven demand for the aircraft product?",
  "No. ASSUMPTION, thesis 09: aircraft leasing is rare for Tamarindo's proposed retail customer and product — that is the stated reason the base case books no volume. The catalog personas describe who the client would be; nothing yet says how many exist.",
);

add(
  "autos-aircraft",
  P.regulator,
  "Who is the auto lessee — a Colombian consumer?",
  "No. FACT, catalog: the persona is the same US-FICO lessee as the home book — a diaspora household using US credit for a Colombian vehicle. Tamarindo is not competing for the local peso borrower the 17–28.8% E.A. bank book serves.",
);

add(
  "autos-aircraft",
  P.founder,
  "What extra model lines do autos carry that homes do not?",
  "FACT, thesis 09: FX, insurance, registration, recovery, and residual value are kept as separate model lines for the auto book. On homes the residual story is the 20%-of-asset balloon on an appreciating asset; on autos residual value is a depreciating-asset risk line of its own.",
);

add(
  "autos-aircraft",
  P.stakeholder,
  "Why 36–48 month auto terms instead of 10 years?",
  "CONTEXT, thesis 09 and the catalog: Colombian vehicle credit is commonly quoted at 36–60 and 60–84 months, and the catalog notes 36–48 is the payment sweet spot Bancolombia actually books. A 10-year car lease would outlive the asset's prime years; the term follows the collateral.",
);

add(
  "autos-aircraft",
  P.investor,
  "Does the auto vertical change Tamarindo's fee machine?",
  "OPINION, thesis 01/19: no — the identity holds. Tamarindo still originates and services on the same six fee lines while a funding vehicle owns the asset; only the collateral, term, and registry change. If the company ever warehoused cars on its own balance sheet, that would be drift.",
);

add(
  "autos-aircraft",
  P.friend,
  "Which auto is most of the book?",
  "FACT, catalog: the CX-30 at 60% of the auto mix versus 40% for the Prado. Volume sits in the compact crossover; the Prado is the premium family ticket.",
);

add(
  "autos-aircraft",
  P.prospect,
  "Could I lease a plane the way I would lease an apartment?",
  "CONTEXT, catalog: the aircraft ICPs are built around operators — an air-taxi, medevac, or cargo business for the Caravan, a Part 135 charter or UHNW principal for the Phenom — on 7-to-10-year terms with zero rental pool. It is a commercial finance lease shape, not the lifestyle lease with a comodato that homes get.",
);

add(
  "autos-aircraft",
  P.regulator,
  "What must exist before an aircraft deal closes?",
  "FACT, thesis 09: a separate aviation vehicle plus diligence, insurance, registry, maintenance-reserve, and residual-value modeling. None of that is waived by the catalog carrying seeds; the entry exists so the extension can be planned honestly.",
);

add(
  "autos-aircraft",
  P.investor,
  "What does one Phenom do to the aircraft book?",
  "FACT, catalog: at an $11.5M seed against the Caravan's $2.2M, a single Phenom origination is worth roughly five Caravans of funded volume — which is why the entry says sparse mix, one of these moves the book, and holds it to 20% of aircraft originations.",
);

const VERTICAL_ONE_LINERS = [
  ["AUTO-1 Andes Family Prado", "Toyota Prado TX-L seed $102k, 48 months at 14.5%, 40% of the auto mix — the diaspora family SUV.", "FACT"],
  ["AUTO-2 City Hybrid CX-30", "Mazda CX-30 hybrid seed $33k, 36 months at 14.5%, 60% of the mix — the volume auto.", "FACT"],
  ["AIR-1 Andes Caravan", "used Cessna 208B Grand Caravan EX seed $2.2M, 84 months at 9.5%, 80% of the aircraft mix — the Andes utility hull.", "ASSUMPTION"],
  ["AIR-2 Caribbean Light Jet", "used Embraer Phenom 300E seed $11.5M, 120 months at 9.5%, 20% of the mix — the MIA–MDE/CTG corridor jet.", "ASSUMPTION"],
];

VERTICAL_ONE_LINERS.forEach(([name, line, grade], i) => {
  add(
    "autos-aircraft",
    rotate(i + 1),
    `In one line, what is ${name}?`,
    `${grade}, catalog: ${line}`,
  );
});

// ---------------------------------------------------------------------------
// Drills — short phrasings across all three topics for retrieval
// ---------------------------------------------------------------------------

const DRILLS = [
  ["where ICPs come from", "CONTEXT, thesis 01/06 + catalog: team meetings and the thesis deal sheets, curated by admins with public price checks. Not a listing feed."],
  ["why ICP prices are gated", "FACT, docs/nico 12: the catalog defines what the company sells; it lives under Admin → ICPs, changed by admin curation and Publish."],
  ["the member what-if kit", "FACT, docs/nico 12: ~14 blue levers — down/LTV, balloon floor, four fee levers, tranches, rental share, growth, auto/aircraft start months."],
  ["ICPs into decks", "FACT, docs/nico 12: server-side engine, live statements/returns/sensitivity, HTML/PDF/CSV/XLSX; numbers never frozen in a template."],
  ["why 10 years", "CONTEXT, thesis 06: finance-lease shape — amortize 60% funded to a material 20%-of-asset balloon at a payment a prime client can carry."],
  ["the ramp", "OPINION, thesis 06: Pilot $20M → Multiply $60–80M → Marketplace $150–400M → Rails $0.7–1B over years 7–10."],
  ["fy10 targets", "ASSUMPTION, thesis 09 + docs/nico 12: admin-only model inputs pending real quotes and contracts — the forward story, not promises."],
  ["grading projections", "CONTEXT, thesis 09: cited observation ranks highest; recommended policy is opinion; any input awaiting a quote or contract is an assumption. Targets never get the top grade."],
  ["breakeven", "OPINION, thesis 06: roughly $50–60M funded AUM, around Year 3 on the ramp."],
  ["current policy numbers", "FACT, thesis 13: 11.84% effective client rate, 20%-of-asset balloon floor, 30% default time rented."],
  ["why autos exist", "OPINION, thesis 01: the rails carry other asset classes; autos were deliberately deferred, not rejected."],
  ["auto/aircraft start months", "FACT, docs/nico 12: autoStartMonth and aircraftStartMonth are blue — member-visible what-if levers."],
  ["the two aircraft", "ASSUMPTION, catalog: used Grand Caravan EX $2.2M for Andes operators; used Phenom 300E $11.5M for the MIA–Colombia corridor. Seeds inside real bands; demand unproven."],
  ["autos vs homes", "FACT, catalog: 36–48 month terms, 14.5% seed, zero rent factor, RUNT registration instead of an escritura."],
  ["aircraft base case", "FACT, thesis 09: no aircraft volume in the base case; a separate aviation vehicle plus insurance, registry, reserves, and residual modeling comes first."],
];

DRILLS.forEach(([topic, a], i) => {
  add("drill", rotate(i), `In one line: ${topic}.`, a);
  add("drill", rotate(i + 2), `What does Nico say about ${topic}?`, a);
});

// ---------------------------------------------------------------------------
// Validate — every answer carries exactly one grade label and a source
// ---------------------------------------------------------------------------

const GRADE_RE = /\b(FACT|CONTEXT|OPINION|ASSUMPTION)\b/g;
const SOURCE_RE = /(thesis \d{2}|thesis 01|catalog|docs\/nico 12)/i;
const errors = [];
for (const row of qa) {
  const grades = row.a.match(GRADE_RE) ?? [];
  if (grades.length !== 1) {
    errors.push(`grade x${grades.length}: ${row.q}`);
  }
  if (!SOURCE_RE.test(row.a)) {
    errors.push(`no source cite: ${row.q}`);
  }
  if (/broker fee/i.test(row.a) || /broker fee/i.test(row.q)) {
    errors.push(`forbidden phrase: ${row.q}`);
  }
}
if (errors.length) {
  console.error("Validation failed:");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
if (qa.length < 100) {
  console.error(`Only ${qa.length} pairs — need at least 100.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });

const parts = [
  "# Investor walk — ICP origin, 10-year horizon, autos and aircraft",
  "",
  "Generated Q&A from thesis 01 / 06 / 09 / 13 / 19 and the ICP catalog (lib/model/icp-catalog.ts), plus docs/nico/12-blue-variables.md for lever governance. As of 26 Aug 2026. Grades: FACT / CONTEXT / OPINION / ASSUMPTION. Current policy: 11.84% client rate, 20% balloon floor, 30% rented. Targets are labeled, never sold as settled.",
  "",
];
for (const row of qa) {
  parts.push(`### [${row.persona}] ${row.q}`);
  parts.push(row.a);
  parts.push("");
}
writeFileSync(FILE, parts.join("\n"));

const counts = new Map();
for (const row of qa) counts.set(row.bucket, (counts.get(row.bucket) ?? 0) + 1);

const line = `- investor-walk.md: ${qa.length} investor-walk Qs (ICP origin, 10-year horizon, autos/aircraft) from \`scripts/generate-investor-walk-qa.mjs\` (thesis 01/06/09/13/19 + ICP catalog, 26 Aug 2026)`;
let readme = readFileSync(README, "utf8");
if (!readme.includes("investor-walk.md")) {
  if (!readme.endsWith("\n")) readme += "\n";
  readme += `\n${line}\n`;
  writeFileSync(README, readme);
} else {
  writeFileSync(README, readme.replace(/^- investor-walk\.md:.*$/m, line));
}

console.log(`Wrote ${qa.length} Q&As to knowledge/qa/investor-walk.md`);
for (const [bucket, n] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${bucket}: ${n}`);
}
