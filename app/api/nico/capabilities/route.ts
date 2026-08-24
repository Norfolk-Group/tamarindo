import { getSessionActor } from "@/lib/auth";
import { registry } from "@/lib/procedures";
import { jsonErr, jsonOk } from "@/lib/http/api-response";

/** GET /api/nico/capabilities — the capability map for the caller's role. */
export async function GET() {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });

  const capabilities = await registry.invoke(
    "capabilities.list",
    {},
    { actor, traceId: crypto.randomUUID() },
  );
  return jsonOk(capabilities);
}
