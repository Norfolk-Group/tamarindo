import { z } from "zod";
import { prisma } from "@/lib/db";
import { artifactThreadMarker } from "@/lib/channels/in-thread";
import { deliverOutbound } from "@/lib/channels/outbound";
import { defineProcedure } from "@/lib/procedures/registry";

/**
 * Outbound send. The registry blocks it until an approved Approval row
 * exists — except Q2: re-attaching a file already in-thread.
 * Provider handoff uses HTTP when keys exist; missing keys skip and invent nothing.
 */
export const communicationsSend = defineProcedure({
  name: "communications.send",
  description:
    "Send an outbound message (email, WhatsApp, SMS, or call). Always requires human approval unless the attached file is already in-thread.",
  input: z.object({
    approvalId: z.string().optional(),
    channel: z.enum(["email", "whatsapp", "sms", "call"]),
    to: z.string().min(1),
    subject: z.string().optional(),
    body: z.string().min(1),
    artifactId: z.string().optional(),
    conversationId: z.string().optional(),
  }),
  output: z.object({
    queued: z.literal(true),
    channel: z.string(),
    artifactId: z.string().nullable(),
  }),
  minRole: "member",
  requiresApproval: true,
  handler: async (input) => {
    if (input.artifactId) {
      const artifact = await prisma.artifact.findUnique({
        where: { id: input.artifactId },
        select: { id: true },
      });
      if (!artifact) throw new Error("Artifact not found");
    }
    if (input.conversationId && input.artifactId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: input.conversationId },
        select: { id: true },
      });
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: input.conversationId,
            role: "system",
            content: `${artifactThreadMarker(input.artifactId)} ${input.body}`,
          },
        });
      }
    }
    await deliverOutbound({
      channel: input.channel,
      to: input.to,
      subject: input.subject,
      body: input.body,
    });
    return {
      queued: true as const,
      channel: input.channel,
      artifactId: input.artifactId ?? null,
    };
  },
});
