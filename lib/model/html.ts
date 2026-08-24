import { escapeHtml, formatCount, formatPct, formatUsd } from "@/lib/model/format";
import { REPORT_CSS } from "@/lib/model/html-theme";
import type {
  CashflowModel,
  DivisionStatement,
  StatementLine,
} from "@/lib/model/types";

function moneyCells(values: number[], slice: number[]): string {
  return slice
    .map((i) => `<td>${escapeHtml(formatUsd(values[i] ?? 0))}</td>`)
    .join("");
}

function scfTable(division: DivisionStatement, from: number, to: number): string {
  const slice = Array.from({ length: to - from }, (_, i) => from + i);
  const heads = slice
    .map((i) => `<th>${escapeHtml(division.years[i]?.label.split(" · ")[0] ?? "")}</th>`)
    .join("");
  const sections: Array<{
    key: StatementLine["section"];
    title: string;
  }> = [
    { key: "operatingIn", title: "Cash from operations — receipts" },
    { key: "operatingOut", title: "Cash from operations — payments" },
    { key: "investing", title: "Cash from investing" },
    { key: "financing", title: "Cash from financing" },
    { key: "memo", title: "Supplementary (not in cash totals)" },
  ];
  const rows: string[] = [];
  for (const section of sections) {
    const lines = division.lines.filter((line) => line.section === section.key);
    if (lines.length === 0) continue;
    rows.push(
      `<tr class="section"><td class="stub" colspan="${slice.length + 1}">${escapeHtml(section.title)}</td></tr>`,
    );
    for (const line of lines) {
      const memo = section.key === "memo" ? " memo" : "";
      rows.push(
        `<tr class="${memo}"><td class="stub">${escapeHtml(line.label)}</td>${moneyCells(line.values, slice)}</tr>`,
      );
    }
  }
  const cfo = slice.map((i) => division.years[i].cfoUsd);
  const net = slice.map((i) => division.years[i].netChangeUsd);
  const close = slice.map((i) => division.years[i].closingCashUsd);
  rows.push(
    `<tr class="total"><td class="stub">Net cash from operations</td>${moneyCells(cfo, slice.map((_, i) => i))}</tr>`,
  );
  rows.push(
    `<tr class="total"><td class="stub">Net change in cash</td>${moneyCells(net, slice.map((_, i) => i))}</tr>`,
  );
  rows.push(
    `<tr class="total"><td class="stub">Closing cash</td>${moneyCells(close, slice.map((_, i) => i))}</tr>`,
  );
  return `
    <table class="scf">
      <caption>${escapeHtml(division.title)} · IAS 7 / ASC 230 direct method · ${escapeHtml(division.years[from]?.label ?? "")} to ${escapeHtml(division.years[to - 1]?.label ?? "")}</caption>
      <thead><tr><th class="stub">Line</th>${heads}</tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>`;
}

function contractCards(model: CashflowModel): string {
  return model.contracts
    .map((icp) => {
      return `<article class="card">
        <div class="code">${escapeHtml(icp.code)} · ${escapeHtml(icp.citation.label)}</div>
        <h4>${escapeHtml(icp.name)}</h4>
        <p class="sans" style="margin:0 0 10px;color:var(--muted);font-size:12px;">${escapeHtml(icp.city)} · ${escapeHtml(icp.neighborhood)}</p>
        <dl>
          <div><dt>Purchase</dt><dd>${escapeHtml(formatUsd(icp.purchasePriceUsd))}</dd></div>
          <div><dt>Funded</dt><dd>${escapeHtml(formatUsd(icp.fundedUsd))}</dd></div>
          <div><dt>Term</dt><dd>${icp.termMonths} months</dd></div>
          <div><dt>Rate</dt><dd>${escapeHtml(formatPct(icp.clientRate))}</dd></div>
          <div><dt>Lease</dt><dd>${escapeHtml(formatUsd(icp.monthlyLeaseUsd))}/mo</dd></div>
          <div><dt>Residual</dt><dd>${escapeHtml(formatUsd(icp.residualUsd))}</dd></div>
        </dl>
      </article>`;
    })
    .join("");
}

