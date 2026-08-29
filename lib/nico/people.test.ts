import { describe, expect, it } from "vitest";
import { namedPeopleIn, peopleNoteFor } from "@/lib/nico/people";
import { needsKnowledgeSearch } from "@/lib/nico/knowledge-intent";

describe("Tamarindo people", () => {
  it("knows Dov from a short who-is", () => {
    expect(needsKnowledgeSearch("who is Dov?")).toBe(true);
    expect(needsKnowledgeSearch("Who's Dov")).toBe(true);
    expect(namedPeopleIn("who is Dov?").map((p) => p.aliases[0])).toContain(
      "dov",
    );
    expect(peopleNoteFor("who is Dov?")).toContain("Kaleil Dov Isaza Tuzman");
    expect(peopleNoteFor("who is Dov?")).toContain("Managing Director");
    expect(peopleNoteFor("who is that?")).toBeUndefined();
  });

  it("knows Natalia as marketing director", () => {
    expect(peopleNoteFor("who is Natalia?") ?? "").toMatch(/Director of Marketing/i);
  });

  it("knows Juan Pablo and Jesse from the Launch Team thread", () => {
    expect(peopleNoteFor("who is Juan Pablo?") ?? "").toMatch(/Hoyos/i);
    expect(peopleNoteFor("who is Jesse?") ?? "").toMatch(/Business Development/i);
  });

  it("does not treat a greeting as a person lookup", () => {
    expect(needsKnowledgeSearch("Hey, how are you?")).toBe(false);
  });
});
