import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import type { KnowledgePassage } from "@/lib/procedures/knowledge-search";
import { HUMAN_TEST_TURN } from "@/lib/nico/human-test";
import { nicoSystemPrompt, type NicoChannel } from "@/lib/nico/prompts";

/**
 * The model seam. Everything above this file is model-agnostic.
 *
 * Production: Anthropic via the Vercel AI SDK (`@ai-sdk/anthropic` +
 * `streamText`). ANTHROPIC_API_KEY is enough. Optional AI_GATEWAY_URL
 * overrides the provider base URL so the same key can route through
 * Cloudflare AI Gateway.
 *
 * Dev / failure: grounded retrieval (`devAnswer`), never an empty bubble.
 */

export type ComposeContext = {
  /** Set when Nico just queued a workbook so the reply can point at it. */
  artifactNote?: string;
  /** Set when Nico checked the live world (weather, markets, headlines, parlor horoscope). */
  worldNote?: string;
  /** Durable notes from earlier conversations. A new window does not erase them. */
  memoryNote?: string;
  /** Registration + intake + how to address this person. */
  whoNote?: string;
  givenName?: string | null;
  /** First-name permission has not been asked yet this relationship. */
  askGivenName?: boolean;
  /**
   * Caller's routing signal: true only for a turn with no knowledge passages,
   * no artifact note, and no model/variable action. Absent means the strong
   * model, so an analytical answer is never silently downgraded.
   */
  conversational?: boolean;
  /** chat (default) or voice — voice drops markdown so TTS does not read fences. */
  channel?: NicoChannel;
  /** Real model reasoning, not a fake ticker. */
  onThinking?: (snippet: string) => void;
  /** Image/video the server just made. */
  mediaNote?: string;
  /** Named Tamarindo seats when the user asked who someone is. */
  peopleNote?: string;
};

/** A provider that never writes leaves the user staring at an empty bubble. */
const FIRST_TOKEN_TIMEOUT_MS = 6_000;
/** A long analytical answer may legitimately stream for a while. */
const STREAM_TIMEOUT_MS = 90_000;

const STRONG_MODEL = "claude-sonnet-4-5";
const FAST_MODEL = "claude-haiku-4-5";

export async function* composeAnswer(
  message: string,
  passages: KnowledgePassage[],
  context: ComposeContext = {},
): AsyncGenerator<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    yield* devAnswer(message, passages, context);
    return;
  }

  let streamed = false;
  try {
    for await (const token of streamAnthropic(message, passages, context)) {
      streamed = true;
      yield token;
    }
  } catch (err) {
    console.warn("[nico] model stream failed; using grounded retrieval", err);
    // Tokens already on screen cannot be recalled, so restarting with
    // fallback text here would duplicate content mid-sentence.
    if (streamed) return;
    yield* devAnswer(message, passages, context);
    return;
  }
  if (!streamed) {
    console.warn("[nico] model stream sent no tokens; using grounded retrieval");
    yield* devAnswer(message, passages, context);
  }
}

/**
 * Two tiers so chit-chat does not pay for a ten-year cash-flow read. The fast
 * tier is opt-in: an absent signal, or any grounded passage, keeps the strong
 * model. Setting NICO_FAST_MODEL to NICO_MODEL collapses this to one tier.
 */
export function selectModel(
  passages: KnowledgePassage[],
  context: ComposeContext,
): string {
  const fast = context.conversational === true && passages.length === 0;
  return fast
    ? (process.env.NICO_FAST_MODEL ?? FAST_MODEL)
    : (process.env.NICO_MODEL ?? STRONG_MODEL);
}

