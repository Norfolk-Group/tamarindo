# Tamarindo — complete business and engine spec for Excel

**Download:** Nico → Statements → **Excel spec**, or
`GET /api/nico/spec` (signed-in). Filename `tamarindo-excel-spec.md`.
Paste this whole file into Claude for Excel.

**Audience:** Claude for Excel (or any modeler) rebuilding Nico’s live
workbook. Recreate the **same calculations and the same four statement
books**. Do not invent a raise, an exit IRR, or a legal conclusion.

**Canonical code:** `lib/model/engine.ts`, `lib/model/contracts.ts`,
`lib/model/money.ts`, `lib/model/engine-statements.ts`,
`lib/model/variables.ts` (+ fees / ops / equity), `lib/model/icp-catalog.ts`,
`lib/model/capital-kpis.ts`, `lib/model/equity.ts`, `lib/model/returns.ts`,
`lib/model/fee-catalog.ts`. Thesis: `knowledge/thesis/01`–`22`.

**Generated:** 2026-09-02 from the shipped seed defaults. Percents in the
app are typed as `40` meaning 40%. In this file, percent **seeds** are
already converted (e.g. `40%` = `0.40` in Excel).

**Labels:** FACT / CONTEXT / OPINION / ASSUMPTION. Zeros on the fee book
are levers, not omissions.

**Do not discuss** anyone’s personal or legal history. Seats and roles only.

---

## 1. How to use this file

1. Build **one Inputs sheet** with every key in §11. Blue cells = user
   (visibility `user`). Grey = admin.
2. Build **one Contracts sheet**: ten ICPs, computed funded / residual /
   monthly lease from §6.
3. Build **120 monthly columns** (or 120 rows) for Nov 2026 → Oct 2036.
   Originate, service, and roll books as in §7.
4. Roll months into **10 fiscal years** (Nov–Oct) as in §2.
5. Produce **four statement books** (§8): Tamarindo US, Tamarindo Colombia
   (sucursal), Consolidated OpCo, Tamarindo-Intervest vehicle.
6. Produce **Returns** (unit vehicle IRR + OpCo cash-on-cash) and
   **Sensitivity** (shock one blue lever, rerun). Do **not** invent an
   exit year or an exit IRR.
7. Money is **USD, bank cents** (`ROUND(x, 2)` half-up). Use Excel `PMT`
   and `IRR` as specified. Use `decimal.js` precision if you leave JS.

Nico’s reports to match:

| Report | What to print |
|--------|----------------|
| Statements | Direct-method cash flow, four entities, FY columns |
| Income | Cash-basis OpCo P&L = US operating receipts − payments (not accrual) |
| Returns | Per-ICP vehicle IRR; book vehicle IRR; OpCo cash-on-cash |
| Sensitivity | Shock down / balloon floor / spread / activation; FY1 & FY10 cash |
| Structure | Entity map — not engine math (thesis 02) |

---

## 2. Fiscal period

Not a calendar year.

| Item | Seed |
|------|------|
| Plan open | **November 2026** (`planStartYear=2026`, `planStartMonth=11`) |
| Horizon | **120 months** = 10 fiscal years (`horizonMonths=120`) |
| FY window | November → October |
| FY1 | Nov 2026 – Oct 2027 |
| FY10 | Nov 2035 – Oct 2036 |
| Month index | `0` = Nov 2026 |

Label: `FY{n} · {Mon} {openYear}–{Mon} {closeYear}`.

Engine steps **monthly**, then sums 12 months into each FY. Opening cash
of FY1 is 0. Closing cash = opening + CFO + CFI + CFF.

---

## 3. What Tamarindo is

**A US-law lease-to-own origination and servicing platform.** A prime US
credit file becomes the right to use a Colombian hard asset (homes first)
while a **replaceable funding vehicle holds title**. The client signs a
US-law lease, puts ~40% down, occupies under **comodato**, and faces a
**material balloon**. InterVest is the **first warehouse**, not the
product.

Not a mortgage. Not Colombian *leasing habitacional*. Not a broker. Never
call Credit’s origination a “broker fee.” Referring-partner cost is a
**cost**.

**OPINION — three identities, in order:**

1. **Fee machine, not a lender.** OpCo never owns the house. Capital
   partners own the asset and earn the base yield. Credit earns layered
   fees: origination, activation, servicing, interest spread, rental
   share, later PM via Ashoka.
2. **Rails company.** Durable asset is the legal + ops machinery
   (sucursal title, comodato + US lease + option, recovery, underwriting,
   servicing). Vehicle #1 is a template for vehicles #2..N.
3. **Lifestyle product.** Use US credit to occupy a Colombian home; rent
   it when away. Default rented-time 30%. Tamarindo keeps ~20% of net
   rent.

**10-year arc (thesis 03 / 10):** prove ~45 homes on a $20M Intervest
pilot (Y1–2); OpCo breakeven near $60M AUM (Y3, OPINION); more vehicles
after Intervest exclusivity (Y3–5); corridors and aircraft in the last
three FYs. Year-10 **funded AUM** goal: **$100M property / $30M auto /
$20M aircraft**. Intervest walks a KPI curve to **$75M (50%)**; three
simulated partners share the other $75M.

---

## 4. The four companies (legal map vs model books)

**Hard line (FACT):** Tamarindo Credit does **not** own Tamarindo
Intervest. Intervest / Global owns 100% of the vehicle. Credit **manages**
it. There is **no** “Tamarindo Colombia Inc.” Each US LLC has its **own**
Colombian sucursal. Ashoka is a **sister**, not OpCo.

The Excel family (same as Nico’s four tabs) is:

| Book | Legal identity | Owns assets? | On OpCo cap table? |
|------|----------------|--------------|--------------------|
| **Tamarindo US** | Tamarindo Credit, LLC (Delaware OpCo) | Never | Yes — this is the raise |
| **Tamarindo Colombia (sucursal)** | Credit’s Colombian branch (model: one for-profit sucursal book) | No | No third company |
| **Consolidated** | US + Colombia, **eliminate** the US→CO mandate | — | OpCo cash |
| **Tamarindo-Intervest** | Tamarindo Intervest, LLC + its sucursal (title) | Yes | **No** — counterparty |

**Ashoka** is the fourth company in the family. It does **not** get a
cash-flow tab. Its STR fee and repair markup sit as **memo** on US /
consolidated. Do not consolidate Ashoka into OpCo cash.

### 4.1 Tamarindo Credit, LLC (OpCo / “US”)

Delaware. Brand, app, underwriting, servicing, billing, partner
relationship. Lean core. **Earns:** activation 2% of draw (FACT),
origination 1% of funded (ASSUMPTION), servicing 75 bps of outstanding
(ASSUMPTION), ~20% of interest (FACT), insurance commission 40 bps of new
funded (ASSUMPTION), 20% of net rental remainder (OPINION). **Pays:**
named US payroll, US desks, mandate to Colombia, ancillary costs (most $0
until scheduled). **Financed by** three priced equity rounds — **not**
the Intervest warehouse.

### 4.2 Tamarindo Intervest, LLC (vehicle #1)

Delaware. **100% Intervest-owned.** The **US lease lives here**. Client
wires **down + monthly + balloon** to this company. Its **Sucursal
Colombia buys and holds title**. Default / recovery sits on that title,
cushioned by ~40% down / 60% LTV. Pilot: $10M Medellín + $10M Cartagena
(FACT). Intervest exclusive first **three fiscal years**, then ROFR, not
exclusivity. Future `Tamarindo-[Partner] LLC` clones this template.

**Vehicle cash is not OpCo payroll and is not on the cap table.**

### 4.3 Tamarindo Credit, Sucursal Colombia

Branch of Credit — local ops: bills, repairs, PM liaison, notary,
comodato admin. **MODEL OVERRIDE (Ricardo 2026-08-23):** the cash-flow
book treats a **for-profit** Colombia that bills clients (closing,
diligence, monthly admin) plus a US mandate. It may run cash-flow
negative while thin. That is a model choice, **not** a third legal
entity. Intervest’s sucursal (title) is **not** this P&L.

### 4.4 Ashoka (sister)

Property management, maintenance, rental pool. Related-party: market
rates, disclosed, terminable. **Earns** ~20% of gross STR (ASSUMPTION)
and repair markup ~15%. Vehicle LPs will read the contract. Sloppy
Ashoka is a diligence red flag.

---

## 5. Who pays whom (money on one deal)

