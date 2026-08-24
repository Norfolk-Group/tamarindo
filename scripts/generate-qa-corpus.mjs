#!/usr/bin/env node
/**
 * Writes persona Q&A markdown into knowledge/qa/ for the bundled corpus.
 * Run: node scripts/generate-qa-corpus.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "knowledge/qa");

/** @typedef {{ persona: string; q: string; a: string }} QA */

const qa = [];

function add(persona, q, a) {
  const answer = a.replace(/\s+/g, " ").trim();
  qa.push({ persona, q, a: answer });
}

const P = {
  investor: "investor",
  founder: "founder",
  stakeholder: "stakeholder",
  prospect: "prospect",
  regulator: "regulator",
  friend: "friend",
};

// --- Capital ---
add(
  P.investor,
  "How much capital did Intervest actually commit?",
  "The working box is twenty million dollars as a test, not a blank check. Kickoff language split it ten million Medellín and ten million Cartagena. Later precision: the first ten is provisional and the second ten is on agreed KPIs. Grade: FACT from Aug meetings. Do not tell LPs it is one unconditional twenty million cheque.",
);
add(
  P.investor,
  "Is the second ten million guaranteed?",
  "No. It is described as contingent on KPIs that are not in a signed term sheet in the corpus. Treat vehicle number one as a ten million start with an option on another ten. FACT as structure, open as documentation.",
);
add(
  P.founder,
  "Why did we split Medellín and Cartagena ten and ten?",
  "Kickoff wanted two cities so the test is not a one-neighborhood anecdote. Medellín is the liquidity backbone. Cartagena is the yield and rental proof, capped so seasonality cannot eat the vehicle. That split is FACT as intent, OPINION as the right mix.",
);
add(
  P.stakeholder,
  "Does Intervest have exclusivity?",
  "No exclusivity. Tamarindo kept a right of first refusal only. That is FACT from the Aug 19–20 calls and it is load-bearing: Year 2–4 is clone vehicles with other capital partners.",
);
add(
  P.investor,
  "What yield does Intervest need?",
  "Meetings price vehicle capital around nine to twelve percent. That is the vehicle’s cost of funds, not the client rate and not Tamarindo’s take. FACT as the working range; not a closed SPA.",
);
add(
  P.investor,
  "Is Tamarindo a 2 and 20 shop?",
  "No. Intervest’s own fund is often described as two-and-twenty versus their LPs. Tamarindo earns a two percent activation on drawdown plus about twenty percent of interest billings, plus servicing and rental lines. Mixing those three layers was the 18 Aug debrief failure mode.",
);
add(
  P.friend,
  "Who is writing the big check?",
  "A New York specialty-finance manager, Intervest, run by Mike Gontar. They are testing about twenty million into Colombian homes Tamarindo originates. Tamarindo itself is trying to raise a few million to run the company. Two different wallets.",
);
add(
  P.regulator,
  "Is Intervest depositing public money in Colombia through Tamarindo?",
  "The design is the opposite of captación: a US vehicle buys the house through a sucursal, the client pays a US-law lease, and the client never hands Tamarindo a deposit-like savings product. Whether Superintendencia agrees is an open legal item. Do not declare it clean.",
);

// --- Intervest CONTEXT ---
add(
  P.investor,
  "How big is Intervest, really?",
  "Their site (retrieved 23 Aug 2026) markets twenty-six plus years, one hundred sixty plus vehicles, and twenty-five billion plus in funds and accounts, employee-owned, Mike Gontar CEO. Commercial Observer figures to March 2025 printed about ten point four billion AUM and two point five billion originated in a year. Those yardsticks do not match and must not be stacked on one slide. CONTEXT, not a Tamarindo audit.",
);
add(
  P.founder,
  "Can we put twenty-five billion AUM in the deck?",
  "Not as AUM unless Intervest gives a current fact sheet. Twenty-five billion is their funds-and-accounts marketing line. A 2025 press print was ten point four billion AUM. The 18 Aug debrief already warned against unsourced market claims. Same discipline for the partner.",
);
add(
  P.stakeholder,
  "Is the watch business the same Intervest deal?",
  "No. Mechanical Art Capital swapping Mike out of watches is a separate LP-conflict thread. Tamarindo-Intervest LLC is vehicle one for homes. Keep them in different sentences.",
);

