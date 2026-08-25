# 18 — KYC / AML, two countries (as of 24 Aug 2026)

*Companion to 17 (how title actually moves). CONTEXT for counsel and
compliance. **Do not invent that Tamarindo is BSA- or DFS-licensed.**
Not legal advice.*

Launch policy (Granola): **individuals only (SSNs)** at first, to avoid
corporate KYC. US-side file is Plaid + driver’s license + SSN. Colombian
document pack for the **final transfer** is still an open legal item.

## United States — is the lessor a BSA financial institution?

**FACT.** Two “FI” lists exist. 31 U.S.C. § 5312 is broad (loan or
finance company, vehicle seller, real-estate closer). 31 CFR
§ 1010.100(t) is **narrower**. A **loan or finance company is expressly
not** a § 1010.100(t) FI.

**FACT.** FinCEN’s “loan or finance company” AML program (Part 1029) is
only **non-bank residential mortgage lenders/originators**. There is
**no CIP subpart** in Part 1029.

**FACT.** Statutory FIs FinCEN has not yet given programs stay
**temporarily exempt** under § 1010.205(b) (including vehicle sellers
and real-estate closers).

**CONTEXT.** A US specialty lessor of **Colombian** homes/cars is
typically **not** an RMLO, **not** an MSB (collecting its own rent/down/
balloon is integral to the service — § 1010.100(ff)(5)(ii)(F)), and
**not** a bank CIP FI. Counsel must still test recharacterization
(finance lease / bargain option as a “loan”).

### CIP, CTA, CDD

**FACT.** Bank CIP (31 CFR § 1020.220 / PATRIOT § 326) applies when a
**bank** opens an *account*: name, DOB, address, SSN/ITIN or passport.
**It does not attach to a generic lessor.**

**FACT — CTA / BOI as of 24 Aug 2026.** FinCEN final rule 11 Aug 2026,
effective **14 Aug 2026**: **US-created companies and US persons file
no BOI reports.** Remaining reporters: foreign entities registered to
do business in a US state, and they must **not** report US-person
beneficial owners.

**FACT.** Bank CDD (31 CFR § 1010.230) still applies to **covered FIs**.
A non-bank lessor is not one of them.

**CONTEXT.** Practical “CIP” at origination (name, DOB, address, SSN or
passport + Plaid) is **policy + credit-bureau demand**, not a FinCEN
CIP duty.

### OFAC, cash, FCRA, NY

**FACT — OFAC.** Every **US person** (and typically a foreign branch of
a US parent) must not deal with SDNs. Screen lessee and payors at
origination, each payment, and list updates. **Not BSA-gated.**

**FACT — SAR.** Mandatory SAR only if the entity is a covered FI. A
plain lessor has **no mandatory SAR**. Voluntary disclosure is still
protected (31 U.S.C. § 5318(g)(3)).

**FACT — $10k cash.** Banks file CTRs. A trade or business that
**receives currency > $10,000** files **Form 8300** (15 days). Wires
and ACH are **not** currency for 8300.

**CONTEXT.** Same customer, later balloon is **not** a new statutory
CIP opening. **OFAC re-screen** still applies. Source-of-funds on large
wires is **risk policy** plus whatever the **receiving bank** demands.

**FACT.** Pulling FICO makes the lessor a **user of consumer reports**
(FCRA). ECOA/Reg B can cover consumer leases (*Brothers v. First
Leasing*). FACTA Red Flags can apply to creditors with covered
accounts.

**FACT — NY.** Licensed lender (Banking Law § 340) is about **loans**
under dollar caps. Money-transmitter (§ 641) is about transmitting
**other people’s** money. Collecting **own** lease receivables is not
transmission. A **true lease** is generally not Art. IX lending; a
bargain balloon is the recharacterization risk. **Do not say Tamarindo
is DFS-licensed.**

## Colombia — who actually KYCs the transfer

**FACT — SFC SARLAFT** is for **SFC-supervised** entities (banks,
fiduciarias). A title-holding sucursal that is **not** a fiduciaria is
**not** an SFC SARLAFT subject. If title sits in a **fiducia**, the
**fiduciaria** is.

**FACT — SuperSociedades CE 100-000020 (2 Jul 2026)** unified SAGRILAFT
+ PTEE. **Sucursales de sociedades extranjeras** are *sujetos
obligados* when under SuperSociedades **and** they hit UVB tests
(ingresos or activos). Full system ~**4,929,017 UVB**; lower sectoral
(inmobiliario, comercio de vehículos) ~**3,696,762 UVB**. First-time
obligated: implement by 31 May of the following year. Do **not** assume
the sucursal is already in.

**FACT — Notaries are the real CO KYC gate.** SNR IA 17/2016 + IA
08/2017: **SIPLAFT**; ROS immediately; RON quarterly. They identify
grantors; they report, they do not have a duty to *block* the act. UIAF
wants foreigners who sign *escrituras* on a **passport**.

**FACT — DIAN.** Notary is *agente de retención* on many conveyances.
Passport + RUT/NIT. Visa/*cédula* is **not** a civil-law condition of
purchase.

**FACT — RUNT.** Buyer and seller *inscritos*. Foreign adult ID:
*cédula*, **valid passport**, or PPT.

**FACT — Cash (CO).** Art. 90 ET: cash paid for real estate does not
enter fiscal cost. SFC entities report individual cash ≥ COP 10m to
UIAF. If the balloon is paid **in the US**, US 8300/OFAC/bank CDD fire
on the dollar; CO notary SIPLAFT + DIAN fire on the deed.

## Option exercise — what actually refreshes

| Layer | What refreshes |
|---|---|
| US BSA CIP | **No** new statutory CIP if not a covered FI |
| OFAC | **Yes** — new payment |
| FCRA/ECOA | Only if a **new** credit pull |
| Form 8300 | Only if **currency** > $10k |
| CO notary / RUNT | **Full identity again** |
| Sucursal SAGRILAFT | If obligated: contraparte KYC + ROS if unusual |

## Practical stack (CONTEXT — not a license)

| Book | Do | Why |
|---|---|---|
| US origination | CIP-**like** file + **OFAC** + FICO with FCRA/ECOA notices | Policy + credit + sanctions |
| US option | OFAC re-screen; 8300 if cash; source-of-funds **policy** on large wires | Sanctions + 8300; the bank CIPs its *account* |
| US entity | No domestic CTA BOI after **14 Aug 2026** | FinCEN final rule |
| CO title | Notary SIPLAFT + RON/ROS; DIAN IDs/RUT; RUNT passport OK | This is the statutory KYC |
| CO sucursal | Measure UVB + CIIU; implement if threshold met | CE 100-000020 |

## Sources

- 31 CFR §§ 1010.100, 1010.205, 1010.230, 1010.330, 1020.220, 1029.210/.320
- FinCEN CTA: https://www.fincen.gov/boi (eff. 14 Aug 2026)
- OFAC FAQ 1501; IRS Form 8300
- NY DFS licensed lenders / money transmitters
- SFC CBJ Parte I; SuperSociedades CE 100-000020 (2 Jul 2026)
- UIAF SNR; SNR IA 17/2016
- RUNT / Ventanilla Movilidad traspaso
