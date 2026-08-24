import { emitInbound } from "@/lib/channels/inbound";
import { verifyTwilioSignature, WebhookVerifyError } from "@/lib/channels/verify";
import { jsonErr, jsonOk } from "@/lib/http/api-response";

export async function POST(request: Request) {
  const raw = await request.text();
  const params = Object.fromEntries(new URLSearchParams(raw));
  try {
    verifyTwilioSignature(
      request.url,
      params,
      request.headers.get("x-twilio-signature"),
      process.env.TWILIO_AUTH_TOKEN ?? "",
    );
  } catch (err) {
    const message = err instanceof WebhookVerifyError ? err.message : "unverified";
    return jsonErr(message, 401, { code: "UNAUTHORIZED" });
  }

  const from = params.From ?? "";
  const channel = from.startsWith("whatsapp:") ? "whatsapp" : "sms";
  const result = await emitInbound({
    channel,
    message: params.Body ?? "",
    phone: from.replace(/^whatsapp:/, ""),
    lastInboundAt: new Date(),
  });
  return jsonOk(result);
}