// --- Product box ---
add(
  P.prospect,
  "How much do I need down?",
  "Forty percent, wired, and you cannot yank it back after it hits. Tamarindo finances at most sixty percent. That is stricter than a typical Colombian non-VIS mortgage, which often tops out near seventy percent LTV. FACT for Tamarindo; CONTEXT for the local cap.",
);
add(
  P.prospect,
  "What FICO do I need?",
  "Launch box is roughly seven-fifty plus, Tier 1, SSN, individuals not companies. Hard pull only after you confirm intent. Early paper said seven-sixty and five to twenty first deals; the live box is seven-fifty and about forty-five homes. FACT as the Aug 20 box.",
);
add(
  P.prospect,
  "Is there a prepayment penalty?",
  "Meetings say you can prepay any time with no penalty. FACT as described. The buyout math is the residual plus remaining principal, not a charge for leaving early.",
);
add(
  P.prospect,
  "When do I own the apartment?",
  "Not on day one. The sucursal holds title. You get use through comodato plus a purchase option. You take title when you pay the residual or exercise early. That is the whole point versus a Colombian mortgage.",
);
add(
  P.investor,
  "Why sixty percent LTV if Colombian banks go to seventy?",
  "Cushion. Forty percent client cash plus a residual balloon is how the vehicle survives a default without looking like a 90 percent US mortgage. Local 70 percent LTV is CONTEXT for pesos and local income. Tamarindo is dollar, US credit, foreign collateral — tighter on purpose.",
);
add(
  P.regulator,
  "Is this a mortgage?",
  "Tamarindo’s position is no: US-law lease, material residual, title in the vehicle, comodato for use. US tax true-lease tests, ASC 842, state consumer-credit law, and Colombian characterization are all still open. Say the design intent, then say counsel has not closed it.",
);

// --- Rates ---
add(
  P.prospect,
  "Why would I pay eleven percent if US mortgages are six?",
  "Because a US bank will not take your Cartagena apartment as collateral. Freddie Mac’s thirty-year was about 6.17 percent the week of 21 Aug 2026 — on US homes. Colombian non-VIS mortgages in mid-2026 printed roughly twelve to eighteen percent E.A. and often want local income. Tamarindo’s ten to twelve is the unproven willingness-to-pay question, not a cheap US mortgage clone.",
);
add(
  P.investor,
  "Is ten to twelve percent a signed rate?",
  "No. It is the conversion question the pilot is built to answer. Model anchor is about eleven percent. Sensitivity tests at nine, eleven, thirteen. If qualified people will not sign in that band, the thesis fails. MIXED: structure FACT, level open.",
);
add(
  P.founder,
  "How does BanRep sit next to our client rate?",
  "BanRep’s intervention rate was 9.25 percent as of the 17 July 2026 decision. Local housing credit sits well above that. Our client rate is a dollar lease, not a peso hipotecario, so BanRep is context for Colombian cost of money, not our coupon.",
);
add(
  P.stakeholder,
  "What rate does the vehicle pay Intervest versus what the client pays?",
  "Vehicle capital is talked at nine to twelve percent. Client is talked at ten to twelve willingness-to-pay. Tamarindo’s spread share is about twenty percent of interest billings, so if the client is at eleven, that line is about two hundred twenty basis points of outstanding. Layers must stay separate.",
);

// --- Balloon / formulas ---
add(
  P.investor,
  "Why is there a balloon at all?",
  "If you amortize the funded amount to zero it looks like a loan. A material residual keeps more economics with the lessor and is the commercial hook for ‘this is a lease.’ Meetings want at least ten percent of asset; they also say likely around twenty given the forty percent deposit. ICP sheets use fifteen percent of funded. Three different conventions — say which one you are using.",
);
add(
  P.regulator,
  "Does a ten percent residual make this an IRS true lease?",
  "No. Equipment true-lease guidelines lessors still quote (Rev. Proc. 2001-28) look for about twenty percent residual, remaining life, no bargain option, lessor equity and profit tests. Ten percent of asset is below that equipment safe harbor. Real estate is not equipment. Characterization is an open memo, not a slogan.",
);
add(
  P.founder,
  "Which residual number do we put in the model?",
  "Until counsel picks one: legal floor ten percent of asset, meetings often twenty percent, ICP workbooks fifteen percent of funded. On a sixty percent LTV, fifteen percent of funded is nine percent of asset — so it can sit under the ten percent asset floor. Flag that inconsistency; do not hide it.",
);
add(
  P.prospect,
  "What do I pay at year ten?",
  "The residual buyout, plus any unpaid amounts. On the Cartagena ICP-2 sheet that is on the order of fifty-eight thousand dollars on a six hundred fifty thousand dollar home with three hundred ninety thousand funded. That figure is ASSUMPTION pending Ricardo’s model. You can also prepay.",
);
add(
  P.friend,
  "Is the monthly payment rent?",
  "No. It is a lease payment sized like loan service on the sixty percent Tamarindo funds, with a lump sum left at the end. If the home is in the rental pool, a net credit can offset part of that payment. You are not paying Medellín market rent to a landlord.",
);
add(
  P.investor,
  "What is the payment formula?",
  "Monthly rate r equals i over twelve. PMT equals open bracket PV minus FV over (1+r) to the n close bracket, times r, divided by one minus (1+r) to the minus n. Excel PMT(r,n,-PV,FV). Worked ICP-1: PV 252000, i 11 percent, n 120, FV 37800, PMT about 3300. ASSUMPTION on the inputs, FACT on the algebra.",
);

