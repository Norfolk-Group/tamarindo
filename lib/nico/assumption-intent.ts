const SHOW_RE = /\b(show|list|what are|open)\b/i;
const NOUN_RE = /\b(assumptions?|inputs?|blue variables?)\b/i;

export function isAssumptionsAsk(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return SHOW_RE.test(text) && NOUN_RE.test(text);
}
