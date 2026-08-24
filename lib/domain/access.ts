import type { Actor } from "@/lib/contracts/procedure";
import { prisma } from "@/lib/db";

/**
 * Current NDA template. Confidential reads require `ndaSignedAt` plus a
 * `NdaSignature` row for this version (R5). Timestamp alone is not enough.
 */
export const CURRENT_NDA_TEMPLATE_VERSION = "nda-v1";

export type NdaProfile = {
  ndaSignedAt: Date | null;
  ndaSignatures: { templateVersion: string }[];
};

let testOverride: boolean | null = null;

/** Test-only. Pass `null` to restore the Prisma lookup. */
export function setCurrentNdaForTests(allowed: boolean | null): void {
  testOverride = allowed;
}

export function hasCurrentNda(profile: NdaProfile): boolean {
  if (!profile.ndaSignedAt) return false;
  return profile.ndaSignatures.some(
    (row) => row.templateVersion === CURRENT_NDA_TEMPLATE_VERSION,
  );
}

export async function hasCurrentNdaForSubject(authSubject: string): Promise<boolean> {
  if (testOverride !== null) return testOverride;
  const profile = await prisma.profile.findUnique({
    where: { authSubject },
    select: {
      ndaSignedAt: true,
      ndaSignatures: { select: { templateVersion: true } },
    },
  });
  if (!profile) return false;
  return hasCurrentNda(profile);
}

/**
 * Confidential reads (data room, knowledge, private artifacts).
 * Admins own the corpus — they do not sign their own NDA.
 */
export async function canReadConfidential(
  actor: Pick<Actor, "id" | "role">,
): Promise<boolean> {
  if (actor.role === "admin") return true;
  return hasCurrentNdaForSubject(actor.id);
}
