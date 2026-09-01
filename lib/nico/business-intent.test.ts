import { describe, expect, it } from "vitest";
import {
  formatBusinessBrief,
  parseBusinessExplainAsk,
} from "@/lib/nico/business-intent";
import { parseHelpAsk } from "@/lib/nico/help-intent";
import { parseReportAsk } from "@/lib/nico/report-intent";

describe("business explain intent", () => {
  it("maps a model walk-through to the live brief", () => {
    expect(parseBusinessExplainAsk("how does Tamarindo work")).toBe(true);
    expect(parseBusinessExplainAsk("explain the business model")).toBe(true);
    expect(parseBusinessExplainAsk("walk me through the structure")).toBe(true);
    expect(parseBusinessExplainAsk("what does Tamarindo do")).toBe(true);
    expect(parseBusinessExplainAsk("what is the product")).toBe(true);
    expect(parseBusinessExplainAsk("cómo funciona Tamarindo")).toBe(true);
    expect(parseBusinessExplainAsk("qué es Tamarindo")).toBe(true);
    expect(parseBusinessExplainAsk("cuál es el producto")).toBe(true);
    expect(parseBusinessExplainAsk("explícame Tamarindo")).toBe(true);
  });

  it("does not steal reports, ICPs, or worksheets", () => {
    expect(parseBusinessExplainAsk("what is ICP-1")).toBe(false);
    expect(parseBusinessExplainAsk("show investor returns")).toBe(false);
    expect(parseBusinessExplainAsk("show the corporate structure")).toBe(false);
    expect(parseReportAsk("show the corporate structure")?.kind).toBe("structure");
    expect(parseBusinessExplainAsk("Help me build a worksheet")).toBe(false);
    expect(parseBusinessExplainAsk("what do we make on a $500k lease")).toBe(
      false,
    );
  });

  it("wins over Help for a business-model ask", () => {
    expect(parseHelpAsk("explain the business model")).toBeNull();
    expect(parseReportAsk("explain the business model")).toBeNull();
    expect(parseHelpAsk("cómo funciona Tamarindo")).toBeNull();
    expect(parseHelpAsk("cómo funciona esta pantalla")?.kind).toBe("list");
  });

  it("keeps the brief short and points at the live doors", () => {
    const note = formatBusinessBrief({
      homesOriginated: 10,
      autosOriginated: 20,
      aircraftOriginated: 3,
      fy1ClosingCashUsd: 1,
      fy10ClosingCashUsd: 2,
    });
    expect(note.length).toBeLessThan(1600);
    expect(note).toMatch(/LIVE SNAPSHOT/);
    expect(note).toMatch(/lease-to-own/i);
    expect(note).toMatch(/warehouse/i);
    expect(note).toMatch(/Intervest/i);
    expect(note).toMatch(/Excel/);
    expect(note).toMatch(/Files/);
    expect(note).toMatch(/do not invent/i);
  });
});
