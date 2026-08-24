import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeAgentTool = vi.hoisted(() => vi.fn());
const composeAnswer = vi.hoisted(() => vi.fn());
const profileIdFor = vi.hoisted(() => vi.fn());
const ensureConversation = vi.hoisted(() => vi.fn());
const appendMessage = vi.hoisted(() => vi.fn());
const recallLearned = vi.hoisted(() => vi.fn());
const learnFromTurn = vi.hoisted(() => vi.fn());

vi.mock("@/lib/nico/registry-tools", () => ({ invokeAgentTool }));
vi.mock("@/lib/nico/composer", () => ({ composeAnswer }));
vi.mock("@/lib/procedures/profile", () => ({ profileIdFor }));
vi.mock("@/lib/nico/session", () => ({ ensureConversation, appendMessage }));
vi.mock("@/lib/nico/memory", () => ({ recallLearned, learnFromTurn }));

import { runTurn } from "@/lib/nico/orchestrator";

const actor = {
  kind: "user" as const,
  id: "user_1",
  displayName: "Ada",
  role: "member" as const,
};

describe("runTurn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recallLearned.mockResolvedValue("");
    learnFromTurn.mockResolvedValue(undefined);
  });
  it("invokes knowledge.search as kind agent with the session authSubject", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockResolvedValue({ passages: [] });
    composeAnswer.mockImplementation(async function* () {
      yield "hello";
    });

    const events = [];
    for await (const event of runTurn("thesis?", actor, {
      conversationId: "conv_1",
    })) {
      events.push(event);
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "knowledge.search",
      { query: "thesis?", limit: 6 },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(appendMessage).toHaveBeenCalledWith({
      conversationId: "conv_1",
      role: "user",
      content: "thesis?",
    });
    expect(
      events.some((e) => e.type === "activity" && e.state === "listening"),
    ).toBe(true);
    expect(events.some((e) => e.type === "token" && e.text === "hello")).toBe(
      true,
    );
    expect(events.at(-1)).toEqual({ type: "done" });
    expect(invokeAgentTool).not.toHaveBeenCalledWith(
      "artifacts.create",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("checks the sky without opening the thesis", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "weather.get") {
        return {
          place: "Medellín",
          country: "Colombia",
          celsius: 22,
          summary: "partly cloudy",
          windKmh: 6,
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _m: string,
      _p: unknown,
      context?: { worldNote?: string },
    ) {
      yield context?.worldNote ?? "";
    });

    const events = [];
    for await (const event of runTurn("what's the weather?", actor, {
      conversationId: "conv_wx",
    })) {
      events.push(event);
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "weather.get",
      { place: "Medellín" },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(invokeAgentTool).not.toHaveBeenCalledWith(
      "knowledge.search",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("checks the tape without opening the thesis", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "markets.get") {
        return {
          asOf: "2026-08-23T12:00:00.000Z",
          quotes: [
            {
              id: "nasdaq",
              name: "NASDAQ Composite",
              last: 17812,
              changePct: -0.4,
              unit: "pts",
            },
          ],
          source: "Yahoo Finance",
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _m: string,
      _p: unknown,
      context?: { worldNote?: string },
    ) {
      yield context?.worldNote ?? "";
    });

    const events = [];
    for await (const event of runTurn("How is the NASDAQ today?", actor, {
      conversationId: "conv_nq",
    })) {
      events.push(event);
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "markets.get",
      { focus: "indices" },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(invokeAgentTool).not.toHaveBeenCalledWith(
      "knowledge.search",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("scans hourly headlines without opening the thesis", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "news.headlines") {
        return {
          window: "hour",
          region: "world",
          asOf: "2026-08-23T12:00:00.000Z",
          items: [
            {
              title: "A labeled number beats a rumor",
              url: "https://example.com/1",
              source: "BBC World",
              publishedAt: "Sun, 23 Aug 2026 16:00:00 GMT",
            },
          ],
          source: "BBC World",
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _m: string,
      _p: unknown,
      context?: { worldNote?: string },
    ) {
      yield context?.worldNote ?? "";
    });

    for await (const event of runTurn("top news of the hour", actor, {
      conversationId: "conv_news",
    })) {
      void event;
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "news.headlines",
      { window: "hour", region: "world", limit: 5 },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
  });

  it("pulls Medellín-area housing headlines without opening the thesis", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "news.headlines") {
        return {
          window: "day",
          region: "medellin_re",
          asOf: "2026-08-23T12:00:00.000Z",
          items: [
            {
              title: "Poblado rents hold while Envigado listings slow",
              url: "https://example.com/med",
              source: "El Colombiano",
              publishedAt: "Sun, 23 Aug 2026 15:00:00 GMT",
            },
          ],
          source: "Google News (Aburrá housing, ES)",
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _m: string,
      _p: unknown,
      context?: { worldNote?: string },
    ) {
      yield context?.worldNote ?? "";
    });

    for await (const event of runTurn(
      "real estate news around Medellín",
      actor,
      { conversationId: "conv_med_re" },
    )) {
      void event;
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "news.headlines",
      { window: "day", region: "medellin_re", limit: 5 },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(invokeAgentTool).not.toHaveBeenCalledWith(
      "knowledge.search",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("queues a family workbook when the user asks for a whole-business worksheet", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "artifacts.create") return { id: "art_family" };
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _message: string,
      _passages: unknown,
      context?: { artifactNote?: string },
    ) {
      yield context?.artifactNote ?? "";
    });

    const events = [];
    for await (const event of runTurn(
      "Help me build a worksheet about the Tamarindo business as a whole",
      actor,
      { conversationId: "conv_ws" },
    )) {
      events.push(event);
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "artifacts.create",
      {
        kind: "excel",
        title: "Tamarindo family — 10-year worksheet",
        entities: [
          "Tamarindo US",
          "Tamarindo-Intervest",
          "Tamarindo Colombia",
          "Ashoka",
        ],
      },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(
      events.some(
        (e) =>
          e.type === "activity" &&
          e.state === "drafting" &&
          "label" in e &&
          e.label.includes("worksheet"),
      ),
    ).toBe(true);
  });

  it("tells a member an admin-only variable was not applied", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "model.setVariables") {
        return {
          applied: [],
          model: { summary: { fy1ClosingCashUsd: 1, fy10ClosingCashUsd: 2 } },
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _message: string,
      _passages: unknown,
      context?: { artifactNote?: string },
    ) {
      yield context?.artifactNote ?? "";
    });

    for await (const event of runTurn("set the balloon to 25%", actor, {
      conversationId: "conv_var",
    })) {
      void event;
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "model.setVariables",
      { values: { minResidualOfAssetPct: 0.25 } },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(composeAnswer).toHaveBeenCalledWith(
      "set the balloon to 25%",
      expect.anything(),
      expect.objectContaining({
        artifactNote: expect.stringContaining("admin"),
      }),
    );
  });

  it("carries durable memory into a new window and learns after the turn", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    recallLearned.mockResolvedValue(
      "Already known:\n- [fact] Intervest wants the first close in Q1",
    );
    composeAnswer.mockImplementation(async function* () {
      yield "I remember.";
    });

    for await (const event of runTurn("hey, still with me?", actor, {
      conversationId: "conv_new",
    })) {
      void event;
    }

    expect(recallLearned).toHaveBeenCalledWith("hey, still with me?");
    expect(composeAnswer).toHaveBeenCalledWith(
      "hey, still with me?",
      expect.anything(),
      expect.objectContaining({
        memoryNote: expect.stringContaining("first close in Q1"),
        conversational: true,
      }),
    );
    expect(learnFromTurn).toHaveBeenCalledWith({
      userMessage: "hey, still with me?",
      reply: "I remember.",
      profileId: "prof_1",
      conversationId: "conv_new",
    });
  });
});
