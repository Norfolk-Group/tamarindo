# Pitch deck design standard

Visual contract for Tamarindo investor slides. Tokens match
[07-design-system.md](../07-design-system.md). HTML preview, PPTX, and PDF
must share this system — do not restyle one format.

## Canvas

- 16:9 widescreen (`13.333" × 7.5"` / 1219 × 685 px in the HTML preview)
- Background `#091414` (`--bg`)
- Hairline `#f2f7f608` frames, no drop shadows
- One jewel accent: teal `#23a5b4` for rules and the live cursor
- **Gold `#ffc94d` only for money** — P&L cells, Use of Funds, the ask figure

## Type

| Role | Face | Size (preview) |
|------|------|----------------|
| Slide kicker | Geist Mono | 11px, teal, tracking |
| Title | Space Grotesk | 28–32px |
| Body | Geist | 15px |
| Table | Geist Mono | 12px, tabular numbers |

## Tables (P&L and Use of Funds)

- One table per slide. No second grid.
- Header row: dim ink, uppercase, 10px
- First column stub (line name); remaining columns FY labels or uses
- Gold on totals and the ask cell only
- Footnote in 11px dim: `FACT` / `OPINION` / `ASSUMPTION` / `model`

## Slide chrome

- Top-left: `TAMARINDO` in mono
- Top-right: slide index `04 / 10` on story slides; `B2` on backups
- Thank-you has no index
- Footer: `Confidential · not an offer` until Deal Terms are published

## Motion (HTML preview only)

- Slides are a vertical stack; no auto-play
- `prefers-reduced-motion`: static
- Do not animate numbers; they are already live from the engine

## Illustrations

Optional Nano Banana plates go in `library/illustrations/generated/…`.
A missing picture is fine. A hallucinated chart of live P&L is not — use
the table.
