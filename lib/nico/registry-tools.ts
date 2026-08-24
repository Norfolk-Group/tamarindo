import type { Actor, Capability } from "@/lib/contracts/procedure";
import { registry } from "@/lib/procedures";

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
