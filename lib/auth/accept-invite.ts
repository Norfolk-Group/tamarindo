import type { Role } from "@/lib/contracts/procedure";
import { prisma } from "@/lib/db";

const INVITED_ROLES = new Set<Role>(["member", "investor"]);

/**
 * Apply a pending Neon invitation after AuthKit login.
 * First login stays guest until this runs. Role is never copied from
 * WorkOS metadata (U3). Neon is the source of truth.
 */
export async function applyPendingInvitation(opts: {
  email: string;
  authSubject: string;
}): Promise<{ applied: boolean; role: Role } | null> {
  const email = opts.email.trim().toLowerCase();
  if (!email) return null;

  const invite = await prisma.invitation.findFirst({
    where: { email, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (!invite) return null;

  if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) {
    await prisma.invitation.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    return null;
  }

  const invitedRole = invite.role as Role;
  if (!INVITED_ROLES.has(invitedRole)) return null;

  const profile = await prisma.profile.findUnique({
    where: { authSubject: opts.authSubject },
    select: { id: true, role: true },
  });
  if (!profile) return null;

  if (profile.role !== "guest" && profile.role !== invitedRole) {
    return { applied: false, role: profile.role };
  }

  const nextRole = profile.role === "guest" ? invitedRole : profile.role;

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: { role: nextRole, email },
    }),
    prisma.invitation.update({
      where: { id: invite.id },
      data: { status: "accepted", acceptedAt: new Date() },
    }),
  ]);

  void acceptWorkosInvitation(invite.workosId);

  return {
    applied: profile.role === "guest" && nextRole !== "guest",
    role: nextRole,
  };
}

/** Resolve the invited email from a WorkOS invitation token. */
export async function lookupInvitationEmailByToken(
  invitationToken: string | undefined,
): Promise<string | undefined> {
  const token = invitationToken?.trim();
  if (!token) return undefined;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return undefined;
  try {
    const { WorkOS } = await import("@workos-inc/node");
    const invitation = await new WorkOS(
      apiKey,
    ).userManagement.findInvitationByToken(token);
    return invitation.email.trim().toLowerCase();
  } catch (err) {
    console.error("[auth] workos_find_invitation_by_token_failed", err);
    return undefined;
  }
}

async function acceptWorkosInvitation(workosId: string | null): Promise<void> {
  if (!workosId) return;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return;
  try {
    const { WorkOS } = await import("@workos-inc/node");
    await new WorkOS(apiKey).userManagement.acceptInvitation(workosId);
  } catch (err) {
    console.error("[auth] workos_accept_invitation_failed", err);
  }
}
