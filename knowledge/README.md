# Knowledge — Nico's source materials and thesis

This folder holds confidential Tamarindo source materials for Nico to ingest
(meeting recordings, transcripts, financials, PDFs, notes) plus the
synthesized **thesis** built from them.

**Raw source materials are gitignored** — they never go to GitHub. Once the
ingestion pipeline is built, they will live in Cloudflare R2 with embeddings
in pgvector, and this folder becomes a local staging area.

**`thesis/` and `qa/` are version-controlled** — authored analysis and
persona Q&As for Nico, not raw recordings. `knowledge.search` retrieves over
that bundled markdown today. `MemoryChunk.embedding` is the pgvector slot.
`node scripts/ingest-memory-chunks.mjs` dry-runs chunk counts; `--apply`
writes rows **without embeddings** and does not migrate. Do not run `--apply`
without an explicit database go-ahead.

## Layout

```
knowledge/
  thesis/                      # the Tamarindo opinion & thesis (committed)
  qa/                          # persona Q&As for Nico retrieval (committed)
  meetings/<date>-<topic>/     # recording, chat log, transcript, summary (ignored)
  financials/                  # Excel files, statements (ignored)
  documents/                   # PDFs, memos, contracts (ignored)
```

## Start here

- [thesis/README.md](thesis/README.md) — the one-paragraph thesis and index
  to entity architecture, the 10-year plan, ICP deals, and the fee engine.
- [meetings/granola-index.md](meetings/granola-index.md) — meeting timeline.
- [documents/tamarindo-docs-index.md](documents/tamarindo-docs-index.md) —
  document index.