function icpYearTable(model: CashflowModel): string {
  const heads = model.fyLabels
    .map((label) => `<th>${escapeHtml(label.split(" · ")[0])}</th>`)
    .join("");
  const rows = model.contracts
    .map((icp) => {
      const cells = model.us.years
        .map((year) => {
          const slice = year.byIcp.find((row) => row.icpId === icp.id);
          return `<td>${slice?.originated ?? 0}</td>`;
        })
        .join("");
      return `<tr><td class="stub">${escapeHtml(icp.code)} ${escapeHtml(icp.name)}</td>${cells}</tr>`;
    })
    .join("");
  return `<table class="scf"><caption>Homes originated by ICP lease</caption><thead><tr><th class="stub">ICP</th>${heads}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function renderCashflowHtml(model: CashflowModel): string {
  const s = model.summary;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Tamarindo · 10-year statement of cash flows</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <main class="wrap">
    <p class="kicker">Tamarindo Credit · Confidential model</p>
    <h1>Statement of<br/>cash flows</h1>
    <hr class="cover-rule"/>
    <p class="lede">Ten fiscal years from November 2026. OpCo cash comes from three priced equity rounds — smallest first ($2M, $2.25M, $2.25M at $10M / $15M / $20M pre-money) — not from the Intervest warehouse. Named US pay is half for the first eight months. The year-10 book is a $100M property, $30M auto, and $20M aircraft goal. Intervest funds half of that book after a KPI walk from the $10M+$10M test. Lease collections are agency and sit below the totals.</p>
    <div class="meta">
      <span>Direct method · IAS 7 / ASC 230</span>
      <span>January cohort ${s.januaryCohortYear}</span>
      <span>Five equal partners · $6.5M equity across three rounds</span>
    </div>
    <div class="stats">
      <div class="stat"><b>${escapeHtml(formatUsd(s.homeAumEndUsd))}</b><span>Property book, FY10</span></div>
      <div class="stat"><b>${escapeHtml(formatUsd(s.autoAumEndUsd))}</b><span>Auto book, FY10</span></div>
      <div class="stat"><b>${escapeHtml(formatUsd(s.aircraftAumEndUsd))}</b><span>Aircraft book, FY10</span></div>
      <div class="stat"><b>${escapeHtml(formatUsd(s.intervestLineEndUsd))}</b><span>Intervest line, FY10 (50%)</span></div>
      <div class="stat"><b>${escapeHtml(formatUsd(s.partnerLineEndUsd))}</b><span>Other partners, FY10</span></div>
      <div class="stat"><b>${escapeHtml(formatUsd(s.fy1ClosingCashUsd))}</b><span>Consolidated cash, FY1</span></div>
      <div class="stat"><b>${escapeHtml(formatUsd(s.fy10ClosingCashUsd))}</b><span>Consolidated cash, FY10</span></div>
    </div>

    <section class="section">
      <h3>Equity</h3>
      <h2>Five partners, equal shares, names TBD.</h2>
      <p class="note">Intervest is not on this cap table — it funds the lease book. New money can come from anyone. Rounds 2 and 3 are dated month 12 and month 24 until you change them.</p>
      <table class="scf">
        <caption>Priced rounds</caption>
        <thead><tr><th class="stub">Round</th><th>Pre-money</th><th>Raise</th><th>Post-money</th><th>Sold</th></tr></thead>
        <tbody>
          ${model.capTable.rounds
            .map(
              (round) =>
                `<tr><td class="stub">${escapeHtml(round.label)}</td><td>${escapeHtml(formatUsd(round.preMoneyUsd))}</td><td>${escapeHtml(formatUsd(round.amountUsd))}</td><td>${escapeHtml(formatUsd(round.postMoneyUsd))}</td><td>${escapeHtml(formatPct(round.percentSold))}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <table class="scf">
        <caption>Fully diluted after round 3 — each founder starts at ${escapeHtml(formatPct(model.capTable.eachFounderStart))} and ends at ${escapeHtml(formatPct(model.capTable.eachFounderEnd))}</caption>
        <thead><tr><th class="stub">Holder</th><th>Class</th><th>Ownership</th></tr></thead>
        <tbody>
          ${model.capTable.holdersEnd
            .map(
              (row) =>
                `<tr><td class="stub">${escapeHtml(row.name)}</td><td>${row.klass}</td><td>${escapeHtml(formatPct(row.percent))}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h3>Six ICP leases</h3>
      <h2>Not every contract is ten years.</h2>
      <p class="note">Each card is a sample contract: property, price, term, rate, residual, and the monthly lease the engine amortizes. Mix weights decide which ICP is written after the first five vintages.</p>
      <div class="cards">${contractCards(model)}</div>
    </section>

    <section class="section">
      <h3>Origination</h3>
      <h2>Two in November, two in December, one in January ${s.januaryCohortYear}.</h2>
      ${icpYearTable(model)}
    </section>

    <section class="book">
      <h2>Tamarindo US</h2>
      <p>US-law lease. Keeps activation, origination, servicing, ~20% of interest, and rental share. Pays Colombia a monthly mandate plus a per-close fee — not a full opex wash. Remits the rest of the lease to Intervest.</p>
    </section>
    ${scfTable(model.us, 0, 5)}
    ${scfTable(model.us, 5, 10)}

    <section class="book">
      <h2>Tamarindo Colombia (sucursal)</h2>
      <p>For-profit local company — not a nonprofit cost center, and not Intervest’s title vehicle. It bills clients for closing, diligence, and monthly administration, plus a US mandate. It may run cash-flow negative while the book is thin; the fees are there to try to turn it.</p>
    </section>
    ${scfTable(model.sucursal, 0, 5)}
    ${scfTable(model.sucursal, 5, 10)}

    <section class="book">
      <h2>Consolidated</h2>
      <p>US third-party fees plus Colombia client fees, less both divisions’ opex, plus seed equity. The US mandate is eliminated.</p>
    </section>
    ${scfTable(model.consolidated, 0, 5)}
    ${scfTable(model.consolidated, 5, 10)}

    <footer class="colophon">
      Generated ${escapeHtml(model.generatedAt)} · Server-side deterministic engine ·
      Residuals floored at 10% of asset · Named payroll from thesis 09 ·
      Ashoka STR fee is sister-company memo, not OpCo cash.
      Income statement and balance sheet follow once this cash-flow book is accepted.
    </footer>
  </main>
</body>
</html>`;
}
