import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  try {
    const data = await registry.invoke("nda.prepare", {}, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "NDA prepare failed";
    const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, { code: status === 403 ? "FORBIDDEN" : "VALIDATION" });
  }
}

export async function POST(req: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonErr("Invalid JSON", 400, { code: "INVALID_JSON" });
  }
  try {
    const data = await registry.invoke("nda.sign", body, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "NDA sign failed";
    const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, { code: status === 403 ? "FORBIDDEN" : "VALIDATION" });
  }
}
