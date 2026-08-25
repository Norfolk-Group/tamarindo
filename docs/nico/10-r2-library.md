# 10 — File library (R2)

Plain-English map of the `tamarindo-files` bucket. The code contract is `lib/storage/r2-schema.ts`.

Nico should know as much as the app does. That does **not** mean every pixel and every live spreadsheet cell becomes a vector. It means:

1. Every knowledge-bearing file is stored in the right drawer.
2. Text (or a short caption) is extracted into the knowledge base.
3. Live numbers stay in the cash-flow engine and Deal Terms. Nico asks those procedures; he does not search an old PNG.

## The drawers

| Drawer | What goes here | Does Nico search it? |
|--------|----------------|----------------------|
| `library/kb/raw/…` | Source material (chat uploads, Dropbox, brand files) | After extract |
| `library/kb/derived/…` | Extracts and notes Nico wrote for himself | Yes — this is what he reads |
| `library/templates/…` | Report shells that only change numerically | No |
| `library/illustrations/…` | Pictures from Nano Banana / similar | Caption only |
| `library/charts/…` | Chart specs and frozen images | Spec maybe; image no |
| `library/share/users/…` | Downloadable work product | No (download, don't embed) |
| `library/share/admin/…` | Admin drafts | No unless promoted |
| `library/scratch/…` | Temporary working files | Never |
| `library/inbox/…` | Unclassified landing zone | After someone files it |

Old keys (`uploads/chat/…`, `source/dropbox/…`, `artifacts/…`) still open. New writes use `library/`.

## How a file becomes something Nico can quote

1. Put the original on a `kb/raw` shelf (remote R2 only).
2. Extract text to `knowledge/documents/` and copy the extract to `library/kb/derived/extracts/`. PDFs use `pdftotext` first; if the page looks empty or scanned, Mistral OCR (`MISTRAL_API_KEY`, local ingest only) reads it. Pass `--ocr` to force OCR. Never send a public download URL.
3. `npm run knowledge:sync` so keyword search sees it.
4. `node --env-file=.env scripts/ingest-memory-chunks.mjs --apply --only knowledge/documents/<file>` — never a full `--apply`.
5. Embed the new nulls only.

Personal legal history of any team member is excluded from this pipeline. That stays out of the searchable corpus on purpose.

## What stays in the database, not in R2 search

Cash-flow variables, ICP mix, Deal Terms, artifact rows. Nico calls the same procedures the UI calls.
