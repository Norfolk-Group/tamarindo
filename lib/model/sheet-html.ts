import { reportPageCssSize } from "@/lib/model/report-page";
import { escapeHtml } from "@/lib/model/format";
import type { ReportDepth } from "@/lib/model/report-depth";
import { sheetHidesLinesInSummary } from "@/lib/model/report-depth";
import type { ReportSheet, ReportWorkbook, SheetRow } from "@/lib/model/report-workbook";
import { renderStructureHtml } from "@/lib/model/structure-html";

const SHEET_CSS = `
:root {
  --bg: #091414;
  --sheet: #0b1717;
  --ink: #f2f7f6;
  --ink-dim: #93a8a5;
  --teal: #23a5b4;
  --gold: #ffc94d;
  --line: rgba(242,247,246,0.08);
}
* { box-sizing: border-box; }
html, body { margin: 0; background: #050a0a; color: var(--ink); font-family: Geist, system-ui, sans-serif; }
main { max-width: 1200px; margin: 0 auto; padding: 32px 20px 72px; }
.kicker { font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; letter-spacing: 0.16em; color: var(--teal); }
h1 { font-family: "Space Grotesk", sans-serif; font-size: 28px; margin: 8px 0 6px; }
.meta { color: var(--ink-dim); font-size: 12px; margin-bottom: 16px; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin: 0 0 24px; }
.depth { display: flex; gap: 8px; }
.export { display: flex; gap: 8px; }
.depth button,
.export a {
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  padding: 6px 12px;
  cursor: pointer;
  text-decoration: none;
}
body[data-depth="summary"] .depth [data-depth="summary"],
body[data-depth="extended"] .depth [data-depth="extended"] {
  color: var(--ink);
  border-color: var(--teal);
}
body[data-depth="summary"][data-hide-lines="1"] tr.line,
body[data-depth="summary"][data-hide-lines="1"] tr.section { display: none; }
body[data-depth="summary"] .sum-hide { display: none; }
tbody.sec[data-open="0"] tr.line { display: none; }
tr.section button {
  all: unset;
  cursor: pointer;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
}
tr.section button::before { content: "▾ "; }
tbody.sec[data-open="0"] tr.section button::before { content: "▸ "; }
.sheet { background: var(--sheet); border: 1px solid var(--line); padding: 18px 18px 12px; margin: 0 0 28px; overflow: auto; }
.sheet h2 { font-family: "Space Grotesk", sans-serif; font-size: 18px; margin: 0 0 6px; }
.sheet .caption { color: var(--ink-dim); font-size: 12px; margin: 0 0 12px; max-width: 48rem; }
table.xl { width: 100%; border-collapse: collapse; font-family: "Geist Mono", ui-monospace, monospace; font-size: 12px; }
table.xl th, table.xl td { border-bottom: 1px solid var(--line); padding: 5px 8px; text-align: right; white-space: nowrap; }
table.xl th:first-child, table.xl td:first-child { text-align: left; }
table.xl thead th { position: sticky; top: 0; background: var(--sheet); color: var(--ink-dim); text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; font-weight: 500; }
table.xl tr.section td { color: var(--teal); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; padding-top: 14px; }
table.xl .tone-blue { color: var(--teal); }
table.xl .tone-gold { color: var(--gold); }
table.xl .tone-dim { color: var(--ink-dim); }
table.xl tr.total td { border-bottom-width: 2px; }
@page { size: ${reportPageCssSize()}; margin: 14mm 10mm 14mm 10mm; }
@media print {
  html, body { background: var(--bg); }
  main { max-width: none; padding: 0; }
  .sheet { overflow: visible; margin: 0 0 8mm; break-inside: auto; break-before: page; }
  .sheet:first-of-type { break-before: auto; }
  table.xl { font-size: 11px; }
  table.xl thead { display: table-header-group; }
  table.xl tfoot { display: table-footer-group; }
  table.xl thead th { position: static; }
  table.xl tr { break-inside: avoid; page-break-inside: avoid; }
  .toolbar { display: none; }
}
`;

function rowHtml(row: SheetRow): string {
  const tag = row.kind === "header" ? "th" : "td";
  const cells = row.cells
    .map((item) => {
      const tone = item.tone && item.tone !== "plain" ? `tone-${item.tone}` : "";
      const hide = item.hideInSummary ? "sum-hide" : "";
      const cls = [tone, hide].filter(Boolean).join(" ");
      const title = item.formula ? ` title="${escapeHtml(item.formula)}"` : "";
      return `<${tag} class="${cls}"${title}>${escapeHtml(item.text)}</${tag}>`;
    })
    .join("");
  return `<tr class="${row.kind}">${cells}</tr>`;
}

