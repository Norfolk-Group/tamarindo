import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) return jsonErr("Missing cell key", 400, { code: "VALIDATION" });
  const scenarioId = url.searchParams.get("scenarioId") ?? undefined;
  const depthRaw = url.searchParams.get("depth");
  const depth = depthRaw ? Number(depthRaw) : undefined;
  try {
    const data = await registry.invoke(
      "model.explain",
      { key, scenarioId, depth },
      { actor, traceId: crypto.randomUUID() },
    );
    return jsonOk(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Explain failed";
    const status =
      err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, {
      code: status === 403 ? "FORBIDDEN" : "VALIDATION",
    });
  }
}
