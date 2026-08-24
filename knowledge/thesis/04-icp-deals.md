# 04 — ICP Deals: The Rotating Three

*The framework is per user direction (Aug 21): at any moment Tamarindo
works from exactly 3 active ICP deal profiles — property, price, location —
reviewed and rotated as portfolio data accumulates. Neighborhood anchors
come from the Aug 19 call (Cartagena: Old City, Bocagrande, Castillo
Grande; Medellín: Poblado, Envigado, Llanogrande/Rionegro). All rents,
yields, and costs below are ASSUMPTIONS to validate with market data
before any investor use.*

> **MODEL OVERRIDE (Ricardo, 2026-08-23):** homes do NOT rent the full
> term — people want to enjoy their homes in Colombia. Each ICP has its
> own **share-of-time-rented** variable (`icp.<id>.rentedTimePct`,
> default 30%, user-editable for what-ifs). All rentals are short-term
> but **never shorter than one month** — no nightly stays. Rent is priced
> as **% of property value per month** (`rentalMonthlyPctOfValue`,
> default 0.55%/mo ≈ 6.6%/yr gross), scaled per ICP by a rental-strength
> factor (ICP-3 Llanogrande rents at 40% of the standard rule). The
> waterfall is mgmt fee → operating costs → 20% of the remainder to
> Tamarindo → rest credits the client. The nightly-ADR framing for ICP-2
> below is superseded by monthly-minimum pricing.

## Why exactly three (OPINION)

Three is enough to cover distinct buyer personas and rental profiles, and
few enough that underwriting, appraisal review, and Ashoka's operations
stay standardized. An ICP is a *permission slip*: if a prospective deal
doesn't match an active ICP, it isn't done — that is how the box stays
tight while volume grows. Review quarterly; retire an ICP when its data
disappoints or its market saturates; promote a candidate ICP in its place.

## The ICP template (every ICP defines these)

