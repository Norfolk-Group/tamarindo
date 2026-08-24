import { prisma } from "@/lib/db";
import {
  fetchSiblingAgent,
  siblingAgentBinding,
  siblingAgentUrl,
} from "@/lib/nico/sibling-fetch";
import { sessionKey } from "@/lib/nico/session-key";

/**
 * After a human `approvals.decide`, resume the waiting Nico DO (KTD12).
 * Does not auto-retry `communications.send`. Prefers NICO_AGENT binding (Q7).
 */
export async function notifyWaitingSession(
  conversationId: string | null | undefined,
  approvalId: string,
): Promise<void> {
  if (!conversationId) return;
  if (!siblingAgentBinding() && !siblingAgentUrl()) {
    console.info("[nico] session notify skipped (sibling Worker not configured)", {
      conversationId,
      approvalId,
    });
    return;
  }
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { profileId: true },
  });
  const key = conversation
    ? sessionKey(conversation.profileId, conversationId)
    : conversationId;
  const secret =
    process.env.NICO_HANDSHAKE_SECRET || process.env.WORKOS_COOKIE_PASSWORD || "";
  const res = await fetchSiblingAgent("/resume", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-nico-resume-secret": secret,
    },
    body: JSON.stringify({
      conversationId,
      approvalId,
      sessionKey: key,
    }),
  });
  if (!res) {
    console.info("[nico] session notify skipped (sibling Worker not configured)", {
      conversationId,
      approvalId,
    });
    return;
  }
  if (!res.ok) {
    console.error("[nico] session notify failed", res.status, conversationId);
  }
}
