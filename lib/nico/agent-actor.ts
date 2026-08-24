import { actorFromProfile } from "@/lib/auth/actor";
import type { Actor } from "@/lib/contracts/procedure";
import { prisma } from "@/lib/db";

/**
 * Nico's tool actor. Same authSubject as the signed-in human; kind is always
 * `agent` so humanOnly procedures stay forbidden (KTD4 / KTD13).
 */
export async function agentActorForSubject(
  authSubject: string,
): Promise<Actor> {
  const profile = await prisma.profile.findUnique({
    where: { authSubject },
    select: { authSubject: true, displayName: true, role: true },
  });
  if (!profile) {
    throw new Error(`No profile for ${authSubject}`);
  }
  return actorFromProfile(profile, "agent");
}

/** SSE and the DO both invoke tools as Nico, not as the human clicker. */
export function asAgent(actor: Actor): Actor {
  return { ...actor, kind: "agent" };
}
