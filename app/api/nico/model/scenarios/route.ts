import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  try {
    const data = await registry.invoke("model.listScenarios", {}, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    return invokeErr(err, "Scenario list failed");
  }
}

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return jsonErr("Invalid JSON", 400, { code: "INVALID_JSON" });
  }
  if (!body || typeof body !== "object") {
    return jsonErr("Invalid JSON", 400, { code: "INVALID_JSON" });
  }
  const payload = body as Record<string, unknown>;
  const action = typeof payload.action === "string" ? payload.action : "";

  try {
    if (action === "save") {
      const name = typeof payload.name === "string" ? payload.name.trim() : "";
      if (!name) return jsonErr("Name is required", 400, { code: "VALIDATION" });
      const data = await registry.invoke(
        "model.saveScenario",
        { name },
        { actor, traceId: crypto.randomUUID() },
      );
      return jsonOk(data);
    }
    if (action === "apply") {
      const scenarioId =
        typeof payload.scenarioId === "string" ? payload.scenarioId : "";
      if (!scenarioId) {
        return jsonErr("scenarioId is required", 400, { code: "VALIDATION" });
      }
      const data = await registry.invoke(
        "model.applyScenario",
        { scenarioId },
        { actor, traceId: crypto.randomUUID() },
      );
      return jsonOk(data);
    }
    if (action === "diff") {
      const scenarioA =
        typeof payload.scenarioA === "string" ? payload.scenarioA : "";
      const scenarioB =
        typeof payload.scenarioB === "string" ? payload.scenarioB : "";
      if (!scenarioA || !scenarioB) {
        return jsonErr("scenarioA and scenarioB are required", 400, {
          code: "VALIDATION",
        });
      }
      const data = await registry.invoke(
        "model.diffScenarios",
        { scenarioA, scenarioB },
        { actor, traceId: crypto.randomUUID() },
      );
      return jsonOk(data);
    }
    return jsonErr("Unknown scenario action", 400, { code: "VALIDATION" });
  } catch (err) {
    return invokeErr(err, "Scenario action failed");
  }
}

function invokeErr(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  const status =
    err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
  return jsonErr(message, status, {
    code: status === 403 ? "FORBIDDEN" : "VALIDATION",
  });
}
