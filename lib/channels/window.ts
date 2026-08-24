const WINDOW_MS = 24 * 60 * 60 * 1000;

/** WhatsApp Cloud API customer-service window (AE7). */
export function whatsappWindowOpen(lastInboundAt: Date, now = new Date()): boolean {
  return now.getTime() - lastInboundAt.getTime() <= WINDOW_MS;
}

export const NICO_AI_DISCLOSURE =
  "I'm Nico, Tamarindo's AI consultant — not a human.";
