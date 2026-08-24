import { issueHandshake, nicoAgentHost } from "@/lib/nico/attach";
import { sessionKey } from "@/lib/nico/session-key";

/**
 * Open a sibling DO `/turn` stream. The SSE `/api/nico/chat` proxy is gone
 * (KTD1 / KTD6) — turns run on the Durable Object only.
 */
export async function openTurnStream(
  message: string,
  conversationId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ReadableStream<Uint8Array>> {
  const host = nicoAgentHost();
  if (!host) {
    throw new Error("Nico Worker host is not configured");
  }
  const handshake = await issueHandshake(conversationId, fetchImpl);
  if (!handshake) {
    throw new Error("Handshake failed");
  }
  const res = await fetchImpl(`${host}/turn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nico-handshake": handshake.token,
    },
    body: JSON.stringify({
      message,
      conversationId,
      sessionKey: sessionKey(handshake.profileId, conversationId),
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Chat unavailable (${res.status})`);
  }
  return res.body;
}
