import { describe, expect, it } from "vitest";
import { needsKnowledgeSearch } from "@/lib/nico/knowledge-intent";

describe("needsKnowledgeSearch", () => {
  it("skips greetings so Nico can talk first", () => {
    expect(needsKnowledgeSearch("hi")).toBe(false);
    expect(needsKnowledgeSearch("Hey, how are you?")).toBe(false);
    expect(needsKnowledgeSearch("thanks")).toBe(false);
  });

  it("skips ticket math so Nico calculates instead of dumping 19", () => {
    expect(needsKnowledgeSearch("what do we make on a $500k lease")).toBe(
      false,
    );
    expect(needsKnowledgeSearch("what's our origination fee")).toBe(false);
  });

  it("skips a workbook ask (that path queues the file instead)", () => {
    expect(
      needsKnowledgeSearch(
        "Help me build a worksheet about the Tamarindo business as a whole",
      ),
    ).toBe(false);
  });

  it("skips the Claude-for-Excel spec download", () => {
    expect(needsKnowledgeSearch("download the excel spec")).toBe(false);
  });

  it("searches a legal or math question even without the brand name", () => {
    expect(needsKnowledgeSearch("How does comodato work in Colombia?")).toBe(
      true,
    );
    expect(needsKnowledgeSearch("What is the balloon payment formula?")).toBe(
      true,
    );
  });

  it("does not search the thesis for weather, tape, or headlines", () => {
    expect(needsKnowledgeSearch("What's the weather in Cartagena?")).toBe(
      false,
    );
    expect(needsKnowledgeSearch("scorpio horoscope today?")).toBe(false);
    expect(needsKnowledgeSearch("How is the NASDAQ today?")).toBe(false);
    expect(needsKnowledgeSearch("top news of the hour")).toBe(false);
    expect(needsKnowledgeSearch("USD/COP?")).toBe(false);
    expect(needsKnowledgeSearch("real estate news around Medellín")).toBe(
      false,
    );
    expect(
      needsKnowledgeSearch("Cartagena walled city real estate?"),
    ).toBe(false);
  });

  it("does not search the thesis for a plain illustration ask", () => {
    expect(
      needsKnowledgeSearch("draw me an illustration of a dusk skyline"),
    ).toBe(false);
    expect(
      needsKnowledgeSearch("illustrate the ICP-1 balloon for me"),
    ).toBe(true);
  });

  it("searches a short who-is about a named person", () => {
    expect(needsKnowledgeSearch("who is Dov?")).toBe(true);
    expect(needsKnowledgeSearch("Who is Rosario")).toBe(true);
  });

  it("searches when the user asks a Tamarindo fact", () => {
    expect(needsKnowledgeSearch("what is the thesis?")).toBe(true);
    expect(needsKnowledgeSearch("Intervest yield?")).toBe(true);
    expect(needsKnowledgeSearch("what's predial in Cartagena")).toBe(true);
    expect(needsKnowledgeSearch("US tourist visa days in Colombia")).toBe(true);
  });
});
