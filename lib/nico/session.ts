import { prisma } from "@/lib/db";
export { sessionKey } from "@/lib/nico/session-key";

export async function ensureConversation(
  profileId: string,
  conversationId: string,
): Promise<void> {
  const existing = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, profileId: true },
  });
  if (existing && existing.profileId !== profileId) {
    throw new Error("Conversation belongs to another profile");
  }
  if (existing) return;
  await prisma.conversation.create({
    data: { id: conversationId, profileId },
  });
}

export async function listRecentMessages(
  conversationId: string,
  take = 8,
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take,
    select: { role: true, content: true },
  });
  return rows.reverse().map((row) => ({
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
  }));
}

export async function appendMessage(input: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<void> {
  if (!input.content.trim()) return;
  await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
    },
  });
}