// --- Fees ---
add(
  P.investor,
  "Walk the six revenue lines.",
  "One origination about one percent of funded, ASSUMPTION, payer TBD. Two activation two percent of drawdown, FACT. Three servicing about seventy-five basis points of outstanding, ASSUMPTION. Four about twenty percent of interest billings, FACT. Five property-management charge-through at Ashoka, market plus possible markup. Six about twenty percent of net rental when pooled, FACT.",
);
add(
  P.investor,
  "What take rate should I underwrite?",
  "Opinion in the fee file: on funded AUM at about eleven percent client rate, two hundred twenty bps spread plus seventy-five servicing plus forty to sixty rental blend is about three point three to three point five percent recurring, plus about three percent one-time in the year a dollar is deployed. Not investor-grade until the model lands.",
);
add(
  P.investor,
  "Dov said thirty thousand a month. Is that the company?",
  "That Aug 19 sketch on the twenty million pilot, about three hundred sixty thousand a year, matches the spread-share line alone: two hundred twenty bps times about fifteen million funded. The full stack is modeled as roughly three times that. Do not put three hundred sixty thousand in a deck as total revenue.",
);
add(
  P.founder,
  "Who pays origination?",
  "Unset. Could be client, vehicle, or split. Until it is cited, Luca’s fee engine should leave the payer and the rate blank except for the one percent assumption in the thesis, labeled ASSUMPTION.",
);
add(
  P.stakeholder,
  "Does Ashoka steal economics from the vehicle?",
  "Ashoka is a sister operator on market-rate PM, eight to ten percent long-term, eighteen to twenty-two percent short-term as ASSUMPTION, plus a Tamarindo share of net rent. Related-party pricing must be documented and terminable or LPs will call it a conflict. That discipline is OPINION and also just good hygiene.",
);

// --- Burn / raise ---
add(
  P.investor,
  "What are you raising for the OpCo?",
  "Opinion: two and a half to three and a half million dollars of Tamarindo US equity for about twenty-four months, through the twenty million pilot and into vehicle two. It is not Intervest’s money. Intervest buys properties.",
);
add(
  P.investor,
  "What is monthly burn?",
  "Opinion: one hundred fifty to one hundred eighty thousand a month in year one, about one point eight to two point two million a year, for a lean three US plus two Colombia team plus platform and legal. Salaries are explicitly not set. Boris still owes the Colombia budget.",
);
add(
  P.investor,
  "Where is breakeven?",
  "Opinion: about fifty-five to sixty-five million funded AUM at roughly three point four percent recurring take, year three / phase two. One-time fees on new vehicles pull that forward in deployment years.",
);
add(
  P.friend,
  "Is this a billion-dollar company tomorrow?",
  "No. The honest path is prove about forty-five homes with twenty million, then see if other pools clone. A billion of AUM is a year-seven-to-ten cartoon, all OPINION, and it dies if conversion or recovery fails.",
);

// --- ICPs ---
add(
  P.prospect,
  "What does a Poblado deal look like in dollars?",
  "ICP-1 anchor four hundred twenty thousand, band three-fifty to five hundred. Forty percent down one hundred sixty-eight thousand, funded two hundred fifty-two thousand. Model lease about three thousand three hundred a month at eleven percent with a fifteen percent-of-funded residual. Mid-term rent story two thousand two hundred gross at about eighty-five percent occupancy. Net credit cited about one thousand one hundred seventy a month, roughly thirty-five percent of the lease. ASSUMPTION until comps land.",
);
add(
  P.prospect,
  "What about Cartagena?",
  "ICP-2 anchor six hundred fifty thousand, band five to eight hundred. Down two hundred sixty, funded three hundred ninety. Lease about five thousand one hundred. ADR about two hundred ten at sixty-two percent occupancy, strong and seasonal. Net credit about one thousand five hundred eighty, up to about forty-five percent in high season. Cap that ICP at forty percent of a vehicle. Liquidity thinner, one hundred fifty to two hundred seventy days estimated.",
);
add(
  P.prospect,
  "Llanogrande sounds like a house. Do I need rent?",
  "ICP-3 is a house near the airport corridor, six to nine hundred thousand, funded four hundred fifty on the anchor. Lease about five thousand nine hundred. Occasional lets about eighteen thousand a year. Many clients will not pool. Underwrite income, not occupancy. Cap twenty-five percent of a vehicle.",
);
add(
  P.investor,
  "How is the twenty million deployed across ICPs?",
  "Opinion mix: about twenty Poblado homes five million funded, fifteen Cartagena five point nine, nine Llanogrande four point one, total about forty-four homes and fifteen million funded, twenty-five million of assets at sixty percent LTV. The extra five million of the twenty is fees, reserves, furnishing. Not a mandate yet.",
);
add(
  P.founder,
  "Why only three ICPs?",
  "Three is enough for personas and rental types and few enough that underwriting and Ashoka ops stay standard. If it is not an active ICP, it is not a deal. Review quarterly. OPINION as operating rule from Aug 21 direction.",
);

