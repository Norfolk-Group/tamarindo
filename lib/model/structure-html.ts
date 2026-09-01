import { escapeHtml } from "@/lib/model/format";
import { reportPageCssSize } from "@/lib/model/report-page";
import type { ReportWorkbook } from "@/lib/model/report-workbook";
import { STRUCTURE_ENTITIES, STRUCTURE_FLOW } from "@/lib/model/structure";

const STRUCTURE_CSS = `
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
main { max-width: 1240px; margin: 0 auto; padding: 32px 20px 72px; }
.kicker { font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; letter-spacing: 0.16em; color: var(--teal); }
h1 { font-family: "Space Grotesk", sans-serif; font-size: 28px; margin: 8px 0 6px; }
.meta { color: var(--ink-dim); font-size: 12px; margin-bottom: 16px; max-width: 52rem; }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin: 0 0 24px; }
.export { display: flex; gap: 8px; }
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
.sheet { background: var(--sheet); border: 1px solid var(--line); padding: 22px 20px 16px; margin: 0 0 28px; }
.sheet h2 { font-family: "Space Grotesk", sans-serif; font-size: 18px; margin: 0 0 6px; }
.sheet .caption { color: var(--ink-dim); font-size: 12px; margin: 0 0 16px; max-width: 52rem; }
.hard-line {
  border: 1px solid rgba(255,201,77,0.28);
  color: var(--gold);
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.02em;
  padding: 10px 14px;
  margin: 0 0 20px;
}
.legend { display: flex; flex-wrap: wrap; gap: 16px 24px; margin: 0 0 16px; font-size: 11px; color: var(--ink-dim); }
.legend span { display: inline-flex; align-items: center; gap: 8px; }
.swatch { width: 22px; height: 2px; display: inline-block; }
.swatch.own { background: var(--gold); }
.swatch.manage { background: var(--teal); }
.swatch.future { background: var(--ink-dim); border-top: 1px dashed var(--ink-dim); height: 0; width: 22px; }
.diagram { width: 100%; overflow: auto; }
.diagram svg { display: block; width: 100%; height: auto; }
.node-title { font-family: "Space Grotesk", sans-serif; font-size: 13px; fill: var(--ink); }
.node-sub { font-family: Geist, system-ui, sans-serif; font-size: 10px; fill: var(--ink-dim); }
.edge-label { font-family: "Geist Mono", ui-monospace, monospace; font-size: 9px; fill: var(--ink-dim); letter-spacing: 0.04em; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.card { border: 1px solid var(--line); padding: 12px 14px; }
.card .code { font-family: "Geist Mono", ui-monospace, monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--teal); margin: 0 0 6px; }
.card h3 { font-family: "Space Grotesk", sans-serif; font-size: 15px; margin: 0 0 6px; font-weight: 500; }
.card p { margin: 0; font-size: 12px; color: var(--ink-dim); }
.steps { display: grid; gap: 10px; }
.step { display: grid; grid-template-columns: 140px 1fr; gap: 12px; border-top: 1px solid var(--line); padding: 10px 0; }
.step b { font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; color: var(--gold); font-weight: 500; }
.step .who { color: var(--teal); font-size: 12px; margin: 0 0 4px; }
.step p { margin: 0; font-size: 13px; color: var(--ink); }
table.xl { width: 100%; border-collapse: collapse; font-family: "Geist Mono", ui-monospace, monospace; font-size: 12px; }
table.xl th, table.xl td { border-bottom: 1px solid var(--line); padding: 7px 8px; text-align: left; vertical-align: top; }
table.xl thead th { color: var(--ink-dim); text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; font-weight: 500; }
table.xl .tone-gold { color: var(--gold); }
table.xl .tone-dim { color: var(--ink-dim); }
@page { size: ${reportPageCssSize()}; margin: 14mm 10mm 14mm 10mm; }
@media print {
  html, body { background: var(--bg); }
  main { max-width: none; padding: 0; }
  .sheet { overflow: visible; margin: 0 0 8mm; break-inside: avoid; break-before: page; }
  .sheet:first-of-type { break-before: auto; }
  .toolbar { display: none; }
  .diagram { overflow: visible; }
}
`;

function entityTable(): string {
  const heads = ["Entity", "Jurisdiction", "Role", "Owns assets", "Relationship"]
    .map((text) => `<th>${escapeHtml(text)}</th>`)
    .join("");
  const rows = STRUCTURE_ENTITIES.map((entity) => {
    const nameTone = entity.id === "credit" ? "tone-gold" : "";
    return `<tr>
      <td class="${nameTone}">${escapeHtml(entity.name)}</td>
      <td class="tone-dim">${escapeHtml(entity.jurisdiction)}</td>
      <td>${escapeHtml(entity.role)}</td>
      <td>${escapeHtml(entity.ownsAssets)}</td>
      <td>${escapeHtml(entity.relationship)}</td>
    </tr>`;
  }).join("");
  return `<table class="xl"><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table>`;
}

