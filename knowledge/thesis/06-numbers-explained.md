# 06 — Every Tamarindo number, explained

*Working ledger plus outside context. Internal figures: Granola (Jun–Aug
2026), 7 Aug overview, 18 Aug debrief, thesis 01–05. Outside figures
checked 23 Aug 2026. **FACT** = Tamarindo source or named public page.
**CONTEXT** = public market/legal fact, not a Tamarindo promise.
**OPINION** / **ASSUMPTION** as in the rest of the thesis.*

Do not paste CONTEXT into a deck as if Intervest produced it. Nico uses it
to answer “does this number even make sense?”

## Three money layers (never mix them)

| Layer | What it is | Example |
|---|---|---|
| Vehicle capital | Intervest buying apartments | $10M + $10M |
| OpCo equity | Cash to run Tamarindo US | ~$2.5–3.5M seed (OPINION) |
| Client cash | Down payment + lease + residual | 40% + ~11% + 10–20% balloon |

Intervest **2+20** is their fund vs their LPs. Tamarindo **2% activation**
is a one-time fee on drawdown. Tamarindo **~20% of interest billings** is
a spread share. Saying “we are 2 and 20” in a client meeting is how the
18 Aug debrief got confused.

## Capital — Intervest test

**$20M total test (FACT).** Kickoff: **$10M Medellín + $10M Cartagena**.
Later: first **$10M provisional**, second **$10M on KPIs**. Not one
unconditional $20M cheque.

**Capital price ~9–12% (FACT)** is the vehicle yield, not the client rate.

**No exclusivity, ROFR only (FACT).** A second vehicle is allowed. That is
the Year 2–4 multiply thesis.

**CONTEXT — Intervest.** InterVest Capital Partners (intervest.com, 23 Aug
2026) presents as specialty finance + real estate, 100% employee-owned,
**26+ years**, **160+ vehicles**, **$25B+ funds/accounts**. CEO **Michael
Gontar**. Commercial Observer (figures to 1 Mar 2025) reported **$10.4B
AUM** and **$2.5B originated** in the prior twelve months. Do not put
$25B+ “funds/accounts” and $10.4B AUM on the same slide without saying
they are different yardsticks. Meetings said “~$25B fund.” Treat $25B as
marketing headline until Intervest gives a current fact sheet.

**CONTEXT — 2+20** is GP economics on a PE/credit fund. Not Tamarindo’s
take.

## Product box

| Term | Working number | Grade | Outside check |
|---|---|---|---|
| Down payment | 40% minimum | FACT | Colombia non-VIS mortgages often cap near **70% LTV** (CONTEXT). Tamarindo is stricter. |
| Max LTV | 60% | FACT | Early overview said 50–65%; Aug 20 box is 60%. |
| FICO | 750+ / Tier 1, SSN, individuals at launch | FACT | CONTEXT: 800+ is a thin tail of US scores; 750+ is already “very good.” Pilot is cream, not mass. |
| Term | ~10 years | FACT | Closer to a finance lease than a 30-year mortgage. |
| Client rate | 10–12% WTP; model ~11%; tests 9/11/13% | MIXED | See rates. |
| Residual | Floor ≥10% of asset; meetings ~20%; ICP 15% of funded | MIXED | See true lease. |
| Prepay | Allowed, no penalty | FACT | |
| Lease default | 2 months → repossess; deposit forfeited | FACT | Unlitigated. |
| Comodato default | 1 month eviction vs rental desahucio | FACT as described | Counsel must confirm procedure. |
| Title + appraisal | $700–800, client-paid, no markup | FACT | Not a US domestic appraisal comp. |
| Offer window | 5–7 business days | FACT | |
| Closing | 30–45 days after 40% wire; no walk | FACT | Colombian escritura often takes weeks. |
| Hard pull | After intent only | FACT | |

**STALE unless revived:** 50–65% LTV, FICO ≥760, 5–20 first deals. Live
box: 60% LTV, 750+, ~45 homes.

## Rates — US vs Colombia vs Tamarindo

Open question: will a 750+ FICO US person pay **10–12% dollars** to
control a Colombian home?

**CONTEXT — US prime mortgage.** Freddie Mac PMMS, week of 21 Aug 2026:
30-year fixed **~6.17%**. That is US collateral, 30-year amortizing. It is
the opportunity-cost anchor, not a competing product.

