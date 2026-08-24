# 07 — Comodato, leasing, balloons, and the two countries

*Companion to 06. This file is the legal and math primer Nico should use
when a founder, investor, prospect, regulator, or friend asks “but is that
even a thing?” It is not legal advice. Counsel signs opinions. Nico
explains the shape.*

## Comodato (Colombia)

**What the Civil Code actually says.** Article **2200** Código Civil:
comodato (préstamo de uso) is a contract where one party delivers a
movable or immovable thing **gratuitously** so the other may use it and
must return **the same thing** when use ends. It is perfected by
**tradición** (delivery), not by the signature alone.

**Gratuitous is the whole point.** Colombian courts (including CSJ
language repeated in 2019–2023 tutelas) treat comodato as **essentially
free**. If the “borrower” pays for the use, the deal is usually
**arrendamiento** (lease) or an innominate paid contract — not comodato.
Tamarindo’s money does **not** ride on the comodato. Rent/interest rides
on the **US-law lease**. The comodato is the **use-right and recovery
hook** while the sucursal holds title.

**Who is who.** Sucursal = comodante (owner/lender of the thing). Client =
comodatario (holder, not owner). The client is a **tenedor**, not a
possessor in the strong sense. That is why recovery is framed as
restitution of tenancy, not a mortgage foreclosure.

**Duration and precario.** Art. 2205: return at the agreed time, or after
the agreed use. If no term and no special use — or the lender reserves
the right to call the thing at will — it is **comodato precario** and can
be demanded at any time (art. 2219–2220 family). Tamarindo meetings talk
about **1-month overdue lock-out** as the enforcement edge versus
desahucio on a residential lease. That is a **commercial claim**, not a
statute that says “one month.” The procedure is still a court (or
contractual) restitution path. Nico should say: “faster than a rental
eviction is the design; it is not a self-help eviction.”

**Improvements.** Ordinary upkeep is on the comodatario. Useful
improvements are generally **not** reimbursed (art. 2216 family). That
matters if a client pours money into a Cartagena remodel.

**Why Tamarindo wants it.** Owner-friendly recovery; client never takes
title until the purchase option; avoids looking like a Colombian
mortgage or captación de dinero. **Open legal items:** Superintendencia
Financiera / captación; whether a paid US lease plus a free comodato is
respected as two contracts or recharacterized as one financing; tax on
the sucursal.

## US lease vs loan vs mortgage

Tamarindo’s pitch: the client signs a **US-law lease-to-own** with a
**purchase option** and a **material residual**, so Tamarindo is a
**lessor/servicer**, not a bank making a mortgage.

**Tax (federal).** Substance over label. *Frank Lyon* (1978): who has the
benefits and burdens of ownership. IRS equipment true-lease guidelines
(Rev. Proc. **2001-28 / 2001-29**) that lessors still quote:

1. No bargain purchase option (must be FMV, not $1).
2. Expected residual **≥ 20% of cost**, lessor bears residual risk.
3. Remaining useful life at expiry **≥ 20%** of original, general-use
   asset.
4. Lessor profit, cash-flow, and minimum equity tests.

Tamarindo’s meeting floor of **10% of asset** is **below** that equipment
safe harbor. Real property is not equipment. **Do not tell a prospect the
IRS has blessed 10%.** Tell them counsel is writing the characterization
memo, and the balloon is large **on purpose**.

**Accounting (ASC 842).** Finance vs operating is a different test
(ownership transfer, reasonably certain purchase option, term majority of
life, PV substantially all of FMV, specialized asset). A 15% balloon does
not automatically make an operating lease.

**Consumer / usury / licensing.** A US-law consumer lease can still be a
consumer-credit product under state law or the federal Consumer Leasing
Act / TILA if it looks like financing. **Open.** The 18 Aug debrief
flagged usury and true-lease opinions as blocking.

**Why a balloon helps the story (not the opinion).** If payments
amortize **all** of the funded amount to zero, it looks like a loan. If a
**material** residual remains, more of the economic life is left with the
lessor. That is the commercial intuition. The legal tests are stricter.

## Balloon / residual math

**Names.** Residual = estimated value at term (lease talk). Balloon =
contractual lump sum at term (loan talk). Tamarindo uses both for the
same cash flow: the client’s buyout.

**Level-payment formula**

Let `i` = annual client rate, `r = i/12`, `n` = months, `PV` = amount
funded, `FV` = balloon.

```
PMT = (PV - FV / (1+r)^n) * r / (1 - (1+r)^(-n))
```

Excel: `=PMT(r, n, -PV, FV)`
Google: same. HP: n, i/12, PV, FV, PMT.

**Interest in month k** ≈ `r * outstanding_{k-1}`.
**Principal in month k** = `PMT - interest`.
**Outstanding after k** = `PV*(1+r)^k - PMT*((1+r)^k - 1)/r`.
At `k = n` that outstanding should equal `FV`.

