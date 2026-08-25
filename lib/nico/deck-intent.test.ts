import { describe, expect, it } from "vitest";
import { parseDeckAsk } from "@/lib/nico/deck-intent";

describe("parseDeckAsk", () => {
  it("maps investor / raise / pitch phrasing to a raise deck", () => {
    expect(parseDeckAsk("make the investor deck")).toEqual({
      kind: "deck",
      variant: "raise",
    });
    expect(parseDeckAsk("queue a raise pptx")).toEqual({
      kind: "deck",
      variant: "raise",
    });
    expect(parseDeckAsk("pitch deck please")).toEqual({
      kind: "deck",
      variant: "raise",
    });
    expect(parseDeckAsk("build the raise deck")).toEqual({
      kind: "deck",
      variant: "raise",
    });
  });

  it("maps working / draft / admin phrasing to raise-draft", () => {
    expect(parseDeckAsk("working raise deck")).toEqual({
      kind: "deck",
      variant: "raise-draft",
    });
    expect(parseDeckAsk("raise draft for the partners")).toEqual({
      kind: "deck",
      variant: "raise-draft",
    });
    expect(parseDeckAsk("queue an admin deck")).toEqual({
      kind: "deck",
      variant: "raise-draft",
    });
  });

  it("maps structure phrasing to a structure deck or memo", () => {
    expect(parseDeckAsk("show the corporate structure")).toEqual({
      kind: "deck",
      variant: "structure",
    });
    expect(parseDeckAsk("entity map please")).toEqual({
      kind: "deck",
      variant: "structure",
    });
    expect(parseDeckAsk("Ashoka memo")).toEqual({
      kind: "memo",
      variant: "structure",
    });
    expect(parseDeckAsk("structure memo")).toEqual({
      kind: "memo",
      variant: "structure",
    });
  });

  it("does not treat cash-flow or Excel workbook asks as a deck", () => {
    expect(parseDeckAsk("10-year cash flow")).toBeNull();
    expect(parseDeckAsk("show the 10-year cash flow")).toBeNull();
    expect(parseDeckAsk("excel workbook")).toBeNull();
    expect(parseDeckAsk("build the 10-year excel")).toBeNull();
  });

  it("ignores ordinary talk", () => {
    expect(parseDeckAsk("what is the balloon on ICP-1?")).toBeNull();
    expect(parseDeckAsk("who is Rosario?")).toBeNull();
  });
});
