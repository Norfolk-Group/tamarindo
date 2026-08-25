import { describe, expect, it } from "vitest";
import { PITCH_TOTAL_SLIDE_COUNT } from "@/lib/artifacts/deck";
import { deckSpecFromPublishedTerms } from "@/lib/artifacts/raise-deck";
import { renderDeckPptx } from "@/lib/artifacts/pptx";
import { runCashflowModel } from "@/lib/model/engine";
import { defaultValues } from "@/lib/model/variables";

describe("deck engine", () => {
  it("writes a 17-slide .pptx with live table numbers", () => {
    const spec = deckSpecFromPublishedTerms(
      {
        version: 2,
        status: "published",
        payload: {
          seedAskUsd: "4000000",
          instrument: "SAFE",
          board: "1 observer",
        },
      },
      runCashflowModel(defaultValues()),
    );
    expect(spec.slides).toHaveLength(PITCH_TOTAL_SLIDE_COUNT);
    const bytes = renderDeckPptx(spec);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
    const asText = bytes.toString("latin1");
    expect(asText).toContain("The ask");
    expect(asText).toContain("4,000,000");
    expect(asText).toContain("Use of funds");
  });
});
