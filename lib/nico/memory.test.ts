import { describe, expect, it } from "vitest";
import { heuristicExtract } from "@/lib/nico/memory";

describe("heuristicExtract", () => {
  it("keeps an explicit remember-that as a fact", () => {
    expect(
      heuristicExtract("Remember that Intervest wants the first close in Q1."),
    ).toEqual([
      { kind: "fact", text: "Intervest wants the first close in Q1" },
    ]);
  });

  it("keeps a standing preference", () => {
    expect(
      heuristicExtract("From now on always show the sucursal as for-profit."),
    ).toEqual([
      {
        kind: "preference",
        text: "always show the sucursal as for-profit",
      },
    ]);
  });

  it("keeps a correction", () => {
    expect(
      heuristicExtract("That's wrong, the balloon floor is twenty percent."),
    ).toEqual([
      {
        kind: "correction",
        text: "the balloon floor is twenty percent",
      },
    ]);
  });

  it("ignores greetings and thin talk", () => {
    expect(heuristicExtract("hey")).toEqual([]);
    expect(heuristicExtract("what's the weather")).toEqual([]);
    expect(heuristicExtract("I'm here")).toEqual([]);
  });

  it("keeps an explicit first-name permission", () => {
    expect(heuristicExtract("you can call me by my first name")).toEqual([
      {
        kind: "preference",
        text: "Nico may call this person by first name",
      },
    ]);
  });
});
