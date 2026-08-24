import { describe, expect, it } from "vitest";
import { deckSpecFromPublishedTerms } from "@/lib/artifacts/deck";
import { renderDeckPptx } from "@/lib/artifacts/pptx";

describe("deck engine", () => {
  it("writes a 5-slide .pptx from published Deal Terms only", () => {
    const spec = deckSpecFromPublishedTerms({
      version: 1,
      status: "published",
      payload: {
        seedAskUsd: "4000000",
        instrument: "SAFE",
        preMoneyUsd: "unpublished-not-used-if-missing",
        board: "1 observer",
      },
    });
    expect(spec.slides).toHaveLength(5);
    const bytes = renderDeckPptx(spec);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    const asText = bytes.toString("latin1");
    expect(asText).toContain("The ask");
    expect(asText).toContain("4000000");
  });
});
