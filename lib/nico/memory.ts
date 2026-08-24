import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/db";

export const LEARNED_SOURCE = "memory/learned";

export type LearnedKind = "fact" | "preference" | "correction";

export type LearnedNote = {
  kind: LearnedKind;
  text: string;
};

export type LearnTurnInput = {
  userMessage: string;
  reply: string;
  profileId: string;
  conversationId: string;
};

const RECALL_LIMIT = 24;
const MIN_NOTE_CHARS = 12;

/**
 * Standing notes survive a new chat window. This is not the transcript —
 * only things Nico should still know tomorrow.
 */
export function heuristicExtract(userMessage: string): LearnedNote[] {
  const text = userMessage.trim();
  if (text.length < MIN_NOTE_CHARS) return [];

  const notes: LearnedNote[] = [];
  const remember = text.match(
    /(?:remember(?: that)?|don't forget(?: that)?|do not forget(?: that)?)\s+(.+)/i,
  );
  if (remember?.[1]) {
    notes.push({ kind: "fact", text: cleanNote(remember[1]) });
  }
  const fromNow = text.match(
    /(?:from now on|going forward|always)\s+(.+)/i,
  );
  if (fromNow?.[1]) {
    notes.push({ kind: "preference", text: cleanNote(fromNow[1]) });
  }
  const correction = text.match(
    /(?:that(?:'s| is) wrong|no[,.] that's|actually(?:[,.]| it(?:'s| is)))[,.]?\s+(.+)/i,
  );
  if (correction?.[1]) {
    notes.push({ kind: "correction", text: cleanNote(correction[1]) });
  }
  const name = text.match(
    /(?:my name is|i(?:'m| am)|call me)\s+([A-ZÁÉÍÓÚÑ][\p{L}'-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'-]+)?)/iu,
  );
  if (name?.[1] && !/^(here|ready|back|good|fine)\b/i.test(name[1])) {
    notes.push({ kind: "fact", text: `The person in this room is ${name[1]}.` });
  }
  return uniqueNotes(notes);
}

export async function extractDurableNotes(
  userMessage: string,
  reply: string,
): Promise<LearnedNote[]> {
  const notes = heuristicExtract(userMessage);
  if (!process.env.ANTHROPIC_API_KEY) return notes;
  if (userMessage.trim().length < 24 && notes.length === 0) return notes;

  try {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const result = await generateText({
      model: anthropic("claude-haiku-4-5"),
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(8_000),
      system:
        "Extract only durable notes Nico must still know in a later conversation. Skip greetings, weather, one-off questions, and anything already in a published thesis. Return JSON only: an array of {\"kind\":\"fact\"|\"preference\"|\"correction\",\"text\":\"...\"}. Empty array if nothing durable.",
      prompt: `User:\n${userMessage.slice(0, 2_000)}\n\nNico:\n${reply.slice(0, 2_000)}`,
    });
    notes.push(...parseExtractedJson(result.text));
  } catch (err) {
    console.warn("[nico] memory extract skipped", err);
  }
  return uniqueNotes(notes);
}

export async function saveLearned(
  notes: LearnedNote[],
  meta: { profileId: string; conversationId: string },
): Promise<number> {
  if (notes.length === 0) return 0;
  const existing = await prisma.memoryChunk.findMany({
    where: { sourcePath: LEARNED_SOURCE },
    select: { content: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  const seen = new Set(existing.map((row) => normalize(row.content)));
  let saved = 0;
  for (const note of notes) {
    const text = cleanNote(note.text);
    if (text.length < MIN_NOTE_CHARS || seen.has(normalize(text))) continue;
    seen.add(normalize(text));
    await prisma.memoryChunk.create({
      data: {
        sourcePath: LEARNED_SOURCE,
        title: titleFor(note),
        content: text,
        metadata: {
          kind: note.kind,
          profileId: meta.profileId,
          conversationId: meta.conversationId,
        },
      },
    });
    if (note.kind === "correction") {
      await prisma.correction.create({
        data: {
          profileId: meta.profileId,
          original: "prior understanding",
          corrected: text,
          context: meta.conversationId,
        },
      });
    }
    saved += 1;
  }
  return saved;
}

export async function recallLearned(query: string): Promise<string> {
  const rows = await prisma.memoryChunk.findMany({
    where: { sourcePath: LEARNED_SOURCE },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: { title: true, content: true, metadata: true, createdAt: true },
  });
  if (rows.length === 0) return "";

  const terms = tokenize(query);
  const scored = rows.map((row, index) => {
    const hay = `${row.title} ${row.content}`.toLowerCase();
    const hits = terms.filter((term) => hay.includes(term)).length;
    // Recency keeps Nico oriented even when the new window has no keywords.
    const recency = Math.max(0, 8 - index);
    return { row, score: hits * 4 + recency };
  });
  scored.sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, RECALL_LIMIT);
  if (picked.length === 0) return "";

  const lines = picked.map(({ row }) => {
    const kind = kindFrom(row.metadata);
    return `- [${kind}] ${row.content}`;
  });
  return [
    "Already known from earlier conversations (a new chat window does not erase these):",
    ...lines,
  ].join("\n");
}

export async function learnFromTurn(input: LearnTurnInput): Promise<void> {
  const notes = await extractDurableNotes(input.userMessage, input.reply);
  await saveLearned(notes, {
    profileId: input.profileId,
    conversationId: input.conversationId,
  });
}

function parseExtractedJson(raw: string): LearnedNote[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    const notes: LearnedNote[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as { kind?: unknown; text?: unknown };
      if (
        (row.kind === "fact" ||
          row.kind === "preference" ||
          row.kind === "correction") &&
        typeof row.text === "string"
      ) {
        notes.push({ kind: row.kind, text: cleanNote(row.text) });
      }
    }
    return notes;
  } catch {
    return [];
  }
}

function uniqueNotes(notes: LearnedNote[]): LearnedNote[] {
  const seen = new Set<string>();
  const out: LearnedNote[] = [];
  for (const note of notes) {
    const text = cleanNote(note.text);
    const key = `${note.kind}:${normalize(text)}`;
    if (text.length < MIN_NOTE_CHARS || seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: note.kind, text });
  }
  return out;
}

function cleanNote(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[.?!]+$/, "").trim();
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9áéíóúñü\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((term) => term.length > 2);
}

function titleFor(note: LearnedNote): string {
  const head = note.text.slice(0, 72);
  return `${note.kind}: ${head}`;
}

function kindFrom(metadata: unknown): LearnedKind {
  if (metadata && typeof metadata === "object" && "kind" in metadata) {
    const kind = (metadata as { kind?: unknown }).kind;
    if (kind === "fact" || kind === "preference" || kind === "correction") {
      return kind;
    }
  }
  return "fact";
}
