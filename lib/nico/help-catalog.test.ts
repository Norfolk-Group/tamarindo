import { describe, expect, it } from "vitest";
import {
  HELP_TOPICS,
  fieldHelpId,
  helpTip,
  helpTopic,
  searchHelp,
} from "@/lib/nico/help-catalog";

describe("help catalog", () => {
  it("has a unique id for every topic", () => {
    const ids = HELP_TOPICS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns the short tip used by (i) helpers", () => {
    expect(helpTip("nav.statements")).toMatch(/cash-flow book/i);
    expect(helpTopic("nav.artifacts")?.title).toBe("Files");
    expect(helpTopic("artifacts.list")?.title).toBe("Files list");
    expect(helpTopic("glossary.icp")?.title).toBe("Ideal Contract Profile");
  });

  it("searches title, tip, and body", () => {
    const hits = searchHelp("residual");
    expect(hits.map((row) => row.id)).toContain("glossary.residual");
    expect(searchHelp("").length).toBe(HELP_TOPICS.length);
    expect(searchHelp("no-such-topic-xyz")).toEqual([]);
  });

  it("maps ICP field keys to the matching tip", () => {
    expect(fieldHelpId("icp.icp1.purchasePriceUsd")).toBe("icp.price");
    expect(fieldHelpId("icp.auto1.termMonths")).toBe("icp.term");
    expect(fieldHelpId("icp.air2.mixWeight")).toBe("icp.mix");
    expect(fieldHelpId("downPaymentPct")).toBeUndefined();
  });
});
