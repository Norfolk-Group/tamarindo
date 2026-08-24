import type { Actor } from "@/lib/contracts/procedure";
import { prisma } from "@/lib/db";

/**
 * Channel identity mapper (KTD13). Returns an existing Profile or guest.
 * Never mints admin/member. Phone/email bind is admin/invite, not here.
 */
export async function actorFromChannel(lookup: {
  email?: string;
  /** Accepted for the mapper contract. Phone bind is admin/invite, not a lookup. */
  phone?: string;
}): Promise<Actor> {
  const email = lookup.email?.trim().toLowerCase();
  if (email) {
    const profile = await prisma.profile.findFirst({
      where: { email },
      select: { authSubject: true, displayName: true, role: true },
    });
    if (profile) {
      return {
        kind: "user",
        id: profile.authSubject,
        displayName: profile.displayName,
        role: profile.role,
      };
    }
  }
  return {
    kind: "user",
    id: "guest:unmapped",
    displayName: "Guest",
    role: "guest",
  };
}