function flowSteps(): string {
  return `<div class="steps">${STRUCTURE_FLOW.map(
    (row) => `<div class="step">
      <b>${escapeHtml(row.step)}</b>
      <div>
        <p class="who">${escapeHtml(row.who)}</p>
        <p>${escapeHtml(row.what)}</p>
      </div>
    </div>`,
  ).join("")}</div>`;
}

function cards(): string {
  const shown = STRUCTURE_ENTITIES.filter((row) => row.id !== "client" && row.id !== "partner");
  return `<div class="cards">${shown
    .map(
      (entity) => `<article class="card">
        <p class="code">${escapeHtml(entity.jurisdiction)}</p>
        <h3>${escapeHtml(entity.name)}</h3>
        <p>${escapeHtml(entity.role)}</p>
      </article>`,
    )
    .join("")}</div>`;
}

/** Ownership / management map. Coordinates are viewBox units. */
function structureSvg(): string {
  return `<svg viewBox="0 0 1120 720" role="img" aria-label="Tamarindo corporate structure">
    <defs>
      <marker id="arrow-gold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffc94d"/>
      </marker>
      <marker id="arrow-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#23a5b4"/>
      </marker>
      <marker id="arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#93a8a5"/>
      </marker>
    </defs>

    <text x="80" y="28" class="edge-label" fill="#23a5b4">UNITED STATES — TWO DELAWARE LLCS</text>
    <text x="680" y="28" class="edge-label" fill="#23a5b4">COLOMBIA — A SUCURSAL OF EACH US LLC</text>

    <rect x="380" y="44" width="360" height="70" rx="4" fill="#0b1717" stroke="#ffc94d" stroke-width="1.2"/>
    <text x="560" y="74" text-anchor="middle" class="node-title">Intervest / Global</text>
    <text x="560" y="94" text-anchor="middle" class="node-sub">owns 100% of the funding vehicle</text>

    <line x1="560" y1="114" x2="560" y2="168" stroke="#ffc94d" stroke-width="1.4" marker-end="url(#arrow-gold)"/>
    <text x="572" y="148" class="edge-label" fill="#ffc94d">OWNS 100%</text>

    <rect x="80" y="176" width="320" height="92" rx="4" fill="#0b1717" stroke="rgba(242,247,246,0.16)" stroke-width="1"/>
    <text x="240" y="208" text-anchor="middle" class="node-title">Tamarindo Credit, LLC</text>
    <text x="240" y="228" text-anchor="middle" class="node-sub">OpCo · originator · servicer · biller</text>
    <text x="240" y="246" text-anchor="middle" class="node-sub">manages the vehicle · owns no properties</text>

    <rect x="480" y="176" width="320" height="92" rx="4" fill="#0b1717" stroke="#ffc94d" stroke-width="1.2"/>
    <text x="640" y="208" text-anchor="middle" class="node-title">Tamarindo Intervest, LLC</text>
    <text x="640" y="228" text-anchor="middle" class="node-sub">funding vehicle #1 · US-law lease lives here</text>
    <text x="640" y="246" text-anchor="middle" class="node-sub">client wires down + monthly + balloon here</text>

    <rect x="860" y="176" width="200" height="92" rx="4" fill="#0b1717" stroke="#93a8a5" stroke-width="1" stroke-dasharray="5 4"/>
    <text x="960" y="214" text-anchor="middle" class="node-title">Tamarindo-[Partner]</text>
    <text x="960" y="234" text-anchor="middle" class="node-sub">future vehicles #2..N</text>
    <text x="960" y="250" text-anchor="middle" class="node-sub">same template, new owner</text>

    <line x1="400" y1="222" x2="476" y2="222" stroke="#23a5b4" stroke-width="1.4" marker-end="url(#arrow-teal)"/>
    <text x="438" y="212" text-anchor="middle" class="edge-label" fill="#23a5b4">MANAGES</text>
    <text x="438" y="254" text-anchor="middle" class="edge-label" fill="#23a5b4">DOES NOT OWN</text>

    <line x1="240" y1="268" x2="240" y2="330" stroke="rgba(242,247,246,0.28)" stroke-width="1.2" marker-end="url(#arrow-dim)"/>
    <text x="252" y="306" class="edge-label">OWNS</text>
    <line x1="640" y1="268" x2="640" y2="330" stroke="#ffc94d" stroke-width="1.4" marker-end="url(#arrow-gold)"/>
    <text x="652" y="306" class="edge-label" fill="#ffc94d">OWNS</text>

    <rect x="80" y="338" width="320" height="80" rx="4" fill="#0b1717" stroke="rgba(242,247,246,0.16)" stroke-width="1"/>
    <text x="240" y="370" text-anchor="middle" class="node-title">Credit, Sucursal Colombia</text>
    <text x="240" y="390" text-anchor="middle" class="node-sub">local ops · bills · repairs · notary</text>
    <text x="240" y="406" text-anchor="middle" class="node-sub">not a third legal OpCo</text>

    <rect x="480" y="338" width="320" height="80" rx="4" fill="#0b1717" stroke="#ffc94d" stroke-width="1.2"/>
    <text x="640" y="370" text-anchor="middle" class="node-title">Intervest, Sucursal Colombia</text>
    <text x="640" y="390" text-anchor="middle" class="node-sub">buys and holds title to the asset</text>
    <text x="640" y="406" text-anchor="middle" class="node-sub">recovery advantage — title already here</text>

    <line x1="400" y1="378" x2="476" y2="378" stroke="#23a5b4" stroke-width="1.2" marker-end="url(#arrow-teal)"/>
    <text x="438" y="368" text-anchor="middle" class="edge-label" fill="#23a5b4">LOCAL EXECUTION</text>

    <rect x="280" y="468" width="280" height="72" rx="4" fill="#0b1717" stroke="rgba(35,165,180,0.45)" stroke-width="1.2"/>
    <text x="420" y="498" text-anchor="middle" class="node-title">Ashoka</text>
    <text x="420" y="518" text-anchor="middle" class="node-sub">sister co. · PM / rentals · related-party</text>

    <line x1="240" y1="418" x2="240" y2="504" stroke="#23a5b4" stroke-width="1.2"/>
    <line x1="240" y1="504" x2="276" y2="504" stroke="#23a5b4" stroke-width="1.2" marker-end="url(#arrow-teal)"/>
    <text x="168" y="458" class="edge-label" fill="#23a5b4">CONTRACTS</text>
    <line x1="640" y1="418" x2="640" y2="504" stroke="#23a5b4" stroke-width="1.2"/>
    <line x1="640" y1="504" x2="564" y2="504" stroke="#23a5b4" stroke-width="1.2" marker-end="url(#arrow-teal)"/>
    <text x="648" y="458" class="edge-label" fill="#23a5b4">PM / RENTALS</text>

    <rect x="420" y="596" width="280" height="72" rx="4" fill="#0b1717" stroke="rgba(242,247,246,0.16)" stroke-width="1"/>
    <text x="560" y="626" text-anchor="middle" class="node-title">Client</text>
    <text x="560" y="646" text-anchor="middle" class="node-sub">comodato use rights + purchase option</text>

    <line x1="640" y1="418" x2="640" y2="572" stroke="#ffc94d" stroke-width="1.2"/>
    <line x1="640" y1="572" x2="700" y2="572" stroke="none"/>
    <path d="M640 418 V572 H560" fill="none" stroke="#ffc94d" stroke-width="1.2" marker-end="url(#arrow-gold)"/>
    <text x="652" y="556" class="edge-label" fill="#ffc94d">COMODATO + OPTION</text>
    <path d="M560 596 V572 H420 V504" fill="none" stroke="#23a5b4" stroke-width="1.2"/>
    <text x="360" y="568" class="edge-label" fill="#23a5b4">40% + LEASE TO VEHICLE</text>
  </svg>`;
}

