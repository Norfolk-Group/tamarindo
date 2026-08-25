# 16 — Lease characterization, two countries (as of 23 Aug 2026)

*Companion to 07, 17 (how title actually moves at option), and 18 (KYC).
This file is the sourced legal CONTEXT behind the true-lease / comodato /
captación design. It is **not** tax advice, not a legal opinion, and not
a ruling request. Counsel signs opinions. Nico explains the shape.*

**Assumed structure (ASSUMPTION):** US Intervest vehicle is lessor under
a US-law payment contract with US persons; Colombian sucursal (or
fiducia) holds registered title; occupant gets Colombian possession via
comodato, not a Colombian rent contract.

**MODEL UPDATE (Ricardo, 2026-08-23):** the purchase-option floor is
**20% of asset cost** (`minResidualOfAssetPct`). A 10% balloon is the
old meeting number and is **STALE**.

## United States — true lease vs disguised sale / mortgage

### IRS Rev. Proc. 2001-28 (ruling guidelines, not the legal test)

**FACT.** Rev. Proc. 2001-28, 2001-19 I.R.B. 1156 (7 May 2001),
supersedes Rev. Proc. 75-21. It states when IRS *ordinarily will issue
an advance ruling* that a leveraged lease is a lease.
https://www.irs.gov/pub/irs-irbs/irb01-19.pdf

**FACT.** The procedure itself says the guidelines **do not define, as a
matter of law**, whether a transaction is a lease (§3). Background
points to Rev. Rul. 55-540 (conditional sale vs lease of *equipment*).

**FACT — residual / life / option (ruling floor):**

- Lessor equity at risk ≥ **20% of cost**, maintained throughout.
- Estimated **end-of-term FMV ≥ 20% of original cost**, *without*
  inflation, *after* lessor removal/delivery costs.
- Remaining useful life ≥ **the longer of 1 year or 20%** of originally
  estimated useful life.
- **No member of the Lessee Group** may have a contractual right to buy
  at **less than FMV at exercise**.
- Lessor must expect **pre-tax profit exclusive of tax benefits**.

**CONTEXT.** These are *equipment leveraged-lease* ruling screens.
Residential land typically has no finite “useful life”; counsel should
not treat 20/20 as a real-estate statute. **Do not tell a prospect the
IRS has blessed any number.**

### Why 20% of-asset is safer than 10%

**FACT.** The IRS ruling residual is **20% of original cost**. A **10%**
fixed option is below that floor if the option price is treated as the
residual the lessee is expected to take.

**CONTEXT.** A bargain or economically compelled option is the classic
recharacterization marker (Rev. Rul. 55-540; 2001-28 §4.03). If a
rational occupant would always pay 10% rather than walk away, the lessor
has not kept a meaningful reversion — looks like **amortizing loan +
residual balloon**, not rent. 20% of cost (or a true FMV option at
exercise) sits *on* the IRS residual floor. It does **not** guarantee
true-lease treatment on audit.

**ASSUMPTION.** “20% of asset” means 20% of capitalized acquisition cost
(or independently appraised end-of-term FMV), not 20% of unpaid
principal.

### UCC 1-203 — analog only

**FACT.** https://www.law.cornell.edu/ucc/1/1-203

**FACT — bright line (§1-203(b)).** A form-of-lease is a **security
interest** if the lessee’s payment obligation is non-cancellable **and**
any of: original term ≥ remaining **economic life**; lessee is **bound**
to renew for remaining life or **bound** to become owner; option to
renew for remaining life for **no / nominal** extra consideration;
option to become owner for **no / nominal** extra consideration.

**FACT — not enough by themselves (§1-203(c)).** Full-payout PV, risk of
loss, net-lease taxes/insurance/maintenance, mere existence of a
purchase option, or a fixed option ≥ reasonably predictable FMV at
exercise.

**FACT — “nominal” (§1-203(d)).** Additional consideration is nominal if
it is **less than the lessee’s reasonably predictable cost of
performing if the option is not exercised**. It is **not** nominal if
the option price is **FMV determined at exercise**.

**CONTEXT.** UCC Art. 2A / §1-203 governs **goods**, not Colombian
realty. Use it as the US commercial analog, not as the statute that
will decide a house in Medellín. A 10% of-cost option is more likely
“nominal” (cheaper than moving/returning) than 20% or a true end-of-term
FMV option.

### New York governing law (high level)

**CONTEXT.** Specialty-finance paper often picks **New York** (UCC
1-203 adopted; N.Y. Gen. Oblig. Law §5-1401 for many contracts ≥
$250,000; Commercial Division used to true-lease vs loan fights).

**ASSUMPTION.** NY law can govern the *payment* contract; it cannot
rewrite Colombian *in rem* title, registro, or eviction.

