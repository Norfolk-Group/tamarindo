# 22 — Tamarindo Credit LLC fee schedule

**Who this is for:** Tamarindo Credit, LLC builds the model. Norfolk AI
was hired to build Nico and the engine. Norfolk AI is not Credit, not a
capital partner, and has no seat on the deal.

**Purpose:** every industry-standard fee Credit **is paid** and every
fee Credit **pays** has a blue lever. Defaults are **$0 / 0%** except
the live book already signed or seeded (activation 2%, origination 1%,
servicing 75 bps, spread 20%, insurance 40 bps, Colombia client
closing / diligence / admin). Zero means “on the schedule, not yet
turned on” — not “does not exist.”

Never call Credit’s own origination a broker fee. Referring-partner
**cost** is a cost line.

## Already live (non-zero seeds)

| Lever | Default | Who |
|-------|---------|-----|
| `activationFeePct` | 2% of draw | Credit is paid (FACT) |
| `originationFeePct` | 1% of funded | Credit is paid (ASSUMPTION) |
| `servicingBps` | 75 bps of outstanding | Credit is paid (ASSUMPTION) |
| `spreadSharePct` | 20% of interest | Credit is paid (FACT) |
| `insuranceCommissionPct` | 40 bps of new funded | Credit is paid (ASSUMPTION) |
| `coClosingFeeUsd` | $2,200 / home close | Sucursal, client |
| `coInspectionFeeUsd` | $400 / home close | Sucursal, client |
| `coAdminPerLeaseUsd` | $120 / home / month | Sucursal, client |
| `rentalTamarindoSharePct` | 20% of net rent | Credit is paid |

## On the book at zero (turn on when scheduled)

**Credit is paid:** application, document/admin, credit-report recovery,
title study, wire/ACH, late, NSF, statement, modification, assumption,
extension, payoff quote, purchase-option processing, disposition,
early-payoff protection (policy today is **no** penalty — leave at 0),
default/workout, collection, minimum servicing top-up, forced-place
markup.

Each event fee has an **incidence** lever (share of active leases per
month). Both the dollar and the incidence must be non-zero to book cash.

**Credit pays:** unused-line / commitment on undrawn warehouse, FX hedge
(thesis 20 — must exist; 0 until a quote), referring-partner cost (% of
funded and/or $ / close), bureau/KYC, backup servicer, subservicer/tech,
UCC/filing, outbound wire, notary/registro.

## Fair and complete

Fair: do not invent a late-fee schedule or a hedge quote. Complete: the
lever is there so Credit does not leave money on the table or forget a
cost Intervest will bill. Statements show the lines even at $0.
