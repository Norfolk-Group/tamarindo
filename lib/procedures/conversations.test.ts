import { describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
const profileIdFor = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { conversation: { findUnique } },
}));
vi.mock("@/lib/procedures/profile", () => ({ profileIdFor }));

import { conversationsGet } from "@/lib/procedures/conversations";

const actor = {
  kind: "user" as const,
  id: "user_1",
  displayName: "Ada",
  role: "member" as const,
};

describe("conversations.get", () => {
  it("returns owned messages", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    findUnique.mockResolvedValue({
      profileId: "prof_1",
      messages: [
        {
          role: "user",
          content: "thesis?",
          createdAt: new Date("2026-08-22T00:00:00Z"),
        },
        {
          role: "assistant",
          content: "Here.",
          createdAt: new Date("2026-08-22T00:00:01Z"),
        },
      ],
    });
    const result = await conversationsGet.handler(
      { conversationId: "conv_1" },
      { actor, traceId: "t" },
    );
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0]?.content).toBe("thesis?");
  });

  it("hides another profile's conversation", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    findUnique.mockResolvedValue({
      profileId: "prof_other",
      messages: [{ role: "user", content: "secret", createdAt: new Date() }],
    });
    const result = await conversationsGet.handler(
      { conversationId: "conv_1" },
      { actor, traceId: "t" },
    );
    expect(result.messages).toEqual([]);
  });
});
