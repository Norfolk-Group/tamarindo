---
title: R2 Library and Knowledge Ingest
type: feat
date: 2026-08-24
origin: ce-pov oracle (approach-set) on R2 folder schema and 100% KB coverage
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-pov
execution: code
---

# R2 Library and Knowledge Ingest

## Goal Capsule

Give Nico one filing cabinet and one ingest pipeline so every **knowledge-bearing** file the app stores is something he can find — without embedding logos, scratch files, or live numbers that belong in the cash-flow engine.

**Authority:** `docs/nico/02-tech-stack.md` (R2 + Neon pgvector, not Vectorize/D1); `lib/storage/r2-schema.ts` (typed shelves — already started); this plan for how writers, extracts, corpus, and embeddings stay in lockstep.

**Stop if:** a change would put secrets in git, publish a data-room row without a human ask, wipe all `MemoryChunk` embeddings with a full ingest `--apply`, invent investor-facing numbers, or write personal legal history of any team member into extracts, corpus, or embeddings.

## Product Contract

### Summary

Ricardo asked for a real R2 folder schema and for Nico to know as much as the app does. The settled position: keep the typed `library/` drawers, make every write go through them, and run a **mandatory, observable ingest** for eligible content. Structured app state (model variables, Deal Terms, ICPs, artifacts metadata) stays in Postgres and reaches Nico through procedures — it is not copied wholesale into vectors.

### Problem Frame

Today files land in R2 under mixed prefixes. Nico's search only reads a build-time markdown corpus plus `MemoryChunk` rows that are re-checked against that corpus. Chat uploads, Dropbox pulls, PDFs, and Excel sit in the bucket and stay invisible unless someone extracts them by hand. The Cursor upload rule still teaches the old prefixes. A single `artifacts/` dump would erase audience and index policy.

### Requirements

- R1. Every new object write uses a shelf from `lib/storage/r2-schema.ts`. Legacy keys remain readable via `canonicalR2Key`.
- R2. The Cursor upload rule matches the library keys. Agents stop inventing parallel trees.
- R3. Drawers exist for: raw KB, agent-derived KB, user artifacts, admin artifacts, numeric report templates, generated illustrations, variable-driven charts, scratch, and inbox.
- R4. **100% coverage means 100% of eligible knowledge**, not 100% of bytes. Every `index: vector` object gets a text extract (or a one-line caption if it is not text). `index: metadata` objects get a caption/filename record only. `index: none` objects are stored, not searched.
- R5. An extract that should be searchable is written to `library/kb/derived/…`, added to the bundled corpus (`npm run knowledge:sync`), and upserted into `MemoryChunk` with `--only` (never a full wipe). Embeddings are a separate targeted job.
- R6. Vector hits stay permission-checked. New extract `sourcePath`s must exist in the corpus so `lib/knowledge/vector-search.ts` does not drop them, or the gate is extended with explicit visibility on the chunk — do not leave R2-only chunks unreadable.
- R7. Structured truth (cash-flow variables, ICP catalog, Deal Terms, artifact list) is queried via existing procedures (`model.get`, `dealTerms.get`, `artifacts.list`). Nico is not taught to "search R2" for those numbers.
- R8. Personal legal history of any team member is permanently excluded from extracts, corpus, and embeddings. Investor and chat surfaces stay on the Tamarindo brief.
- R9. No data-room publish unless Ricardo asks. No temporary download URLs printed in chat.
- R10. Natalia's competitor benchmark workbook (already on disk) is the first backfill: store on the raw-KB shelf, extract, sync, targeted ingest, embed.

### Actors

- **Admin / Ricardo** — drops source files; Nico must be able to answer from them.
- **Nico (agent)** — writes extracts, illustrations, charts, and user artifacts through the same shelves.
- **Entitled users** — download share-shelf artifacts; do not see admin raw KB unless NDA/role allows.

### Acceptance examples