// --- Comodato / legal ---
add(
  P.regulator,
  "What is comodato under Colombian law?",
  "Civil Code article 2200: a loan of use, movable or immovable, delivered gratuitously, same thing to be returned, perfected by delivery. Courts treat paid use as something else, usually arrendamiento. Tamarindo’s rent sits on the US lease; comodato is the use-and-recovery hook while the sucursal holds title.",
);
add(
  P.prospect,
  "If I miss payments, how fast can they take the keys?",
  "Meetings: two months on the US lease and about one month on the comodato, versus a long rental desahucio. The sucursal already has title. That is the design. It is not a license for self-help eviction. Procedure still goes through the recovery playbook counsel writes.",
);
add(
  P.regulator,
  "Is comodato precario the 1-month story?",
  "Precario is the no-term, callable-at-will flavor. Tamarindo’s one-month overdue lock-out is a commercial target, not a sentence in article 2200. MinJusticia still tells people to write term, use, and return conditions. Counsel has to pick precario versus term comodato plus default.",
);
add(
  P.stakeholder,
  "Who holds title during the ten years?",
  "The funding vehicle through its Colombian sucursal. Tamarindo US must not own the apartment. Client has use plus option. Default path is terminate comodato and re-lease or sell. FACT as architecture.",
);
add(
  P.regulator,
  "US true lease versus Colombia leasing habitacional — same thing?",
  "No. Local banks already sell housing leases, often at higher LTV than mortgages, rates in the mid-teens. Tamarindo is dollar, US-law obligation, sucursal title, comodato use. Do not analogize them into one regulated product without opinions.",
);
add(
  P.prospect,
  "Can I deduct the lease on my US return?",
  "Meetings said US write-off on lease payments and no Colombian tax event for the lessee. That is a meeting claim, not a tax opinion. Personal versus investment use, characterization, and tax home can kill the deduction. Tell them to use their CPA. Nico is not the CPA.",
);

// --- Tax ---
add(
  P.investor,
  "What CIT does the sucursal pay?",
  "Headline Colombian corporate income tax is thirty-five percent in 2025–26 summaries (PwC, Deloitte). Meetings recalled nineteen percent pre-Petro. Financial institutions may owe a five percent surcharge through 2027. Branch remittances can stack more. Model thirty-five percent as CONTEXT unless tax counsel says otherwise.",
);
add(
  P.founder,
  "Does Tamarindo US pay Colombian tax?",
  "Meetings: Tamarindo US or Credit LLC pays US tax on its fee income. Colombian tax sits on the sucursal if it is a PE/branch with local income. Cross-border flows are an open structural item. Do not invent a PE analysis.",
);

// --- Cities ---
add(
  P.prospect,
  "Is four hundred twenty thousand realistic in El Poblado?",
  "CONTEXT 2026 luxury sketches put El Poblado apartments roughly two hundred seventeen to seven hundred sixty-one thousand dollars. Four hundred twenty sits in the middle of that international-buyer band, not the citywide median. Still an ICP box, not an appraisal.",
);
add(
  P.prospect,
  "Cartagena Old City at six hundred fifty — tourist trap?",
  "It is the yield ICP: higher ADR, seasonal occupancy, ops-heavy, thinner resale. That is why the vehicle cap is forty percent. If you want quiet cash-flow, you are in the wrong ICP. If you want the rental engine, this is the one.",
);
add(
  P.investor,
  "Why include Llanogrande if rent is weak?",
  "Income-quality diversifier and a different persona — retirees, airport corridor, house not apartment. Rent is not the underwrite. Cap it so the vehicle does not become a second-home graveyard.",
);

// --- Team / calendar ---
add(
  P.stakeholder,
  "Who is actually on the team?",
  "Intent is about three in the US and two in Colombia. Named: Rosario Davi CFO/COO, Tom Herman CTO at five to ten hours a week near-term, Natalia Carvajal marketing, Boris Mulett Colombia ops, Andrés Sierra commercial, Ivan Arias government/sales, Ricardo on the still-missing three-to-five year model. Mike Gontar is the Intervest counterpart.",
);
add(
  P.investor,
  "When do you present to Mike?",
  "Target is the week after Labor Day 2026, around 8 September. Weekly working call is 4 pm Eastern, 3 pm Colombia. The deck is blocked on Ricardo’s model as of 20 Aug.",
);
add(
  P.founder,
  "What is still not a number?",
  "No 3–5 year financial model as of 20 Aug. No salaries. No Colombian opex from Boris. Origination payer unset. Lease characterization pending both countries. Superintendencia / captación review open. Residual convention not unified.",
);

// --- Path ---
add(
  P.investor,
  "What does phase one have to prove?",
  "Conversion at ten to twelve percent, payment behavior, at least one recovery fire-drill, rental offset thirty to fifty-five percent, and five people plus platform servicing about fifty homes. End state about twenty million AUM, forty-five homes, fee income about zero point eight to one point two million a year — OPINION on the revenue.",
);
add(
  P.investor,
  "When do you clone vehicles?",
  "Phase two, years two to four, after the pilot gates. Target sixty to eighty million AUM, two to three vehicles, OpCo near breakeven. Template docs from vehicle one are the product.",
);

// --- TAM ---
add(
  P.investor,
  "Is the market 1.4 million Colombians in the US?",
  "Pew’s 2021 ACS Colombian-origin Hispanic figure is about 1.4 million. MPI’s 2021 immigrant count is about 855 thousand. Origin estimates for 2024 run higher. Meetings also said 800 thousand to a million Tier 1 prospects. The debrief said do not derive the last from the first. Need a sourced funnel before a deck TAM.",
);
add(
  P.founder,
  "Where should we originate first in the US?",
  "MPI put about thirty-five percent of Colombian immigrants in Florida, thirteen in New York, eleven in New Jersey in 2017–21. That is where the first brokers should live, not a fifty-state spray.",
);

