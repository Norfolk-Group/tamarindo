import { describe, expect, it, vi } from "vitest";

const upsert = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    profile: { upsert },
  },
}));

import { ensureProfile } from "@/lib/auth";

describe("ensureProfile", () => {
  it("creates a first WorkOS login as guest and never writes role on update", async () => {
    upsert.mockResolvedValue({ displayName: "Ada", role: "guest" });
    const row = await ensureProfile({ id: "user_1", displayName: "Ada" }, "guest");
    expect(row).toEqual({ displayName: "Ada", role: "guest" });
    expect(upsert).toHaveBeenCalledWith({
      where: { authSubject: "user_1" },
      create: {
        authSubject: "user_1",
        displayName: "Ada",
        role: "guest",
      },
      update: { displayName: "Ada" },
    });
  });
});