Illustrative **ICP-1** (engine, thesis 13): $420k home, 40% down, 120
months, 11.5% + FICO blend ≈ **11.84%**, balloon **20% of asset = $84k**,
monthly lease **$3,223**.

| Step | Payer | Payee | What |
|------|-------|-------|------|
| Close | Client | Intervest vehicle (US) | ~40% down ($168k). Vehicle sucursal buys the asset. Seller gets $420k day 0. |
| Close | Vehicle | Seller | Full ticket. Warehouse draws the funded slice ($252k). |
| Close | Vehicle / client (model: Credit books the fee) | **Credit US** | Activation **2% of draw** ($5,040). Origination **1% of funded** ($2,520). Insurance **40 bps of funded** ($1,008). |
| Close | Client | **Credit sucursal** | Closing $2,200 + inspection $400. |
| Close | Credit US | Credit sucursal | Mandate **$1,000 per home close** + **$20,000/mo** retainer (eliminated in consolidation). |
| Monthly | Client | Vehicle (Credit bills / services) | US-law lease. Credit keeps servicing + 20% of interest; **remits the rest** to the vehicle. |
| Monthly | Client | Credit sucursal | $120 admin / home / month. |
| When rented | Guest | Ashoka waterfall | Default **30% of time**. Gross → Ashoka mgmt 20% → opex 25% → Tamarindo 20% of remainder → client credit. |
| Exit | Client | Vehicle | Residual balloon. Title leaves the Intervest sucursal (*escritura* / RUNT — thesis 17). |
| Default | — | Intervest sucursal | Comodato ends. Title already here. Down payment is the cushion. |

**Lifetime ICP-1 (engine, thesis 13 — do not invent new IRRs):**

| Party | Puts in | Takes out |
|-------|---------|-----------|
| Client | ~$664k over 10 years | The $420k home if they exercise |
| Vehicle | $252k day 0 | ~$413k back ≈ **9.08% vehicle IRR** |
| Credit US | desks | ~$75.3k fees + strip + rental share |
| Credit sucursal | closings / field | ~$17k client fees + $1k mandate |

---

## 6. Lease math (must match Excel PMT)

Use **decimal half-up cents**. Annual rate / 12 = monthly rate.

### Homes (ICP-1…6)

```
down = ROUND(purchase * downPaymentPct, 2)
funded = ROUND(purchase - down, 2)          // 60% LTV at 40% down
residual = MAX(funded * residualOfFundedPct, purchase * minResidualOfAssetPct)
effectiveRate = baseClientRate + blendedFicoSpread
monthlyLease = PMT(effectiveRate/12, termMonths, -funded, residual)
```

Excel: `=PMT(rate, nper, -pv, fv)` — same as `lib/model/money.ts` `pmt`.

**Blended FICO spread (defaults ≈ +34 bps):**

```
spread = ficoTier1SharePct * ficoTier1SpreadPct
       + ficoTier2SharePct * ficoTier2SpreadPct
       + ficoTier3SharePct * ficoTier3SpreadPct
```

Seeds: 50% at +75 bps (750–779), 35% at 0 (780–809), 15% at −25 bps (810+).

**Gross rent / Tamarindo rental share (homes only):**

```
grossRent = purchase * rentalMonthlyPctOfValue * rentFactor
tamarindoSharePerMonth = ROUND(grossRent * (1 - ashokaMgmtFeePct - rentalCostsPct) * rentalTamarindoSharePct, 2)
rentalThisMonth = ROUND(tamarindoSharePerMonth * icp.rentedTimePct, 2)
```

### Autos

LTV **80%**. Residual **20% of ticket**. Rate = ICP base + FICO blend.
`PMT` on funded → residual. Mix AUTO-1 / AUTO-2.

### Aircraft

LTV **70%**. Residual **25% of ticket**. Same PMT. Mix AIR-1 / AIR-2.
Aviation is **out of this Intervest warehouse** (Aug 26 box) — the model
still books a late-horizon aircraft book as a planning goal.

---

## 7. Monthly engine (the algorithm)

For `m` in `0 … horizonMonths-1`:

### 7.1 Capacity

```
intervestLine = kpi path (below) or legacy
partnerLine   = three simulated vehicles after exclusivity
committed     = intervest + partners
capacity      = useKpiCapitalCurve ? committed : committed * targetUtilizationPct
```

**KPI Intervest line (useKpiCapitalCurve=1):**

- Months `< tranche2MonthIndex` (seed 6): **$10M** (`lineTranche1Usd`) only.
- Then FY-end millions: `20, 25, 30, 40, 48, 55, 62, 68, 72, 75` scaled so
  FY10 = `fy10IntervestLineUsd` (seed $75M).

**KPI other partners:** `fy10PartnerLineUsd` / 3 each. Start months 36 /
60 / 84. Ramp 40% → 70% → 100% after 0 / 24 / 48 months on book.

**Product AUM ceilings** (refuse an origination that would breach):

| Book | FY weights (share of FY10 goal at each FY close) |
|------|--------------------------------------------------|
| Home | 0.16, 0.28, 0.38, 0.50, 0.60, 0.70, 0.80, 0.88, 0.95, 1 |
| Auto | 0.06, 0.16, 0.28, 0.40, 0.53, 0.67, 0.80, 0.90, 0.97, 1 |
| Aircraft | 0, 0, 0, 0, 0, 0, 0, 0.35, 0.70, 1 |

Also refuse if `currentOutstanding + newFunded > capacity`.

### 7.2 Home originations

Planned count by calendar month:

| When | Count keys |
|------|------------|
| Nov 2026 | `stubNovCount` = 2 |
| Dec 2026 | `stubDecCount` = 2 |
| Jan `januaryCohortYear` (2027) | `januaryCount` = 1 |
| Feb–Dec 2027 | `ramp2027.feb` … `ramp2027.dec` (2 → 5) |
| 2028+ | `min(maxOriginationsPerMonth, ROUND(postPilotMonthlyBase * (1+postPilotAnnualGrowthPct)^yearsAfter2028))` |

**ICP pick:** first five vintages **fixed**: ICP-1, ICP-5, ICP-2, ICP-4,
ICP-6. After that, weighted mix of the six home ICPs (`originatedIndex %
100` against cumulative mix × 100).

On each successful home close, book:

```
activation += funded * activationFeePct
origination += funded * originationFeePct
insurance  += funded * insuranceCommissionPct
vehicle: assetPurchase += ticket; fundedNew += funded; clientDown += ticket - funded
```

### 7.3 Autos and aircraft

Autos start `autoStartMonth` (6). Wanted = max(homesThisMonth ×
`autoMultipleX10`/10, floor(auto AUM headroom / blend funded)), cap
`autoMaxPerMonth`. Alternate AUTO-1 / AUTO-2 by mix.

Aircraft: `aircraftPerYear` after `aircraftStartMonth` (84), pick AIR-1 /
AIR-2 by mix. Same activation / origination / insurance on **funded**.

### 7.4 Service each live lease

```
interest  = ROUND(outstanding * monthlyRate, 2)
last      = (age == termMonths - 1)
principal = last ? outstanding - residual : MIN(payment - interest, outstanding)
collected = last ? interest + principal + residual : payment
usSpread  = ROUND(interest * spreadSharePct, 2)
usServicing = ROUND(outstanding * servicingBps / 12, 2)
remit     = MAX(0, collected - usSpread - usServicing)
outstanding -= principal
if last: balloon += residual; drop the lease
```

Homes also add `rentalThisMonth` (above).

**Agency memo (not OpCo CFO):** `leaseCollected`, `remitted`.

### 7.5 Opex

If `useDepartmentOpex=1` (seed): named US + Colombia desks from §11
People groups, including CS growth (`dept.csHomesPerRep`), sales growth,
founder half-pay for `founderPayHalfMonths`. Else lumps
`usMonthlyOpexUsd` / `sucursalMonthlyOpexUsd` + per-lease.

### 7.6 Colombia client fees + mandate

```
intercompany = (usMandateMonthlyUsd + sucursalClosingFeeUsd * homesClosedThisMonth) * (1 + sucursalCostPlusPct)
coClosing    = coClosingFeeUsd * homesClosedThisMonth
coInspection = coInspectionFeeUsd * homesClosedThisMonth
coAdmin      = coAdminPerLeaseUsd * activeHomes
```

### 7.7 Ancillary fees (most $0)

See `FEE_LINES` in `lib/model/fee-catalog.ts` and `applyAncillaryFees`.
A dollar fee **and** its incidence must both be non-zero to book cash.
Referring-partner cost is **out**, never labeled broker fee.