// --- Charts / Nico behavior ---
add(
  P.stakeholder,
  "When should Nico draw a chart?",
  "When two or more quantities are compared: ICP mix, phases, fee stack, US versus Colombia rates. Use a markdown table and a fenced chart JSON block so the chat UI can paint bars. Do not chart a single lonely number.",
);
add(
  P.friend,
  "Can Nico just tell me if this is a good idea?",
  "Nico can walk the box, the unproven rate, the legal holes, and the twenty million test. Nico cannot bless the investment. If conversion fails or recovery is unenforceable, the thesis is sized to die small. That is the honest one-liner.",
);

// Expand: permutations so the vector store has hundreds of phrasings.
const extras = [];

const rateQs = [
  ["prospect", "Is my rate fixed?", "Working talk is a fixed dollar lease around ten to twelve percent for the pilot, model eleven. Not a signed coupon. Repricing is not in the corpus."],
  ["investor", "What happens to spread if client rate is nine percent?", "Spread share is twenty percent of interest billings, so nine percent client rate is about one hundred eighty bps of outstanding on that line, plus servicing and rental. Conversion may improve; take rate falls. That is why the model must test nine, eleven, thirteen."],
  ["investor", "What if they only sign at thirteen percent?", "Take rate fattens and conversion may die. The pilot is built to read that tradeoff, not to assume eleven forever."],
];
for (const [p, q, a] of rateQs) add(p, q, a);

const cities = [
  ["Medellín", "El Poblado and Envigado, mid-term executives, liquidity backbone, ICP-1."],
  ["Cartagena", "Old City and Bocagrande, short-term, seasonal, ICP-2, cap forty percent."],
  ["Llanogrande", "Rionegro airport corridor houses, weak rent, ICP-3, cap twenty-five percent."],
];
for (const [city, bit] of cities) {
  add(P.prospect, `Why ${city}?`, `${bit} Launch is Medellín and Cartagena only; Llanogrande is the third ICP inside the Antioquia corridor, not a third country.`);
  add(P.investor, `What share of the pilot is ${city}?`, `See the opinion mix: Poblado about twenty homes and five million funded, Cartagena fifteen and five point nine, Llanogrande nine and four point one. ${bit}`);
}

const numbers = [
  ["two percent activation", "FACT, one-time on Intervest drawdown, paid to Tamarindo US."],
  ["seventy-five basis points servicing", "ASSUMPTION. US residential servicing is often cheaper; specialty can be richer. Blank until cited in the engine."],
  ["twenty percent of billings", "FACT as spread share of interest billings, not of principal, not of rent, not Intervest’s carry."],
  ["twenty percent rental share", "FACT when the unit is in the pool, of net after PM and costs in the ICP waterfall ASSUMPTIONS."],
  ["forty percent down", "FACT minimum. Wired. Forfeited on the described default path."],
  ["sixty percent LTV", "FACT maximum funded. Early paper said fifty to sixty-five; live box is sixty."],
  ["ten year term", "FACT as working term for the US lease."],
  ["five to seven day offer", "FACT firm-offer window in business days."],
  ["thirty to forty-five day close", "FACT after the forty percent wire."],
  ["seven hundred to eight hundred title", "FACT pass-through, no markup."],
  ["two months default", "FACT on the US lease as described; deposit forfeited."],
  ["one month comodato", "FACT as meeting target versus rental eviction; procedure is counsel’s."],
];
for (const [label, a] of numbers) {
  add(P.investor, `Is ${label} firm?`, a);
  add(P.prospect, `Explain ${label} in one breath.`, a);
  add(P.friend, `What does ${label} mean for a normal person?`, a);
}

const phases = [
  [1, "years 1–2, twenty million AUM, about forty-five homes, one vehicle, about a million of OpCo revenue, seed-funded"],
  [2, "years 2–4, sixty to eighty million, one hundred fifty to one hundred eighty homes, two to three vehicles, breakeven zone"],
  [3, "years 4–7, one hundred fifty to four hundred million, hundreds of homes, four to six vehicles, profitable"],
  [4, "years 7–10, zero point seven to one billion AUM, fifteen hundred plus homes, eight to ten vehicles, compounding"],
];
for (const [n, bit] of phases) {
  add(P.investor, `What is phase ${n}?`, `All forward numbers are OPINION. Phase ${n}: ${bit}. No phase starts until the previous gates clear.`);
  add(P.founder, `What can we say publicly about phase ${n}?`, `Only with the OPINION label. Phase ${n}: ${bit}. Kill criteria still apply.`);
}

