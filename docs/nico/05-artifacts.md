# 05 — Artifacts

Nico ships four artifact families. All are versioned rows in the artifacts
table with files in R2, rendered as rich cards in the conversation.

## Excel models — live formulas, not pasted values

The differentiator: models compute. Change a growth assumption in Excel and
the valuation recalculates.

Pipeline:
1. **Luca** (finance specialist) designs the model structure as a typed
   spec: sheets, rows, assumptions, formula graph. A silent **fee engine**
   owns every fee Tamarindo charges and every fee a Tamarindo entity pays
   (`lib/artifacts/fees.ts`). Center engines own manpower. Uncited rates
   stay blank.
2. **`runCashflowModel`** (`decimal.js`) is the calculator. Each run
   materializes `ModelCell` values plus human-readable formulas and
   `ModelCellDep` edges on Neon. That is the live book, not a spreadsheet
   library.
3. **Hand-rolled OOXML** (`lib/artifacts/excel.ts`) writes the downloadable
   `.xlsx` so Excel can recompute the formulas. No HyperFormula or ExcelJS
   package — they do not fit the Workers isolate.
4. Every input traces to a source: a cell either derives from a formula, an
   admin record, or a cited document.

Covers: income statements, cash flow statements, DCFs (WACC, terminal
value), scenario/sensitivity tables.

Live path (what ships): blue variables + `runCashflowModel` + a formatted
report workbook. See [12-blue-variables.md](12-blue-variables.md). HTML
preview (new window), 16:9 PDF, and CSV are the same object. Cells and formulas persist on
`ModelCell` and the report-workbook artifact row.

## Pitch decks — 10 story + thank you + 6 backup

Canonical contract: [11-pitch-deck.md](11-pitch-deck.md). Design:
[design/pitch-deck.md](design/pitch-deck.md).

1. Nico **recalculates** (`runCashflowModel`) then fills the 10-slide
   storyline. Slide 6 is P&L and slide 7 is Use of Funds — Excel-like
   tables, live cells, never a pasted PNG of last week's book.
2. **The ask** (slide 9) and any investor-facing raise figure render only
   from published Deal Terms. Unpublished → refuse. See
   [08-guardrails.md](08-guardrails.md).
3. One spec, three formats: HTML (new window), PPTX, PDF. Preview:
   `GET /api/nico/artifacts/:id/html`.
4. Chat may omit a teammate or rebuild after a variable change. It may not
   add slides, drop the tables, or invent the ask.
5. An admin reference `.pptx` on `library/templates/pitch/` is a layout
   hint only. Nico still writes an original deck.

## Podcasts — NotebookLM-style

Two-step pipeline, run as a Cloudflare Workflow:
1. **Script:** Nico writes a two-host dialogue from the source material
   (transcript, memo, the quarter's numbers) — banter, questions, "wait,
   explain that" moments.
2. **Audio:** Gemini TTS multi-speaker (exactly 2 voices) renders the
   dialogue in one call, with pacing/expressive tags (`[short pause]`,
   `[laughs]`). Output stitched, stored in R2, delivered as a playable
   waveform card.

Fallback engine: ElevenLabs dialogue API.

## Memos, briefs & charts

- Pre-meeting investor briefs and post-meeting follow-ups (from transcripts)
- One-pagers and internal memos (Markdown → styled PDF via Browser Rendering)
- Charts: Recharts specs styled in the design system (monochrome + teal,
  mono-font axes), exportable as images for decks and emails