## Colombia

### Arrendamiento vs leasing habitacional

**FACT.** Código Civil art. 1973: arrendamiento = grant of enjoyment
**for a determined price**.

**FACT.** Urban **housing** leases are specialized by **Ley 820 de
2003** (D.O. 45.244, 10 Jul 2003):
http://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html

**FACT.** **Leasing habitacional** is a **regulated bank/CFC product**,
not a civil lease. Ley 795 de 2003 / Decreto 777 de 2003 / SFC
Conceptos 2003047678-1 and 2003038222-2: an authorized entity delivers
**tenencia** of housing for a periodic **canon**; title **stays with
the bank** until the locatario exercises an acquisition option and pays
its value.

**CONTEXT.** A US Intervest vehicle is **not** an SFC “entidad
autorizada.” Labeling the US contract “leasing habitacional” would be a
**false banking product**. Design: US-law lease + vehicle/sucursal
title, **not** Colombian financial leasing.

### Comodato vs arrendamiento

**FACT.** CC art. 2200: comodato = **gratuitous** loan of a specific
thing for use, with duty to restore the same thing; perfected only by
**tradición**. If it is **not** free, it is another contract
(MinJusticia LegalApp, 5 Feb 2018). Comodatario typically pays
**servicios and administración** unless otherwise agreed.

**CONTEXT — when used:**

- **Comodato:** intra-group possession (sucursal/fiducia → occupant)
  where **no Colombian rent** is charged; US rent sits offshore.
- **Arrendamiento / Ley 820:** Colombian-peso housing rent to an
  occupant in Colombia.
- **Leasing habitacional:** only SFC entities.

**ASSUMPTION.** Authorities may **recharacterize** a “comodato” if the
occupant’s US payments are the economic price of enjoyment. That is the
main local characterization risk. Recovery is a court (or contractual)
restitution path — **not** self-help eviction. “Faster than a rental
eviction” is the design claim, not a statute.

### Captación masiva de dineros

**FACT.** Decreto 1068 de 2015 art. 2.18.2.1 (SuperSociedades Oficio
220-231657, 26 Sep 2023): captación masiva y habitual if liabilities to
the public are **>20 persons** or **>50 obligations**, plus either
**>50% of equity** or funds raised by public/private **innominate
offers**.

**FACT.** Decreto 4334 de 2008 art. 6 (as amended Ley 1902 de 2018):
SuperSociedades may intervene on **objective/notorious** facts of mass
delivery of money in unauthorized ops. Corte Constitucional C-145/09
upheld that standard.

**CONTEXT.** Design is the opposite of deposit-taking: (i) payee
**already owns** a specific registered asset; (ii) payor buys **use +
optional title**, not a pooled yield; (iii) no offer of returns to the
Colombian public; (iv) counterparties are US persons on a US contract.

**ASSUMPTION.** Marketing in Colombia as “invest / earn / guaranteed
buyback,” or taking money from many Colombian residents without a
matching titled asset, can still trip 4334/1068 regardless of NY law.

### Foreign ownership of urban real estate

**FACT.** Constitución art. 100: foreigners have the **same civil
rights** as Colombians, subject to statutory limits.

**FACT.** Decreto 1415 de 1940 art. 5: **baldíos** on national **coasts**
and **border regions** may be **adjudicated only to native Colombians**
and may **not be transferred to foreigners**. That is **state vacant
land**, not private urban lots.

**CONTEXT.** Blog claims of a general foreign ban inside 50 km of a
border / 2 km of coast, citing Ley 2 de 1959, do **not** match Ley 2
(forest reserves) or Decreto 1415. **Do not rely on that 50/2 km
rule.**

**ASSUMPTION.** Private urban housing in interior cities is generally
acquirable by a foreign company/sucursal. Border municipios (Ley 191 de
1995) and islands/strategic zones still need a **parcel-level** check.
Canalize FX via Banco de la República investment registration.

### Fiducia mercantil / inmobiliaria

**FACT.** Código de Comercio art. 1226: fiduciante transfers specified
assets to a **fiduciario** (SFC-authorized) to administer or sell for a
stated purpose.

**CONTEXT.** **Fiducia inmobiliaria** / “fiducia de parqueo” is the
common **title-holding** PATRIMONIO AUTÓNOMO (asset leaves the settlor’s
estate). Alternative to sucursal-on-title. Off-plan funds should sit in
a licensed fiducia — protects against developer insolvency, **not**
delays or quality.

### Registro, notary, retenciones on sale

**FACT.** Transfer of urban realty: **escritura pública** + inscription
at **Oficina de Registro de Instrumentos Públicos** (Ley 1579 de 2012).
Tradición of real rights is by registro, not the private contract.