**CONTEXT — BanRep.** Intervention rate **9.25%** as of the 17 Jul 2026
decision (BanRep site, retrieved 23 Aug 2026). Quote the date; it moves.

**CONTEXT — Colombian housing credit, mid-2026.** Superintendencia
coverage (La República, to 19 Jun 2026): non-VIS mortgages roughly
**11.8–17.7% E.A.**, weighted average ~**15.2%**; housing leasing non-VIS
~**14.7%**. Foreigners with no local income are often at the expensive end
or declined. Practitioner guides still quote **70% max LTV** non-VIS,
**80% VIS**.

If Tamarindo’s 10–12% clears, it is far above a US mortgage (expected),
in the neighborhood of a peso mortgage a non-resident often cannot get,
in dollars, on a US-law lease, against an asset the vehicle already owns.
Conversion at that rate is unproven. That is the kill criterion.

## Balloon, residual, true lease

Meetings: balloon must be **material** so the contract stays a lease, not
a loan, and Tamarindo is not a bank. Floor **≥10% of asset**; likely
**~20%** given 40% deposit; ICP sheets **15% of funded**.

**CONTEXT — IRS equipment true-lease (Rev. Proc. 2001-28).** Common
lessor reading: residual **≥20% of cost**, remaining life **≥20%**, no
bargain purchase option, lessor equity/profit tests. **A 10% residual is
below that equipment safe harbor.** Real estate ≠ equipment. Nico must
not say “10% residual makes this a true lease under IRS rules.” Counsel
owns characterization.

**CONTEXT — ASC 842** uses a different finance vs operating test. Residual
size alone does not decide it.

**CONTEXT — Colombia leasing habitacional** already exists at banks, often
higher LTV than mortgages, rates in the mid-teens. Tamarindo is not that
product: title in a sucursal, US-law payment, comodato for use.

**Payment formula** (level payment, balloon `FV`):

`PMT = [PV − FV/(1+r)^n] × r / [1 − (1+r)^(−n)]`

with `r = i/12`, `n` months. Excel `=PMT(i/12, n, -PV, FV)`.

Worked **ICP-1 (ASSUMPTION):** PV $252k, i 11%, n 120, FV $37.8k.
`(1.009167)^120 ≈ 3.00`, PV of balloon ≈ $12.6k, amortize ≈ $239k,
**PMT ≈ $3,300/mo**. Month-1 interest ≈ $2,310; Tamarindo’s 20% of
interest ≈ **$462** that month, declining. That is why Dov’s ~$30k/mo on
the whole pilot matches **spread share**, not the full stack.

## Six fees

| # | Line | Number | Grade | Plain English |
|---|---|---|---|---|
| 1 | Origination | ~1% of funded; payer TBD | ASSUMPTION | US brokers often 0–2% of amount. |
| 2 | Activation | **2% of drawdown** | FACT | $450k draw → $9k. |
| 3 | Servicing | ~75 bps outstanding | ASSUMPTION | US residential servicing often 25–50+ bps; 75 is a placeholder. |
| 4 | Spread share | **~20% of interest billings** | FACT | 11% client rate → ~220 bps of outstanding to Tamarindo on this line. |
| 5 | PM | market + possible markup | MIXED | STR PM often 15–25% of gross; mid-term 8–12%. |
| 6 | Rental share | **~20% of net** if pooled | FACT | After PM and opex. |

**Take on $1 funded AUM at ~11% (OPINION):** 220 + 75 + 40–60 bps ≈
**3.3–3.5% recurring**, plus ~3% one-time in the deploy year.

**Dov sketch (FACT as sketch):** ~$30k/mo on $20M ≈ 220 bps × $15M funded.
Full stack modeled ~3×.

**Y1 burn $150–180k/mo (OPINION).** Breakeven **$55–65M** funded AUM
(OPINION). Seed **$2.5–3.5M / 24 months** (OPINION). Salaries unset.

## ICPs and $20M mix

CONTEXT: 2026 luxury sketches put El Poblado apartments roughly
**$0.22–0.76M** and Bocagrande/Castillo Grande from the high-$100ks into
**$1M+**. Tamarindo $350–900k is the international-buyer slice, not the
Medellín median.

