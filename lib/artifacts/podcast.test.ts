import { describe, expect, it } from "vitest";
import { podcastScriptFromMemo } from "@/lib/artifacts/podcast";

describe("podcast script", () => {
  it("uses two speakers and does not invent a raise number", () => {
    const script = podcastScriptFromMemo({
      title: "Pilot update",
      body: "The rental pool is live on three homes.",
    });
    expect(script.speakers).toBe(2);
    expect(script.lines).toHaveLength(3);
    expect(JSON.stringify(script).includes("2.5")).toBe(false);
    expect(script.lines[1]?.text).toContain("three homes");
  });
});
