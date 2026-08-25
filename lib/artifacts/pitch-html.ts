import type { DeckSlide, DeckSpec } from "@/lib/artifacts/deck";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function indexLabel(slide: DeckSlide, storyIndex: number, backupIndex: number): string {
  if (slide.kind === "thankyou") return "";
  if (slide.kind === "backup") return `B${backupIndex}`;
  return `${String(storyIndex).padStart(2, "0")} / 10`;
}

function tableHtml(slide: DeckSlide): string {
  if (!slide.table) return "";
  const head = slide.table.headers
    .map((cell) => `<th>${escapeHtml(cell)}</th>`)
    .join("");
  const body = slide.table.rows
    .map((row, i) => {
      const last = i === slide.table!.rows.length - 1 || row[0]?.toLowerCase().includes("total") || row[0]?.toLowerCase().includes("closing");
      return `<tr class="${last ? "total" : ""}">${row
        .map((cell, j) => `<t${j === 0 ? "h" : "d"}>${escapeHtml(cell)}</t${j === 0 ? "h" : "d"}>`)
        .join("")}</tr>`;
    })
    .join("");
  return `<figure class="sheet">
    ${slide.table.caption ? `<figcaption>${escapeHtml(slide.table.caption)}</figcaption>` : ""}
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    ${slide.table.footnote ? `<p class="note">${escapeHtml(slide.table.footnote)}</p>` : ""}
  </figure>`;
}

function slideHtml(
  slide: DeckSlide,
  storyIndex: number,
  backupIndex: number,
): string {
  const bullets = slide.bullets
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  return `<article class="slide kind-${slide.kind ?? "story"}" id="${escapeHtml(slide.id)}">
    <header>
      <p class="brand">TAMARINDO</p>
      <p class="idx">${escapeHtml(indexLabel(slide, storyIndex, backupIndex))}</p>
    </header>
    <h1>${escapeHtml(slide.title)}</h1>
    ${bullets ? `<ul>${bullets}</ul>` : ""}
    ${tableHtml(slide)}
    <footer>Confidential · not an offer</footer>
  </article>`;
}

/** Standalone 16:9 preview. Tokens match docs/nico/design/pitch-deck.md. */
export function renderPitchHtml(spec: DeckSpec, title = "Tamarindo pitch"): string {
  let story = 0;
  let backup = 0;
  const slides = spec.slides
    .map((slide) => {
      if (slide.kind === "backup") backup += 1;
      else if (slide.kind !== "thankyou") story += 1;
      return slideHtml(slide, story, backup);
    })
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg: #091414;
      --ink: #f2f7f6;
      --ink-dim: #93a8a5;
      --teal: #23a5b4;
      --gold: #ffc94d;
      --line: rgba(242,247,246,0.08);
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #050a0a; color: var(--ink); font-family: Geist, system-ui, sans-serif; }
    main { display: flex; flex-direction: column; gap: 24px; padding: 32px 16px 64px; align-items: center; }
    .slide {
      width: min(1219px, 100%);
      aspect-ratio: 16 / 9;
      background: var(--bg);
      border: 1px solid var(--line);
      padding: 28px 36px 22px;
      display: flex;
      flex-direction: column;
      page-break-after: always;
    }
    header { display: flex; justify-content: space-between; font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--teal); }
    h1 { font-family: "Space Grotesk", sans-serif; font-size: 28px; font-weight: 600; margin: 18px 0 12px; }
    .kind-thankyou h1 { font-size: 42px; margin-top: 18%; }
    ul { margin: 0; padding-left: 18px; font-size: 15px; line-height: 1.45; color: var(--ink); }
    li + li { margin-top: 8px; }
    footer { margin-top: auto; font-size: 11px; color: var(--ink-dim); font-family: "Geist Mono", ui-monospace, monospace; }
    .sheet { margin: 10px 0 0; overflow: auto; }
    figcaption { font-size: 11px; color: var(--ink-dim); margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-family: "Geist Mono", ui-monospace, monospace; font-size: 12px; }
    th, td { border-bottom: 1px solid var(--line); padding: 4px 8px; text-align: right; }
    thead th { color: var(--ink-dim); text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; font-weight: 500; }
    th:first-child, td:first-child { text-align: left; font-weight: 400; color: var(--ink-dim); }
    tr.total td, tr.total th { color: var(--gold); }
    .note { font-size: 11px; color: var(--ink-dim); margin: 8px 0 0; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
    @media print { body { background: var(--bg); } main { padding: 0; gap: 0; } .slide { border: 0; width: 13.333in; height: 7.5in; } }
  </style>
</head>
<body>
  <main>${slides}</main>
</body>
</html>`;
}
