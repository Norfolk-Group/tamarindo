import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const streamText = vi.hoisted(() => vi.fn());
const createAnthropic = vi.hoisted(() =>
  vi.fn(() => (id: string) => ({ id })),
);

vi.mock("ai", () => ({ streamText }));
vi.mock("@ai-sdk/anthropic", () => ({ createAnthropic }));

import { composeAnswer, selectModel } from "@/lib/nico/composer";

const passage = {
  title: "Rate Benchmarks",
  path: "knowledge/thesis/12-rate-benchmarks.md",
  excerpt: "Effective client rate is 11.84%.",
  score: 1,
};

async function collect(
  gen: AsyncGenerator<string>,
): Promise<string> {
  let out = "";
  for await (const chunk of gen) out += chunk;
  return out;
}

async function* tokens(...parts: string[]) {
  for (const part of parts) yield part;
}

describe("composeAnswer", () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.AI_GATEWAY_URL;
    delete process.env.NICO_MODEL;
    delete process.env.NICO_FAST_MODEL;
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it("falls back to grounded retrieval when the key is missing", async function () {
    const text = await collect(composeAnswer("hey", []));
    expect(text).toContain("I'm here");
    expect(streamText).not.toHaveBeenCalled();
  });

  it("falls back when the provider errors before the first token", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      textStream: (async function* () {
        throw new Error("401 unauthorized");
      })(),
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const text = await collect(composeAnswer("what is an ICP?", [passage]));
    expect(text).toContain("Rate Benchmarks");
    expect(text).toContain("binder without commentary");
    expect(text).not.toMatch(/401/);
    warn.mockRestore();
  });

  it("does not restart with fallback after a partial stream", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      textStream: (async function* () {
        yield "Hello from ";
        throw new Error("socket dropped");
      })(),
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const text = await collect(composeAnswer("hey", []));
    expect(text).toBe("Hello from ");
    expect(text).not.toContain("I'm here");
    warn.mockRestore();
  });

  it("streams model tokens when the key is set", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({ textStream: tokens("Hey.", " What's up?") });
    const text = await collect(composeAnswer("hey", [], { conversational: true }));
    expect(text).toBe("Hey. What's up?");
    expect(streamText).toHaveBeenCalledOnce();
    const call = streamText.mock.calls[0][0] as { model: { id: string } };
    expect(call.model.id).toBe("claude-haiku-4-5");
  });
});

describe("selectModel", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("uses the strong model unless the caller marks the turn conversational", () => {
    expect(selectModel([], {})).toBe("claude-sonnet-4-5");
    expect(selectModel([passage], { conversational: true })).toBe(
      "claude-sonnet-4-5",
    );
    expect(selectModel([], { conversational: true })).toBe("claude-haiku-4-5");
  });

  it("honors env overrides so the two tiers can collapse", () => {
    process.env.NICO_MODEL = "claude-sonnet-4-5";
    process.env.NICO_FAST_MODEL = "claude-sonnet-4-5";
    expect(selectModel([], { conversational: true })).toBe("claude-sonnet-4-5");
  });
});
