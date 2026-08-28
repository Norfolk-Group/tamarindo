# 19 — Platform economics (seeds, research, calculated)

*WhatsApp / slide 2026-08-26 is a **partial** source. Nico has Launch Team
people-facts from that channel; this fee note is a later paste, not a full
export. Complement it with thesis 05 / 06 / 09 / 12 / 13 and the kickoff
fee list. Do not let one chat replace the book.*

**Grade:** FACT that the six revenue lines exist and that activation is 2% of
draw and spread share is ~20% of interest (meetings + 05). ASSUMPTION that
**live model seeds** stay at research-calibrated **1% origination** and
**75 bps servicing** until a signed schedule. WhatsApp percentages are
**additional seeds / negotiation ranges**, not a second book. Dollar examples
are **calculated** from `funded × rate` (and decline with outstanding).

Tamarindo originates a **US-law lease**, not a bank mortgage. A “$500k
mortgage” in the WhatsApp note is a funded-ticket analogy.

## What is a variable vs what is calculated

| Kind | Keys / formula | Notes |
|------|----------------|--------|
| Variable (sourced) | `activationFeePct` = 2% of draw | FACT — do not overwrite from WhatsApp |
| Variable (sourced) | `spreadSharePct` ≈ 20% of interest | FACT — do not overwrite from WhatsApp |
| Variable (research seed) | `originationFeePct` live **1%** of funded | 04 / 13 waterfall; meetings left the level unset |
| Variable (research seed) | `servicingBps` live **75 bps** of outstanding / year | 07 / 12 / 13 IRR book; 09 market check 75–200 bps |
| Variable (WhatsApp seed) | origination ask **1.50%**; proposal **125–150 bps**; stretch **~2%** | Same key if you load it; not the live default |
| Variable (WhatsApp seed) | servicing ask **40 bps**; proposal **35–40 bps**; stretch **50 bps**; slide band 25–40 bps | Same |
| Variable (cost seed) | subservicer / tech **$15–$40+ / loan / month** | ASSUMPTION, scale-dependent; not in the engine |
| Calculated | `originationUsd = funded × originationFeePct` | $7,500 only if funded is $500k **and** the seed is 1.50% |
| Calculated | year-1 servicing gross ≈ `funded × servicingBps`, then **declines** | Engine: `Σ monthly outstanding × servicingBps / 12` |
| Calculated | year-1 origination + servicing (before cost) | WhatsApp ≈ $9,500 at 1.50% + 40 bps on $500k |
| Variable (complete book, default $0) | late, NSF, application, document, title, min servicing, unused line, FX hedge, referring-partner cost, … | Thesis 22. Blue levers. Zero ≠ missing. |

## Research already on the shelf (keep)

- **Six lines** (05, kickoff): origination, activation, servicing, spread
  share, Ashoka PM, rental share. Levels for origination and servicing were
  never signed.
- **Activation 2% + spread ~20%** are the durable Intervest-side terms (09).
  “2 and 20” is the *manager’s* LP fee, not Tamarindo’s take.
- **~1% origination + 75 bps servicing** are the model seeds used in 04, 07,
  12, and 13. Vehicle IRR tables in 12 assume 75 bps. That work is not stale.
- **Market check (09):** equipment-finance forward-flow servicing often
  **75–200 bps**. That band **includes** both the 75 bps seed and sits above
  the WhatsApp 40 bps ask — so 40 bps is a lean bank-side ask, not a market
  midpoint.
- **Kickoff CONTEXT:** a white-label MAC-style servicer was sketched at
  **2–5% per transaction** — a different product shape (per-deal, not bps of
  outstanding). Use as a ceiling check, not a live input.
- Referring **brokers** are a *cost* to model if they exist. Tamarindo’s own
  origination take is not a broker fee.

## WhatsApp / slide seeds (complement, do not replace)

Slide “Economics to your platform” (R2
`library/kb/raw/chat/2026-08-26/economics-to-your-platform.png`):

| Line | Seed | Use |
|------|------|-----|
| Origination | target 1.50%; likely 1.00–1.50% | Negotiation ask / scenario |
| Annual servicing | target 40 bps; likely 25–40 bps | Same |
| Delinquent / default | additional, separate schedule | Off-model |
| Early payoff protection | yes, 6–12 months | Off-model |
| Ancillary / late fees | negotiate share vs retain | Off-model |

Chat note (same day, bank-analogy):

- Frame as an **outsourced origination and servicing platform** (acquisition,
  intake, package, verification, closing, post-close) — not a referral.
- Possible **proposal:** 125–150 bps at funded closing + 35–40 bps servicing,
  plus delinquent/foreclosure pay and a **minimum servicing fee per loan**.
- **40 bps is revenue, not margin.** Subservicer/tech $15–$40+/loan/month plus
  compliance.
- **MSR ownership** (saleable) vs pay-to-subservice: only if the contract
  says so.
- **Stretch ask** if the cross-border work is heavier: ~2% + 50 bps.

## Calculated $500k ticket (same formulas, different seeds)

`year1Gross ≈ funded × originationFeePct + funded × servicingBps`
(servicing then amortizes down; this is the opening-balance sketch).

| Seed set | Origination | Y1 servicing | Y1 gross before cost |
|----------|-------------|--------------|----------------------|
| Research / live | 1.00% → $5,000 | 75 bps → $3,750 | **$8,750** |
| WhatsApp target ask | 1.50% → $7,500 | 40 bps → $2,000 | **$9,500** |
| WhatsApp proposal mid | 1.375% → $6,875 | 37.5 bps → $1,875 | **$8,750** |
| Stretch | 2.00% → $10,000 | 50 bps → $2,500 | **$12,500** |

None of those dollars are facts. They are the formula at $500k funded, with
**no principal on Tamarindo’s balance sheet**.

At $500k average balance, even 40 bps ($2,000/yr ≈ $167/mo) can clear a
$15–$40 subservicer invoice; at small balances a **minimum per-loan fee**
matters. Do not invent a margin until a vendor quote exists.

## How to talk about it

- Quote **live variables** (`originationFeePct`, `servicingBps`) when asked
  what the model uses. Today that is **1% / 75 bps**.
- Quote WhatsApp / slide numbers only as **asks, ranges, or a scenario**.
- Never say “broker fee” for Tamarindo’s own origination take.
- The complete fee book is on the model (thesis 22). Quote live keys.
  Do not invent a dollar where the lever is still $0.
- Never invent an MSR value.
- Recurring take shape (05): spread 20% × client rate + **live servicing** +
  rental/PM 40–60 bps. At 11.84% and **75 bps**: ≈ 237 + 75 + 40–60 ≈
  **3.5–3.7% of funded AUM**, plus one-time activation 2% + live origination.
  Swap servicing to 40 bps only when walking the WhatsApp scenario.
