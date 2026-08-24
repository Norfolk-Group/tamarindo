/**
 * Provider handoff for communications.send. HTTP only — no SDKs.
 * Missing keys skip that channel and invent nothing.
 */

export type OutboundChannel = "email" | "whatsapp" | "sms" | "call";

export type OutboundInput = {
  channel: OutboundChannel;
  to: string;
  subject?: string;
  body: string;
};

export type OutboundResult = "sent" | "skipped";

export async function deliverOutbound(
  input: OutboundInput,
  fetchImpl: typeof fetch = fetch,
): Promise<OutboundResult> {
  if (input.channel === "email") return deliverResend(input, fetchImpl);
  if (input.channel === "call") return deliverTwilioCall(input, fetchImpl);
  if (input.channel === "whatsapp") {
    const viaTwilio = await deliverTwilioMessage(input, "whatsapp", fetchImpl);
    if (viaTwilio !== "skipped") return viaTwilio;
    return deliverMetaWhatsApp(input, fetchImpl);
  }
  return deliverTwilioMessage(input, "sms", fetchImpl);
}

export function asTwilioAddress(value: string, channel: "whatsapp" | "sms"): string {
  const trimmed = value.trim();
  if (channel === "sms") return trimmed.replace(/^whatsapp:/, "");
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  return `whatsapp:${trimmed.startsWith("+") ? trimmed : `+${trimmed}`}`;
}

async function deliverResend(
  input: OutboundInput,
  fetchImpl: typeof fetch,
): Promise<OutboundResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) return "skipped";
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject?.trim() || "Nico",
      text: input.body,
    }),
  });
  if (!res.ok) {
    throw new Error(`resend_failed ${res.status}`);
  }
  return "sent";
}

async function deliverMetaWhatsApp(
  input: OutboundInput,
  fetchImpl: typeof fetch,
): Promise<OutboundResult> {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const phoneId = process.env.META_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return "skipped";
  const res = await fetchImpl(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/^\+/, ""),
        type: "text",
        text: { body: input.body },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`meta_whatsapp_failed ${res.status}`);
  }
  return "sent";
}

function twilioFrom(channel: "whatsapp" | "sms"): string | undefined {
  if (channel === "whatsapp") {
    return (
      process.env.TWILIO_WHATSAPP_FROM?.trim() ||
      (process.env.TWILIO_FROM?.trim().startsWith("whatsapp:")
        ? process.env.TWILIO_FROM.trim()
        : undefined)
    );
  }
  const from = process.env.TWILIO_FROM?.trim();
  if (!from || from.startsWith("whatsapp:")) return undefined;
  return from;
}

async function deliverTwilioMessage(
  input: OutboundInput,
  channel: "whatsapp" | "sms",
  fetchImpl: typeof fetch,
): Promise<OutboundResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = twilioFrom(channel);
  if (!sid || !token || !from) return "skipped";
  const body = new URLSearchParams({
    To: asTwilioAddress(input.to, channel),
    From: asTwilioAddress(from, channel),
    Body: input.body,
  });
  const res = await fetchImpl(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  if (!res.ok) {
    throw new Error(`twilio_${channel}_failed ${res.status}`);
  }
  return "sent";
}

function escapeTwiml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function deliverTwilioCall(
  input: OutboundInput,
  fetchImpl: typeof fetch,
): Promise<OutboundResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = twilioFrom("sms");
  if (!sid || !token || !from) return "skipped";
  const twiml = `<Response><Say>${escapeTwiml(input.body)}</Say></Response>`;
  const body = new URLSearchParams({
    To: asTwilioAddress(input.to, "sms"),
    From: from,
    Twiml: twiml,
  });
  const res = await fetchImpl(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  if (!res.ok) {
    throw new Error(`twilio_call_failed ${res.status}`);
  }
  return "sent";
}
