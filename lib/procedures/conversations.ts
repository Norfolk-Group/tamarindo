import { z } from "zod";
import { prisma } from "@/lib/db";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

const MessageRowSchema = z.object({
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const conversationsGet = defineProcedure({
  name: "conversations.get",
  description:
    "Load messages for a conversation the caller owns. Used to hydrate reload and a second tab.",
  input: z.object({ conversationId: z.string().min(1) }),
  output: z.object({ messages: z.array(MessageRowSchema) }),
  minRole: "guest",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const profileId = await profileIdFor(ctx.actor.id);
    const row = await prisma.conversation.findUnique({
      where: { id: input.conversationId },
      select: {
        profileId: true,
        messages: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { role: true, content: true, createdAt: true },
        },
      },
    });
    if (!row || row.profileId !== profileId) {
      return { messages: [] };
    }
    return {
      messages: row.messages.map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  },
});
