import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  try {
    const data = await registry.invoke("artifacts.list", {}, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't load files";
    const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, {
      code: status === 403 ? "FORBIDDEN" : "VALIDATION",
    });
  }
}
