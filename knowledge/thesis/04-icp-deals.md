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
- **Financing:** 40% down ($168k) → funded $252k; 10y at ~11%, 15%
  residual → lease ≈ **$3,300/mo** (ASSUMPTION, model to confirm).
- **Rental:** furnished mid-term (1–6 mo executives/nomads) ≈ $2,200/mo
  gross at ~85% occupancy → ~$22.4k/yr gross (~5.3% gross yield).
- **Rental waterfall (ASSUMPTION):** −10% Ashoka mgmt −25% costs
  (HOA, predial, utilities, upkeep) −20% Tamarindo share of remainder →
  **net to client ≈ $1,170/mo → offsets ~35% of the lease payment.**
- **Liquidity:** deepest resale market of the three; est. 90–150 days.

## ICP-2 — "Cartagena Heritage" (Cartagena)

- **Property:** 1–2BR renovated apartment, 60–110 m², Old City historic
  building or premium Bocagrande/Castillo Grande tower.
  **Price:** $500–800k (anchor $650k).
- **Persona:** US investor-lifestyle buyer, 45–65; uses it 4–8 weeks/yr;
  explicitly wants the rental engine running the rest of the time.
- **Financing:** 40% down ($260k) → funded $390k; 10y at ~11%, 15%
  residual → lease ≈ **$5,100/mo** (ASSUMPTION).
- **Rental:** short-term, ADR ~$210 at ~62% occupancy → ~$47.5k/yr gross
  (~7.3% gross yield) — strong but seasonal and ops-heavy.
- **Waterfall (ASSUMPTION):** −20% Ashoka STR mgmt −30% costs (cleaning,
  utilities, HOA, predial, wear) −20% Tamarindo share → **net to client
  ≈ $1,580/mo → offsets ~31% of payment; up to ~45% in high season.**
- **Liquidity:** thinner, tourism-correlated; est. 150–270 days. Cap this
  ICP's portfolio share (OPINION: ≤40% of any vehicle).

## ICP-3 — "Llanogrande Country" (Rionegro / Oriente)

- **Property:** house/casa campestre, 200–350 m² on 1,000+ m² lot, gated
  community near the JMC airport corridor. **Price:** $600–900k
  (anchor $750k).
- **Persona:** retiree or remote-work family, 50–70; primary or
  near-primary residence; lifestyle-first, rental secondary.
- **Financing:** 40% down ($300k) → funded $450k; 10y at ~11%, 15%
  residual → lease ≈ **$5,900/mo** (ASSUMPTION).
- **Rental:** occasional — weekend/event/seasonal lets ≈ $18k/yr gross
  (~2.4% gross yield); many clients won't pool at all.
- **Waterfall:** net to client ≈ $700/mo when pooled → **offsets ~12% of
  payment.** This ICP is underwritten on client income, not rental.
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

- Activation 2% of $390k ≈ $7.8k + origination (TBD, assume 1% ≈ $3.9k)
- Servicing + 20% interest share ≈ $9–11k/yr early, declining ≈ $70k/10y
- Rental share (20%) + Ashoka mgmt (20% of gross) ≈ $14–17k/yr pooled
  ≈ $120k/10y when pooled most of the term
- **Total family take ≈ $190–210k per deal over 10 years — roughly half
  of it from the service layer, which is why Ashoka matters and why the
  rental pool is strategic, not incidental.**

## Client ROI story (the sales math to validate)

For ICP-2: client puts $260k down, pays ~$5,100/mo, receives ~$1,580/mo
rental credit → effective ~$3,520/mo for a $650k Old City apartment they
own the upside on, with an option to buy out the ~$58k residual at year
10. If Cartagena appreciates even modestly (ASSUMPTION: 3–4%/yr USD), the
client's equity outcome beats renting and beats waiting to save cash —
*that comparison table is the single most important sales artifact to
build and validate.*
