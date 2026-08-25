import { describe, expect, it } from "vitest";
import { AvatarStateSchema } from "@/lib/contracts/events";

describe("avatar contract", () => {
  it("uses the truthful states and not searching", () => {
    expect(AvatarStateSchema.options).toEqual([
      "idle",
      "listening",
      "thinking",
      "researching",
      "drafting",
      "generating",
      "speaking",
      "awaiting_approval",
    ]);
    expect(AvatarStateSchema.safeParse("searching").success).toBe(false);
  });
});
