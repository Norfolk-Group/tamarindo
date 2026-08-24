import { z } from "zod";

/**
 * Agent-native core contract.
 *
 * Every capability in this system is a Procedure. The web UI, Nico's
 * orchestrator, and any future channel (WhatsApp, phone, email) are all
 * just callers of the same registry — parity by construction.
 */

export const RoleSchema = z.enum(["admin", "member", "investor", "guest"]);
export type Role = z.infer<typeof RoleSchema>;

export const ActorSchema = z.object({
  kind: z.enum(["user", "agent"]),
  id: z.string(),
  displayName: z.string(),
  role: RoleSchema,
});
export type Actor = z.infer<typeof ActorSchema>;

/** Context every procedure handler receives. */
export interface ProcedureContext {
  actor: Actor;
  /** Correlation id for audit logging (one per conversation turn / job). */
  traceId: string;
}

export interface ProcedureDefinition<
  Input extends z.ZodTypeAny = z.ZodTypeAny,
  Output extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** Namespaced verb, e.g. "knowledge.search", "artifacts.list". */
  name: string;
  /** One sentence. Shown to humans in the UI and to agents as tool docs. */
  description: string;
  input: Input;
  output: Output;
  /** Minimum role allowed to invoke. */
  minRole: Role;
  /**
   * True when the procedure has an outside-world side effect (send email,
   * message an investor, place a call). Requires an approved approval
   * record before execution — the gate lives in the registry, not here.
   */
  requiresApproval: boolean;
  /**
   * True when only a human user may invoke. The capability map hides these
   * from agents; `registry.invoke` is the control and still rejects
   * `actor.kind === "agent"` (KTD4).
   */
  humanOnly?: boolean;
  handler: (
    input: z.infer<Input>,
    ctx: ProcedureContext,
  ) => Promise<z.infer<Output>>;
}

/** Serializable descriptor — what the UI renders and agents introspect. */
export const CapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  minRole: RoleSchema,
  requiresApproval: z.boolean(),
  humanOnly: z.boolean(),
});
export type Capability = z.infer<typeof CapabilitySchema>;

const roleRank: Record<Role, number> = {
  guest: 0,
  investor: 1,
  member: 2,
  admin: 3,
};

export function roleAtLeast(actual: Role, required: Role): boolean {
  return roleRank[actual] >= roleRank[required];
}
