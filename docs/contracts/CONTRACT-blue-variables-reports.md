# CONTRACT — Blue variables and live financial reports

**Status:** candidate for [norfolk-kit](https://github.com/Norfolk-Group/norfolk-kit).  
**First implemented in:** Tamarindo / Nico.  
**Does not change the Tamarindo stack** (Workers + Prisma + Neon/Hyperdrive + WorkOS).

A kit default that still uses Railway + Drizzle should map the same nouns,
not copy Tamarindo’s host.

## Why

Operators ask Nico for financial statements, investor returns, and
sensitivity the way they ask Excel. The math must be live. The view must
look like a formatted workbook. Cells, formulas, and formatting must live
in the database — not only in a JSON blob on an artifact row.

## Nouns

| Noun | Meaning |
|------|---------|
| **Blue variable** | User-facing input. Ships a **seed default**. Members may change it. Excel convention: blue = typed. |
| **Grey variable** | Admin-only input. On the admin Assumptions list; members do not edit it. |
| **Personal case** | One saved input set per profile. First save copies away from the shared company case. The only working set. |
| **Named what-if** | A personal snapshot of that live case (`ModelScenario`). Save-as does not change the live case. Load copies it back onto the personal case. Not a second live case. |
| **Engine** | Server-side calculator. Tamarindo: `runCashflowModel`. |
| **Report workbook** | One live book of a `kind`. Contains sheets. |
| **Report cell** | One grid address: value, display text, formula, format, tone, row kind. |

Ask, pre-money, and instrument are **not** blue. They come from the
published Deal Terms record.

## MUST

1. Recalculate on the server when the user asks for statements, returns, or
   sensitivity — or after a write to **that caller’s** case.
2. Persist every visible cell as a `ReportCell` row (address, row, column,
   text, numeric value, formula, format, tone, row kind).
3. Offer the **same** workbook as HTML (preview window), PDF, and CSV.
4. Mark blue-variable cells `tone=blue`. Mark totals / IRRs `tone=gold`.
5. UI and the agent call the same procedures (`model.setVariables`,
   `model.saveScenario`, `model.listScenarios`, `model.applyScenario`,
   `model.diffScenarios`, `model.report`, `model.export`).
6. Label FACT / OPINION / ASSUMPTION on cited inputs. Do not invent a raise
   or an exit IRR.
7. Sensitivity shocks rerun the engine in memory. They do **not** save
   unless the user names a save (`save this as {name}` → `model.saveScenario`).

## MUST NOT

1. Paste a stale PNG or last week’s book as the live report.
2. Invent Deal Terms from the model.
3. Treat vehicle warehouse cash as OpCo equity.
4. Put formulas only in the client.
5. Restyle HTML, PDF, and CSV as three different products.
6. Treat a named what-if as a second live case.

## Data (Prisma shape — Tamarindo)

```
ReportWorkbook  kind, title, theme, generatedAt, isLive, createdBy
ReportSheet     key, title, caption, sortOrder
ReportCell      address, rowIndex, colIndex, text, value, formula,
                format (text|usd|pct|number),
                tone (blue|gold|dim|plain),
                rowKind (header|section|line|total)
```

`ModelScenario` / `ModelCell` remain the **provenance graph** (what a number
depends on). `ReportCell` is the **formatted view** (what the operator sees).
Do not collapse the two.

One `isLive=true` workbook per `kind`. A new run flips the previous live
row off. History stays.

## Procedures

| Procedure | Does |
|-----------|------|
| `model.get` | Engine output + variables this role may see |
| `model.setVariables` | Write this caller’s personal case; recalculate. `resetToShared` drops it. Does **not** publish the company case. |
| `model.publishShared` | Admin **human** only. Writes the shared company case. Agents cannot invoke it. UI Publish POSTs `/api/nico/model`. |
| `model.saveScenario` | Snapshot the current live case as a named personal what-if. Does not change the live case or its title. |
| `model.listScenarios` | This profile’s named what-ifs. Hides auto-saved `"Base case (auto)"`. Members see blue keys only. |
| `model.applyScenario` | Copy one owned snapshot onto this profile’s personal case. Never publishes. Members persist only published keys. |
| `model.diffScenarios` | Compare two owned snapshots. Glance of input deltas plus FY1/FY10 closing cash — not a second report book. |
| `model.report` | Build workbook for `statements` \| `income` \| `returns` \| `sensitivity`; persist cells; return preview path |
| `model.export` | `html` \| `pdf` \| `csv` \| `xlsx` of that kind; optional `depth=summary\|extended` |

## Report kinds

| Kind | Contents |
|------|----------|
| `statements` | Entity cash-flow grids (OpCo, local, consolidated, vehicles as the product defines) |
| `income` | Cash-basis operating P&L built on demand from the same engine |
| `returns` | Unit / book investor returns the product can compute without inventing an exit |
| `sensitivity` | Shock published blue levers; show the same output columns each time |

## Presentation

Theme name is a token (`tamarindo-sheet` here). Tokens live in the product
design standard. Chat shows a glance (meaning rows, not the book). Reports
that can be read two ways ship **summary** (totals) and **extended** (every
line). Default is summary. HTML in a new tab is the review surface and
keeps the same toggle. PDF is a 16:9 print of the same cells with repeating
headers; CSV is the same tables. PDF/CSV default to extended.

## Agent-native chat

Honor: “financial statements”, a fiscal-year slice, “investor returns”,
“sensitivity on {lever}”, “set {blue variable} to {n}”, “show my
assumptions” (meeting-lever glance, not the 181-row book), “save this as
{name}” (`model.saveScenario`, not Publish), “load {name}” / “apply {name}”
(`model.applyScenario` after a name match), “compare {A} and {B}”
(`model.diffScenarios`, compact glance). Percents are typed and shown as 40,
not 0.40.

Refuse: invent the ask, save a shock as the base case, treat a named
what-if as a second live case, add slides past a product cap, discuss
anyone’s personal legal history.

## Feed this back to the kit

Raise this file into `norfolk-kit` as
`contracts/blue-variables-reports.md` (or the kit’s current CONTRACT
folder). Do not migrate Tamarindo toward Railway, Drizzle, Clerk, or
Vercel to “match the kit.”