| Field | Meaning |
|-------|---------|
| Property | Type, size, condition, building profile |
| Price band | Purchase price range (USD) |
| Location | City + specific neighborhoods |
| Buyer persona | Who leases it and why |
| Financing shape | Down %, funded amount, term, residual |
| Rental profile | Channel (STR/mid/long), expected occupancy |
| Rental offset | % of lease payment covered by net rental |
| Liquidity test | Days-to-resell if recovered (the vehicle's safety) |

## ICP-1 — "Poblado Executive" (Medellín)

- **Property:** 2–3BR apartment, 100–160 m², estrato 6, doorman building
  with amenities, move-in ready. **Price:** $350–500k (anchor $420k).
- **Location:** El Poblado (Provenza, Los Balsos), Envigado (Zúñiga).
- **Persona:** Colombian-American professional, 35–55, buying a family
  base / eventual retirement home; visits 6–10 weeks/yr now.
- **Financing:** 40% down ($168k) → funded $252k; 10y at **11.84%
  effective** (11.5% base + FICO blend), balloon $84k (20% of asset) →
  lease ≈ **$3,223/mo** (model output).
- **Rental:** furnished mid-term, one-month minimum, rented **30% of the
  time** → gross **$2,310/mo when occupied** (0.55% of value) ≈ $8.3k/yr
  actual gross ($27.7k/yr if it never sat empty).
- **Rental waterfall (model):** −20% Ashoka mgmt ($462) −25% costs
  ($578, HOA/predial/utilities/upkeep) → $1,270 remainder; −20% Tamarindo
  share ($254) → **net to client $1,016/mo when occupied ≈ $305/mo
  averaged over the year → offsets ~9% of the lease payment.**
- **Liquidity:** deepest resale market of the three; est. 90–150 days.

## ICP-2 — "Cartagena Heritage" (Cartagena)

- **Property:** 1–2BR renovated apartment, 60–110 m², Old City historic
  building or premium Bocagrande/Castillo Grande tower.
  **Price:** $500–800k (anchor $650k).
- **Persona:** US investor-lifestyle buyer, 45–65; uses it 4–8 weeks/yr;
  explicitly wants the rental engine running the rest of the time.
- **Financing:** 40% down ($260k) → funded $390k; 10y at **11.84%
  effective** (11.5% base + FICO blend), balloon $130k (20% of asset) →
  lease ≈ **$4,988/mo** (model output).
- **Rental:** short-term with a one-month minimum, rented **30% of the
  time** → gross **$3,575/mo when occupied** ≈ $12.9k/yr actual gross
  ($42.9k/yr at full occupancy) — the strongest of the three, but
  seasonal and ops-heavy.
- **Waterfall (model):** −20% Ashoka mgmt ($715) −25% costs ($894,
  cleaning/utilities/HOA/predial/wear) → $1,966 remainder; −20% Tamarindo
  share ($393) → **net to client $1,573/mo when occupied ≈ $472/mo
  averaged → offsets ~9% of payment; more in high season.**
- **Liquidity:** thinner, tourism-correlated; est. 150–270 days. Cap this
  ICP's portfolio share (OPINION: ≤40% of any vehicle).

## ICP-3 — "Llanogrande Country" (Rionegro / Oriente)

- **Property:** house/casa campestre, 200–350 m² on 1,000+ m² lot, gated
  community near the JMC airport corridor. **Price:** $600–900k
  (anchor $750k).
- **Persona:** retiree or remote-work family, 50–70; primary or
  near-primary residence; lifestyle-first, rental secondary.
- **Financing:** 40% down ($300k) → funded $450k; 12y at **11.34%
  effective** (11% base + FICO blend), balloon $150k (20% of asset) →
  lease ≈ **$5,238/mo** (model output).
- **Rental:** occasional — the rental-strength factor is **0.4** (this
  market rents at 40% of the standard rule), so gross **$1,650/mo when
  occupied**, rented 30% of the time ≈ $5.9k/yr actual gross. Many
  clients won't pool at all.
- **Waterfall (model):** −20% mgmt −25% costs → $908 remainder; −20%
  Tamarindo ($182) → **net to client $726/mo when occupied ≈ $218/mo
  averaged → offsets ~4% of payment.** This ICP is underwritten on client
  income, not rental.
- **Liquidity:** growing market (airport proximity) but slower;
  est. 180–300 days. OPINION: ≤25% of any vehicle.

## Portfolio shape for the $20M pilot (OPINION)

| ICP | Homes | Capital | Rationale |
|-----|-------|---------|-----------|
| ICP-1 Poblado | ~20 | ~$5.0M funded | volume + liquidity backbone |
| ICP-2 Cartagena | ~15 | ~$5.9M funded | yield story + rental proof |
| ICP-3 Llanogrande | ~9 | ~$4.1M funded | income-quality diversifier |
| **Total** | **~44** | **~$15M funded** (~$25M asset value at 60% LTV) | |

(Deployment of the $20M includes fees, reserves, and furnishing float;
exact split is a financial-model output, not an input.)

## Lifetime value per deal (the number that matters)

Illustrative 10-year value to the Tamarindo family per ICP-2 deal
(ASSUMPTION-heavy; the financial model owns the real version):

- Activation 2% of $390k ≈ $7.8k + origination 1% ≈ $3.9k + insurance
  commission ≈ $1.6k
- Lifetime interest on the lease ≈ $338.6k; **Tamarindo's 20% strip ≈
  $67.7k**, plus servicing 75 bps/yr on the declining balance ≈ $21.5k
- Rental at 30% time rented: Tamarindo's 20% share ≈ $14.2k/10y and
  Ashoka's 20% mgmt fee ≈ $25.7k/10y
- **Total family take ≈ $140–145k per deal over 10 years — about 45% of
  it from the service layer (servicing, rental share, Ashoka mgmt,
  insurance), which is why Ashoka matters and why the rental pool is
  strategic, not incidental.**

## Client ROI story (the sales math to validate)

For ICP-2: client puts $260k down and pays **$4,988/mo** (model output).
The rental credit is **$1,573/mo in a month the unit is actually rented** —
but at 30% time rented that averages **~$472/mo**, so the honest effective
cost is **~$4,516/mo averaged** (~$3,415/mo in a rented month) for a $650k
Old City apartment they own the upside on. At year 10 the purchase option
is **$130,000** — 20% of the asset, the true-lease floor (thesis 07), not a
token buyout; the client must plan to fund or refinance it. If Cartagena
appreciates even modestly (ASSUMPTION: 3–4%/yr USD), the client's equity
outcome beats renting and beats waiting to save cash — *that comparison
table is the single most important sales artifact to build and validate.*

**Sell the averaged number, not the occupied one (OPINION).** Quoting
"$3,415/mo" without saying the unit rents 30% of the time is the fastest
way to lose a client in year two. Lead with $4,516 and let the rental
credit be upside.