**FACT — withholding (as of 8 May 2026).** Consejo de Estado (auto 7 May
2026) **provisionally suspended** Decreto 572/2025 arts. 2–8. DIAN
Comunicado 070 (8 May 2026) restores pre-572 Decreto 1625/2016 art.
1.2.4.9.1:

- Housing: **1%** on first **20,000 UVT**, **2.5%** on excess.
- Other use: **2.5%**.
- De minimis: **27 UVT** (restored), not 10 UVT.

**FACT.** Estatuto Tributario art. 401: if buyer is a **legal person**,
withholding is a **condition precedent** to the escritura. DIAN Concepto
5148/2026: buyer-legal-person is the agent **even if a nonresident
foreign company**.

### Ley 820 de 2003 — if the Colombian contract *is* a housing lease

**FACT (Senado text):**

- **Term:** as agreed; default **1 year** (art. 5). Auto-prórroga if
  both sides performed (art. 6).
- **Rent cap:** monthly rent ≤ **1% of commercial value**, and
  commercial value ≤ **2× avalúo catastral** (art. 18). Annual reset ≤
  **100% of prior-year CPI** (art. 20).
- **Deposits:** **prohibited** as security for tenant obligations (art.
  16).
- Tenant pays rent, utilities, and **admin when the contract so
  provides** (art. 9.3). **Predial is not assigned to the tenant** in
  Ley 820.
- Eviction is **not** at-will. Restitution is a **judicial/administrative
  process**, not self-help. Intermediaries with **>5** contracts must
  **matricularse** with the alcaldía in municipios >15,000.

**CONTEXT.** If possession is a true comodato and no Colombian rent is
charged, Ley 820 **should not** be the contract statute — a judge can
still apply it after recharacterization.

### SIC / Estatuto del Consumidor

**FACT.** Ley 1480 de 2011 governs producer–provider–**consumer**
relationships; SIC is the consumer authority.

**CONTEXT.** Marketing **to Colombians in Colombia** invites Ley 1480 +
Ley 820 + alcaldía matrícula. Contracts with **US persons under US
law**, no Colombian consumer solicitation, are designed to stay
outside SIC.

**ASSUMPTION.** A sucursal plus Colombian-resident occupants,
Spanish-language ads, or COP collection can pull the product into
SIC/Ley 820 regardless of NY choice-of-law.

## How the two legs are supposed to fit

| Layer | Intended form | What it is *not* |
|---|---|---|
| US payment contract | True lease / use + non-bargain option (~20% or FMV) | Disguised mortgage; 10% bargain balloon |
| Colombian title | Vehicle, sucursal, or SFC fiducia | Locatario / occupant on folio |
| Colombian possession | Comodato (gratuitous) | Ley 820 rent; SFC leasing habitacional |
| Colombian money | No public deposits; no yield offer | Captación / pirámide / “venta de servicios” |

**ASSUMPTION.** Counsel must still test (i) IRS benefits-and-burdens on
the *US person*, (ii) Colombian substance-over-form on the comodato,
(iii) FX/registry on the sucursal, (iv) who is the “consumer.”

## Sources (consulted)

| Source | Date | URL |
|---|---|---|
| IRS IRB 2001-19 / Rev. Proc. 2001-28 | 7 May 2001 | https://www.irs.gov/pub/irs-irbs/irb01-19.pdf |
| UCC §1-203 (Cornell LII) | official text, fetched Aug 2026 | https://www.law.cornell.edu/ucc/1/1-203 |
| Ley 820/2003 (Senado) | 10 Jul 2003; page 30 Jun 2026 | http://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html |
| Decreto 4334/2008 | 17 Nov 2008 | http://historico.presidencia.gov.co/decretoslinea/2008/noviembre/17/dec433417112008.pdf |
| Corte Constitucional C-145/09 | 2009 | https://www.corteconstitucional.gov.co/relatoria/2009/c-145-09.htm |
| Decreto 1415/1940 art. 5 | 1940 | https://cancilleria.gov.co/normograma/compilacion/docs/decreto_1415_1940.htm |
| DIAN Comunicado 070 | 8 May 2026 | https://www.dian.gov.co/Prensa/Paginas/NG-Comunicado-de-Prensa-070-2026.aspx |
| DIAN Concepto 5148/2026 | 31 Mar 2026 | https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_5148_2026.htm |
| SIC Estatuto del Consumidor | Ley 1480, 12 Oct 2011 | https://www.sic.gov.co/estatutos-consumidor |

**Not used as authority:** law-firm blogs claiming a general 50 km /
2 km foreign-ownership ban.

See **17** for the option-exercise closing (balloon ≠ folio; POA; BanRep;
RUNT) and **18** for US OFAC / CIP-like files and notary SIPLAFT.