### 7.8 Ashoka memo (not OpCo cash)

```
pooled = Σ (rentedTimePct of live homes) * rentalPoolOptInPct
ashokaFee    = pooled * ashokaGrossRentUsd * ashokaMgmtFeePct
ashokaRepair = pooled * ashokaRepairUsd * (1 + ashokaRepairMarkupPct)
```

### 7.9 Equity in month m

`seedEquityUsd` in month 0 (seed **$0** — unused). Plus priced rounds
when `m == equityRoundNMonth` and amount > 0.

Seeds: R1 $2.0M at $10M pre, month 0; R2 $2.25M at $15M pre, month 12;
R3 $2.25M at $20M pre, month 24; R4 off. Five equal partners; Intervest
**not** on the cap table. Each founder starts 20%, diluted by
`amount / (pre + amount)` each round.

---

## 8. Statement identities (match Nico)

Direct method. IAS 7 / ASC 230 spirit. **Cash, not accrual.**

### Tamarindo US — CFO

```
+ activation + origination + servicing + spread + rental + insurance
+ Σ feeIn − Σ feeOut − usOpex − intercompany (mandate to Colombia)
CFI = 0
CFF = equity proceeds
```

Memo: agency collections / remittance, lines, AUM, originations, Ashoka.

### Tamarindo Colombia — CFO

```
+ intercompany + coClosing + coInspection + coAdmin − sucursalOpex
CFI = 0, CFF = 0
```

### Consolidated OpCo — CFO

```
US receipts + Colombia client fees + feeIn
− feeOut − usOpex − sucursalOpex
```

**Eliminate** the US mandate (`intercompany` is memo only). CFF = equity.
Vehicle warehouse cash is **not** here.

### Tamarindo-Intervest — not consolidated

```
CFO = clientDown + remitted − activation − origination
CFI = −assetPurchase
CFF = fundedNew   // warehouse draw
```

Split remittance into ex-balloon vs balloon on the printed book.

**Closing cash** each FY: `opening + CFO + CFI + CFF`.

---

## 9. Returns and sensitivity

### Unit vehicle IRR (one ICP)

Month-0 vehicle flow: `−funded − activation − origination`.  
Months 1..term: remittance as in §7.4 (last month includes balloon).  
`IRR` of that series, then **effective annual** `(1+monthly)^12 − 1`.  
If Excel cannot solve, leave **blank** — do not invent.

### Book vehicle IRR

Annual net change in vehicle cash (10 FY points). Same IRR rule.

### OpCo cash-on-cash

`Σ US CFO over 10y / Σ equity in`. **Not** an exit IRR.

### Sensitivity

Rerun the full engine shocking **one** blue lever at a time (down,
balloon floor, spread, activation). Do **not** save shocks. Show FY1
cash, FY10 cash, ICP-1 lease, ICP-1 vehicle IRR.

---

## 10. Named seats (roles only)

Five **equal partners** at t=0; **names not assigned** to the 20%
equity seats (thesis 11). Norfolk AI builds Nico; it is **not** Credit
and **not** a capital partner.

| Name | Function | On OpCo payroll? |
|------|----------|------------------|
| Dov Tuzman | Founder / Managing Director. Capital partners and the Intervest relationship. | Yes — Credit US (`pay.dovLoadedUsd`) |
| Rosario Davi | Finance Director. Deck, numbers, HITL on the book. | Yes (`pay.rosarioLoadedUsd`) |
| Ricardo Cidale | Director of Planning and Corporate Development. Model and Nico. Also MD of Norfolk AI (vendor). | Yes (`pay.ricardoLoadedUsd`) |
| Tom Herman | Director of Information Systems. Platform / credit-stack (part-time at launch). | Yes (`pay.tomLoadedUsd`) |
| Boris Mulett | General Manager, Colombia. Closings and the local book. | Yes (`pay.gmLoadedUsd`) |
| Andrés Sierra | Director of Business Development, Colombia. | Yes (desk, not a named pay key) |
| Iván Arias | Government Relations, Colombia. | Yes (desk) |
| Natalia Carvajal | Director of Marketing, Colombia. | **No** — OpCo loaded pay $0 |
| Jesi Gomes | Director of Business Development, Colombia. | **No** — OpCo loaded pay $0 |
| Michael Gontar | Intervest counterpart. | **No** |
| Juan Pablo Hoyos | Stakeholder, Colombia channels. | **No** until titled |

Founder US named pay is **50% for the first 8 months**
(`founderPayHalfMonths`, `founderPayHalfPct`).

---

## 11. Complete variable catalog (live seeds)

Percents shown already converted. `user` = blue. `admin` = grey.

### Capital

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `lineTranche1Usd` | Intervest first tranche | 10000000 | usd | user | FACT | Intervest $10M Medellín line |
| `lineTranche2Usd` | Intervest second tranche | 10000000 | usd | user | FACT | Second $10M on KPIs (Cartagena) |
| `tranche2MonthIndex` | Second tranche month (0 = Nov 2026) | 6 | integer | user | ASSUMPTION | May 2027 — six months after first closings |
| `lineStepUpPct` | Line step-up every 6 months (X) | 20% | percent | admin | OPINION | Legacy only — unused while useKpiCapitalCurve=1. KPI path is thesis 10. |
| `lineStepUpEveryMonths` | Months between step-ups | 6 | integer | admin | ASSUMPTION | Warehouse review cadence |
| `targetUtilizationPct` | Target line utilization | 85% | percent | admin | ASSUMPTION | Leave headroom on the commitment |
| `useKpiCapitalCurve` | Use KPI capital curve (1) or old X% step-up (0) | 1 | integer | admin | ASSUMPTION | KPI path to $75M Intervest + $75M other vehicles by FY10 — thesis 10 |

### Lease

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `downPaymentPct` | Client down payment | 40% | percent | user | FACT | 40% down; complement of 60% max LTV |
| `residualOfFundedPct` | Residual of funded | 15% | percent | admin | ASSUMPTION | 15% of funded — non-binding since the 20%-of-asset floor is larger at 60% LTV |
| `minResidualOfAssetPct` | Purchase option floor (% of asset cost) | 20% | percent | user | FACT | Rev. Proc. 2001-28: residual ≥20% of original cost; UCC 1-203 bars nominal options. Raised from 10% (Ricardo 2026-08-23) so the lease is never read as a mortgage. Counsel to validate. |

### Fees

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `activationFeePct` | Activation fee of draw | 2% | percent | user | FACT | 2% of capital drawdown — US |
| `originationFeePct` | Origination fee of funded | 1% | percent | user | ASSUMPTION | Research seed 1% of funded (04/13). WhatsApp ask 1.50%; proposal 125–150 bps; stretch 2%. Same variable. |
| `servicingBps` | Servicing of outstanding | 0.75% | percent | user | ASSUMPTION | Research seed 75 bps (12/13; market 75–200). WhatsApp ask 40 bps; proposal 35–40; stretch 50. Revenue ≠ margin. |
| `spreadSharePct` | US share of interest | 20% | percent | user | FACT | ~20% of interest billings stay at US |

### Rental pricing

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `rentalMonthlyPctOfValue` | Gross monthly rent as % of property value | 0.55% | percent | user | ASSUMPTION | 0.55%/mo ≈ 6.6%/yr gross. Furnished, monthly-minimum stays (no nightly). Validate with comps before investor use. |
| `rentalCostsPct` | Rental operating costs of gross rent | 25% | percent | admin | ASSUMPTION | HOA, predial, utilities, cleaning, upkeep |
| `rentalTamarindoSharePct` | Tamarindo share of net rental remainder | 20% | percent | user | OPINION | 20% of what is left after mgmt fee and costs; client keeps the rest |

### OpCo

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `seedEquityUsd` | US seed equity (month 0) | 0 | usd | admin | OPINION | Unused in the base case — three priced rounds ($2.0M / $2.25M / $2.25M) replace the lump seed. The VARIABLE_DEFS note still says “$1M”; ignore that string. |
| `usMonthlyOpexUsd` | US monthly opex | 130000 | usd | admin | OPINION | US share of $165k midpoint burn — lump, not salaries |
| `useDepartmentOpex` | Use department payroll (1) or US/Colombia lumps (0) | 1 | integer | admin | ASSUMPTION | 1 replaces the $130k/$35k lumps with named desks |

