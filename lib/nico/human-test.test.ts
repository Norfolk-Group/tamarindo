import { describe, expect, it } from "vitest";
import { HUMAN_TEST, HUMAN_TEST_TURN } from "@/lib/nico/human-test";

describe("human test", () => {
  it("is a silent gate with concrete fails", () => {
    expect(HUMAN_TEST).toContain("would a human answer this way?");
    expect(HUMAN_TEST).toContain("Never announce the check");
    expect(HUMAN_TEST).toMatch(/statement or a table/i);
    expect(HUMAN_TEST_TURN).toContain("rewrite once silently");
  });
});
