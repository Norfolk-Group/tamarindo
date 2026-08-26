import { tool, type ToolSet } from "ai";
import type { Actor, Capability } from "@/lib/contracts/procedure";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

/**
 * Tools on the agent are `capabilities.list` invoked as `kind: "agent"`.
 * There is no second tool list (KTD11).
 */
export async function listAgentTools(
  actor: Actor,
  traceId: string,
): Promise<Capability[]> {
  const toolActor = { ...actor, kind: "agent" as const };
  const result = (await registry.invoke(
    "capabilities.list",
    {},
    { actor: toolActor, traceId },
  )) as { capabilities: Capability[] };
  return result.capabilities;
}

export async function invokeAgentTool(
  name: string,
  input: unknown,
  actor: Actor,
  traceId: string,
): Promise<unknown> {
  return registry.invoke(name, input, {
    actor: { ...actor, kind: "agent" },
    traceId,
  });
}

/** Anthropic tool names allow [a-zA-Z0-9_-]; procedure names use dots. */
export function toolWireName(procedureName: string): string {
  return procedureName.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * The model's tool loop, built from the same capability map (KTD11) and
 * executed through `registry.invoke`, so role checks, humanOnly denial,
 * durable Approval rows, and audit logging all still apply. A ProcedureError
 * comes back as a tool result — not a thrown stream error — so Nico can tell
 * the user what is blocked (e.g. "awaiting approval") instead of dying.
 */
export async function agentToolSet(
  actor: Actor,
  traceId: string,
  options?: { allow?: ReadonlySet<string> },
): Promise<ToolSet> {
  const capabilities = await listAgentTools(actor, traceId);
  const tools: ToolSet = {};
  for (const cap of capabilities) {
    // The model does not need to introspect its own tool list.
    if (cap.name === "capabilities.list") continue;
    if (options?.allow && !options.allow.has(cap.name)) continue;
    const inputSchema = registry.inputSchema(cap.name);
    if (!inputSchema) continue;
    const description = cap.requiresApproval
      ? `${cap.description} Outside-world side effect: blocked until a human approves — pass an approved approvalId, or request one via approvals_request and tell the user you are waiting.`
      : cap.description;
    tools[toolWireName(cap.name)] = tool({
      description,
      inputSchema,
      execute: async (input: unknown) => {
        try {
          return await invokeAgentTool(cap.name, input, actor, traceId);
        } catch (err) {
          if (err instanceof ProcedureError) {
            return { error: err.code, message: err.message };
          }
          return {
            error: "failed",
            message: err instanceof Error ? err.message : "unknown error",
          };
        }
      },
    });
  }
  return tools;
}
