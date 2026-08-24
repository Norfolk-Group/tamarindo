import { z } from "zod";
import { getSessionActor } from "@/lib/auth";
import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { signHandshake } from "@/lib/nico/handshake";
import { profileIdFor } from "@/lib/procedures/profile";

const BodySchema = z.object({
  conversationId: z.string().min(1),
});

/**
 * Issues a short-lived DO attach assertion for the signed-in session.
 * Cookie-gated by middleware. The sibling Worker verifies the token (KTD10).
 */
export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonErr("Invalid JSON", 400, { code: "INVALID_JSON" });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonErr("conversationId is required", 400, { code: "VALIDATION" });
  }

  try {
    const profileId = await profileIdFor(actor.id);
    const token = await signHandshake({
      authSubject: actor.id,
      profileId,
      conversationId: parsed.data.conversationId,
    });
    return jsonOk({
      token,
      profileId,
      conversationId: parsed.data.conversationId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handshake failed";
    return jsonErr(message, 503, { code: "HANDSHAKE_UNAVAILABLE" });
  }
}
