import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  try {
    const data = await registry.invoke("model.get", {}, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    return invokeErr(err, "Model load failed");
  }
}

export async function PATCH(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonErr("Invalid JSON", 400, { code: "INVALID_JSON" });
  }
  try {
    const data = await registry.invoke("model.setVariables", body, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    return invokeErr(err, "Model update failed");
  }
}

function invokeErr(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
  return jsonErr(message, status, {
    code: status === 403 ? "FORBIDDEN" : "VALIDATION",
  });
}
