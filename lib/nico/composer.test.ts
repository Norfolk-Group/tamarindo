import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const streamText = vi.hoisted(() => vi.fn());
const createAnthropic = vi.hoisted(() =>
  vi.fn(() => (id: string) => ({ id })),
);

vi.mock("ai", () => ({ streamText, stepCountIs: () => () => false }));
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
    const text = await collect(
      composeAnswer("hey", [], {
        givenName: "Ricardo",
        askGivenName: true,
      }),
    );
    expect(text).toContain("Hey Ricardo");
    expect(text).toContain("first name");
    expect(text).toContain("What's bringing you in");
    expect(streamText).not.toHaveBeenCalled();
  });

  it("falls back when the provider errors before the first token", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "error", error: new Error("401 unauthorized") };
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
      fullStream: (async function* () {
        yield { type: "text-delta", text: "Hello from " };
        yield { type: "error", error: new Error("socket dropped") };
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
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "text-delta", text: "Hey." };
        yield { type: "text-delta", text: " What's up?" };
      })(),
    });
    const text = await collect(composeAnswer("hey", [], { conversational: true }));
    expect(text).toBe("Hey. What's up?");
    expect(streamText).toHaveBeenCalledOnce();
    const call = streamText.mock.calls[0][0] as {
      model: { id: string };
      messages: { content: string }[];
    };
    expect(call.model.id).toBe("claude-haiku-4-5");
  });

  it("puts durable memory in the model prompt", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "text-delta", text: "Yes." };
      })(),
    });
    await collect(
      composeAnswer("hey", [], {
        conversational: true,
        memoryNote: "Already known:\n- [fact] First close is Q1",
      }),
    );
    const call = streamText.mock.calls[0][0] as {
      messages: { content: string }[];
    };
    expect(call.messages[0].content).toContain("First close is Q1");
  });

  it("puts who-this-is and the first-name ask in the model prompt", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "text-delta", text: "Hey Ricardo." };
      })(),
    });
    await collect(
      composeAnswer("hey", [], {
        conversational: true,
        whoNote: 'Say "Ricardo" once, then ask if you may keep using that first name.',
        givenName: "Ricardo",
        askGivenName: true,
      }),
    );
    const call = streamText.mock.calls[0][0] as {
      messages: { content: string }[];
    };
    expect(call.messages[0].content).toContain("Ricardo");
    expect(call.messages[0].content).toContain("keep using that first name");
  });

  it("treats a people note as a Tamarindo fact even with no passages", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "text-delta", text: "Dov is the MD." };
      })(),
    });
    await collect(
      composeAnswer("who is Dov?", [], {
        peopleNote: "Kaleil Dov Isaza Tuzman — founder and Managing Director.",
      }),
    );
    const call = streamText.mock.calls[0][0] as {
      messages: { content: string }[];
    };
    expect(call.messages[0].content).toContain("Kaleil Dov Isaza Tuzman");
    expect(call.messages[0].content).toContain("Tamarindo fact");
  });

  it("asks the model to compose from a live snapshot and refresh with tools", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "text-delta", text: "Twelve homes." };
      })(),
    });
    await collect(
      composeAnswer("how does Tamarindo work", [], {
        artifactNote: "LIVE SNAPSHOT — Live book: 12 homes",
        tools: { model_get: {} } as unknown as import("ai").ToolSet,
      }),
    );
    const call = streamText.mock.calls[0][0] as {
      messages: { content: string }[];
      system: string;
    };
    expect(call.messages[0].content).toContain("Live snapshot for this turn");
    expect(call.messages[0].content).toContain("Do not paste this note");
    expect(call.messages[0].content).toContain("Live tools are on");
    expect(call.messages[0].content).not.toContain("Artifact just queued");
    expect(call.messages[0].content).toContain("Files in the left rail");
    expect(call.system).toMatch(/Compose the spoken answer this turn/);
  });

  it("asks the model to reply in Spanish with the consultant register", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "text-delta", text: "Arrendamiento con opción de compra." };
      })(),
    });
    await collect(
      composeAnswer("cómo funciona Tamarindo", [], {
        language: "es",
        artifactNote: "LIVE SNAPSHOT — Live book: 12 homes",
      }),
    );
    const call = streamText.mock.calls[0][0] as {
      messages: { content: string }[];
      system: string;
    };
    expect(call.messages[0].content).toContain("Reply in Spanish this turn");
    expect(call.system).toContain("arrendamiento con opción de compra");
    expect(call.system).toContain("Files");
  });
});

describe("selectModel", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("uses the strong model unless the caller marks the turn conversational", () => {
    expect(selectModel([], {})).toBe("claude-opus-4-6");
    expect(selectModel([passage], { conversational: true })).toBe(
      "claude-opus-4-6",
    );
    expect(selectModel([], { conversational: true })).toBe("claude-haiku-4-5");
  });

  it("surfaces Anthropic reasoning as thinking, not as chat text", async function () {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const thoughts: string[] = [];
    streamText.mockReturnValue({
      fullStream: (async function* () {
        yield { type: "reasoning-delta", text: "They want the balloon." };
        yield { type: "text-delta", text: "Twenty percent of the asset." };
      })(),
    });
    const text = await collect(
      composeAnswer("what is the balloon?", [passage], {
        onThinking: (s) => thoughts.push(s),
      }),
    );
    expect(thoughts.join("")).toContain("balloon");
    expect(text).toBe("Twenty percent of the asset.");
    expect(text).not.toContain("They want");
    const call = streamText.mock.calls[0][0] as {
      model: { id: string };
      providerOptions?: { anthropic?: { thinking?: { budgetTokens?: number } } };
    };
    expect(call.model.id).toBe("claude-opus-4-6");
    expect(call.providerOptions?.anthropic?.thinking?.budgetTokens).toBe(8_192);
  });

  it("honors env overrides so the two tiers can collapse", () => {
    process.env.NICO_MODEL = "claude-sonnet-4-5";
    process.env.NICO_FAST_MODEL = "claude-sonnet-4-5";
    expect(selectModel([], { conversational: true })).toBe("claude-sonnet-4-5");
  });
});
