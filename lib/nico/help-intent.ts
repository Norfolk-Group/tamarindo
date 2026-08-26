import { parseBusinessExplainAsk } from "@/lib/nico/business-intent";
import { parseUnitCalcAsk } from "@/lib/nico/unit-intent";
import {
  HELP_TOPICS,
  scoreHelpTopic,
  searchHelp,
  type HelpTopic,
} from "@/lib/nico/help-catalog";

export type HelpAsk =
  | { kind: "list"; query?: string }
  | { kind: "get"; id: string };

const LIST_RE =
  /\b(how does (this|the) (app|screen|menu) work|what can i do here|show (me )?(the )?help|open help|c[oó]mo funciona (esta|la) (app|pantalla|aplicaci[oó]n|men[uú])|abre (la )?ayuda)\b/i;

const HOW_RE = /\b(how do i|how to|where (do i|can i)|what does|what is|what's|whats|explain|c[oó]mo (hago|abro)|d[oó]nde (est[aá]|queda))\b/i;

const HELP_ME_TASK_RE =
  /\bhelp me\b(?!\s+(understand|use|find|navigate|with (the )?(app|screen|menu|help)))/i;

export function parseHelpAsk(message: string): HelpAsk | null {
  const text = message.trim();
  if (!text) return null;
  if (HELP_ME_TASK_RE.test(text)) return null;
  if (parseBusinessExplainAsk(text)) return null;
  if (parseUnitCalcAsk(text)) return null;

  if (/^(help|ayuda|\?|how does this (app|work))\b/i.test(text) && text.length < 40) {
    return { kind: "list" };
  }

  if (LIST_RE.test(text) && !/\b(icp[-\s]?\d|auto[-\s]?\d|air(?:craft)?[-\s]?\d)\b/i.test(text)) {
    const query = text.replace(LIST_RE, "").trim();
    return query ? { kind: "list", query } : { kind: "list" };
  }

  if (!HOW_RE.test(text) && !/\bhelp\b/i.test(text)) return null;

  const hits = searchHelp(text);
  const exact = HELP_TOPICS.find((row) =>
    text.toLowerCase().includes(row.title.toLowerCase()),
  );
  const ranked = [...hits].sort(
    (a, b) => scoreHelpTopic(b, text) - scoreHelpTopic(a, text),
  );
  const best = ranked[0];
  const next = ranked[1];
  const clearBest =
    best &&
    scoreHelpTopic(best, text) >= 3 &&
    (!next || scoreHelpTopic(best, text) > scoreHelpTopic(next, text));
  const topic: HelpTopic | undefined =
    exact ?? (hits.length === 1 ? hits[0] : clearBest ? best : undefined);
  if (topic && (HOW_RE.test(text) || /\bhelp\b/i.test(text))) {
    return { kind: "get", id: topic.id };
  }
  if (hits.length > 1 && (HOW_RE.test(text) || /\bhelp\b/i.test(text))) {
    return { kind: "list", query: text };
  }
  return null;
}

export function isHelpRequest(message: string): boolean {
  return parseHelpAsk(message) !== null;
}

export function formatHelpTopic(topic: Pick<HelpTopic, "title" | "body">): string {
  return `${topic.title}. ${topic.body}`;
}

export function formatHelpList(topics: Array<Pick<HelpTopic, "title" | "tip">>): string {
  const lines = topics
    .slice(0, 8)
    .map((row) => `${row.title}: ${row.tip}`)
    .join(" ");
  return `Help is the same catalog as the (i) buttons. ${lines} Open Help in the sidebar for the rest.`;
}
