/**
 * useAgentChat sometimes appends an empty assistant stub after the user
 * turn. Read the last user message with text, not messages.at(-1).
 */
export function lastUserText(messages: unknown): string {
  const list = Array.isArray(messages)
    ? messages
    : messages == null
      ? []
      : [messages];
  for (let i = list.length - 1; i >= 0; i--) {
    const text = textFrom(list[i], "user");
    if (text.trim()) return text;
  }
  return "";
}

function textFrom(message: unknown, role: "user"): string {
  if (!message || typeof message !== "object") return "";
  const row = message as { role?: string; content?: unknown; parts?: unknown };
  if (row.role && row.role !== role) return "";
  if (typeof row.content === "string") return row.content;
  if (Array.isArray(row.content)) {
    return row.content.map(partText).join("");
  }
  if (!Array.isArray(row.parts)) return "";
  return row.parts.map(partText).join("");
}

function partText(part: unknown): string {
  if (typeof part === "string") return part;
  if (!part || typeof part !== "object") return "";
  const row = part as { text?: unknown; content?: unknown };
  if (typeof row.text === "string") return row.text;
  if (typeof row.content === "string") return row.content;
  return "";
}
