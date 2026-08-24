import { describe, expect, it } from "vitest";
import { isChitChat, isLifeTalk } from "@/lib/nico/world-intent";

describe("world-intent", () => {
  it("treats rapport as life talk, not a thesis dump", () => {
    expect(isChitChat("Hey, how are you?")).toBe(true);
    expect(isLifeTalk("I need a break")).toBe(true);
  });

  it("does not treat an LTV question as small talk", () => {
    expect(isLifeTalk("What LTV do we use in Medellín?")).toBe(false);
  });
});
