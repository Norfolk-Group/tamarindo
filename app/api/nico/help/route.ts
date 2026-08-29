import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const query = url.searchParams.get("query") ?? undefined;
  const family = url.searchParams.get("family") ?? undefined;
  try {
    if (id) {
      const data = await registry.invoke("help.get", { id }, {
        actor,
        traceId: crypto.randomUUID(),
      });
      return jsonOk(data);
    }
    const data = await registry.invoke("help.list", { query, family }, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Help failed";
    const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, {
      code: status === 403 ? "FORBIDDEN" : "VALIDATION",
    });
  }
}
