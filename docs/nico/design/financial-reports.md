# Financial report design standard

Excel-like HTML for statements, investor returns, and sensitivity.
Tokens match [07-design-system.md](../07-design-system.md).

## Canvas

- Background `#091414`
- Sheet surface `#0b1717`
- Hairline `#f2f7f608`
- **Blue `#23a5b4`** — input / blue-variable cells only
- **Gold `#ffc94d`** — totals and IRRs
- Body ink `#f2f7f6`; dim `#93a8a5`

## Type

- Geist Mono for every number and every cell address
- Space Grotesk for the report title
- Tabular lining figures; right-align money

## Grid

- One header row, sticky
- Section rows: teal, uppercase, 10px — click to fold the lines under them
- Blue cells: teal ink, no fill shout
- Total rows: gold ink, 2px rule
- Do not animate numbers

## Export

HTML, PDF, and CSV share the same workbook object. Do not restyle PDF
as a second product.

- **Page** — 16:9 landscape (`13.333in × 7.5in`). Theme tokens travel into
  the print stylesheet (`tamarindo-sheet`).
- **Pagination** — each entity sheet starts a page; rows may continue.
  Year headers live in `<thead>` and repeat on every printed page.
- **Chrome** — header names the theme; footer is confidential + page X / Y.
- **Chat** — a glance table, not the book. Statements stay a table; do not
  add a cash line chart. “Show my assumptions” is a meeting-lever table
  (funding, lease, fees), not the 181-row book. **Summary** is the default (totals / meaning rows).
  **Extended** is every line or extra column. Same engine numbers. Full book
  opens in a new tab with the same toggle. PDF and CSV default to the
  extended book (`depth=extended`).
