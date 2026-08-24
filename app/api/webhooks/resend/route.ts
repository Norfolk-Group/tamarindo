import { emitInbound } from "@/lib/channels/inbound";
import { verifySvixSignature, WebhookVerifyError } from "@/lib/channels/verify";
import { jsonErr, jsonOk } from "@/lib/http/api-response";

export async function POST(request: Request) {
  const raw = await request.text();
  try {
    verifySvixSignature(
      raw,
      request.headers.get("svix-id") ?? request.headers.get("webhook-id"),
      request.headers.get("svix-timestamp") ??
        request.headers.get("webhook-timestamp"),
      request.headers.get("svix-signature") ??
        request.headers.get("webhook-signature"),
      process.env.RESEND_WEBHOOK_SECRET ?? "",
    );
  } catch (err) {
    const message = err instanceof WebhookVerifyError ? err.message : "unverified";
    return jsonErr(message, 401, { code: "UNAUTHORIZED" });
  }

  const parsed = parseInboundEmail(raw);
  if (!parsed) return jsonOk({ ignored: true });
  const result = await emitInbound({
    channel: "email",
    message: parsed.text,
    email: parsed.from,
    lastInboundAt: new Date(),
  });
  return jsonOk(result);
}

function parseInboundEmail(raw: string): { from?: string; text: string } | null {
  try {
    const body = JSON.parse(raw) as {
      type?: string;
      data?: { from?: string; text?: string; subject?: string };
    };
    const text = body.data?.text ?? body.data?.subject;
    if (!text) return null;
    return { from: body.data?.from, text };
  } catch {
    return null;
  }
}
