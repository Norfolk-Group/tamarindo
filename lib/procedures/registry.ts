import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  type Actor,
  type Capability,
  type ProcedureContext,
  type ProcedureDefinition,
  type Role,
  roleAtLeast,
} from "@/lib/contracts/procedure";
import {
  artifactAlreadyInThread,
  sendAttachFields,
} from "@/lib/channels/in-thread";
import { hashApprovalInput } from "@/lib/procedures/approval-payload";

/**
 * The single choke point for every capability in the system.
 * Role checks, approval gates, and audit logging live here — once.
 */

export function defineProcedure<
  I extends z.ZodTypeAny,
  O extends z.ZodTypeAny,
>(def: ProcedureDefinition<I, O>): ProcedureDefinition<I, O> {
  return def;
}

/**
 * Erased form for registry storage. Type safety lives at definition time
 * (defineProcedure) and at runtime (Zod parses input and output).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProcedure = ProcedureDefinition<any, any>;

export type CapabilityFilter = {
  role?: Role;
  kind?: Actor["kind"];
};

export class ProcedureRegistry {
  private procedures = new Map<string, AnyProcedure>();

  register(def: AnyProcedure): this {
    if (this.procedures.has(def.name)) {
      throw new Error(`Procedure already registered: ${def.name}`);
    }
    this.procedures.set(def.name, def);
    return this;
  }

  /** The capability map: what the UI renders and agents introspect. */
  capabilities(filter?: CapabilityFilter | Role): Capability[] {
    const role = typeof filter === "string" ? filter : filter?.role;
    const kind = typeof filter === "string" ? undefined : filter?.kind;
    return [...this.procedures.values()]
      .filter((p) => !role || roleAtLeast(role, p.minRole))
      .filter((p) => kind !== "agent" || !p.humanOnly)
      .map(({ name, description, minRole, requiresApproval, humanOnly }) => ({
        name,
        description,
        minRole,
        requiresApproval,
        humanOnly: Boolean(humanOnly),
      }));
  }

  async invoke(
    name: string,
    rawInput: unknown,
    ctx: ProcedureContext,
  ): Promise<unknown> {
    const def = this.procedures.get(name);
    if (!def) throw new ProcedureError("not_found", `Unknown procedure: ${name}`);
    if (!roleAtLeast(ctx.actor.role, def.minRole)) {
      throw new ProcedureError(
        "forbidden",
        `${ctx.actor.role} may not invoke ${name} (requires ${def.minRole})`,
      );
    }
    if (def.humanOnly && ctx.actor.kind === "agent") {
      throw new ProcedureError(
        "forbidden",
        `agent may not invoke ${name} (humanOnly)`,
      );
    }
    let consumedId: string | null = null;
    if (def.requiresApproval && !(await maySkipSendApproval(name, rawInput))) {
      consumedId = await assertApprovedAndConsume(name, rawInput);
    }
    const input = def.input.parse(rawInput);
    const startedAt = Date.now();
    try {
      const output = await def.handler(input, ctx);
      await persistAudit({
        name,
        ctx,
        ok: true,
        ms: Date.now() - startedAt,
        requiresApproval: def.requiresApproval,
      });
      return def.output.parse(output);
    } catch (err) {
      if (consumedId) await restoreApproval(consumedId);
      await persistAudit({
        name,
        ctx,
        ok: false,
        ms: Date.now() - startedAt,
        error: err instanceof Error ? err.message : "unknown",
        requiresApproval: def.requiresApproval,
      });
      throw err;
    }
  }
}

export class ProcedureError extends Error {
  constructor(
    public code: "not_found" | "forbidden" | "approval_required",
    message: string,
  ) {
    super(message);
  }
}

/** Q2: same-file attach in-thread is not a second outbound send. */
export async function maySkipSendApproval(
  procedure: string,
  rawInput: unknown,
): Promise<boolean> {
  if (procedure !== "communications.send") return false;
  const { conversationId, artifactId } = sendAttachFields(rawInput);
  return artifactAlreadyInThread(conversationId, artifactId);
}

function readApprovalId(rawInput: unknown): string | null {
  if (!rawInput || typeof rawInput !== "object") return null;
  const id = (rawInput as { approvalId?: unknown }).approvalId;
  return typeof id === "string" ? id : null;
}

/**
 * Bind procedure + canonical payload hash, then consume in the same
 * compare-and-set so a concurrent reuse fails (AE4). Restore on handler
 * failure so a failed send does not stay consumed.
 */
export async function assertApprovedAndConsume(
  procedure: string,
  rawInput: unknown,
): Promise<string> {
  const approvalId = readApprovalId(rawInput);
  if (!approvalId) {
    throw new ProcedureError(
      "approval_required",
      `${procedure} needs an approved approvalId — request one via approvals.request`,
    );
  }

  const row = await prisma.approval.findUnique({ where: { id: approvalId } });
  const expectedHash = hashApprovalInput(rawInput);
  if (
    !row ||
    row.procedure !== procedure ||
    row.status !== "approved" ||
    row.payloadHash !== expectedHash
  ) {
    throw new ProcedureError(
      "approval_required",
      `${procedure} is blocked until approval ${approvalId} is approved for this procedure and payload`,
    );
  }

  const consumed = await prisma.approval.updateMany({
    where: { id: approvalId, status: "approved" },
    data: { status: "consumed" },
  });
  if (consumed.count !== 1) {
    throw new ProcedureError(
      "approval_required",
      `Approval ${approvalId} was already used`,
    );
  }
  return approvalId;
}

export async function restoreApproval(approvalId: string): Promise<void> {
  await prisma.approval.updateMany({
    where: { id: approvalId, status: "consumed" },
    data: { status: "approved" },
  });
}

async function persistAudit(entry: {
  name: string;
  ctx: ProcedureContext;
  ok: boolean;
  ms: number;
  error?: string;
  requiresApproval: boolean;
}) {
  console.log(
    `[audit] ${entry.ctx.traceId} ${entry.ctx.actor.kind}:${entry.ctx.actor.id} → ${entry.name} ${entry.ok ? "ok" : "error"} ${entry.ms}ms`,
  );
  const failClosed =
    process.env.NODE_ENV !== "development" && entry.requiresApproval;
  try {
    if (!prisma.profile) {
      if (failClosed) {
        throw new Error("Prisma Profile delegate missing — cannot persist audit");
      }
      return;
    }
    const profile = await prisma.profile.findUnique({
      where: { authSubject: entry.ctx.actor.id },
      select: { id: true },
    });
    await prisma.auditLog.create({
      data: {
        traceId: entry.ctx.traceId,
        actorKind: entry.ctx.actor.kind,
        actorId: entry.ctx.actor.id,
        profileId: profile?.id,
        procedure: entry.name,
        ok: entry.ok,
        durationMs: entry.ms,
        error: entry.error,
      },
    });
  } catch (err) {
    console.error("[audit] persist failed", err);
    if (failClosed) throw err;
  }
}
