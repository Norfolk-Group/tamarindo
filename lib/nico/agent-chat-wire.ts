/** Parse `cf_agent_use_chat_response` frames from the Agents chat wire. */

export function chunksFromAgentWire(rawMessages: string[]): Record<string, unknown>[] {
  const chunks: Record<string, unknown>[] = [];
  for (const raw of rawMessages) {
    let parsed: { type?: string; body?: unknown };
    try {
      parsed = JSON.parse(raw) as { type?: string; body?: unknown };
    } catch {
      continue;
    }
    if (parsed.type !== "cf_agent_use_chat_response") continue;
    let body = parsed.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body) as unknown;
      } catch {
        continue;
      }
    }
    if (body && typeof body === "object") chunks.push(body as Record<string, unknown>);
  }
  return chunks;
}

export function tokenEventsFromAgentWire(
  rawMessages: string[],
): { type: "token"; text: string }[] {
  return chunksFromAgentWire(rawMessages)
    .filter(
      (chunk) => chunk.type === "text-delta" && typeof chunk.delta === "string",
    )
    .map((chunk) => ({ type: "token" as const, text: String(chunk.delta) }));
}
