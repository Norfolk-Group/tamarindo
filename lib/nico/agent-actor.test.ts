import { describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { profile: { findUnique } },
}));

import { agentActorForSubject, asAgent } from "@/lib/nico/agent-actor";

describe("agentActorForSubject", () => {
  it("returns kind agent with the signed-in authSubject and Profile role", async () => {
    findUnique.mockResolvedValue({
      authSubject: "user_1",
      displayName: "Ada",
      role: "member",
    });
    await expect(agentActorForSubject("user_1")).resolves.toEqual({
      kind: "agent",
      id: "user_1",
      displayName: "Ada",
      role: "member",
    });
  });
});

describe("asAgent", () => {
  it("keeps the same id and flips kind", () => {
    expect(
      asAgent({
        kind: "user",
        id: "user_1",
        displayName: "Ada",
        role: "admin",
      }),
    ).toEqual({
      kind: "agent",
      id: "user_1",
      displayName: "Ada",
      role: "admin",
    });
  });
});
