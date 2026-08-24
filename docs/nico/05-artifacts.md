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
2. **HyperFormula** computes the formula graph server-side to validate that
   every cell resolves and sanity checks pass (no #REF!, balance checks).
3. **ExcelJS** writes the `.xlsx` with real formulas, named ranges, an
   assumptions sheet, and formatting (mono numbers, Tamarindo styling).
4. Every input traces to a source: a cell either derives from a formula, an
   admin record, or a cited document.

Covers: income statements, cash flow statements, DCFs (WACC, terminal
value), scenario/sensitivity tables.

## Pitch decks — ask and terms included

1. **Pietro** (output specialist) fills a structured outline: problem,
   market, traction, team, projections (pulled live from the model), use of
   funds, the ask, term summary.
2. **The ask and terms render only from the admin-controlled Deal Terms
   record** (raise amount, pre-money, instrument, board seats). Never from
   model imagination. See [08-guardrails.md](08-guardrails.md).
3. **PptxGenJS** renders real `.pptx` on the Tamarindo template; a React
   preview renders slide thumbnails in the conversation.
4. Lint gates before delivery: overflow text, missing citations, off-brand
   colors.
5. Term-sheet drafts carry a "draft, not legal advice" footer and pass the
   approval gate before any investor sees them.

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
