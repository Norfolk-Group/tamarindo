import { describe, expect, it } from "vitest";
import {
  isLiveWriteTurn,
  LIVE_READ_PROCEDURE_SET,
} from "@/lib/nico/live-tools";

describe("live read tools", () => {
  it("keeps model, tape, and headlines on the read set", () => {
    expect(LIVE_READ_PROCEDURE_SET.has("model.get")).toBe(true);
    expect(LIVE_READ_PROCEDURE_SET.has("model.report")).toBe(true);
    expect(LIVE_READ_PROCEDURE_SET.has("ticker.list")).toBe(true);
    expect(LIVE_READ_PROCEDURE_SET.has("news.headlines")).toBe(true);
    expect(LIVE_READ_PROCEDURE_SET.has("model.setVariables")).toBe(false);
    expect(LIVE_READ_PROCEDURE_SET.has("artifacts.create")).toBe(false);
  });

  it("treats case writes, workbooks, decks, and media as write turns", () => {
    expect(isLiveWriteTurn({ variableSet: { originationFeePct: 0.015 } })).toBe(
      true,
    );
    expect(isLiveWriteTurn({ workbook: true })).toBe(true);
    expect(isLiveWriteTurn({ deck: { kind: "deck" } })).toBe(true);
    expect(isLiveWriteTurn({ scenarioKind: "save" })).toBe(true);
    expect(isLiveWriteTurn({ scenarioKind: "load" })).toBe(true);
    expect(isLiveWriteTurn({ media: true })).toBe(true);
    expect(isLiveWriteTurn({ scenarioKind: "compare" })).toBe(false);
    expect(isLiveWriteTurn({})).toBe(false);
  });
});
