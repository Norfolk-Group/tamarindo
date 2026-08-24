import type { KnowledgePassage } from "@/lib/procedures/knowledge-search";

/**
 * The model seam. Everything above this file is model-agnostic.
 *
 * Production path (Cloudflare AI Gateway REST API, Aug 2026 docs):
 *   POST https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1/messages
 *   Authorization: Bearer CLOUDFLARE_API_TOKEN
 *   optional header cf-aig-gateway-id
 *
 * BYOK fallback (classic gateway + Anthropic key):
 *   POST {AI_GATEWAY_URL}/v1/messages
 *   x-api-key: ANTHROPIC_API_KEY
 *
 * Dev mode (no keys): grounded retrieval, clearly labeled.
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
};

export async function* composeAnswer(
  message: string,
  passages: KnowledgePassage[],
  context: ComposeContext = {},
): AsyncGenerator<string> {
  if (cloudflareGatewayConfigured()) {
    yield* streamAnthropicViaCloudflare(message, passages, context);
    return;
  }
  if (byokGatewayConfigured()) {
    yield* streamAnthropicViaByok(message, passages, context);
    return;
  }
  yield* devAnswer(message, passages, context);
}

function cloudflareGatewayConfigured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN,
  );
}

function byokGatewayConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_URL && process.env.ANTHROPIC_API_KEY);
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

async function* streamAnthropicViaCloudflare(
  message: string,
  passages: KnowledgePassage[],
  context: ComposeContext,
): AsyncGenerator<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/messages`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
  };
  if (process.env.CF_AIG_GATEWAY_ID) {
    headers["cf-aig-gateway-id"] = process.env.CF_AIG_GATEWAY_ID;
  }
  yield* streamAnthropicSse(url, headers, {
    model: process.env.NICO_MODEL ?? "anthropic/claude-sonnet-4-5",
    max_tokens: 4096,
    stream: true,
    system: NICO_SYSTEM,
    messages: [{ role: "user", content: userContent(message, passages, context) }],
  });
}

async function* streamAnthropicViaByok(
  message: string,
  passages: KnowledgePassage[],
  context: ComposeContext,
): AsyncGenerator<string> {
  const base = process.env.AI_GATEWAY_URL!.replace(/\/$/, "");
  const url = `${base}/v1/messages`;
  yield* streamAnthropicSse(
    url,
    {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    {
      model: process.env.NICO_MODEL ?? "claude-sonnet-4-5",
      max_tokens: 4096,
      stream: true,
      system: NICO_SYSTEM,
      messages: [{ role: "user", content: userContent(message, passages, context) }],
    },
  );
}

async function* streamAnthropicSse(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
): AsyncGenerator<string> {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `AI Gateway ${res.status}: ${detail.slice(0, 280) || res.statusText}`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const token = tokenFromSseFrame(frame);
      if (token) yield token;
    }
  }
}

function tokenFromSseFrame(frame: string): string | null {
  for (const line of frame.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const raw = line.slice(6).trim();
    if (raw === "[DONE]") return null;
    try {
      const json = JSON.parse(raw) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (
        json.type === "content_block_delta" &&
        json.delta?.type === "text_delta" &&
        json.delta.text
      ) {
        return json.delta.text;
      }
    } catch {
      return null;
    }
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
      "\n---\n*Dev mode: this is direct retrieval, not model reasoning. ",
      "Add CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN (or AI_GATEWAY_URL + ANTHROPIC_API_KEY) to get the full consultant.*",
    );
  }

  for (const part of parts) {
    for (let i = 0; i < part.length; i += 24) {
      yield part.slice(i, i + 24);
      await new Promise((r) => setTimeout(r, 12));
    }
  }
}