/** Standalone HTML diagram. Tokens match docs/nico/design/financial-reports.md. */
export function renderStructureHtml(workbook: ReportWorkbook): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(workbook.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet"/>
  <style>${STRUCTURE_CSS}</style>
</head>
<body data-kind="structure">
  <main>
    <p class="kicker">TAMARINDO · LIVE MODEL</p>
    <h1>${escapeHtml(workbook.title)}</h1>
    <p class="meta">Generated ${escapeHtml(workbook.generatedAt)} · Source: thesis 02 — Entity Architecture. Two US LLCs; each has its own Colombian sucursal. Intervest is a counterparty, not a consolidated subsidiary.</p>
    <div class="toolbar">
      <div class="export" aria-label="Export">
        <a data-format="pdf" href="/api/nico/model/export?format=pdf&amp;kind=structure">PDF</a>
        <a data-format="csv" href="/api/nico/model/export?format=csv&amp;kind=structure">CSV</a>
      </div>
    </div>

    <section class="sheet" id="map">
      <h2>The map</h2>
      <p class="caption">Ownership in gold. Management and local execution in teal. Future vehicles are dashed. There is no separate “Tamarindo Colombia Inc.”</p>
      <p class="hard-line">Hard line: Tamarindo Credit does not own Tamarindo Intervest. Intervest owns the vehicle. Credit manages it and earns 2 + 20.</p>
      <div class="legend">
        <span><i class="swatch own"></i> Legal ownership</span>
        <span><i class="swatch manage"></i> Manages / contracts</span>
        <span><i class="swatch future"></i> Future vehicle</span>
      </div>
      <div class="diagram">${structureSvg()}</div>
    </section>

    <section class="sheet" id="roles">
      <h2>Who does what</h2>
      <p class="caption">${escapeHtml(workbook.sheets[0]?.caption ?? "")}</p>
      ${cards()}
    </section>

    <section class="sheet" id="entities">
      <h2>Entities</h2>
      <p class="caption">Same family as the diagram. CSV and Excel export this table.</p>
      ${entityTable()}
    </section>

    <section class="sheet" id="flow">
      <h2>Money on one deal</h2>
      <p class="caption">${escapeHtml(workbook.sheets[1]?.caption ?? "")}</p>
      ${flowSteps()}
    </section>
  </main>
</body>
</html>`;
}
