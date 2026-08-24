import { emitInbound } from "@/lib/channels/inbound";
import { verifyRecallSecret, WebhookVerifyError } from "@/lib/channels/verify";
import { jsonErr, jsonOk } from "@/lib/http/api-response";

export async function POST(request: Request) {
  const raw = await request.text();
  try {
    verifyRecallSecret(
      request.headers.get("x-recall-secret") ??
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
        null,
      process.env.RECALL_WEBHOOK_SECRET ?? "",
      request.headers.get("x-recall-timestamp"),
    );
  } catch (err) {
    const message = err instanceof WebhookVerifyError ? err.message : "unverified";
    return jsonErr(message, 401, { code: "UNAUTHORIZED" });
  }

  const text = extractTranscript(raw);
  if (!text) return jsonOk({ ignored: true });
  const result = await emitInbound({
    channel: "meeting",
    message: text,
    lastInboundAt: new Date(),
  });
  return jsonOk(result);
}

function extractTranscript(raw: string): string | null {
  try {
    const body = JSON.parse(raw) as {
      data?: { transcript?: { text?: string }; text?: string };
      text?: string;
    };
    return body.data?.transcript?.text ?? body.data?.text ?? body.text ?? null;
  } catch {
    return null;
  }
}