function budgetMs(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function userContent(
  message: string,
  passages: KnowledgePassage[],
  context: ComposeContext = {},
): string {
  const sources = passages
    .map(
      (p, i) =>
        `[${i + 1}] ${p.title} (${p.path})\n${p.excerpt}`,
    )
    .join("\n\n");
  const artifact = context.artifactNote
    ? `\n\nArtifact just queued:\n${context.artifactNote}\nTell the user it is in the left-rail Artifacts list. Do not invent blank salary or unlabeled fee cells.\n`
    : "";
  const world = context.worldNote
    ? `\n\nWorld check (share this naturally, no thesis dump):\n${context.worldNote}\n`
    : "";
  const memory = context.memoryNote
    ? `\n\n${context.memoryNote}\n`
    : "";
  const who = context.whoNote ? `\n\n${context.whoNote}\n` : "";
  const media = context.mediaNote
    ? `\n\nMedia just made (already on screen — talk about it, do not reprint the fence):\n${context.mediaNote}\n`
    : "";
  const people = context.peopleNote ? `\n\n${context.peopleNote}\n` : "";
  if (!sources) {
    return `You are in conversation. No binder excerpt.${artifact}${world}${memory}${who}${media}${people}\nTalk like Nico the person. Do not apologize for missing the knowledge base unless they asked a Tamarindo fact. If a people note is present, that is a Tamarindo fact — answer it.\n\nUser:\n${message}\n\n${HUMAN_TEST_TURN}`;
  }
  return `Knowledge passages:\n\n${sources}${artifact}${world}${memory}${who}${media}${people}\n\nUser:\n${message}\n\n${HUMAN_TEST_TURN}`;
}

async function* streamAnthropic(
  message: string,
  passages: KnowledgePassage[],
  context: ComposeContext,
): AsyncGenerator<string> {
  // Two budgets, not one. A provider that accepts the socket and then goes
  // quiet has to be dropped in seconds, but an answer that is already
  // streaming has earned a far longer leash.
  const firstTokenMs = budgetMs(
    process.env.NICO_FIRST_TOKEN_TIMEOUT_MS,
    FIRST_TOKEN_TIMEOUT_MS,
  );
  const ceilingMs = budgetMs(
    process.env.NICO_STREAM_TIMEOUT_MS,
    STREAM_TIMEOUT_MS,
  );
  const controller = new AbortController();
  const ceilingTimer = setTimeout(() => controller.abort(), ceilingMs);
  let firstTokenTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(
    () => controller.abort(),
    firstTokenMs,
  );

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(process.env.AI_GATEWAY_URL
      ? { baseURL: process.env.AI_GATEWAY_URL.replace(/\/$/, "") }
      : {}),
  });

  try {
    const modelId = selectModel(passages, context);
    const strong = modelId === (process.env.NICO_MODEL ?? STRONG_MODEL);
    const result = streamText({
      model: anthropic(modelId),
      system: nicoSystemPrompt(context.channel ?? "chat"),
      messages: [
        { role: "user", content: userContent(message, passages, context) },
      ],
      abortSignal: controller.signal,
      maxRetries: 0,
      ...(strong
        ? {
            providerOptions: {
              anthropic: {
                thinking: { type: "enabled", budgetTokens: 2_048 },
              },
            },
          }
        : {}),
    });

    // textStream drops error/abort parts, so a failed provider call would
    // look like an empty success. Read fullStream and surface those.
    for await (const part of result.fullStream) {
      const thinkingText = thinkingDelta(part);
      if (thinkingText) {
        if (firstTokenTimer !== undefined) {
          clearTimeout(firstTokenTimer);
          firstTokenTimer = undefined;
        }
        context.onThinking?.(thinkingText);
        continue;
      }
      if (part.type === "text-delta") {
        if (firstTokenTimer !== undefined) {
          clearTimeout(firstTokenTimer);
          firstTokenTimer = undefined;
        }
        if (part.text) yield part.text;
        continue;
      }
      if (part.type === "error") {
        throw part.error instanceof Error
          ? part.error
          : new Error(String(part.error));
      }
      if (part.type === "abort") {
        throw new Error("Anthropic aborted the stream");
      }
    }
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        firstTokenTimer === undefined
          ? `Anthropic aborted: stream exceeded ${ceilingMs}ms`
          : `Anthropic aborted: no first token within ${firstTokenMs}ms`,
      );
    }
    throw err;
  } finally {
    if (firstTokenTimer !== undefined) clearTimeout(firstTokenTimer);
    clearTimeout(ceilingTimer);
  }
}

function thinkingDelta(part: { type?: string; text?: string }): string | null {
  if (!part.type) return null;
  if (
    part.type === "reasoning-delta" ||
    part.type === "reasoning" ||
    part.type === "thinking-delta"
  ) {
    return part.text?.trim() ? part.text : null;
  }
  return null;
}

async function* devAnswer(
  message: string,
  passages: KnowledgePassage[],
  context: ComposeContext = {},
): AsyncGenerator<string> {
  const parts: string[] = [];

  if (context.artifactNote) {
    parts.push(`${context.artifactNote}\n\n`);
  }
  if (context.worldNote) {
    parts.push(`${context.worldNote}\n\n`);
  }
  if (context.memoryNote) {
    parts.push(`${context.memoryNote}\n\n`);
  }
  if (context.askGivenName && context.givenName) {
    parts.push(
      `Hey ${context.givenName} — I'm Nico. Mind if I keep using your first name, or would you rather I didn't?\n\n`,
    );
  }
  if (passages.length === 0) {
    if (context.askGivenName && context.givenName) {
      parts.push(
        "What's bringing you in today? We can talk like people, or open the Tamarindo binder if that's what you want.",
      );
    } else {
      parts.push(
        "Hey. I'm here. We can talk like people, or I can open the Tamarindo binder if that's what you want. ",
        "What's on your mind?",
      );
    }
  } else {
    parts.push("Here is what the knowledge base says:\n");
    for (const p of passages) {
      parts.push(`\n**${p.title}** — \`${p.path}\`\n`);
      parts.push(`${p.excerpt}\n`);
    }
    parts.push(
      process.env.ANTHROPIC_API_KEY
        ? "\n---\n*Direct retrieval: the model call did not come through, so this is the binder without commentary.*"
        : "\n---\n*Dev mode: this is direct retrieval, not model reasoning. Add ANTHROPIC_API_KEY to get the full consultant.*",
    );
  }

  for (const part of parts) {
    for (let i = 0; i < part.length; i += 24) {
      yield part.slice(i, i + 24);
    }
  }
}
