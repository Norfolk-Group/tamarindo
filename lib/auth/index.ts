import type { Actor, Role } from "@/lib/contracts/procedure";
import { applyPendingInvitation } from "@/lib/auth/accept-invite";
import { prisma } from "@/lib/db";
import { allowDevActor, workosConfigState } from "@/lib/auth/env";

export type { WorkosConfigState } from "@/lib/auth/env";
export { allowDevActor, workosConfigState } from "@/lib/auth/env";

/**
 * Identity boundary. Nothing outside this file may know which auth
 * provider is in use.
 *
 * Production: WorkOS AuthKit (`@workos-inc/authkit-nextjs`).
 * Dev fallback: a fixed admin identity so the copilot runs without keys.
 */

export type AuthIdentity = {
  id: string;
  displayName: string;
  email?: string;
};

export async function getSessionActor(): Promise<Actor | null> {
  const identity = await resolveIdentity();
  if (!identity) return null;
  const firstRole: Role =
    identity.id === "dev-local" && allowDevActor() ? "admin" : "guest";
  const profile = await ensureProfile(identity, firstRole);
  if (!profile) return null;
  let role = profile.role;
  if (identity.email) {
    const accepted = await applyPendingInvitation({
      email: identity.email,
      authSubject: identity.id,
    });
    if (accepted) role = accepted.role;
  }
  return {
    kind: "user",
    id: identity.id,
    displayName: profile.displayName,
    role,
  };
}

async function resolveIdentity(): Promise<AuthIdentity | null> {
  const config = workosConfigState();
  if (config === "partial") {
    console.error("[auth] workos_partial_config");
    return null;
  }
  if (config === "ready") {
    const workos = await resolveWorkosIdentity();
    if (workos) return workos;
    if (allowDevActor()) {
      return { id: "dev-local", displayName: "Ricardo (dev)" };
    }
    return null;
  }
  if (allowDevActor()) {
    return { id: "dev-local", displayName: "Ricardo (dev)" };
  }
  return null;
}

/**
 * AuthKit `withAuth` is loaded only when keys are ready so unit tests that
 * never hit WorkOS do not import `server-only`. Failures are named, not thrown.
 */
export async function resolveWorkosIdentity(): Promise<AuthIdentity | null> {
  try {
    const { withAuth } = await import("@workos-inc/authkit-nextjs");
    const { user } = await withAuth();
    if (!user) return null;
    return {
      id: user.id,
      displayName: displayNameFromWorkos(user),
      email: user.email ?? undefined,
    };
  } catch (err) {
    console.error("[auth] authkit_session_unavailable", err);
    return null;
  }
}

function displayNameFromWorkos(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (user.email) return user.email;
  return "WorkOS user";
}

function isNonDev(): boolean {
  return process.env.NODE_ENV !== "development";
}

export async function ensureProfile(
  identity: AuthIdentity,
  firstRole: Role,
): Promise<{ displayName: string; role: Role } | null> {
  try {
    if (!prisma.profile) {
      if (isNonDev()) {
        throw new Error("Prisma Profile delegate missing — generate the client");
      }
      return { displayName: identity.displayName, role: firstRole };
    }
    const row = await prisma.profile.upsert({
      where: { authSubject: identity.id },
      create: {
        authSubject: identity.id,
        displayName: identity.displayName,
        role: firstRole,
        ...(identity.email ? { email: identity.email } : {}),
      },
      update: {
        displayName: identity.displayName,
        ...(identity.email ? { email: identity.email } : {}),
      },
    });
    return { displayName: row.displayName, role: row.role };
  } catch (err) {
    if (isNonDev()) throw err;
    console.warn("[auth] profile upsert skipped", err);
    return { displayName: identity.displayName, role: firstRole };
  }
}