const personasHow = [
  [P.investor, "If I am an LP, what is the first risk?", "Conversion at ten to twelve percent, then enforceability of recovery, then related-party Ashoka pricing. Capital is not exclusive; Intervest can walk after the test."],
  [P.prospect, "If I am buying for my parents in Envigado, which ICP?", "ICP-1 Poblado/Envigado executive, not Cartagena STR and not a Llanogrande house unless that is actually the asset. If it is not on the three-ICP list, Tamarindo should not do it."],
  [P.regulator, "What would Superfinanciera ask?", "Are you capturing public money, are you a mortgage lender, is the comodato a disguise for a financed sale, and who is the borrower in Colombia. The file says those opinions are pending. Answer with the architecture and the open list."],
  [P.friend, "Is my cousin’s FICO 720 enough?", "Launch box is about seven-fifty plus. Seven-twenty is a no at the start, not a debate. The box is tight on purpose, Mike Gontar’s advice."],
  [P.stakeholder, "What does Rosario own?", "CFO/COO seat on Tamarindo US, model pressure on Ricardo, entity formation questions including whether an existing kit entity can be reused. Credit LLC was not incorporated as of 20 Aug."],
  [P.founder, "What does Tom still need?", "Five to ten hours a week near-term, contingent on legal questions. Platform v1 is in the seed milestones, not a reason to skip the opinions."],
];
for (const [p, q, a] of personasHow) add(p, q, a);

// Formula drills
const drills = [
  ["month-one interest on ICP-1", "252000 times 0.11 divided by 12 is about 2310 dollars. Tamarindo twenty percent of that interest is about 462 that month, declining."],
  ["activation on a 450k draw", "Two percent of 450000 is 9000 dollars to Tamarindo US, FACT structure, example from the entities file."],
  ["activation on ICP-2 funded", "Two percent of 390000 is 7800, plus assumed one percent origination 3900, both in the ICP-2 lifetime sketch."],
  ["PV of a 37800 balloon at 11 percent ten years", "Monthly r about 0.009167, (1+r)^120 about 3, 37800 over 3 about 12600. That is why the payment is not a full 252k amortizing mortgage payment."],
  ["occupancy math ICP-1", "2200 times 12 times 0.85 is 22440 gross a year, about 5.3 percent of a 420k price. Then 10 percent Ashoka, 25 percent costs, 20 percent of remainder to Tamarindo, cited net 1170 a month."],
];
for (const [q, a] of drills) {
  add(P.founder, `Compute ${q}.`, `${a} Show the table in chat. Label ASSUMPTION where the inputs are ICP sheet not a signed loan.`);
  add(P.investor, `Does ${q} match Dov’s sketch?`, `${a} Dov’s thirty thousand a month is the portfolio spread line, not this single-unit identity.`);
}

// Regulator battery
const regs = [
  ["usury", "US and Colombian usury opinions are on the pre-launch checklist. A ten to twelve percent dollar lease may be fine or not depending on characterization and cap statutes. Nico does not opine."],
  ["true sale or true lease", "Title is meant to sit with the vehicle. US true-lease tax tests are not met just because someone said ten percent residual. Accounting is ASC 842, a third test."],
  ["consumer credit", "Individuals at launch, US lessees. Consumer Leasing Act / TILA / state licensing may apply if it is a consumer finance product. Open."],
  ["UDAAP", "Forfeiting a forty percent deposit after two months will get a fairness question. The file describes it; it is not a litigated safe harbor."],
  ["OFAC / KYC", "US client onboarding, hard pull after intent, assignable purchase option with KYC. No detailed BSA program is in the corpus."],
  ["FATCA / CRS", "Not specified in the corpus. Do not invent."],
  ["DIAN", "Sucursal CIT, predial, possible ganancia ocasional on final transfer were flagged in June. Open."],
  ["notary and tradición", "Comodato perfects by delivery; real estate still needs the escritura into the sucursal. Thirty to forty-five day close is the operating target."],
];
for (const [topic, a] of regs) {
  add(P.regulator, `Regulatory take on ${topic}?`, a);
  add(P.investor, `Is ${topic} closed?`, a);
}

// Prospect battery
for (const q of [
  "Can I use the apartment three months a year and rent the rest?",
  "Who pays HOA and predial?",
  "What if the rental pool is empty in October?",
  "Can I put this in an LLC?",
  "Can my sister buy me out?",
  "Do you furnish?",
  "Is FX in the lease?",
  "What insurance is required?",
]) {
  add(
    P.prospect,
    q,
    q.includes("LLC")
      ? "Launch is individuals, not companies. FACT as Aug box. Family assignment of the option is discussed as KYC-gated, not a free transfer."
      : q.includes("FX")
        ? "Client pays a US-law dollar lease. Property costs in Colombia are pesos. Who holds FX is not a closed policy in the corpus; do not promise a peso lease."
        : q.includes("HOA")
          ? "ICP waterfalls treat HOA, predial, utilities, upkeep as cost loads in the rental stack. Who pays when the unit is owner-occupied is an ops policy Ashoka/Tamarindo Colombia must write. Not fully specified."
          : q.includes("October")
            ? "Then the offset shrinks. ICP-2 already shows high-season versus average. The lease payment does not disappear because Airbnb is quiet. That is client-income underwriting, especially Llanogrande."
            : q.includes("three months")
              ? "Yes, that is the lifestyle product: use plus pool. Tamarindo/Ashoka operate the pool and keep about twenty percent of net. Occupancy figures in the ICP sheets are ASSUMPTIONS."
              : q.includes("sister")
                ? "Purchase option is described as assignable with KYC. Not a casual gift. FACT as meeting language, docs TBD."
                : q.includes("furnish")
                  ? "Pilot budget includes furnishing float in the twenty million. Pass-through, not a Tamarindo gift. Details unset."
                  : "Insurance is described as part of the monthly lease stack with tax and a maintenance reserve. Binder-level specs are not in the corpus.",
  );
}

