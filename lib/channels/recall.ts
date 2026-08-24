/**
 * Recall.ai bot start. HTTP only — no SDK.
 * Missing key skips and invents nothing.
 */

import { NICO_AI_DISCLOSURE } from "@/lib/channels/window";

export type RecallStartResult = "started" | "skipped";

export async function startRecallBot(
  meetingUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RecallStartResult> {
  const apiKey = process.env.RECALL_API_KEY?.trim();
  if (!apiKey) return "skipped";
  const region = process.env.RECALL_REGION?.trim() || "us-west-2";
  const res = await fetchImpl(`https://${region}.recall.ai/api/v1/bot/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: "Nico",
      chat: {
        on_bot_join: {
          send_to: "everyone",
          message: NICO_AI_DISCLOSURE,
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`recall_bot_failed ${res.status}`);
  }
  return "started";
}
