import { getSessionActor } from "@/lib/auth";
import { registry } from "@/lib/procedures";
import { jsonErr, jsonOk } from "@/lib/http/api-response";

/** GET /api/nico/conversation?conversationId= — hydrate reload / second tab. */
export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });

  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) {
    return jsonErr("conversationId is required", 400, { code: "VALIDATION" });
  }

  const data = await registry.invoke(
    "conversations.get",
    { conversationId },
    { actor, traceId: crypto.randomUUID() },
  );
  return jsonOk(data);
}
