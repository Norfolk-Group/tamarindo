import { NICO_AI_DISCLOSURE, whatsappWindowOpen } from "@/lib/channels/window";
import { actorFromChannel } from "@/lib/channels/actor";
import { fetchSiblingAgent } from "@/lib/nico/sibling-fetch";
import { signHandshake } from "@/lib/nico/handshake";
import { sessionKey } from "@/lib/nico/session-key";
import { profileIdFor } from "@/lib/procedures/profile";

export type InboundResult =
  | { kind: "emitted"; conversationId: string }
  | { kind: "template"; disclosure: string }
  | { kind: "unavailable"; reason: string };

/**
 * Channel inbound. Does not import runTurn / composeAnswer (U9).
 * In-window free-form is a DO emit, not `communications.send` (KTD8).
 */
export async function emitInbound(input: {
  channel: "whatsapp" | "sms" | "email" | "meeting";
  message: string;
  email?: string;
  phone?: string;
  lastInboundAt?: Date;
}): Promise<InboundResult> {
  if (
    input.channel === "whatsapp" &&
    input.lastInboundAt &&
    !whatsappWindowOpen(input.lastInboundAt)
  ) {
    return { kind: "template", disclosure: NICO_AI_DISCLOSURE };
  }

  const actor = await actorFromChannel({
    email: input.email,
    phone: input.phone,
  });
  const conversationId = `channel:${input.channel}:${actor.id}`;
  const profileId =
    actor.id === "guest:unmapped" ? "guest" : await profileIdFor(actor.id);
  const token = await signHandshake({
    authSubject: actor.id,
    profileId,
    conversationId,
  });

  const res = await fetchSiblingAgent("/turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nico-handshake": token,
    },
    body: JSON.stringify({
      message: `${NICO_AI_DISCLOSURE}\n\n${input.message}`,
      conversationId,
      sessionKey: sessionKey(profileId, conversationId),
    }),
  });
  if (!res) {
    return { kind: "unavailable", reason: "Nico sibling Worker is not configured" };
  }
  if (!res.ok) {
    return { kind: "unavailable", reason: `DO turn failed (${res.status})` };
  }
  return { kind: "emitted", conversationId };
}
