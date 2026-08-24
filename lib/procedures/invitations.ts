import { z } from "zod";
import { prisma } from "@/lib/db";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

/**
 * Persists a role-tagged invite and, when WorkOS keys are present, delivers
 * it through User Management invitations. workosId stays null if delivery
 * is skipped or fails — the Neon row is still the source of truth.
 */
export const invitationsSend = defineProcedure({
  name: "invitations.send",
  description:
    "Create a role-tagged invitation. Approval-gated. WorkOS delivers when configured.",
  input: z.object({
    approvalId: z.string(),
    email: z.string().email(),
    role: z.enum(["member", "investor"]),
  }),
  output: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(["member", "investor"]),
    workosId: z.string().nullable(),
  }),
  minRole: "admin",
  requiresApproval: true,
  handler: async (input, ctx) => {
    const inviterId = await profileIdFor(ctx.actor.id);
    const workosId = await deliverWorkosInvitation(input.email, input.role);
    const row = await prisma.invitation.create({
      data: {
        email: input.email,
        role: input.role,
        inviterId,
        workosId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    return {
      id: row.id,
      email: row.email,
      role: row.role as "member" | "investor",
      workosId: row.workosId,
    };
  },
});

async function deliverWorkosInvitation(
  email: string,
  role: "member" | "investor",
): Promise<string | null> {
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return null;
  try {
    const { WorkOS } = await import("@workos-inc/node");
    const invitation = await new WorkOS(apiKey).userManagement.sendInvitation({
      email,
      expiresInDays: 14,
      roleSlug: role,
    });
    return invitation.id;
  } catch (err) {
    console.error("[invitations] workos_send_failed", err);
    return null;
  }
}
