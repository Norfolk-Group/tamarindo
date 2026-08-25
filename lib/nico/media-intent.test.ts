import { describe, expect, it } from "vitest";
import { parseMediaAsk } from "@/lib/nico/media-intent";

describe("parseMediaAsk", () => {
  it("detects a Nano Banana illustration", () => {
    expect(parseMediaAsk("draw me an illustration of El Poblado at dusk")).toMatchObject({
      kind: "image",
    });
  });

  it("detects a Veo clip", () => {
    expect(parseMediaAsk("create a short video of Cartagena's walled city")).toMatchObject({
      kind: "video",
    });
  });

  it("ignores ordinary talk", () => {
    expect(parseMediaAsk("what is the balloon on ICP-1?")).toBeNull();
    expect(parseMediaAsk("hey")).toBeNull();
  });
});
