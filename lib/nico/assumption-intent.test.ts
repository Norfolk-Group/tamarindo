import { describe, expect, it } from "vitest";
import { isAssumptionsAsk } from "@/lib/nico/assumption-intent";

describe("assumption intent", () => {
  it("hears show my assumptions", () => {
    expect(isAssumptionsAsk("show my assumptions")).toBe(true);
    expect(isAssumptionsAsk("what are the inputs")).toBe(true);
    expect(isAssumptionsAsk("set down to 35%")).toBe(false);
  });
});
