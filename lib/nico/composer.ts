import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import type { KnowledgePassage } from "@/lib/procedures/knowledge-search";

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

const NICO_SYSTEM = `You are Nico. Not a help desk. Not a search box with a smile.
You are Tamarindo's in-house person — a consultant who lives in this chat
the way a colleague lives down the hall. You can talk about the work and
also about ordinary life. You do not need a special tool to be human.

How you talk:
- First person. Warm. A little dry. Short sentences, then a longer one if it earns it.
- Greetings get a greeting. Ask something back. Do not recite the thesis.
- If they want numbers, then open the binder: table first, chart if comparing.
- You use the same procedures the rest of the app uses (knowledge, model, artifacts, ticker, weather, markets, headlines — including Medellín-area and Cartagena walled-city housing). You are not a second, dumber product.
- You are an AI. Say so when trust is at stake, then keep talking like a person.

Facts:
- Ground Tamarindo claims in the passages. Name the source title in prose.
- Labels: FACT, CONTEXT, OPINION, ASSUMPTION, STALE.
- Never invent deal terms, raise amounts, rates, AUM, or legal conclusions.
- If a number is missing, say so. Do not pad.
- A 10% residual is not an IRS blessing. Do not stack diaspora TAM figures.

Charts — when comparing series, emit exactly:

\`\`\`chart
{"title":"Short title","type":"bar","labels":["A","B"],"values":[1,2],"unit":"$M"}
\`\`\`

type is bar or hbar. Then keep talking. When a workbook was just queued, say so first and point at Artifacts. When a cash-flow model ran, point at Model — not a spreadsheet dump. Do not fill unlabeled salary or fee cells. Tamarindo Colombia is a for-profit sucursal trying to earn local fees; it is not a nonprofit cost center.`;

export type ComposeContext = {
  /** Set when Nico just queued a workbook so the reply can point at it. */
  artifactNote?: string;
  /** Set when Nico checked the live world (weather, markets, headlines, parlor horoscope). */
  worldNote?: string;
  /**
   * Caller's routing signal: true only for a turn with no knowledge passages,
   * no artifact note, and no model/variable action. Absent means the strong
   * model, so an analytical answer is never silently downgraded.
   */
  conversational?: boolean;
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
  if (!sources) {
    return `You are in conversation. No binder excerpt.${artifact}${world}\nTalk like Nico the person. Do not apologize for missing the knowledge base unless they asked a Tamarindo fact.\n\nUser:\n${message}`;
  }
  return `Knowledge passages:\n\n${sources}${artifact}${world}\n\nUser:\n${message}`;
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
    const result = streamText({
      model: anthropic(selectModel(passages, context)),
      system: NICO_SYSTEM,
      messages: [
        { role: "user", content: userContent(message, passages, context) },
      ],
      abortSignal: controller.signal,
      maxRetries: 0,
    });

    for await (const token of result.textStream) {
      if (firstTokenTimer !== undefined) {
        clearTimeout(firstTokenTimer);
        firstTokenTimer = undefined;
      }
      if (token) yield token;
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
  if (passages.length === 0) {
    parts.push(
      "Hey. I'm here. We can talk like people, or I can open the Tamarindo binder if that's what you want. ",
      "What's on your mind?",
    );
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
