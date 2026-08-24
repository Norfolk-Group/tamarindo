import { emitInbound } from "@/lib/channels/inbound";
import { verifyMetaSignature, WebhookVerifyError } from "@/lib/channels/verify";
import { jsonErr, jsonOk } from "@/lib/http/api-response";

/** Meta Cloud API verification handshake. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return jsonErr("Invalid Meta verify token", 403, { code: "FORBIDDEN" });
}

export async function POST(request: Request) {
  const raw = await request.text();
  try {
    verifyMetaSignature(
      raw,
      request.headers.get("x-hub-signature-256"),
      process.env.META_APP_SECRET ?? "",
    );
  } catch (err) {
    const message = err instanceof WebhookVerifyError ? err.message : "unverified";
    return jsonErr(message, 401, { code: "UNAUTHORIZED" });
  }

  const text = extractWhatsAppText(raw);
  if (!text) return jsonOk({ ignored: true });
  const result = await emitInbound({
    channel: "whatsapp",
    message: text,
    lastInboundAt: new Date(),
  });
  return jsonOk(result);
}

function extractWhatsAppText(raw: string): string | null {
  try {
    const body = JSON.parse(raw) as {
      entry?: { changes?: { value?: { messages?: { text?: { body?: string } }[] } }[] }[];
    };
    return body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ?? null;
  } catch {
    return null;
  }
}
