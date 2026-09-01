import { describe, expect, it } from "vitest";
import { parseHelpAsk } from "@/lib/nico/help-intent";
import { parseReportAsk } from "@/lib/nico/report-intent";
import { parseUnitCalcAsk } from "@/lib/nico/unit-intent";
import { parseVariableSet } from "@/lib/nico/model-intent";

describe("unit calc intent", () => {
  it("maps a $500k ticket to live-variable math", () => {
    expect(parseUnitCalcAsk("what do we make on a $500,000 lease")).toEqual({
      kind: "ticket",
      fundedUsd: 500_000,
    });
    expect(parseUnitCalcAsk("fees on a $500k ticket")).toEqual({
      kind: "ticket",
      fundedUsd: 500_000,
    });
    expect(parseUnitCalcAsk("year-one on 500k")).toEqual({
      kind: "ticket",
      fundedUsd: 500_000,
    });
    expect(parseUnitCalcAsk("cuánto ganamos en un arriendo de $500k")).toEqual({
      kind: "ticket",
      fundedUsd: 500_000,
    });
  });

  it("quotes live seeds without a ticket", () => {
    expect(parseUnitCalcAsk("what's our origination fee")).toEqual({
      kind: "quote",
    });
    expect(parseUnitCalcAsk("quote the live fees")).toEqual({ kind: "quote" });
    expect(parseUnitCalcAsk("cuál es nuestra originación")).toEqual({
      kind: "quote",
    });
  });

  it("does not steal sets, reports, or the business brief", () => {
    expect(parseUnitCalcAsk("set origination to 1.5%")).toBeNull();
    expect(parseVariableSet("set origination to 1.5%")).toBeTruthy();
    expect(parseUnitCalcAsk("show investor returns")).toBeNull();
    expect(parseReportAsk("show investor returns")?.kind).toBe("returns");
    expect(parseUnitCalcAsk("show the corporate structure")).toBeNull();
    expect(parseReportAsk("show the corporate structure")?.kind).toBe("structure");
    expect(parseUnitCalcAsk("explain the business model")).toBeNull();
    expect(parseHelpAsk("what do we make on a $500k lease")).toBeNull();
  });
});
