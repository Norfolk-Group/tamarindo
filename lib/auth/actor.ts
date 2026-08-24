import type { Actor, Role } from "@/lib/contracts/procedure";

/** Shared actor builder (KTD13). Channel mappers and the DO use this. */
export function actorFromProfile(
  profile: { authSubject: string; displayName: string; role: Role },
  kind: Actor["kind"],
): Actor {
  return {
    kind,
    id: profile.authSubject,
    displayName: profile.displayName,
    role: profile.role,
  };
}