### Colombia

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `sucursalMonthlyOpexUsd` | Colombia fixed monthly opex | 35000 | usd | admin | OPINION | Lean Colombia desk inside the $165k family burn — lump, not salaries. For-profit P&L; not a reimbursement wash. |
| `sucursalPerContractUsd` | Colombia variable opex per active lease | 150 | usd | admin | ASSUMPTION | Local execution allocation |
| `sucursalClosingFeeUsd` | US mandate per close (intercompany) | 1000 | usd | admin | ASSUMPTION | US pays Colombia for vehicle closing work. Not a full opex wash. |
| `sucursalCostPlusPct` | Mandate cost-plus | 0% | percent | admin | ASSUMPTION | Markup only on the US mandate, not on Colombia opex |
| `usMandateMonthlyUsd` | US monthly mandate to Colombia | 20000 | usd | admin | ASSUMPTION | Retainer for the Colombia desk. Does not reimburse full opex — Colombia must earn the rest. |
| `coClosingFeeUsd` | Colombia closing fee (client) | 2200 | usd | user | ASSUMPTION | Client-paid local closing / comodato coordination. Separate from $700–800 vendor title/appraisal. |
| `coInspectionFeeUsd` | Colombia diligence fee (client) | 400 | usd | user | ASSUMPTION | Client-paid inspection / diligence per close |
| `coAdminPerLeaseUsd` | Colombia admin per active lease / month | 120 | usd | user | ASSUMPTION | Client-paid local administration (comodato, filings, liaison) |

### Origination

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `januaryCohortYear` | January cohort year | 2027 | integer | admin | ASSUMPTION | Treated as January 2027 after Nov/Dec 2026. Dial to 2026 only for a backdated vintage. |
| `stubNovCount` | Contracts in November 2026 | 2 | integer | admin | ASSUMPTION | Pilot open |
| `stubDecCount` | Contracts in December 2026 | 2 | integer | admin | ASSUMPTION | Pilot open |
| `januaryCount` | Contracts in January cohort | 1 | integer | admin | ASSUMPTION | Fifth contract |
| `postPilotMonthlyBase` | Monthly originations after Dec 2027 | 5 | integer | admin | OPINION | Exit-2027 run-rate |
| `postPilotAnnualGrowthPct` | Post-pilot origination growth / year | 15% | percent | user | OPINION | After the 2027 ramp |
| `maxOriginationsPerMonth` | Cap on originations / month | 10 | integer | admin | ASSUMPTION | Ops capacity |

### Horizon

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `planStartYear` | Plan start year | 2026 | integer | admin | FACT | November 2026 open |
| `planStartMonth` | Plan start month (1–12) | 11 | integer | admin | FACT | November |
| `horizonMonths` | Horizon (months) | 120 | integer | admin | ASSUMPTION | 10 fiscal years Nov–Oct |

### ICP contracts

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `icp.icp1.purchasePriceUsd` | ICP-1 Poblado Executive purchase price | 420000 | usd | admin | ASSUMPTION | Thesis ICP-1; 10-year term. Poblado $/m² band confirmed Jun 2026.. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp1.termMonths` | ICP-1 Poblado Executive term (months) | 120 | integer | admin | ASSUMPTION | Thesis ICP-1; 10-year term. Poblado $/m² band confirmed Jun 2026.. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp1.clientRate` | ICP-1 Poblado Executive client rate | 11.5% | percent | admin | ASSUMPTION | Thesis ICP-1; 10-year term. Poblado $/m² band confirmed Jun 2026.. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp1.mixWeight` | ICP-1 Poblado Executive mix weight | 25% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp1.rentedTimePct` | ICP-1 Poblado Executive share of time rented | 30% | percent | admin | OPINION | People enjoy their homes; per-ICP. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp1.rentFactor` | ICP-1 Poblado Executive rental strength vs standard pricing | 100% | percent | admin | ASSUMPTION | 1 = standard %-of-value rule; ICP-3 rents weakly. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp2.purchasePriceUsd` | ICP-2 Cartagena Heritage purchase price | 650000 | usd | admin | ASSUMPTION | Thesis ICP-2; 10-year term. Coastal $/m² band confirmed 2026.. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp2.termMonths` | ICP-2 Cartagena Heritage term (months) | 120 | integer | admin | ASSUMPTION | Thesis ICP-2; 10-year term. Coastal $/m² band confirmed 2026.. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp2.clientRate` | ICP-2 Cartagena Heritage client rate | 11.5% | percent | admin | ASSUMPTION | Thesis ICP-2; 10-year term. Coastal $/m² band confirmed 2026.. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp2.mixWeight` | ICP-2 Cartagena Heritage mix weight | 18% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp2.rentedTimePct` | ICP-2 Cartagena Heritage share of time rented | 30% | percent | admin | OPINION | People enjoy their homes; per-ICP. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp2.rentFactor` | ICP-2 Cartagena Heritage rental strength vs standard pricing | 100% | percent | admin | ASSUMPTION | 1 = standard %-of-value rule; ICP-3 rents weakly. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp3.purchasePriceUsd` | ICP-3 Llanogrande Country purchase price | 750000 | usd | admin | ASSUMPTION | 12-year term — not all leases are 10 years. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp3.termMonths` | ICP-3 Llanogrande Country term (months) | 144 | integer | admin | ASSUMPTION | 12-year term — not all leases are 10 years. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp3.clientRate` | ICP-3 Llanogrande Country client rate | 11% | percent | admin | ASSUMPTION | 12-year term — not all leases are 10 years. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp3.mixWeight` | ICP-3 Llanogrande Country mix weight | 12% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp3.rentedTimePct` | ICP-3 Llanogrande Country share of time rented | 30% | percent | admin | OPINION | People enjoy their homes; per-ICP. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp3.rentFactor` | ICP-3 Llanogrande Country rental strength vs standard pricing | 40% | percent | admin | ASSUMPTION | 1 = standard %-of-value rule; ICP-3 rents weakly. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp4.purchasePriceUsd` | ICP-4 Bocagrande Tower purchase price | 480000 | usd | admin | ASSUMPTION | 7-year lifestyle term; Bocagrande $/m² band 2026. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp4.termMonths` | ICP-4 Bocagrande Tower term (months) | 84 | integer | admin | ASSUMPTION | 7-year lifestyle term; Bocagrande $/m² band 2026. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp4.clientRate` | ICP-4 Bocagrande Tower client rate | 12.5% | percent | admin | ASSUMPTION | 7-year lifestyle term; Bocagrande $/m² band 2026. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp4.mixWeight` | ICP-4 Bocagrande Tower mix weight | 18% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp4.rentedTimePct` | ICP-4 Bocagrande Tower share of time rented | 30% | percent | admin | OPINION | People enjoy their homes; per-ICP. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp4.rentFactor` | ICP-4 Bocagrande Tower rental strength vs standard pricing | 100% | percent | admin | ASSUMPTION | 1 = standard %-of-value rule; ICP-3 rents weakly. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp5.purchasePriceUsd` | ICP-5 Envigado Family purchase price | 310000 | usd | admin | ASSUMPTION | 8-year smaller ticket — volume backbone with ICP-1. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp5.termMonths` | ICP-5 Envigado Family term (months) | 96 | integer | admin | ASSUMPTION | 8-year smaller ticket — volume backbone with ICP-1. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp5.clientRate` | ICP-5 Envigado Family client rate | 12% | percent | admin | ASSUMPTION | 8-year smaller ticket — volume backbone with ICP-1. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp5.mixWeight` | ICP-5 Envigado Family mix weight | 17% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp5.rentedTimePct` | ICP-5 Envigado Family share of time rented | 30% | percent | admin | OPINION | People enjoy their homes; per-ICP. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp5.rentFactor` | ICP-5 Envigado Family rental strength vs standard pricing | 100% | percent | admin | ASSUMPTION | 1 = standard %-of-value rule; ICP-3 rents weakly. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp6.purchasePriceUsd` | ICP-6 Castillo Grande Coastal purchase price | 580000 | usd | admin | ASSUMPTION | 9-year coastal; Castillo Grande $/m² band 2026. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp6.termMonths` | ICP-6 Castillo Grande Coastal term (months) | 108 | integer | admin | ASSUMPTION | 9-year coastal; Castillo Grande $/m² band 2026. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp6.clientRate` | ICP-6 Castillo Grande Coastal client rate | 11.5% | percent | admin | ASSUMPTION | 9-year coastal; Castillo Grande $/m² band 2026. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp6.mixWeight` | ICP-6 Castillo Grande Coastal mix weight | 10% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp6.rentedTimePct` | ICP-6 Castillo Grande Coastal share of time rented | 30% | percent | admin | OPINION | People enjoy their homes; per-ICP. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.icp6.rentFactor` | ICP-6 Castillo Grande Coastal rental strength vs standard pricing | 100% | percent | admin | ASSUMPTION | 1 = standard %-of-value rule; ICP-3 rents weakly. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto1.purchasePriceUsd` | AUTO-1 Andes Family Prado purchase price | 102000 | usd | admin | FACT | Prado TX-L list Mar 2026; 48-month lease. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto1.termMonths` | AUTO-1 Andes Family Prado term (months) | 48 | integer | admin | FACT | Prado TX-L list Mar 2026; 48-month lease. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto1.clientRate` | AUTO-1 Andes Family Prado client rate | 14.5% | percent | admin | FACT | Prado TX-L list Mar 2026; 48-month lease. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto1.mixWeight` | AUTO-1 Andes Family Prado mix weight | 40% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto2.purchasePriceUsd` | AUTO-2 City Hybrid CX-30 purchase price | 33000 | usd | admin | FACT | CX-30 GT hybrid list 2026; 36-month lease. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto2.termMonths` | AUTO-2 City Hybrid CX-30 term (months) | 36 | integer | admin | FACT | CX-30 GT hybrid list 2026; 36-month lease. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto2.clientRate` | AUTO-2 City Hybrid CX-30 client rate | 14.5% | percent | admin | FACT | CX-30 GT hybrid list 2026; 36-month lease. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.auto2.mixWeight` | AUTO-2 City Hybrid CX-30 mix weight | 60% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air1.purchasePriceUsd` | AIR-1 Andes Caravan purchase price | 2200000 | usd | admin | ASSUMPTION | Used Grand Caravan mid-band 2026; 7-year term. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air1.termMonths` | AIR-1 Andes Caravan term (months) | 84 | integer | admin | ASSUMPTION | Used Grand Caravan mid-band 2026; 7-year term. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air1.clientRate` | AIR-1 Andes Caravan client rate | 9.5% | percent | admin | ASSUMPTION | Used Grand Caravan mid-band 2026; 7-year term. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air1.mixWeight` | AIR-1 Andes Caravan mix weight | 80% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air2.purchasePriceUsd` | AIR-2 Caribbean Light Jet purchase price | 11500000 | usd | admin | ASSUMPTION | Phenom 300E mid-ask Aug 2026; 10-year term. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air2.termMonths` | AIR-2 Caribbean Light Jet term (months) | 120 | integer | admin | ASSUMPTION | Phenom 300E mid-ask Aug 2026; 10-year term. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air2.clientRate` | AIR-2 Caribbean Light Jet client rate | 9.5% | percent | admin | ASSUMPTION | Phenom 300E mid-ask Aug 2026; 10-year term. Admin-only Ideal Contract Profile — edit under Admin → ICPs |
| `icp.air2.mixWeight` | AIR-2 Caribbean Light Jet mix weight | 20% | percent | admin | OPINION | Mix inside this asset class. Admin-only Ideal Contract Profile — edit under Admin → ICPs |

