import { describe, expect, it } from "vitest";
import { UnpublishedTermsError, deckSpecFromPublishedTerms } from "@/lib/artifacts/deck";

describe("deck spec", () => {
  it("refuses unpublished terms instead of inventing an ask", () => {
    expect(() =>
      deckSpecFromPublishedTerms({ version: 1, status: "draft", payload: { seedAskUsd: 3_000_000 } }),
    ).toThrow(UnpublishedTermsError);
  });

  it("builds five slides from a published record only", () => {
    const spec = deckSpecFromPublishedTerms({
      version: 2,
      status: "published",
      payload: { seedAskUsd: 3_000_000, instrument: "SAFE", board: "1 observer" },
    });
    expect(spec.slides).toHaveLength(5);
    expect(spec.slides[3]?.bullets).toContain("3000000");
  });
});
