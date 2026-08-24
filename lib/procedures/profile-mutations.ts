import { z } from "zod";
import { prisma } from "@/lib/db";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

const BioFields = {
  displayName: z.string().min(1).max(120).optional(),
  org: z.string().min(1).max(200).optional(),
  bio: z.string().min(1).max(4000).optional(),
};

export const profileUpdate = defineProcedure({
  name: "profile.update",
  description:
    "Update the caller's display name, organization, or bio. Never role, NDA, or auth subject.",
  input: z.object(BioFields).refine(
    (value) => Object.values(value).some((v) => v !== undefined),
    { message: "Provide displayName, org, or bio" },
  ),
  output: z.object({
    displayName: z.string(),
    org: z.string().nullable(),
    bio: z.string().nullable(),
  }),
  minRole: "guest",
  requiresApproval: false,
  handler: async (input, ctx) => {
    const id = await profileIdFor(ctx.actor.id);
    const row = await prisma.profile.update({
      where: { id },
      data: {
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.org ? { org: input.org } : {}),
        ...(input.bio ? { bio: input.bio } : {}),
      },
    });
    return { displayName: row.displayName, org: row.org, bio: row.bio };
  },
});

export const profileConfirmBio = defineProcedure({
  name: "profile.confirmBio",
  description: "Human confirms the drafted bio. Does not change NDA state.",
  input: z.object({}),
  output: z.object({ confirmed: z.literal(true), bio: z.string() }),
  minRole: "guest",
  humanOnly: true,
  requiresApproval: false,
  handler: async (_input, ctx) => {
    const id = await profileIdFor(ctx.actor.id);
    const row = await prisma.profile.findUnique({
      where: { id },
      select: { bio: true },
    });
    if (!row?.bio) throw new Error("Bio is empty — update it before confirming");
    return { confirmed: true as const, bio: row.bio };
  },
});
