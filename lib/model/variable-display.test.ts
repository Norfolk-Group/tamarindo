import { describe, expect, it } from "vitest";
import { fromDraftValue, formatVariableValue, toDraftValue } from "@/lib/model/variable-display";

describe("variable display", () => {
  it("shows percents as 40 not 0.4", () => {
    expect(toDraftValue("percent", 0.4)).toBe("40");
    expect(fromDraftValue("percent", "40")).toBe(0.4);
    expect(formatVariableValue("percent", 0.4)).toBe("40%");
  });
});
