import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

/** One artifact with status + signed download URL. Owner/NDA via artifacts.get. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  const { id } = await params;
  try {
    const data = await registry.invoke("artifacts.get", { id }, {
      actor,
      traceId: crypto.randomUUID(),
    });
    return jsonOk(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't load file";
    if (message === "Artifact not found") {
      return jsonErr(message, 404, { code: "NOT_FOUND" });
    }
    const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, {
      code: status === 403 ? "FORBIDDEN" : "VALIDATION",
    });
  }
}
