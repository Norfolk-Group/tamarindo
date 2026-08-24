import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

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
    const data = await registry.invoke("profile.update", body, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    return invokeErr(err, "Profile update failed");
  }
}

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return jsonErr("Invalid JSON", 400, { code: "INVALID_JSON" });
  }
  const action =
    body && typeof body === "object" && "action" in body
      ? (body as { action?: string }).action
      : "confirmBio";
  if (action !== "confirmBio") {
    return jsonErr("Unknown profile action", 400, { code: "VALIDATION" });
  }
  try {
    const data = await registry.invoke("profile.confirmBio", {}, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    return invokeErr(err, "Bio confirm failed");
  }
}

function invokeErr(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
  return jsonErr(message, status, { code: status === 403 ? "FORBIDDEN" : "VALIDATION" });
}