function sheetTable(sheet: ReportSheet): string {
  const heads = sheet.rows.filter((row) => row.kind === "header");
  const body = sheet.rows.filter((row) => row.kind !== "header");
  const groups: SheetRow[][] = [];
  for (const row of body) {
    if (row.kind === "section" || groups.length === 0) groups.push([row]);
    else groups[groups.length - 1]?.push(row);
  }
  const bodies = groups
    .map((rows) => {
      const hasSection = rows.some((row) => row.kind === "section");
      const html = rows
        .map((row) => {
          if (row.kind !== "section") return rowHtml(row);
          const label = escapeHtml(row.cells[0]?.text ?? "");
          const rest = row.cells
            .slice(1)
            .map(() => "<td></td>")
            .join("");
          return `<tr class="section"><td><button type="button">${label}</button></td>${rest}</tr>`;
        })
        .join("");
      return `<tbody class="${hasSection ? "sec" : ""}" data-open="1">${html}</tbody>`;
    })
    .join("");
  return `<table class="xl">
    <thead>${heads.map(rowHtml).join("")}</thead>
    ${bodies}
  </table>`;
}

function sheetHtml(sheet: ReportSheet): string {
  return `<section class="sheet" id="${escapeHtml(sheet.id)}">
    <h2>${escapeHtml(sheet.title)}</h2>
    ${sheet.caption ? `<p class="caption">${escapeHtml(sheet.caption)}</p>` : ""}
    ${sheetTable(sheet)}
  </section>`;
}

const DEPTH_SCRIPT = `
<script>
(function () {
  function exportHref(format, depth) {
    var kind = document.body.getAttribute("data-kind") || "statements";
    return "/api/nico/model/export?format=" + encodeURIComponent(format)
      + "&kind=" + encodeURIComponent(kind)
      + "&depth=" + encodeURIComponent(depth);
  }
  function syncExports(depth) {
    document.querySelectorAll(".export a[data-format]").forEach(function (link) {
      link.setAttribute("href", exportHref(link.getAttribute("data-format") || "pdf", depth));
    });
  }
  function setDepth(depth) {
    document.body.setAttribute("data-depth", depth);
    var url = new URL(window.location.href);
    url.searchParams.set("depth", depth);
    window.history.replaceState({}, "", url);
    syncExports(depth);
  }
  document.querySelectorAll(".depth button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setDepth(btn.getAttribute("data-depth") || "summary");
    });
  });
  document.querySelectorAll("tbody.sec tr.section button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var body = btn.closest("tbody");
      if (!body) return;
      body.setAttribute("data-open", body.getAttribute("data-open") === "0" ? "1" : "0");
    });
  });
  syncExports(document.body.getAttribute("data-depth") || "summary");
})();
</script>
`;

/** Excel-like HTML. Tokens: docs/nico/design/financial-reports.md */
export function renderReportHtml(
  workbook: ReportWorkbook,
  opts: { depth?: ReportDepth } = {},
): string {
  if (workbook.kind === "structure") return renderStructureHtml(workbook);
  const depth = opts.depth ?? "summary";
  const hideLines = sheetHidesLinesInSummary(workbook.kind) ? "1" : "0";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(workbook.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet"/>
  <style>${SHEET_CSS}</style>
</head>
<body data-kind="${escapeHtml(workbook.kind)}" data-depth="${escapeHtml(depth)}" data-hide-lines="${hideLines}">
  <main>
    <p class="kicker">TAMARINDO · LIVE MODEL</p>
    <h1>${escapeHtml(workbook.title)}</h1>
    <p class="meta">Generated ${escapeHtml(workbook.generatedAt)} · hover a cell for its formula · blue = input · Summary is totals; Extended is every line</p>
    <div class="toolbar">
      <div class="depth" role="tablist" aria-label="Report depth">
        <button type="button" data-depth="summary">Summary</button>
        <button type="button" data-depth="extended">Extended</button>
      </div>
      <div class="export" aria-label="Export">
        <a data-format="pdf" href="/api/nico/model/export?format=pdf&amp;kind=${escapeHtml(workbook.kind)}&amp;depth=${escapeHtml(depth)}">PDF</a>
        <a data-format="csv" href="/api/nico/model/export?format=csv&amp;kind=${escapeHtml(workbook.kind)}&amp;depth=${escapeHtml(depth)}">CSV</a>
      </div>
    </div>
    ${workbook.sheets.map(sheetHtml).join("")}
  </main>
  ${DEPTH_SCRIPT}
</body>
</html>`;
}
