import { AvatarStateSchema, type AvatarState } from "@/lib/contracts/events";
import { cn } from "@/lib/utils";

/**
 * Nico's presence. Pure CSS state machine (Rive rig replaces the visual
 * later; the data-state contract stays). States only change when the
 * orchestrator emits an activity event — truthful presence.
 */
export function AvatarOrb({
  state,
  className,
}: {
  state: AvatarState;
  className?: string;
}) {
  const safe = AvatarStateSchema.safeParse(state);
  const resolved: AvatarState = safe.success ? safe.data : "idle";

  return (
    <div
      className={cn("nico-orb size-8", className)}
      data-state={resolved}
      role="img"
      aria-label={`Nico is ${resolved}`}
    />
  );
}