// Founder ops
for (const [q, a] of [
  ["Can five people service fifty homes?", "That is an explicit phase-one kill/scale question, not a claim. Platform plus Ashoka is the bet."],
  ["When do we open Mexico?", "Phase three assumption, after Colombia ICP data. Not a 2026 plan."],
  ["Autos?", "Deliberately deferred, not rejected."],
  ["Bogotá?", "Only after ICP data; assumed as a later Colombian market, not launch."],
  ["What Excel does Luca build first?", "Ten-year P&L plus manpower per entity, fee engine over FEE_LINES, blank cells where uncited. Activation two percent is FACT and may be filled. Pay cells stay blank."],
]) add(P.founder, q, a);

// Friend-and-family plain language
for (const [q, a] of [
  ["Is this like Prop?", "No. Tamarindo is not a REIT and should not own the homes on its own balance sheet."],
  ["Is this like Airbnb?", "Airbnb is a channel Ashoka might use. The product is credit translation plus a lease."],
  ["Is this like Wharton MBA math I can redo?", "Yes. It is PMT with a balloon plus a fee stack. The hard parts are law and conversion, not the annuity formula."],
  ["Can I invest five thousand dollars?", "No retail product is in the corpus. Intervest is the capital partner; OpCo seed is a private raise opinion."],
  ["Will the peso wipe me out?", "Client obligation is described in dollars. Local costs and sale prices have peso and dollar components. No hedge policy is written down."],
]) add(P.friend, q, a);

// Stakeholder / entity
for (const [q, a] of [
  ["What does Tamarindo US own?", "Brand, policy, servicing, templates, partner relationships. No properties."],
  ["What does Tamarindo-Intervest own?", "The homes via sucursal. Default and recovery risk. Pays capital its nine to twelve."],
  ["What does Tamarindo Colombia do?", "Title, notary, comodato admin, inspections, local filings. Cost center paid by US. About two people at the start."],
  ["Credit LLC versus thesis names?", "Aug 20 meetings used Tamarindo Credit LLC plus sucursal and Tamarindo Intervest LLC plus sucursal. Thesis uses Tamarindo US / Intervest / Colombia. Same jobs, wrappers not closed. Credit LLC not incorporated as of 20 Aug."],
]) add(P.stakeholder, q, a);

// Extra numeric drills so retrieval covers "hundreds" of phrasings.
const aumStops = [
  ["year 1 AUM", "Pilot target about twenty million. OPINION."],
  ["year 3 AUM", "Phase two zone about sixty to eighty million. OPINION. That is also the OpCo breakeven neighborhood."],
  ["year 7 AUM", "Phase three high end about four hundred million. OPINION."],
  ["year 10 AUM", "Phase four cartoon zero point seven to one billion. OPINION. Kill criteria can zero it."],
  ["homes in year 2", "About forty-five if the pilot works. OPINION."],
  ["homes in year 10", "Fifteen hundred plus in the rails cartoon. OPINION."],
  ["vehicles in year 4", "Two to three if cloning works. OPINION."],
  ["OpCo revenue year 1", "About zero point eight to one point two million. OPINION, and Dov’s 360k is only the spread line."],
  ["OpCo revenue year 10", "Twenty to thirty million at three percent of a 0.7–1B book. OPINION."],
];
for (const [q, a] of aumStops) {
  add(P.investor, `What is ${q}?`, a);
  add(P.founder, `Can we put ${q} in the deck?`, `${a} Only with the OPINION label and the kill criteria.`);
  add(P.friend, `Roughly ${q}?`, a);
}

const comps = [
  ["US 30-year versus Tamarindo", "Freddie Mac about 6.17 percent week of 21 Aug 2026 on US homes. Tamarindo ten to twelve is a dollar lease on Colombian collateral. Not the same product."],
  ["BanRep versus Tamarindo", "BanRep 9.25 percent as of 17 Jul 2026. Local housing credit often twelve to eighteen. Tamarindo is dollars."],
  ["70 percent local LTV versus 60 percent Tamarindo", "Local non-VIS mortgages often cap near 70 percent LTV. Tamarindo 60 percent is tighter on purpose."],
  ["Intervest 2+20 versus Tamarindo 2 percent", "2+20 is Intervest versus their LPs. Two percent activation is Tamarindo’s one-time on drawdown."],
  ["10 percent residual versus IRS 20 percent", "Meetings use a 10 percent of asset floor. Equipment true-lease guidelines often look for 20 percent residual. Not the same test. Counsel."],
  ["1.4 million versus 800 thousand prospects", "Pew 1.4 million is 2021 Colombian-origin Hispanics. 800k–1M Tier 1 is a meeting subset. Do not derive one from the other."],
  ["Dov 30k versus full stack", "Thirty thousand a month is spread share on the pilot. Full stack modeled about 3x. Do not deck the 30k as company revenue."],
  ["Poblado versus Cartagena rent offset", "ICP-1 about 35 percent of lease. ICP-2 about 31 percent average, 45 percent high season. ASSUMPTION."],
];
for (const [q, a] of comps) {
  add(P.investor, `Compare ${q}.`, a);
  add(P.prospect, `In plain English, ${q}?`, a);
  add(P.regulator, `Why does ${q} matter legally?`, `${a} Characterization and disclosure follow from which story you tell.`);
}

