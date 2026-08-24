import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const user = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "admin" as const,
  },
  traceId: "tabs",
};

describe("two tabs on the same session", () => {
  it("returns the same messages for two conversations.get reads", async () => {
    await seed();
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { authSubject: "dev-local" },
    });
    const conversation = await prisma.conversation.create({
      data: {
        profileId: profile.id,
        title: "Shared",
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: "thesis?",
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: "Credit translation.",
      },
    });
    const first = (await registry.invoke(
      "conversations.get",
      { conversationId: conversation.id },
      user,
    )) as { messages: { content: string }[] };
    const second = (await registry.invoke(
      "conversations.get",
      { conversationId: conversation.id },
      { ...user, traceId: "tabs-2" },
    )) as { messages: { content: string }[] };
    expect(second.messages.map((m) => m.content)).toEqual(
      first.messages.map((m) => m.content),
    );
    expect(first.messages.map((m) => m.content)).toEqual([
      "thesis?",
      "Credit translation.",
    ]);
  });
});