- A PDF uploaded in chat lands at `library/kb/raw/chat/YYYY-MM-DD/…`. Within one ingest pass Nico can quote it via `knowledge.search`.
- A Nano Banana image lands under `library/illustrations/generated/…` and is findable by caption ("Norfolk mark"), not by embedding pixels.
- Changing `icp.icp1.purchasePriceUsd` updates Model; Nico answers from `model.get`, not from an old chart PNG in R2.

### Product scope

In: R2 key contract, ingest Workflow (or script + later Workflow), corpus/chunk/embed path, rule update, first Natalia backfill.

Out: Migrating hosting, changing AuthKit, publishing Deal Terms, building the investor deck, WhatsApp group import (needs an export from Ricardo), Prisma migration unless R6 cannot be met without a visibility column — ask before migrating.

## Planning Contract

### Key technical decisions

- **KTD1 — Typed prefixes are the contract; R2 will not enforce them.** Writers go through `r2Key` / `chatUploadKey` / `userArtifactKey`. Readers try canonical then legacy. Partial dual-namespace is expected during backfill (R2 has no atomic rename).
- **KTD2 — Dual retrieval stays.** Keyword = bundled corpus. Semantic = `MemoryChunk` + bge-m3. To make "Nico knows it" true, every searchable extract must hit **both** paths (sync + targeted ingest + embed).
- **KTD3 — Ingest is event-shaped, not opportunistic.** Target: Cloudflare R2 event notification → Queue → Workflow (parse → extract → corpus note → `--only` upsert → embed). Until that is bound, a `scripts/ingest-r2-object.mjs` that takes a key is the same stages, run by the agent after every upload.
- **KTD4 — Do not embed live financials.** Templates and rendered charts stay `index: none`. Nico reads the engine. A chart spec may be stored; the PNG is a snapshot, not truth.
- **KTD5 — Exclusion list is a filter, not a thesis file.** Implement as a deny in the ingest script and in Nico's voice redline. Do not put excluded topics into `knowledge/thesis/` (that would make them searchable).

### Assumptions

- Bucket remains `tamarindo-files` (remote). Local R2 is not the library.
- No new npm packages without asking. PDF/xlsx extract uses tools already on the machine (`pdftotext`, Python zip/xml, `textutil`).
- Full `ingest-memory-chunks.mjs --apply` without `--only` is forbidden for this work.

### Sequencing

1. Align writers and the Cursor rule (U1).
2. Extract + corpus + chunk path for one object (U2) — prove Natalia's workbook.
3. Backfill known R2 keys (U3).
4. Workflow/notification (U4) only after U2 is boring.

## Implementation Units

### U1 — One write contract

**Scope:** Make the library the only way new bytes are named.

**Files:** `lib/storage/r2-schema.ts`, `lib/storage/r2-schema.test.ts`, `.cursor/rules/r2-uploads.mdc`, `lib/nico/media-store.ts`, `lib/artifacts/complete-job.ts`, `docs/nico/10-r2-library.md` (short operator page in plain English).

**Decisions:** Chat attachments → `library/kb/raw/chat/YYYY-MM-DD/`. Dropbox → `library/kb/raw/dropbox/`. Brand/photos → `library/kb/raw/brand/`. Tell Ricardo the new keys after each upload.

**Tests:** `lib/storage/r2-schema.test.ts` — legacy aliases, `shouldVectorIndex`, date keys.

### U2 — Ingest one object end to end

**Scope:** Given an R2 key, produce extract text, corpus membership, MemoryChunk rows, embeddings — without wiping the rest of the table.

**Files:** `scripts/ingest-r2-object.mjs` (new), `scripts/ingest-memory-chunks.mjs` (already has `--only`), `scripts/sync-knowledge-corpus.mjs`, `scripts/embed-chunks.mjs`, `lib/knowledge/vector-search.ts` (only if corpus-path gate blocks R2 extracts).

