import { afterEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { profile: { findFirst } },
}));

import { actorFromChannel } from "@/lib/channels/actor";

describe("channel actor mapper", () => {
  afterEach(() => {
    findFirst.mockReset();
  });

  it("returns an existing Profile and never invents admin", async () => {
    findFirst.mockResolvedValue({
      authSubject: "user_1",
      displayName: "Rossi",
      role: "investor",
    });
    const actor = await actorFromChannel({ email: "rossi@example.com" });
    expect(actor).toEqual({
      kind: "user",
      id: "user_1",
      displayName: "Rossi",
      role: "investor",
    });
  });

  it("maps an unknown sender to guest", async () => {
    findFirst.mockResolvedValue(null);
    const actor = await actorFromChannel({ email: "unknown@example.com" });
    expect(actor.role).toBe("guest");
    expect(actor.id).toBe("guest:unmapped");
  });

  it("does not mint a role from a phone number (bind waits on invite/admin)", async () => {
    const actor = await actorFromChannel({ phone: "+15551212" });
    expect(actor.role).toBe("guest");
    expect(findFirst).not.toHaveBeenCalled();
  });
});