// Duplicate phrasings for retrieval (hundreds of questions)
const paraphrases = [
  ["How does the money flow on day one?", "Client wires forty percent. Vehicle draws sixty. Tamarindo US books two percent activation on the draw plus origination if any. Sucursal takes escritura. Client signs US lease and comodato."],
  ["How does money flow every month?", "Client pays the US lease. Tamarindo US keeps servicing and about twenty percent of the interest component, remits the rest to the vehicle. If pooled, Ashoka runs rent and the waterfall credits the client."],
  ["What happens in default?", "Cure window, then comodato termination, sucursal already has title, re-lease or sell. Down payment is the cushion. Two months lease / one month comodato in the meeting script."],
  ["What is Ashoka?", "Sister property manager and rental operator. Market PM, charge-through maintenance, executes the twenty percent rental-share decision from Aug 19."],
  ["What is a sucursal?", "Colombian branch of the funding vehicle that holds title. Not Tamarindo US."],
  ["What is the fee engine?", "Luca's silent catalog of every fee Tamarindo charges or pays. Uncited rates stay blank. Activation two percent may be filled because it is sourced."],
  ["Is title in the client's name?", "No. Title sits in the vehicle sucursal. The client has use plus a purchase option, not a Colombian mortgage in their name."],
  ["Who pays Colombian taxes on the house?", "Property tax, notary, and local costs are in the lease stack or pass-through. Vehicle and branch tax is a counsel question. Do not quote a DIY rate."],
  ["Can they sell in year three?", "Yes if docs allow assignment of the option. Residual and remaining payments still matter. Not a flip product."],
  ["Is the lease in pesos?", "Client obligation is described in dollars. Local bills may be pesos. FX is a residual risk, not a priced hedge yet."],
  ["What does 750 FICO actually gate?", "Who we will underwrite in the US box. Not a Colombian bureau score. Alternatives for thin files are unset."],
  ["Why forty percent down?", "Cushion, alignment, and a 60 percent LTV. Local banks often go to about 70. We stay tighter on purpose."],
  ["Why ten years not thirty?", "Dollar lease with a balloon, not a US 30-year. Balloon is the residual; term is a product choice."],
  ["Is Intervest exclusive?", "No exclusivity and no ROFR in the 18 Aug debrief. They can walk; we can shop."],
  ["What is a balloon in one sentence?", "A leftover principal due at term so monthly payments stay lower than a fully amortizing loan."],
  ["Walk me through PMT.", "Monthly rate times leftover present value, divided by one minus one-plus-r to the minus n. Excel PMT does it."],
];
for (const [q, a] of paraphrases) {
  for (const p of Object.values(P)) {
    if (p === "lawyer") continue;
    add(p, q, a);
  }
}

// Fix accidental lawyer persona
for (const row of qa) {
  if (row.persona === "lawyer") row.persona = P.regulator;
}

const byPersona = new Map();
for (const row of qa) {
  const list = byPersona.get(row.persona) ?? [];
  list.push(row);
  byPersona.set(row.persona, list);
}

function fileFor(persona, rows) {
  const title = {
    investor: "Investor questions",
    founder: "Founder and operator questions",
    stakeholder: "Stakeholder and entity questions",
    prospect: "Prospect and family-buyer questions",
    regulator: "Regulatory and counsel-shaped questions",
    friend: "Friends-and-family questions",
  }[persona];
  const parts = [
    `# ${title}`,
    "",
    `Persona tag: [${persona}]. Retrieval chunks are one question each.`,
    "",
  ];
  for (const row of rows) {
    parts.push(`### [${persona}] ${row.q}`);
    parts.push(row.a);
    parts.push("");
  }
  return parts.join("\n");
}

mkdirSync(OUT, { recursive: true });
const names = [];
for (const [persona, rows] of byPersona) {
  const file = `${persona}.md`;
  writeFileSync(path.join(OUT, file), fileFor(persona, rows));
  names.push({ persona, file, count: rows.length });
}

const index = [
  "# Q&A corpus for Nico",
  "",
  `Generated ${qa.length} question-answer pairs across ${names.length} personas.`,
  "Each `###` heading is one retrieval chunk. Re-run `node scripts/generate-qa-corpus.mjs` then `npm run knowledge:sync`.",
  "",
  ...names.map((n) => `- ${n.file}: ${n.count} ${n.persona} Qs`),
  "",
].join("\n");
writeFileSync(path.join(OUT, "README.md"), index);

console.log(`Wrote ${qa.length} Q&As`);
for (const n of names) console.log(`  ${n.file}: ${n.count}`);
