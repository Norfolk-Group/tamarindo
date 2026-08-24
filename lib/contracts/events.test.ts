import { describe, expect, it } from "vitest";
import { AvatarStateSchema } from "@/lib/contracts/events";

describe("avatar contract", () => {
  it("uses the seven truthful states and not searching", () => {
    expect(AvatarStateSchema.options).toEqual([
      "idle",
      "listening",
      "thinking",
      "researching",
      "drafting",
      "speaking",
      "awaiting_approval",
    ]);
    expect(AvatarStateSchema.safeParse("searching").success).toBe(false);
  });
});
