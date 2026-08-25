import { describe, expect, it } from "vitest";
import { parseReportAsk } from "@/lib/nico/report-intent";

describe("report intent", () => {
  it("maps FY3 cash flow to a single-year slice", () => {
    expect(parseReportAsk("FY3 cash flow")).toEqual({
      kind: "statements",
      fromFy: 3,
      toFy: 3,
    });
    expect(parseReportAsk("cash flow for FY 3")).toEqual({
      kind: "statements",
      fromFy: 3,
      toFy: 3,
    });
  });

  it("builds an income statement live instead of swapping in cash flow", () => {
    const ask = parseReportAsk("P&L for year 2 to 4");
    expect(ask).toMatchObject({
      kind: "income",
      fromFy: 2,
      toFy: 4,
      liveBuild: true,
    });
    expect(ask?.waitLine).toMatch(/building it now/i);
    expect(parseReportAsk("show me the income statement")?.kind).toBe("income");
    expect(parseReportAsk("statement of cash flows FY2–FY4")).toEqual({
      kind: "statements",
      fromFy: 2,
      toFy: 4,
    });
  });

  it("maps investor returns and sensitivity", () => {
    expect(parseReportAsk("show investor returns")).toEqual({ kind: "returns" });
    expect(parseReportAsk("vehicle IRR please")).toEqual({ kind: "returns" });
    expect(parseReportAsk("sensitivity on residual")).toEqual({
      kind: "sensitivity",
    });
    expect(parseReportAsk("financial statements")).toEqual({
      kind: "statements",
      fromFy: 1,
      toFy: 10,
    });
    expect(parseReportAsk("detailed cash flow")).toMatchObject({
      kind: "statements",
      depth: "extended",
    });
  });

  it("leaves the full 10-year ask to model.get", () => {
    expect(parseReportAsk("show the 10-year cash flow")).toBeNull();
    expect(parseReportAsk("10-year plan")).toBeNull();
  });

  it("ignores ordinary talk", () => {
    expect(parseReportAsk("what is ICP-1")).toBeNull();
    expect(parseReportAsk("list the ICPs")).toBeNull();
  });
});