| ICP | Anchor | Funded @60% | Homes (OPINION) | Funded $ | Lease/mo (ASSUMPTION) | Rent (ASSUMPTION) |
|---|---|---|---|---|---|---|
| 1 Poblado | $420k ($350–500k) | $252k | ~20 | ~$5.0M | ~$3,300 | $2,200 × ~85% occ → ~$22.4k/yr; net ~$1,170 (~35% of lease) |
| 2 Cartagena | $650k ($500–800k) | $390k | ~15 | ~$5.9M | ~$5,100 | ADR ~$210 × ~62% → ~$47.5k/yr; net ~$1,580 (~31%, ~45% high season) |
| 3 Llanogrande | $750k ($600–900k) | $450k | ~9 | ~$4.1M | ~$5,900 | ~$18k/yr occasional; net ~$700 (~12%) |
| **Pilot** | | | **~44** | **~$15M / ~$25M assets** | | $20M includes fees, reserves, furnishing |

Caps (OPINION): Cartagena ≤40% of a vehicle; Llanogrande ≤25%.

**ICP-2 10-year family take ~$190–210k (ASSUMPTION).** Entities file also
walks a **$750k** Cartagena round number ($9k activation). Not the $650k
ICP-2 sheet.

## Ten-year path (forward OPINION)

| Phase | Years | AUM | Homes | Vehicles | OpCo revenue |
|---|---|---|---|---|---|
| 1 Pilot | 1–2 | $20M | ~45 | 1 | ~$0.8–1.2M |
| 2 Multiply | 2–4 | $60–80M | ~150–180 | 2–3 | ~$2–2.5M |
| 3 Marketplace | 4–7 | $150–400M | 350–900 | 4–6 | $5–12M |
| 4 Rails | 7–10 | $0.7–1B | 1,500+ | 8–10 | $20–30M |

Kill tests: conversion at 10–12% fails; recovery unenforceable; rental
offset not 30–55%; 5 people cannot run ~50 homes.

## Market size — do not stack

| Claim | Number | What it is |
|---|---|---|
| Pew ACS 2021 Colombian-origin Hispanics | ~1.4 million | Origin group. Founding overview used this. |
| 2024 origin estimates | ~1.6–1.8 million | ACS-derived origin counts. |
| MPI ACS 2021 Colombian *immigrants* | ~855,000 | Foreign-born only. |
| Meetings “Tier 1 prospects” | ~800k–1.0 million | Credit subset. **Not** a sourced funnel from 1.4M. |
| Debrief | Do not derive 800k from 1.4M | Warning |

MPI 2017–21: ~35% FL, 13% NY, 11% NJ. Hunt there.

## Team, tax, calendar

**~3 US + ~2 Colombia** (intent). Tom **5–10 hrs/week**. Rosario Davi, Tom
Herman, Natalia Carvajal, Boris Mulett, Andrés Sierra, Ivan Arias, Mike
Gontar, Ricardo on the model.

**CONTEXT — Colombia CIT 35%** (PwC / Deloitte 2025). Financials may pay
**+5% surcharge through 2027**. Branch remittances can face extra **20%**
after CIT. Meetings said “was 19% pre-Petro.” Headline now is **35%**.
Client Colombian tax / US write-off: **counsel**.

Weekly **4pm Eastern**. Mike week after Labor Day 2026 (**~8 Sep**).

Early PoC **$5–20M / 10–30 leases: STALE.**

## Sources retrieved 23 Aug 2026

- intervest.com and intervest.com/people/michael-gontar/
- Commercial Observer, Gontar & Rothschild (AUM/origination to Mar 2025)
- Pew Colombian-origin Latinos fact sheet (2021 ACS)
- Migration Policy Institute, Colombian immigrants in the US
- Banco de la República monetary policy (9.25% print)
- La República / Superfinanciera housing rates (Jun 2026)
- PwC Worldwide Tax Summaries Colombia; Deloitte Colombia Tax Highlights 2025
- Código Civil art. 2200; MinJusticia LegalApp; CSJ on gratuitous comodato
- IRS Rev. Proc. 2001-28 (equipment true-lease; 20% residual)
- Freddie Mac PMMS week of 21 Aug 2026
- TheLatinvestor 2026 Medellín / Cartagena price sketches (CONTEXT only)
