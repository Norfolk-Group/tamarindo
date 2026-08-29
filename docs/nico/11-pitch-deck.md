# 11 — Investor pitch deck

Governance for how Nico builds a Tamarindo raise deck. Design tokens live in
[design/pitch-deck.md](design/pitch-deck.md). The code contract is
`lib/artifacts/raise-deck.ts` plus `lib/artifacts/pitch-tables.ts`.

## What a pitch is

A pitch is **not** a finished PDF report. It is a live artifact Nico
rebuilds after he reads the cash-flow variables and Deal Terms.

Every raise / raise-draft deck has a hard cap:

| Band | Count | What it is |
|------|-------|------------|
| Story | **10** | Cover through close. Includes **one P&L** and **one Use of Funds**. |
| Thank you | **1** | Fixed closer. Not a story slide. |
| Backup | **6** | After thank you. Standard, do not rewrite from chat whim. |

**17 slides total.** Nico will not add an 18th. He will not drop P&L or Use
of Funds to make room for a pet slide.

Formats, always from the **same spec**:

- **HTML** — preview in a new browser window
- **PPTX** — downloadable working file
- **PDF** — downloadable print of that spec (nice-to-have; HTML/PPTX are the product)

## Storyline (the 10)

These titles are the guideline. Wording on most slides is finished
on-demand after Nico recalculates.

1. **Cover** — Tamarindo Credit. Confidential.
2. **Problem** — credit does not travel.
3. **Why now / why Tamarindo** — diaspora, Intervest vehicle, OpCo still needs equity.
4. **Product** — US lease + Colombian comodato. Tamarindo originates and services.
5. **Who we serve** — ten Ideal Contract Profiles from the live catalog (six property, two auto, two aircraft).
6. **P&L** — Excel-like table. Numbers from `runCashflowModel` at request time.
7. **Use of funds** — Excel-like table. OpCo spend from the same run. Not vehicle warehouse cash.
8. **Team** — current roster (`lib/nico/people.ts`). Chat may omit a name.
9. **The ask** — **Deal Terms record only.** Unpublished → refuse. Nico will not invent a raise.
10. **Close** — next conversation (Intervest / Mike), not a second ask.

## Backup (the 6, after thank you)

Fixed purpose. Nico may refresh a cited number; he does not change the
topic.

1. Methodology (model, citations, FACT / OPINION / ASSUMPTION)
2. Team bios
3. Regulatory environment (lease + comodato, no Colombian bank as lender)
4. Unit economics (ICP-1 shape from the engine)
5. Corporate structure (entities + Ashoka — not the ask)
6. Competitive frame (Natalia: banks, brokers, Volvé, Tamarindo)

## What is prefabricated vs on-demand

**Prefabricated:** band count, storyline order, design tokens, Ask legal
wording, backup topics, table shells for P&L and Use of Funds.

**On-demand:** most bullets, every table cell, who is on the team slide,
optional illustrations. Nico checks variables → recalculates → rewords →
places numbers in the shells.

**Excel-like** means the cash-flow engine owns the math. The slide is a
view. Change a variable in chat (`model.setVariables` / `icp.set`) and
rebuild the deck — do not paste a stale PNG.

## Chat mutations Nico will honor

- Rebuild after a variable or ICP change
- Omit or restore a team member on the team / bios slides
- Switch download format (HTML / PPTX / PDF)
- Queue raise-draft (admin) or structure (no ask)

## Limits (he will refuse)

- Invent or “round up” the ask, pre-money, or instrument
- Publish Deal Terms or a data-room row
- Add slides past the cap, or remove P&L / Use of Funds
- Treat an admin **template** as the finished deck (reference only)
- Put vehicle (Intervest) warehouse cash on Use of Funds
- Discuss anyone’s personal legal history

## Admin template

An admin may upload a reference `.pptx` to
`library/templates/pitch/reference.pptx` (see `lib/storage/r2-schema.ts`).
Nico may look at that file slide-by-slide for layout hints. He still writes
an original Tamarindo deck on the 10+6 contract. The template is never
copied through to investors.

## Agent-native

UI and Nico call `artifacts.create` with `kind=deck`. Preview is
`GET /api/nico/artifacts/:id/html` in a new window. Same spec, three
formats.
