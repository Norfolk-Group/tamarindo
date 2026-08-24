/** Print-first report CSS. Navy / teal / gold. Not a spreadsheet skin. */
export const REPORT_CSS = `
@page { size: letter; margin: 18mm 16mm 18mm 16mm; }
:root {
  --navy: #1E2D45;
  --teal: #0097A7;
  --cyan: #00BCD4;
  --gold: #FFC107;
  --paper: #F4EFE4;
  --ink: #1A1F2B;
  --muted: #5C6573;
  --rule: rgba(30, 45, 69, 0.14);
  --band: #E7E1D4;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  font-size: 13.5px;
  line-height: 1.45;
}
.sans { font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif; }
.wrap { max-width: 980px; margin: 0 auto; padding: 48px 40px 80px; }
.kicker {
  font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 11px;
  color: var(--teal);
  font-weight: 600;
}
h1 {
  font-weight: 500;
  font-size: 46px;
  line-height: 0.95;
  letter-spacing: -0.03em;
  margin: 10px 0 18px;
  color: var(--navy);
}
h2 {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--navy);
  margin: 0 0 8px;
}
h3 {
  font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--teal);
  margin: 0 0 14px;
}
.lede { font-size: 17px; max-width: 46rem; color: var(--muted); }
.cover-rule { height: 3px; width: 72px; background: var(--gold); margin: 22px 0 28px; border: 0; }
.meta {
  display: flex; gap: 28px; flex-wrap: wrap;
  font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif;
  font-size: 12px; color: var(--muted);
}
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 36px 0 8px; }
.stat { padding: 16px 0; border-top: 1px solid var(--rule); }
.stat b {
  display: block; font-size: 22px; color: var(--navy);
  font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif;
  letter-spacing: -0.03em;
}
.stat span { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; }
.section { break-inside: avoid; margin-top: 56px; }
.book {
  background: var(--navy);
  color: #F4EFE4;
  padding: 28px 28px 22px;
  margin: 48px 0 0;
}
.book h2 { color: #F4EFE4; }
.book p { color: rgba(244, 239, 228, 0.72); margin: 0; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 18px; }
.card {
  border: 1px solid var(--rule);
  padding: 16px 16px 14px;
  background: rgba(255,255,255,0.35);
  break-inside: avoid;
}
.card .code {
  font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif;
  font-size: 11px; letter-spacing: 0.14em; color: var(--teal); font-weight: 600;
}
.card h4 { margin: 6px 0 8px; font-size: 18px; color: var(--navy); font-weight: 500; }
.card dl { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; }
.card dt { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif; }
.card dd { margin: 0; font-size: 13px; }
table.scf {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif;
  font-size: 11px;
}
table.scf caption {
  caption-side: top; text-align: left; padding: 0 0 8px;
  font-style: italic; color: var(--muted); font-family: Georgia, serif; font-size: 12px;
}
table.scf th, table.scf td {
  padding: 7px 8px; border-bottom: 1px solid var(--rule); vertical-align: bottom;
}
table.scf th { font-weight: 600; color: var(--muted); text-align: right; font-size: 10px; letter-spacing: 0.04em; }
table.scf th.stub, table.scf td.stub { text-align: left; padding-left: 0; color: var(--ink); }
table.scf td { text-align: right; font-variant-numeric: tabular-nums; }
table.scf tr.section td { padding-top: 16px; color: var(--teal); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; border-bottom-color: var(--navy); }
table.scf tr.total td { font-weight: 700; color: var(--navy); border-bottom-width: 2px; border-bottom-color: var(--navy); }
table.scf tr.memo td { color: var(--muted); }
.note { margin-top: 14px; color: var(--muted); font-size: 12px; max-width: 42rem; }
footer.colophon {
  margin-top: 64px; padding-top: 16px; border-top: 1px solid var(--rule);
  font-family: "Avenir Next", "Segoe UI", Helvetica, sans-serif;
  font-size: 11px; color: var(--muted);
}
@media print {
  body { background: white; }
  .wrap { padding: 0; max-width: none; }
  .book { break-before: page; }
  .cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 800px) {
  .wrap { padding: 28px 18px 48px; }
  h1 { font-size: 34px; }
  .stats, .cards { grid-template-columns: 1fr 1fr; }
  table.scf { font-size: 10px; }
}
`;
