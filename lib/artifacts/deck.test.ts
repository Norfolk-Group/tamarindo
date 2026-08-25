import { describe, expect, it } from "vitest";
import { UnpublishedTermsError, PITCH_TOTAL_SLIDE_COUNT } from "@/lib/artifacts/deck";
import { deckSpecFromPublishedTerms, raiseDeckSpec } from "@/lib/artifacts/raise-deck";
import { runCashflowModel } from "@/lib/model/engine";
import { defaultValues } from "@/lib/model/variables";

const published = {
  version: 2,
  status: "published" as const,
  payload: { seedAskUsd: 3_000_000, instrument: "SAFE", board: "1 observer" },
};

describe("deck spec", () => {
  it("refuses unpublished terms instead of inventing an ask", () => {
    expect(() =>
      deckSpecFromPublishedTerms({ version: 1, status: "draft", payload: { seedAskUsd: 3_000_000 } }),
    ).toThrow(UnpublishedTermsError);
  });

  it("builds the 10 + thank you + 6 raise with live P&L and Use of Funds", () => {
    const model = runCashflowModel(defaultValues());
    const spec = deckSpecFromPublishedTerms(published, model);
    expect(spec.slides).toHaveLength(PITCH_TOTAL_SLIDE_COUNT);
    expect(spec.slides.filter((slide) => slide.kind === "story")).toHaveLength(10);
    expect(spec.slides.filter((slide) => slide.kind === "backup")).toHaveLength(6);
    const pnl = spec.slides.find((slide) => slide.id === "pnl");
    const funds = spec.slides.find((slide) => slide.id === "use-of-funds");
    expect(pnl?.table?.rows.length).toBeGreaterThan(3);
    expect(funds?.table?.rows.length).toBeGreaterThan(1);
    expect(spec.slides.find((slide) => slide.id === "ask")?.bullets.join(" ")).toContain("3,000,000");
  });

  it("lets raise-draft omit a teammate without inventing the ask", () => {
    const spec = raiseDeckSpec(
      { version: null, status: null, payload: null },
      "raise-draft",
      runCashflowModel(defaultValues()),
      { omitPersonIds: ["jesse"] },
    );
    const team = spec.slides.find((slide) => slide.id === "team")?.bullets.join(" ") ?? "";
    expect(team.toLowerCase()).not.toContain("jesse");
    expect(spec.slides.find((slide) => slide.id === "ask")?.bullets.join(" ")).toMatch(
      /not published|will not invent/i,
    );
  });
});