**Tamarindo spread share (FACT structure, ASSUMPTION rates).** If
Tamarindo keeps **20% of interest billings**, month k Tamarindo spread
`= 0.20 * r * outstanding_{k-1}`. It **declines**. Servicing at 75 bps is
`0.0075/12 * outstanding` if billed monthly (ASSUMPTION).

**Activation (FACT).** `0.02 * drawdown` once, when capital is drawn.

**Origination (ASSUMPTION).** `0.01 * funded` once.

**Rental offset (ASSUMPTION).** Gross rent × occupancy − PM − opex − 20%
Tamarindo share of remainder = net credit against the lease. ICP-1 uses
10% PM + 25% costs + 20% of remainder. That is a **model**, not a lease
clause until it is in the docs.

**Worked ICP-1.** Price $420k, 40% down $168k, funded $252k, 11%, 10
years, 15% of funded balloon $37,800 → **PMT ≈ $3,300**. Gross rent
$2,200 × 85% occ ≈ $22.4k/yr. Cited net credit **$1,170/mo** (~35% of
PMT). Effective cash **~$2,130/mo**.

**Worked ICP-2.** $650k, down $260k, funded $390k, PMT ≈ $5,100, net
credit ≈ $1,580, effective ≈ $3,520, balloon ≈ $58–59k.

**Do not quote PMT as “rent.”** It is debt service on the funded slice.

## US context Nico should have on his tongue

- Prime US mortgage ~**6.2%** (Freddie Mac PMMS, week of 21 Aug 2026).
- FICO 750+ is a high bar; 800+ is a small minority of scored files.
- US banks generally **will not** take raw Colombian real estate as
  mortgage collateral. That is the hole Tamarindo claims to fill.
- Full US tax deduction of “lease payments” for a second home / personal
  use is **not** something Nico should promise. Personal vs investment
  use, tax home, and characterization all matter. Meetings said “US
  write-off”; label it **as described, counsel**.

## Colombia context

- **CIT 35%** headline 2025–26 (PwC, Deloitte). Financial institutions:
  **+5% surcharge** through 2027 above a UVT threshold. Branch profit
  remittance can add **20%** in some stacks. Meetings’ “19% pre-Petro”
  is history, not the current rate.
- Policy rate **9.25%** (BanRep, 17 Jul 2026 print). Housing credit to
  locals in mid-2026 often **12–18% E.A.**
- Standard non-VIS LTV often **70%**; VIS **80%**. Tamarindo **60%** is
  conservative vs local mortgages and vs local housing leases that
  sometimes fund 85%+.
- **Captación** and Superintendencia: taking money from the public as a
  deposit-like product is a third-rail. Tamarindo’s design (client pays
  a US lessor; vehicle owns the house) is meant to stay out. Unconfirmed.

## Medellín

Launch neighborhood: **El Poblado** (Provenza, Los Balsos), **Envigado**.
ICP-1: 2–3BR, 100–160 m², estrato 6, $350–500k, mid-term rental for
executives/nomads. CONTEXT 2026 luxury sketches: El Poblado units often
**$217k–$761k**; city median much lower. Liquidity 90–150 days is an
**ASSUMPTION**. Occupancy 85% is an **ASSUMPTION**. Estrato 6 is the
admin/tax band, not a quality rating.

## Cartagena

Old City, Bocagrande, Castillo Grande. ICP-2: 1–2BR, 60–110 m²,
$500–800k, short-term, ADR ~$210, occ ~62%. Seasonal. Cap **≤40%** of a
vehicle (OPINION). Liquidity 150–270 days ASSUMPTION. Tourism and HOA
rules can kill STR — ops risk lives here, which is why Ashoka exists.

## Llanogrande / Rionegro

Airport corridor, houses on large lots, $600–900k. Weak rental by
design. Underwrite **income**, not occupancy. Cap **≤25%**.

## Intervest, in one breath

Employee-owned NY specialty-finance / real-estate manager. Public
marketing: 26+ years, 160+ vehicles, $25B+ funds/accounts. 2025 press:
~$10.4B AUM, $2.5B originations. Mike Gontar is CEO. Tamarindo-Intervest
LLC is **vehicle #1**, not Intervest itself. $10M + $10M test, 9–12%
capital, 2% activation to Tamarindo, ROFR not exclusivity. MAC/watch
business is a **separate** Intervest relationship.

## How Nico should show the math in chat

When someone asks about a number, answer in three beats: (1) the
Tamarindo figure and its grade, (2) the outside CONTEXT if it exists,
(3) a table and, if comparing, a chart block. Never stack TAM figures.
Never treat 10% residual as an IRS blessing. Never treat 800k prospects
as a census product.
