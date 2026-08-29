# 20 — Aug 26 Intervest-pilot decisions

**Source:** Granola Tamarindo Call, 26 Aug 2026
(`knowledge/meetings/2026-08-26-tamarindo-call/summary.md`). Grades are
FACT unless marked. People are roles and seats.

This note is the live Intervest-pilot box as of 26 Aug. Where it
conflicts with older thesis or the ICP catalog, **this note wins for
what we tell Mike**; older files stay as history or what-if.

## The box

| Item | Live value | Grade |
|------|------------|-------|
| Pilot | $20M — $10M Medellín + $10M Cartagena | FACT |
| Asset classes | Homes **and** vehicles, **same launch**, not staggered | FACT — Ricardo 27 Aug. Base case books both from month 1. |
| Horizon of the pilot | One-year deployment, soft commitment | FACT |
| Vehicle term | 12–84 months, US increments | FACT |
| Home term | 2–15 years; 15 is the ceiling | FACT |
| Down | 40% | FACT |
| Residual / balloon | **20% of asset** | FACT — Ricardo 27 Aug. 10% is only the “real choice” rule of thumb. |
| Credit | FICO **780+ hard floor**, SSN, individuals only (no LLC) | FACT — Ricardo 27 Aug. Lower tiers stay admin/what-if. |
| Default cite | ~1.5% at 780+; ~8% below | CONTEXT (Dov/Mike, not a Tamarindo book) |
| Pricing reference | ~500 bps over LIBOR / IBOR | FACT — Intervest's *expected* level, not a hard
  price. Intervest gets whatever the model remits. Below-reference is a
  raise-risk comment, not Nico's job to "fix." Track LIBOR; say the
  reference when asked. |
| OpCo take | **2% one-time** on each Intervest **advance** (the
  money Intervest provides so Tamarindo can fund a lease) + **20% of
  what the lessee pays Intervest** (not PE-style 20% of profits) | FACT
  — Ricardo 27 Aug. Not an annual 2% of AUM. The 20% is of **interest
  paid to Intervest**, not the whole check (predial / insurance / reserve
  pass through). Matches `spreadSharePct`. |
| Aviation | **Out of this warehouse entirely** | FACT — Ricardo 27 Aug.
  Catalog aircraft ICPs are what-if only. Do not pitch to Intervest. |
| Used assets | Out for now; new only | FACT |
| Buyer | Already found the asset; needs credit | FACT |
| Speed | Conditional offer in under 3 minutes | FACT (target) |
| PM | Outsourced; no Tamarindo PM firm | FACT |
| Hedge | Currency-hedging cost belongs in the model | FACT (must add) |
| Mike meeting | Week of 8 Sep, in person | FACT |
| OpCo raise (working) | **$2.5M** | ASSUMPTION — Ricardo 27 Aug. Until Colombia cost pack lands. |
| US OpCo payroll | Dov, Rosario, Ricardo, Tom | FACT — Ricardo 27 Aug. Paid from Tamarindo Credit US. **No extra US analyst or CS FTE.** Rosario owns HITL. Tom **is** the IT budget. All four **WFH**. Benefits: **100% family medical** (household of 3) + 401k 3% + family dental/vision. Remote opex: Dov / Rosario / Ricardo **$2,000/mo** each — not Tom. Thesis 21. |
| Title — Dov | Founder / Managing Director (Dov Tuzman) | FACT — Ricardo 27 Aug. |
| Title — Rosario | Finance Director (Rosario Davi) | FACT — Ricardo 27 Aug. |
| Title — Ricardo | Director of Planning and Corporate Development | FACT — Ricardo 27 Aug. |
| Title — Tom | Director of Information Systems | FACT — Ricardo 27 Aug. Was CTO in older notes. |
| Title — Boris | General Manager, Colombia | FACT — Ricardo 27 Aug. |
| Title — Andrés | Director of Business Development, Colombia | FACT — Ricardo 27 Aug. |
| Title — Natalia | Director of Marketing, Colombia | FACT — Ricardo 27 Aug. Colombia-based. **OpCo pay $0** — paid by another entity. |
| Title — Iván | Government Relations, Colombia | FACT — Ricardo 27 Aug. |
| Juan Pablo | Stakeholder for now — not a titled seat | FACT — Ricardo 27 Aug. |
| Title — Jesi | Director of Business Development, Colombia (Jesi Gomes) | FACT — Ricardo 27 Aug. Several BD directors is fine. **OpCo pay $0** — paid by another entity. |

Mike's line on this call: **make the exotic vanilla.**

## What this overrides

- **Aircraft in the catalog / `aircraftStartMonth`.** Out of this
  warehouse entirely (Ricardo, 27 Aug). Keep the two aircraft ICPs as a
  what-if book. Do not pitch aircraft to Intervest.
- **Staggered auto start.** The member lever `autoStartMonth` is still a
  what-if. The **pilot commitment** is both classes at once.
- **FICO internals as a member story.** The published box is 780+.
  Lower-tranche math stays admin / CONTEXT.
- **Jesse / aviation seat.** The person is still on the team. The
  **product** for this warehouse is not aircraft.

## Still open (do not invent)

- 500 bps over LIBOR is a **reference**, not a lock. Intervest gets the
  modeled remittance. Closed 27 Aug (Ricardo).
- Used assets if a warranty covers the whole term (Dov, later).
- Rental fee: Andrés ~1% p.a. of property value vs framing it as
  insurance (ASSUMPTION / OPINION on the call).
- Colombia cost pack (title, notary, insurance, staffing) — due from the
  28 Aug Colombia sync.

## Entities (unchanged, restated — see thesis 02)

Two **US** companies, each with its **own** Colombian sucursal:

- **Tamarindo Credit, LLC** (Delaware OpCo, Rosario incorporating) —
  originator / servicer. **Manages** the vehicle. Does **not** own it.
  Owns the app, servicing, title studies, Formulario 4 admin, insurance.
- **Tamarindo Intervest, LLC** (Delaware) — **100% Intervest-owned**
  (Ricardo, 27 Aug). US company. **Its Colombian sucursal owns the
  properties and cars in Colombia.**
- **Tamarindo Credit, LLC** (Delaware) — US company. Colombian sucursal.
  **Originates and services** (app, underwriting, billing, title study,
  Formulario 4 admin). **Manages** the Intervest vehicle. **Never holds
  title.** The client does **not** pay Credit. Ricardo, 27 Aug.
- **Money and contract:** the US buyer signs the US lease with
  **Tamarindo-Intervest LLC** and **wires and pays that US company**
  (down and ongoing). Ricardo, 27 Aug.

Intervest is named in fine print, not in retail marketing. The OpCo
fundraise is against Credit, not the vehicle.
