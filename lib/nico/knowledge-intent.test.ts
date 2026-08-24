import { describe, expect, it } from "vitest";
import { needsKnowledgeSearch } from "@/lib/nico/knowledge-intent";

describe("needsKnowledgeSearch", () => {
  it("skips greetings so Nico can talk first", () => {
    expect(needsKnowledgeSearch("hi")).toBe(false);
    expect(needsKnowledgeSearch("Hey, how are you?")).toBe(false);
    expect(needsKnowledgeSearch("thanks")).toBe(false);
  });

  it("skips a workbook ask (that path queues the file instead)", () => {
    expect(
      needsKnowledgeSearch(
        "Help me build a worksheet about the Tamarindo business as a whole",
      ),
    ).toBe(false);
  });

  it("searches a legal or math question even without the brand name", () => {
    expect(needsKnowledgeSearch("How does comodato work in Colombia?")).toBe(
      true,
    );
    expect(needsKnowledgeSearch("What is the balloon payment formula?")).toBe(
      true,
    );
  });

  it("does not search the thesis for weather or horoscope", () => {
    expect(needsKnowledgeSearch("What's the weather in Cartagena?")).toBe(
      false,
    );
    expect(needsKnowledgeSearch("scorpio horoscope today?")).toBe(false);
  });

  it("searches when the user asks a Tamarindo fact", () => {
    expect(needsKnowledgeSearch("what is the thesis?")).toBe(true);
    expect(needsKnowledgeSearch("Intervest yield?")).toBe(true);
  });
});
