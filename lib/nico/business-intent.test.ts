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
  });

  it("does not steal reports, ICPs, or worksheets", () => {
    expect(parseBusinessExplainAsk("what is ICP-1")).toBe(false);
    expect(parseBusinessExplainAsk("show investor returns")).toBe(false);
    expect(parseBusinessExplainAsk("Help me build a worksheet")).toBe(false);
  });

  it("wins over Help for a business-model ask", () => {
    expect(parseHelpAsk("explain the business model")).toBeNull();
    expect(parseReportAsk("explain the business model")).toBeNull();
  });

  it("keeps the brief short and points at the live doors", () => {
    const note = formatBusinessBrief({
      homesOriginated: 10,
      autosOriginated: 20,
      aircraftOriginated: 3,
      fy1ClosingCashUsd: 1,
      fy10ClosingCashUsd: 2,
    });
    expect(note.length).toBeLessThan(900);
    expect(note).toMatch(/Intervest/);
    expect(note).toMatch(/do not invent/i);
  });
});
