import { describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
const createConversation = vi.hoisted(() => vi.fn());
const createMessage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    conversation: { findUnique, create: createConversation },
    message: { create: createMessage },
  },
}));

import { appendMessage, ensureConversation, sessionKey } from "@/lib/nico/session";

describe("session key", () => {
  it("is profileId + conversationId", () => {
    expect(sessionKey("prof_1", "conv_1")).toBe("prof_1:conv_1");
  });
});

describe("ensureConversation", () => {
  it("creates when missing", async () => {
    findUnique.mockResolvedValue(null);
    createConversation.mockResolvedValue({});
    await ensureConversation("prof_1", "conv_1");
    expect(createConversation).toHaveBeenCalledWith({
      data: { id: "conv_1", profileId: "prof_1" },
    });
  });

  it("refuses a conversation owned by someone else", async () => {
    findUnique.mockResolvedValue({ id: "conv_1", profileId: "other" });
    await expect(ensureConversation("prof_1", "conv_1")).rejects.toThrow(
      /another profile/,
    );
  });
});

describe("appendMessage", () => {
  it("skips blank content", async () => {
    await appendMessage({
      conversationId: "conv_1",
      role: "assistant",
      content: "   ",
    });
    expect(createMessage).not.toHaveBeenCalled();
  });
});
