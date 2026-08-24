# 05 — The Fee Engine: Revenue, Take Rate, Breakeven, the Raise

*Revenue lines are sourced (six streams enumerated Aug 20; 2% activation,
~20% of billings, rental pool ~20% from Aug 19). Levels, take rates, and
the raise math are OPINION/ASSUMPTION for the financial model to confirm
— this file states the shape and the logic, not investor-grade numbers.*

## The six revenue lines (mapped to who earns them)

| # | Line | Earner | Type | Level (ASSUMPTION where unset) |
|---|------|--------|------|-------------------------------|
| 1 | Origination fee | Tamarindo US | one-time | TBD; assume ~1% of funded |
| 2 | Activation fee | Tamarindo US | one-time | 2% of capital drawdown (sourced) |
| 3 | Servicing fee | Tamarindo US | recurring | assume 75 bps of outstanding |
| 4 | Interest spread share | Tamarindo US | recurring | ~20% of interest billings (sourced) |
| 5 | Property mgmt charge-through | Ashoka | recurring | market rate + markup |
| 6 | Rental revenue share | Tamarindo US / Ashoka | recurring | ~20% of net rental (sourced) |

## Take rate: what $1 of AUM produces annually (OPINION)

On funded AUM at a ~11.84% blended client rate:

- Spread share: 20% × ~11.84% ≈ **237 bps**
- Servicing: ≈ **75 bps**
- Rental share + mgmt economics (blended across ICPs, ~55% of units
  pooled): ≈ **40–60 bps**
- **Recurring take ≈ 3.5–3.7% of funded AUM**, plus ~3% one-time
  (activation + origination) in the year a dollar is deployed.

Sanity check against sources: Dov's Aug 19 sketch of ~$30k/mo on the $20M
pilot (~$360k/yr) matches the spread-share line alone (237 bps × $15M
funded ≈ $355k). The full stack roughly triples that — the difference is
the servicing fee and the service layer, which is the thesis's margin
story.

## OpCo cost base and breakeven (OPINION)

Lean configuration per Aug 19 (~3 US + 2 CO) plus the tech cost model's
platform budget:

- Year-1 OpCo burn ≈ **$150–180k/mo** (~$1.8–2.2M/yr): team, platform
  build (Nico + servicing/billing), legal templates, compliance.
- Breakeven at a ~3.6% recurring take ⇒ **~$50–60M funded AUM** — the
  Phase-2 target zone (Year 3). Before that, one-time fees on each new
  vehicle's deployment shorten the gap in deployment years.

## The raise (OPINION — for the model and deck to finalize)

- **Ask:** ~$2.5–3.5M seed for Tamarindo US equity.
- **Buys:** 24 months of runway — through the full $20M pilot and into
  the first cloned vehicle, i.e., to the doorstep of breakeven.
- **Milestones it must fund:** legal opinions closed; 40–50 homes
  deployed and serviced; rental offset demonstrated with real statements;
  ≥1 recovery fire-drill; vehicle #2 signed.
- **Why equity investors win:** they own the fee machine, not the
  property risk. At Phase-4 scale ($0.7–1B AUM × ~3% take ≈ $20–30M
  revenue at servicer margins), the seed valuation math is the deck's
  closing argument.

## What the financial model must nail down (Ricardo's list, extended)

1. Client rate tests at 9 / 11 / 13% → conversion sensitivity.
2. Origination fee level and payer.
3. Rental offset per ICP with real comps (the 04 numbers are placeholders).
4. Default/recovery timeline and cost per event.
5. Vehicle waterfall: capital partner yield vs. Tamarindo retention,
   under base / downside / severe scenarios.
6. OpCo monthly cash: burn vs. fee ramp → exact raise size.
