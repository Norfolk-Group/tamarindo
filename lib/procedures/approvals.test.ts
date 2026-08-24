import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { approvalsRequest } from "@/lib/procedures/approvals";

describe("approvals.request", () => {
  it("returns a clear error when the actor has no Profile", async () => {
    await expect(
      approvalsRequest.handler(
        {
          procedure: "communications.send",
          payload: { to: "a@b.c" },
          reason: "test",
        },
        {
          actor: {
            kind: "user",
            id: "missing-subject",
            displayName: "Ghost",
            role: "member",
          },
          traceId: "test-no-profile",
        },
      ),
    ).rejects.toThrow(/No profile for actor missing-subject/);
  });
});
