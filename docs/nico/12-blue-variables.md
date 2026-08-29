# 12 — Blue variables and live financial reports

Governance for Nico’s Excel-like book. Design tokens live in
[design/financial-reports.md](design/financial-reports.md). Code:
`lib/model/report-workbook.ts`, `lib/model/returns.ts`, `lib/model/sensitivity.ts`.

## Blue variables

A **blue variable** is a user-facing input. It ships with a **seed default**
from `VARIABLE_DEFS` (`visibility: "user"`). Members may change every blue
key; admins may change every key, including grey operating detail. The
engine recalculates on the server.

**Ideal Contract Profiles** (six property, two auto, two aircraft) are
admin-only. They live under Admin → ICPs, not as blue member inputs.
Seeds and explanations are in `lib/model/icp-catalog.ts`. The gate is
[CONTRACT-admin-catalog.md](../contracts/CONTRACT-admin-catalog.md).

This is the Excel convention: blue = typed by the analyst; black = formula.

Seeds live in code. The **shared company case** is the legacy
`__tamarindo_model_variables__` artifact. The first time a person saves,
they get a **personal case** (`__tamarindo_model_variables__:{profileId}`).
Reports, chat, and export for that session use their case. Reset drops
the personal row and they inherit the company case again. Admin **Publish**
writes the shared company case (human-only `model.publishShared`). Percents
are typed as 40, not 0.40.

**Named what-ifs** are snapshots of the live case, not a second working set.
Assumptions: Save as / Load / Compare. Chat uses the same procedures. Deal
Terms stay off this shelf.

The left rail is **Assumptions** (inputs) and **Statements** (the book).
Assumption groups are collapsible. Statement sections fold the same way.

Key blue levers (meetings + thesis) plus the **complete Credit LLC fee
book** (thesis 22). Core commercial levers stay; every industry-standard
fee Credit is paid or pays is also blue, usually at **$0** until scheduled:

- Client down / LTV (`downPaymentPct`, seed 40% → 60% LTV)
- Purchase-option floor (`minResidualOfAssetPct`, seed 20% of asset)
- Activation, origination, servicing, and US share of interest — the same
  four levers sensitivity shocks
- Warehouse tranches and second-tranche month
- Rental pricing share, post-pilot growth, auto / aircraft start months

Everything else — payroll and department seats, equity rounds and pre-money,
year-10 targets, FICO internals, opex lumps, Ashoka detail, ramp, horizon —
is grey (admin-only). Ask and pre-money are **not** blue. They come from
published Deal Terms.

## Reports Nico builds on demand

All math is server-side (`runCashflowModel`). Nico does not paste a stale
PNG. Chat or Model → he recalculates from the current blue set.

| Kind | What it is |
|------|------------|
| `statements` | Cash-flow book (US, sucursal, consolidated, vehicle) — Excel-like HTML |
| `income` | Cash-basis OpCo P&L, built live — not on the shelf |
| `returns` | Investor returns: unit vehicle IRR, book vehicle IRR, OpCo cash-on-cash |
| `sensitivity` | Shock blue levers (down, balloon floor, spread, activation); show FY cash and ICP-1 IRR |

## Where cells live

The TypeScript engine is the calculator. After a run:

1. **Cell graph** — `ModelScenario` / `ModelCell` / `ModelCellDep` (value +
   human-readable formula + dependencies).
2. **Report workbook** — formatted sheets (tone, number format, stub/total)
   stored as JSON on the `__tamarindo_report_workbook__` artifact row.

No new migration. Formulas and formatting are in Postgres today.

## Presentation and export

- **Chat glance** — Summary first (totals), Extended on a toggle (every line). Statements are a table, not a chart. Not the book.
- **HTML** — Excel-like grid, new browser window (`/api/nico/model/export?format=html&kind=…`)
- **PDF** — 16:9 print of that HTML (repeating year headers, themed footer)
- **CSV** — first-class download of the same tables
- **XLSX** — full 10-year cash-flow workbook (existing)

Templates and themes are ready (`tamarindo-sheet`). Numbers are never
frozen in the template.

## Chat mutations Nico will honor

- “Show the financial statements”
- “FY3 cash flow”
- “Income statement” / “P&L” — not on the shelf; Nico asks you to wait and builds it live
- “Investor returns” / “vehicle IRR”
- “Sensitivity on residual / down payment”
- “Set down to 35%” (writes that person’s case)
- “Show my assumptions” — meeting levers (funding, lease, fees), not the full book
- “Save this as Rate shock” — snapshot the live case; live case unchanged (`model.saveScenario`, not Publish)
- “Load Rate shock” / “Apply Rate shock” — copy that snapshot onto the personal case
- “Compare Rate shock and Base” — input deltas plus FY cash glance, not the book

## Limits

- Will not invent Deal Terms
- Sensitivity shocks do **not** save unless the user says “save this as …”
- Named what-ifs are not a second live case
- Load replaces the live case; Reset returns to the company case, not the previous one
- `model.explain` only walks this profile’s graph. Auto `"Base case (auto)"` stays off the picker.
- Vehicle warehouse is not OpCo equity
- Unlabeled salaries stay blank