### Credit pricing

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `ficoTier1SharePct` | Share of clients FICO 750–779 | 50% | percent | admin | OPINION | Intervest sets rate policy; blended ≈ +34 bps |
| `ficoTier2SharePct` | Share of clients FICO 780–809 | 35% | percent | admin | OPINION | Intervest sets rate policy; blended ≈ +34 bps |
| `ficoTier3SharePct` | Share of clients FICO 810+ | 15% | percent | admin | OPINION | Intervest sets rate policy; blended ≈ +34 bps |
| `ficoTier1SpreadPct` | FICO 750–779 rate spread | 0.75% | percent | admin | OPINION | +75 bps for 750–779. Intervest sets rate policy; blended ≈ +34 bps |
| `ficoTier2SpreadPct` | FICO 780–809 rate spread | 0% | percent | admin | OPINION | Intervest sets rate policy; blended ≈ +34 bps |
| `ficoTier3SpreadPct` | FICO 810+ rate spread | -0.25% | percent | admin | OPINION | Reward tier. Intervest sets rate policy; blended ≈ +34 bps |

### 2027 ramp

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `ramp2027.feb` | 2027 feb originations | 2 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.mar` | 2027 mar originations | 2 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.apr` | 2027 apr originations | 3 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.may` | 2027 may originations | 3 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.jun` | 2027 jun originations | 3 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.jul` | 2027 jul originations | 4 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.aug` | 2027 aug originations | 4 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.sep` | 2027 sep originations | 4 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.oct` | 2027 oct originations | 5 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.nov` | 2027 nov originations | 5 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |
| `ramp2027.dec` | 2027 dec originations | 5 | integer | admin | OPINION | Grow through 2027 to ~45 homes — thesis pilot band |

### Year-10 goals

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `fy10HomeAumUsd` | Year-10 property book (funded AUM) | 100000000 | usd | admin | OPINION | Ricardo goal 2026-08-23 — funded outstanding, not purchase price |
| `fy10AutoAumUsd` | Year-10 auto book (funded AUM) | 30000000 | usd | admin | OPINION | Ricardo goal 2026-08-23 |
| `fy10AircraftAumUsd` | Year-10 aircraft book (funded AUM) | 20000000 | usd | admin | OPINION | Ricardo goal 2026-08-23 — last three fiscal years |
| `fy10IntervestLineUsd` | Year-10 Intervest committed line | 75000000 | usd | admin | OPINION | 50% of the $150M book — inside the $50–100M scale band from Intervest conversations |
| `fy10PartnerLineUsd` | Year-10 other partners (3 vehicles combined) | 75000000 | usd | admin | OPINION | Three simulated sources after Intervest exclusivity |

### People US

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `pay.dovLoadedUsd` | Dov Tuzman MD loaded / month | 26973 | usd | admin | ASSUMPTION | Cash $25k + FICA/Medicare + single health — 09 §3 |
| `pay.rosarioLoadedUsd` | Rosario Davi Finance loaded / month | 16805 | usd | admin | ASSUMPTION | Cash $15k loaded — 09 §3 |
| `pay.ricardoLoadedUsd` | Ricardo Cidale Ops loaded / month | 26973 | usd | admin | ASSUMPTION | Cash $25k loaded — 09 §3 |
| `pay.tomLoadedUsd` | Tom Herman CTO loaded / month | 16805 | usd | admin | ASSUMPTION | Cash $15k loaded — 09 §3 |
| `dept.us.credit.loadedUsd` | US Credit loaded / FTE / month | 8500 | usd | admin | ASSUMPTION | Underwriter / credit analyst |
| `dept.us.credit.fte` | US Credit FTE | 1 | integer | admin | ASSUMPTION | Starts lean |
| `dept.us.success.loadedUsd` | US Customer Success loaded / FTE / month | 7200 | usd | admin | ASSUMPTION | Phones, email, WhatsApp — founder channel |
| `dept.us.success.fte` | US Customer Success base FTE | 2 | integer | admin | ASSUMPTION | Grows with book |
| `dept.csHomesPerRep` | Active homes per CS / service rep | 40 | integer | admin | ASSUMPTION | Adds FTE as the book grows |
| `dept.channelPerRepUsd` | WhatsApp + voice / rep / month | 100 | usd | admin | ASSUMPTION | 09 §5 telephony + WhatsApp reserve |
| `dept.us.service.loadedUsd` | US Customer Service loaded / FTE / month | 6400 | usd | admin | ASSUMPTION | Collections and inbound |
| `dept.us.service.fte` | US Customer Service base FTE | 1 | integer | admin | ASSUMPTION | Grows with book |
| `dept.us.legal.loadedUsd` | US Legal / paperwork loaded / FTE / month | 12000 | usd | admin | ASSUMPTION | Counsel + closings paper |
| `dept.us.legal.fte` | US Legal FTE | 1 | integer | admin | ASSUMPTION | AI-first still needs paper |
| `dept.us.legal.contractorUsd` | US Legal contractors / month | 4000 | usd | admin | ASSUMPTION | Outside counsel / notaries |
| `dept.us.it.loadedUsd` | US IT (ex-CTO) loaded / FTE / month | 12000 | usd | admin | ASSUMPTION | On top of Tom — Excel roster |
| `dept.us.it.fte` | US IT extra FTE | 2 | integer | admin | ASSUMPTION | VP Eng / PM style seats from the tech Excel |
| `dept.us.finance.loadedUsd` | US Finance extra loaded / FTE / month | 8000 | usd | admin | ASSUMPTION | On top of Rosario |
| `dept.us.finance.fte` | US Finance extra FTE | 1 | integer | admin | ASSUMPTION | Controller / AP |
| `dept.us.accounting.loadedUsd` | US Accounting loaded / FTE / month | 5500 | usd | admin | ASSUMPTION | Bookkeeper / close — was missing |
| `dept.us.accounting.fte` | US Accounting FTE | 1 | integer | admin | ASSUMPTION | Separate from Rosario and the controller |
| `dept.us.sales.loadedUsd` | US Sales / origination loaded / FTE / month | 8000 | usd | admin | ASSUMPTION | Closer — not Customer Success |
| `dept.us.sales.fte` | US Sales base FTE | 1 | integer | admin | ASSUMPTION | Grows with monthly closings |
| `dept.salesHomesPerRep` | New homes per sales FTE / month | 8 | integer | admin | ASSUMPTION | Adds a closer as volume rises |
| `dept.us.marketing.loadedUsd` | US Marketing loaded / FTE / month | 7200 | usd | admin | ASSUMPTION | Content / WhatsApp / paid social |
| `dept.us.marketing.fte` | US Marketing FTE | 1 | integer | admin | ASSUMPTION | AI-first still needs a human owner |
| `dept.us.marketing.spendUsd` | US paid acquisition / month | 4000 | usd | admin | ASSUMPTION | Ads and partner referrals — not salaries |

### Workplace

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `dept.officeSeatUsd` | US office seat / on-site head / month | 350 | usd | admin | ASSUMPTION | Flex desk — 09 §3 |
| `dept.wfhStipendUsd` | US WFH stipend / remote head / month | 200 | usd | admin | ASSUMPTION | 09 §3 |
| `dept.us.wfhPct` | US staff working from home | 60% | percent | admin | ASSUMPTION | AI-first; CS still needs coverage |
| `dept.co.officeSeatUsd` | Colombia office seat / month | 80 | usd | admin | ASSUMPTION | Medellín/Cartagena desk |
| `dept.co.wfhPct` | Colombia staff working from home | 30% | percent | admin | ASSUMPTION | Field roles are on-site |

### People Colombia

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `pay.gmLoadedUsd` | Colombia GM loaded / month | 18150 | usd | admin | ASSUMPTION | Salario integral on $15k — 09 §4 |
| `dept.co.closings.loadedUsd` | Colombia closings loaded / FTE / month | 2400 | usd | admin | ASSUMPTION | Title / comodato desk |
| `dept.co.closings.fte` | Colombia closings FTE | 1 | integer | admin | ASSUMPTION | Grows slowly |
| `dept.co.field.loadedUsd` | Colombia field inspector loaded / FTE / month | 2200 | usd | admin | ASSUMPTION | In-house inspections |
| `dept.co.field.fte` | Colombia field FTE | 1 | integer | admin | ASSUMPTION | Otherwise contractors |
| `dept.co.inspectContractorUsd` | Contractor inspection / close | 180 | usd | admin | ASSUMPTION | Paid when FTE capacity is short |
| `dept.co.inspectFteCapacity` | Inspections an FTE can do / month | 12 | integer | admin | ASSUMPTION | Overflow goes to contractors |
| `dept.co.success.loadedUsd` | Colombia CS / WhatsApp loaded / FTE / month | 1750 | usd | admin | ASSUMPTION | Bilingual agent all-in — 09 §5 |
| `dept.co.success.fte` | Colombia CS base FTE | 2 | integer | admin | ASSUMPTION | WhatsApp-first |
| `dept.co.legal.loadedUsd` | Colombia legal logistics loaded / FTE / month | 3200 | usd | admin | ASSUMPTION | Local counsel / filings |
| `dept.co.legal.fte` | Colombia legal FTE | 1 | integer | admin | ASSUMPTION | Paperwork |

### Autos

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `autoStartMonth` | Auto leases start month (0 = Nov 2026) | 6 | integer | user | ASSUMPTION | After tranche 2 — faster fee income |
| `autoMultipleX10` | Auto originations per home ×10 (30 = 3.0x) | 30 | integer | admin | ASSUMPTION | User asked ~3x vehicle contracts vs homes |
| `autoTicketUsd` | Legacy auto ticket (unused — Admin → ICPs) | 55000 | usd | admin | ASSUMPTION | Superseded by AUTO-1 / AUTO-2 |
| `autoTermMonths` | Legacy auto term (unused) | 60 | integer | admin | ASSUMPTION | Superseded by AUTO-1 / AUTO-2 |
| `autoClientRate` | Legacy auto rate (unused) | 14.5% | percent | admin | OPINION | Superseded by AUTO-1 / AUTO-2 |
| `autoGrowthExtraPct` | Auto growth above home curve | 10% | percent | admin | ASSUMPTION | Faster than homes |
| `autoMaxPerMonth` | Auto originations cap / month | 25 | integer | admin | ASSUMPTION | Fills the $30M FY10 auto book |

### Aircraft

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `aircraftStartMonth` | Aircraft start month | 84 | integer | user | ASSUMPTION | Last 3 fiscal years |
| `aircraftPerYear` | Aircraft originations / year after start | 12 | integer | admin | ASSUMPTION | Needed to reach the $20M FY10 aircraft book |
| `aircraftTicketUsd` | Legacy aircraft ticket (unused — Admin → ICPs) | 1200000 | usd | admin | ASSUMPTION | Superseded by AIR-1 / AIR-2 |
| `aircraftTermMonths` | Legacy aircraft term (unused) | 84 | integer | admin | ASSUMPTION | Superseded by AIR-1 / AIR-2 |
| `aircraftClientRate` | Legacy aircraft rate (unused) | 9.5% | percent | admin | ASSUMPTION | Superseded by AIR-1 / AIR-2 |

### Fees Credit is paid

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `insuranceCommissionPct` | Insurance / intermediation commission on new funded | 0.4% | percent | user | ASSUMPTION | 40 bps seed — Credit’s take on placed cover, not a referring-partner cost |
| `fee.applicationUsd` | Application fee / close | 0 | usd | user | ASSUMPTION | Client. Consumer-finance standard. Zero until scheduled. |
| `fee.documentUsd` | Document / admin fee / close | 0 | usd | user | ASSUMPTION | Client. Closing package. Zero until scheduled. |
| `fee.creditReportUsd` | Credit-report recovery / close | 0 | usd | user | ASSUMPTION | Client reimburses bureau pull. |
| `fee.titleStudyUsd` | Title-study fee / close | 0 | usd | user | ASSUMPTION | Client. Separate from Colombia diligence. |
| `fee.wireInUsd` | Wire / ACH fee / close | 0 | usd | user | ASSUMPTION | Client. Payment-rail recovery. |
| `fee.lateUsd` | Late fee / event | 0 | usd | user | ASSUMPTION | Per late incident. Incidence below. |
| `fee.lateIncidencePct` | Late incidents / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. Turn on with the dollar fee. |
| `fee.nsfUsd` | NSF / returned-payment fee / event | 0 | usd | user | ASSUMPTION | Per bounced ACH. |
| `fee.nsfIncidencePct` | NSF incidents / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |
| `fee.statementUsd` | Statement fee / lease / month | 0 | usd | user | ASSUMPTION | Usually $0 if e-statements. |
| `fee.modificationUsd` | Modification fee / event | 0 | usd | user | ASSUMPTION | Term / rate / party change. |
| `fee.modIncidencePct` | Modifications / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |
| `fee.assumptionUsd` | Assumption / transfer fee / event | 0 | usd | user | ASSUMPTION | New lessee takes the contract. |
| `fee.assumptionIncidencePct` | Assumptions / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |
| `fee.extensionUsd` | Extension fee / event | 0 | usd | user | ASSUMPTION | Term extension. |
| `fee.extensionIncidencePct` | Extensions / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |
| `fee.payoffQuoteUsd` | Payoff-quote fee / event | 0 | usd | user | ASSUMPTION | Written payoff. |
| `fee.payoffIncidencePct` | Payoff quotes / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |
| `fee.purchaseOptionUsd` | Purchase-option fee / balloon | 0 | usd | user | ASSUMPTION | Processing when the option is exercised. |
| `fee.dispositionUsd` | Disposition fee / balloon | 0 | usd | user | ASSUMPTION | End-of-term residual handling. |
| `fee.prepayPenaltyPct` | Early-payoff fee of outstanding | 0% | percent | user | ASSUMPTION | Thesis 17: no penalty is the policy. Lever stays at 0 unless Credit changes it. |
| `fee.prepayIncidencePct` | Early payoffs / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |
| `fee.defaultUsd` | Default / workout fee / event | 0 | usd | user | ASSUMPTION | WhatsApp: separate delinquent schedule. |
| `fee.defaultIncidencePct` | Defaults / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |
| `fee.collectionUsd` | Collection / recovery fee / event | 0 | usd | user | ASSUMPTION | Per recovery action. |
| `fee.minServicingUsd` | Minimum servicing / lease / month | 0 | usd | user | ASSUMPTION | Top-up when 75 bps < this floor. WhatsApp seed. |
| `fee.forcedPlaceUsd` | Forced-place markup / event | 0 | usd | user | ASSUMPTION | When Credit places insurance. |
| `fee.forcedPlaceIncidencePct` | Forced-place / active lease / month | 0% | percent | user | ASSUMPTION | 0 = none. |

### Ashoka

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `rentalPoolOptInPct` | Share of homes in the Ashoka rental pool | 55% | percent | admin | ASSUMPTION | Aug 19 pool decision |
| `ashokaMgmtFeePct` | Ashoka STR management fee of gross rent | 20% | percent | admin | ASSUMPTION | 20% base — 09 §7 |
| `ashokaGrossRentUsd` | Gross STR rent / pooled home / month | 1800 | usd | admin | ASSUMPTION | Before Ashoka fee and Tamarindo share |
| `ashokaRepairUsd` | Repair / maintenance spend / pooled home / month | 120 | usd | admin | ASSUMPTION | Charge-through base |
| `ashokaRepairMarkupPct` | Ashoka markup on repairs | 15% | percent | admin | ASSUMPTION | Related-party must be market |

### Capital partners

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `partner2StartMonth` | Capital partner 2 start month | 36 | integer | admin | ASSUMPTION | Intervest exclusive first 3 years |
| `partner2Usd` | Partner 2 year-10 line (legacy curve) | 25000000 | usd | admin | OPINION | Used only when KPI curve is off |
| `partner2Yield` | Partner 2 vehicle yield | 10% | percent | admin | ASSUMPTION | 8.5–11.5% band — 09 §2 |
| `partner3StartMonth` | Capital partner 3 start month | 60 | integer | admin | ASSUMPTION | Years 6–7 |
| `partner3Usd` | Partner 3 committed line | 25000000 | usd | admin | OPINION | Third vehicle |
| `partner3Yield` | Partner 3 vehicle yield | 9.5% | percent | admin | ASSUMPTION | 8.0–11.0% band — 09 §2 |
| `partner4StartMonth` | Capital partner 4 start month | 84 | integer | admin | ASSUMPTION | Years 8–10 / aircraft era |
| `partner4Usd` | Partner 4 year-10 line (legacy curve) | 25000000 | usd | admin | OPINION | Used only when KPI curve is off |
| `partner4Yield` | Partner 4 vehicle yield | 9% | percent | admin | ASSUMPTION | 7.5–10.5% band — 09 §2 |

### Fees Credit pays

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `fee.unusedLineBps` | Unused-line fee (annual, of undrawn) | 0% | percent | user | ASSUMPTION | Warehouse unused-commitment. 0 until Intervest bills it. |
| `fee.fxHedgeBps` | FX hedge (annual, of funded AUM) | 0% | percent | user | ASSUMPTION | Thesis 20: hedge belongs in the model. 0 until a quote. |
| `fee.referringCostPct` | Referring-partner cost of funded | 0% | percent | user | ASSUMPTION | Cost. Never a broker fee on Credit’s own take. |
| `fee.referringCostUsd` | Referring-partner cost / close | 0 | usd | user | ASSUMPTION | Flat alternative or add-on to the %. |
| `fee.bureauKycUsd` | Bureau / KYC cost / close | 0 | usd | user | ASSUMPTION | What Credit pays the bureau — may recover above. |
| `fee.backupServicerBps` | Backup servicer (annual, of AUM) | 0% | percent | user | ASSUMPTION | Warehouse often requires a warm backup. |
| `fee.subservicerUsd` | Subservicer / tech / lease / month | 0 | usd | user | ASSUMPTION | Thesis 19: $15–$40+ seed. 0 until a vendor quote. |
| `fee.uccFilingUsd` | UCC / filing cost / close | 0 | usd | user | ASSUMPTION | US filing if used. |
| `fee.wireOutUsd` | Outbound wire cost / close | 0 | usd | user | ASSUMPTION | Bank rails Credit pays. |
| `fee.notaryRegistroUsd` | Notary / registro cost / close | 0 | usd | user | ASSUMPTION | Colombia vendor. Client may also pay diligence. |

### Equity

| Key | Label | Seed | Type | Visibility | Citation | Note |
|---|---|---|---|---|---|---|
| `founderCount` | Tamarindo partners (equal shares, names TBD) | 5 | integer | admin | ASSUMPTION | Five equal partners until ownership is assigned |
| `founderPayHalfMonths` | Months of reduced founder pay | 8 | integer | admin | OPINION | First 8 months of operations |
| `founderPayHalfPct` | Founder pay during the reduced window | 50% | percent | admin | OPINION | 50% of loaded named US pay |
| `equityRound1Month` | Round 1 month (0 = Nov 2026) | 0 | integer | admin | OPINION | $2M to start operations |
| `equityRound1Usd` | Round 1 raise | 2000000 | usd | admin | OPINION | Smallest check first to get started; FY1 burn is ~$1.65M |
| `equityRound1PreMoneyUsd` | Round 1 pre-money | 10000000 | usd | admin | OPINION | Initial $10M pre-money |
| `equityRound2Month` | Round 2 month | 12 | integer | admin | ASSUMPTION | After the first fiscal year — confirm timing |
| `equityRound2Usd` | Round 2 raise | 2250000 | usd | admin | OPINION | Second check — $2.25M |
| `equityRound2PreMoneyUsd` | Round 2 pre-money | 15000000 | usd | admin | OPINION | $15M after the $10M round |
| `equityRound3Month` | Round 3 month | 24 | integer | admin | ASSUMPTION | After the second fiscal year — confirm timing |
| `equityRound3Usd` | Round 3 raise | 2250000 | usd | admin | OPINION | Third check — $2.25M |
| `equityRound3PreMoneyUsd` | Round 3 pre-money | 20000000 | usd | admin | OPINION | $20M after the $15M round |
| `equityRound4Month` | Round 4 month (optional) | 36 | integer | admin | ASSUMPTION | Slot for a fourth tranche |
| `equityRound4Usd` | Round 4 raise (0 = off) | 0 | usd | admin | ASSUMPTION | Fourth tranche left empty |
| `equityRound4PreMoneyUsd` | Round 4 pre-money | 25000000 | usd | admin | ASSUMPTION | Only if round 4 is turned on |

### ICP catalog seeds

| ID | Code | Name | City | Ticket | Term mo | Base rate | Mix | Rent factor | Class |
|---|---|---|---|---|---|---|---|---|---|
| icp1 | ICP-1 | Poblado Executive | Medellín / El Poblado / Envigado | 420000 | 120 | 11.50% | 0.25 | 1 | property |
| icp2 | ICP-2 | Cartagena Heritage | Cartagena / Old City / Bocagrande / Castillo Grande | 650000 | 120 | 11.50% | 0.18 | 1 | property |
| icp3 | ICP-3 | Llanogrande Country | Rionegro / Llanogrande / JMC airport corridor | 750000 | 144 | 11.00% | 0.12 | 0.4 | property |
| icp4 | ICP-4 | Bocagrande Tower | Cartagena / Bocagrande | 480000 | 84 | 12.50% | 0.18 | 1 | property |
| icp5 | ICP-5 | Envigado Family | Medellín / Envigado / Zúñiga | 310000 | 96 | 12.00% | 0.17 | 1 | property |
| icp6 | ICP-6 | Castillo Grande Coastal | Cartagena / Castillo Grande | 580000 | 108 | 11.50% | 0.1 | 1 | property |
| auto1 | AUTO-1 | Andes Family Prado | Colombia / Medellín / national dealer | 102000 | 48 | 14.50% | 0.4 | 0 | auto |
| auto2 | AUTO-2 | City Hybrid CX-30 | Colombia / Medellín / Bogotá dealer | 33000 | 36 | 14.50% | 0.6 | 0 | auto |
| air1 | AIR-1 | Andes Caravan | Rionegro / JMC / domestic utility | 2200000 | 84 | 9.50% | 0.8 | 0 | aircraft |
| air2 | AIR-2 | Caribbean Light Jet | Miami / Cartagena / US–Colombia corridor | 11500000 | 120 | 9.50% | 0.2 | 0 | aircraft |



---

## 12. Reports Claude for Excel must emit

**Sheets (minimum):**

1. `Inputs` — §11, blue/grey
2. `ICP` — ten tickets + computed funded, residual, payment, effective rate
3. `Monthly` — 120 months of the engine (or a hidden calc sheet)
4. `US` `Colombia` `Consolidated` `Vehicle` — FY1–FY10, same lines as
   `lib/model/engine-statements.ts`
5. `Returns` — unit IRR + book IRR + OpCo CoC
6. `Sensitivity` — four levers
7. `Structure` — entity map (static)
8. `Fee book` — every Credit-paid and Credit-pays line, including zeros

**Formatting:** navy / teal / gold. Blue = input. Gold = totals / IRR.
Geist Mono (or Consolas) for numbers.

**Guardrails:**

- Do not treat vehicle warehouse cash as OpCo equity.
- Do not invent Deal Terms / raise ask.
- Do not fill unlabeled salary or fee cells with made-up quotes — zeros
  stay zero until cited.
- Do not call origination a broker fee.
- Lease characterization, sucursal tax, and usury opinions are **open**
  (thesis 16–18). Do not conclude them.

---

## 13. Open items (do not close in Excel)

- Legal characterization of the lease (US and Colombia).
- Tax of sucursal ownership and cross-border flows (CIT CONTEXT 35%).
- Who pays origination (client vs vehicle) — model books it as Credit
  revenue; vehicle CFO subtracts activation + origination.
- Whether Ashoka stays sister or vendor — OPINION: keep separate.
- FX hedge: lever exists, seed **0** until a quote (thesis 20).
- Aviation is out of **this** Intervest warehouse; the FY8–10 aircraft
  book is a planning goal.

---

## 14. Named functions (TypeScript → Excel)

Rebuild these. If a name and this prose disagree, **the function wins**.

| Function | File | Excel equivalent / job |
|----------|------|------------------------|
| `d`, `cents`, `money` | `lib/model/money.ts` | `ROUND(x, 2)` half-up |
| `pmt(rate, nper, pv, fv)` | same | `=PMT(rate, nper, -pv, fv)` |
| `monthlyRate` | same | `annual/12` |
| `irr(cashflows)` | same | `=IRR(range)` — blank if unsolvable |
| `annualizeMonthlyIrr` | same | `(1+monthly)^12-1` |
| `blendedFicoSpread` | `lib/model/contracts.ts` | weighted FICO bps |
| `computeContracts` | same | funded, residual, payment, effective rate per ICP |
| `plannedOriginations` | `lib/model/vintages.ts` | homes wanted this month |
| `pickIcp` | same | first five fixed, then mix |
| `buildPlannedVintages` | same | vintage list |
| `kpiIntervestLineUsd` | `lib/model/capital-kpis.ts` | Intervest commitment at month m |
| `kpiPartnerLineUsd` | same | other vehicles at month m |
| `productAumTargetUsd` | same | home / auto / aircraft ceiling |
| `productQuote` / `pickProductQuote` | `lib/model/products.ts` | auto / aircraft ticket |
| `autoOriginationsThisMonth` | same | auto count |
| `aircraftOriginationsThisMonth` | same | aircraft count |
| `applyAncillaryFees` | `lib/model/fees.ts` | fee book in/out |
| `monthDepartmentCash` | `lib/model/departments.ts` | named-desk opex |
| `plannedRounds` / `equityProceedsAt` / `buildCapTable` | `lib/model/equity.ts` | CFF equity + dilution |
| `founderPayFactor` | same | 50% named US pay for 8 months |
| `runCashflowModel` | `lib/model/engine.ts` | **the 120-month loop** |
| `assertConsolidatedIdentity` | same | US + CO − mandate = consolidated CFO |
| `buildUs` / `buildSucursal` / `buildConsolidated` / `buildVehicle` | `lib/model/engine-statements.ts` | four books |
| `sumYear` | `lib/model/engine-acc.ts` | 12 months → one FY |
| `computeInvestorReturns` | `lib/model/returns.ts` | unit IRR, book IRR, OpCo CoC |
| `runSensitivity` | `lib/model/sensitivity.ts` | shock one blue lever |
| `calcTicketEconomics` | `lib/model/unit-economics.ts` | one-ticket walk |
| `cashflowWorkbookSpec` | `lib/model/excel-spec.ts` | Nico’s generated .xlsx (outputs, not this spec) |
| `TAMARINDO_PEOPLE` / `namedPeopleIn` / `peopleNoteFor` | `lib/nico/people.ts` | seats only |
| `VARIABLE_DEFS` / `defaultValues` / `num` | `lib/model/variables.ts` | Inputs sheet |
| `ICP_CATALOG` | `lib/model/icp-catalog.ts` | ten tickets |
| `FEE_LINES` | `lib/model/fee-catalog.ts` | fee book including zeros |

### Statement line ids (print these)

**US / Consolidated operating in:** `activation`, `origination`, `servicing`, `spread`, `rental`, `insurance`, plus `feeIn.{id}`. Consolidated also: `coClosing`, `coInspection`, `coAdmin`.

**US operating out:** `feeOut.{id}`, `us.{dept}`, `toSucursal` (eliminated on consolidated as `elims` memo).

**US / Consolidated financing:** `seed`. Investing: `capex` = 0.

**US memo:** `collections`, `remit`, `line`, `partners`, `vehicles`, `aum`, `homeAum`, `autoAum`, `aircraftAum`, `homes`, `autos`, `aircraft`, `ashokaFee`, `ashokaRepair`.

**Colombia in:** `coClosing`, `coInspection`, `coAdmin`, `fromUs`. Out: `co.{dept}`.

**Vehicle:** `clientDown`, `remitExBalloon`, `balloon`, `activation`, `origination`, `purchases` (negative CFI), `draws` (CFF), memo `line` / `aum` / counts.

**US dept keys:** `leadership`, `credit`, `success`, `service`, `legal`, `it`, `finance`, `accounting`, `sales`, `marketing`, `autoDesk`, `aircraftDesk`, `office`, `wfh`, `lump`.

**Colombia dept keys:** `gm`, `closings`, `field`, `success`, `legal`, `office`, `lump`.

**Known tension (do not “fix” in Excel):** `people.ts` says Tom is the whole US IT budget (no extra IT FTE). Seeds still have `dept.us.it.fte = 2`. Follow the **seeds**.

---

## 15. Source index

| Path | Use |
|------|-----|
| `knowledge/thesis/01-thesis.md` | What Tamarindo is |
| `knowledge/thesis/02-entities.md` | Family map |
| `knowledge/thesis/03-ten-year-plan.md` | Phases |
| `knowledge/thesis/04-icp-deals.md` | Home ICPs |
| `knowledge/thesis/05-fee-engine.md` | Take-rate stack |
| `knowledge/thesis/06-numbers-explained.md` | How to read the book |
| `knowledge/thesis/07-markets-legal-math.md` | Market + legal math (open) |
| `knowledge/thesis/08-nico-voice.md` | Voice — not a number source |
| `knowledge/thesis/09-ops-capital-assumptions.md` | Named pay, CS, autos |
| `knowledge/thesis/10-capital-curve.md` | KPI AUM / lines |
| `knowledge/thesis/11-equity.md` | $6.5M, five partners, half pay |
| `knowledge/thesis/12-rate-benchmarks.md` | FICO / market rates |
| `knowledge/thesis/13-deal-waterfall.md` | ICP-1 walk |
| `knowledge/thesis/14-medellin-cartagena-market.md` | Corridor comps |
| `knowledge/thesis/15-colombia-living.md` | Lifestyle product context |
| `knowledge/thesis/16-lease-characterization.md` | Open — do not conclude |
| `knowledge/thesis/17-end-of-lease-title.md` | Balloon ≠ folio |
| `knowledge/thesis/18-kyc-aml.md` | KYC process — not personal files |
| `knowledge/thesis/19-platform-economics.md` | 1% / 75 bps vs WhatsApp |
| `knowledge/thesis/20-aug-26-decisions.md` | Pilot box |
| `knowledge/thesis/21-opco-headcount-pl.md` | Lean P&L |
| `knowledge/thesis/22-fee-schedule.md` | Complete fee book |
| `docs/nico/12-blue-variables.md` | Blue-lever governance |
| `lib/nico/people.ts` | Seats |
| `lib/model/*` | The calculator |

If this file and the code disagree, **the code wins** and this file is
stale — fix the spec, do not “correct” the engine from memory.