**Extract home:** `knowledge/documents/` (gitignored) **and** `library/kb/derived/extracts/…` on R2 so the extract itself is durable.

**Tests:** `lib/knowledge/vector-search.ts` coverage if the gate changes; a unit test that `shouldVectorIndex` + a fixture extract path is treated as confidential-by-default unless tagged public.

**Test scenarios:**

- `--only` upsert of one new extract does not `deleteMany` other `sourcePath`s.
- A PDF/xlsx extract longer than the chunk threshold appears in `knowledge.search` for an admin.
- An `index: none` key is skipped with a logged reason.
- An excluded-topic filename or header is dropped (no chunk written).

### U3 — Backfill what is already in the bucket

**Scope:** Copy or alias known remote keys onto library prefixes; extract every vector-eligible object already uploaded this month (business plan PDF, Dropbox docs, Natalia benchmark xlsx, tech cost model).

**Do not** publish data-room rows. **Do not** print download URLs.

**Tests:** A checklist in the plan appendix, not a unit test — confirm chunk counts and that `knowledge.search` returns Natalia's four competitor categories.

### U4 — Durable ingest (later)

**Scope:** R2 event notifications filtered by `library/kb/` prefixes → Cloudflare Workflow. Same stages as U2. Observability: success/fail per key.

**Stop if:** U2 is still manual and flaky. Do not add a queue on a broken extractor.

**Ask before:** new Cloudflare bindings or migrations.

## Verification Contract

- `npx vitest run lib/storage/r2-schema.test.ts lib/knowledge/`
- Dry-run: `node scripts/ingest-memory-chunks.mjs --only knowledge/documents/<extract>.txt` (no `--apply` until Ricardo okays the DB write).
- After apply: targeted embed of nulls only; confirm pending count for that `sourcePath` is zero.
- Manual: ask Nico "what did Natalia say Volvé is?" — must cite the benchmark extract, not invent.

## Definition of Done

- New uploads use `library/` keys; the Cursor rule says so.
- Natalia's benchmark is in R2, extracted, in corpus, chunked, embedded.
- Nico can retrieve that extract and the existing thesis without a full reingest.
- Operator doc `docs/nico/10-r2-library.md` explains the drawers in plain English.
- Personal legal-history exclusion is in the ingest filter and in Nico's voice redline — not in the searchable thesis.

## Appendix

### Drawer map (plain English)

| Drawer | Who sees it | Nico searches it? |
|---|---|---|
| `library/kb/raw/…` | Admin | Yes, after extract |
| `library/kb/derived/…` | System / admin | Yes (this is the text he actually reads) |
| `library/templates/…` | Admin | No — shells only |
| `library/illustrations/…` | Entitled | Caption only |
| `library/charts/…` | Entitled / system | Spec maybe; rendered PNG no |
| `library/share/users/…` | Entitled users | No (download, don't embed the xlsx) |
| `library/share/admin/…` | Admin | No unless promoted to raw/derived |
| `library/scratch/…` | System | Never |
| `library/inbox/…` | Admin | After someone files it |

### What "as much as the app" means

| App already knows | How Nico should know |
|---|---|
| Thesis, Q&A, meeting extracts | Corpus + MemoryChunk (today) |
| Chat/Dropbox/PDF/xlsx | Extract → derived → corpus + chunk + embed (this plan) |
| Cash-flow, ICPs, Deal Terms | Procedures, not vectors |
| Generated pictures | Caption + signed media URL |
| Team roles | `lib/nico/people.ts` + thesis team note — no excluded personal history |

### First backfill keys (once listed on remote)

- Natalia: `Benchmark Tamarindo vs Competitors` xlsx → `library/kb/raw/chat/2026-08-24/`
- Prior chat PDF / Dropbox docx / tech cost xlsx already discussed this week
- Legacy `uploads/chat/…` and `source/dropbox/…` stay readable via aliases
