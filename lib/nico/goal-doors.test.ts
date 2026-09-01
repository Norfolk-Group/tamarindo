import { describe, expect, it } from "vitest";
import { renderWorkbookXlsx } from "@/lib/artifacts/excel";
import { cashflowWorkbookSpec } from "@/lib/model/excel-spec";
import { runCashflowModel } from "@/lib/model/engine";
import { workbookForDepth } from "@/lib/model/report-depth";
import { buildReportGlance, formatReportFence } from "@/lib/model/report-glance";
import type { ReportKind } from "@/lib/model/report-workbook";
import { reportWorkbookToSpec } from "@/lib/model/report-xlsx";
import { renderReportCsv } from "@/lib/model/sheet-csv";
import { renderReportHtml } from "@/lib/model/sheet-html";
import { calcTicketEconomics, formatTicketTable } from "@/lib/model/unit-economics";
import { defaultValues } from "@/lib/model/variables";
import { parseBusinessExplainAsk } from "@/lib/nico/business-intent";
import { parseChat } from "@/lib/nico/chat-rich-parse";
import { parseReportAsk } from "@/lib/nico/report-intent";
import { parseUnitCalcAsk } from "@/lib/nico/unit-intent";
import { buildReportWorkbook } from "@/lib/procedures/reports";

const KINDS: ReportKind[] = ["statements", "income", "returns", "sensitivity", "structure"];

describe("Nico goal doors", () => {
  it("routes explain, books, returns, sensitivity, and ticket math", () => {
    expect(parseBusinessExplainAsk("how does Tamarindo work")).toBe(true);
    expect(parseBusinessExplainAsk("what is the product")).toBe(true);
    expect(parseReportAsk("show me the books")?.kind).toBe("statements");
    expect(parseReportAsk("show the 10-year cash flow")?.kind).toBe("statements");
    expect(parseReportAsk("10-year plan")).toBeNull();
    expect(parseReportAsk("show me the income statement")?.kind).toBe("income");
    expect(parseReportAsk("what's the IRR")?.kind).toBe("returns");
    expect(parseReportAsk("run a stress test")?.kind).toBe("sensitivity");
    expect(parseReportAsk("show the corporate structure")?.kind).toBe("structure");
    expect(parseReportAsk("entity map")?.kind).toBe("structure");
    expect(parseUnitCalcAsk("what do we make on a $500k lease")).toEqual({
      kind: "ticket",
      fundedUsd: 500_000,
    });
    expect(parseBusinessExplainAsk("cómo funciona Tamarindo")).toBe(true);
    expect(parseReportAsk("muéstrame los libros")?.kind).toBe("statements");
    expect(parseReportAsk("cuál es la TIR")?.kind).toBe("returns");
    expect(parseReportAsk("prueba de estrés")?.kind).toBe("sensitivity");
    expect(parseUnitCalcAsk("cuánto ganamos en un arriendo de $500k")).toEqual({
      kind: "ticket",
      fundedUsd: 500_000,
    });
  });

  it("builds glance + HTML/CSV/Excel bytes from the live engine for each report", () => {
    const values = defaultValues();
    const model = runCashflowModel(values);
    for (const kind of KINDS) {
      const workbook = buildReportWorkbook(kind, model, values, 1, model.fyCount);
      const glance = buildReportGlance({ kind, workbook });
      expect(glance?.previewPath, kind).toContain(`format=html&kind=${kind}`);
      expect(glance?.pdfPath, kind).toContain(`format=pdf&kind=${kind}`);
      expect(glance?.csvPath, kind).toContain(`format=csv&kind=${kind}`);
      expect(glance?.xlsxPath, kind).toContain(`format=xlsx&kind=${kind}`);

      const html = renderReportHtml(workbook, { depth: "extended" });
      expect(html, kind).toMatch(/<table/i);

      const csv = renderReportCsv(workbookForDepth(workbook, "extended"));
      expect(csv.length, kind).toBeGreaterThan(20);

      const spec =
        kind === "statements"
          ? cashflowWorkbookSpec(model, { admin: true, values })
          : reportWorkbookToSpec(workbookForDepth(workbook, "extended"));
      const xlsx = renderWorkbookXlsx(spec);
      expect(xlsx.subarray(0, 2).toString(), kind).toBe("PK");

      const fence = formatReportFence(glance!);
      const report = parseChat(fence).find((segment) => segment.kind === "report");
      expect(report?.kind, kind).toBe("report");
      if (report?.kind === "report") {
        expect(report.spec.xlsxPath, kind).toContain(`format=xlsx&kind=${kind}`);
        expect(report.spec.pdfPath, kind).toContain(`format=pdf&kind=${kind}`);
        expect(report.spec.csvPath, kind).toContain(`format=csv&kind=${kind}`);
        expect(report.spec.previewPath, kind).toContain(`format=html&kind=${kind}`);
      }
    }
    const ticket = calcTicketEconomics({
      fundedUsd: 500_000,
      drawUsd: 500_000,
      originationFeePct: Number(values.originationFeePct),
      servicingBps: Number(values.servicingBps),
      activationFeePct: Number(values.activationFeePct),
      spreadSharePct: Number(values.spreadSharePct),
      clientRate: Number(values["icp.icp1.clientRate"]),
    });
    expect(ticket.originationUsd).toBe(5_000);
    expect(ticket.platformY1Usd).toBeGreaterThan(ticket.originationUsd);
    const table = parseChat(formatTicketTable(ticket)).find(
      (segment) => segment.kind === "table",
    );
    expect(table?.kind).toBe("table");
  });
});
