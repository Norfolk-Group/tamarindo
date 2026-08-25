import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeAgentTool = vi.hoisted(() => vi.fn());
const composeAnswer = vi.hoisted(() => vi.fn());
const profileIdFor = vi.hoisted(() => vi.fn());
const ensureConversation = vi.hoisted(() => vi.fn());
const appendMessage = vi.hoisted(() => vi.fn());
const recallLearned = vi.hoisted(() => vi.fn());
const learnFromTurn = vi.hoisted(() => vi.fn());
const loadWho = vi.hoisted(() => vi.fn());

vi.mock("@/lib/nico/registry-tools", () => ({ invokeAgentTool }));
vi.mock("@/lib/nico/composer", () => ({ composeAnswer }));
vi.mock("@/lib/procedures/profile", () => ({ profileIdFor }));
vi.mock("@/lib/nico/session", () => ({ ensureConversation, appendMessage }));
vi.mock("@/lib/nico/memory", () => ({ recallLearned, learnFromTurn }));
vi.mock("@/lib/nico/who", () => ({ loadWho }));

import { UnpublishedTermsError } from "@/lib/artifacts/deck";
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
    loadWho.mockResolvedValue({
      givenName: "Ada",
      familyName: null,
      addressStyle: "unknown",
      askGivenName: true,
      pendingNameAsk: false,
      whoNote: "Who this is:\n- Given name: Ada",
    });
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

  it("slices FY3 instead of running the full 10-year statement", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "model.report") {
        return {
          fromFy: 3,
          toFy: 3,
          consolidated: {
            years: [
              {
                fy: 3,
                label: "FY3",
                closingCashUsd: 12,
                byIcp: [{ originated: 4 }],
              },
            ],
          },
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

    const events = [];
    for await (const event of runTurn("FY3 cash flow", actor, {
      conversationId: "conv_fy3",
    })) {
      events.push(event);
    }

    expect(
      events.some(
        (event) =>
          event.type === "token" &&
          typeof event.text === "string" &&
          event.text.includes("```report"),
      ),
    ).toBe(true);
    expect(invokeAgentTool).toHaveBeenCalledWith(
      "model.report",
      { kind: "statements", fromFy: 3, toFy: 3 },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(invokeAgentTool).not.toHaveBeenCalledWith(
      "model.get",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("builds an income statement live instead of swapping cash flow", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "model.report") {
        return {
          kind: "income",
          fromFy: 1,
          toFy: 10,
          workbook: {
            kind: "income",
            sheets: [
              {
                id: "income-us",
                title: "US",
                rows: [
                  {
                    kind: "header",
                    cells: [{ text: "Line" }, { text: "FY1" }],
                  },
                  {
                    kind: "total",
                    cells: [{ text: "Operating receipts" }, { text: "$1" }],
                  },
                  {
                    kind: "total",
                    cells: [{ text: "Cash from operations" }, { text: "$1" }],
                  },
                ],
              },
            ],
          },
          consolidated: { years: [] },
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* () {
      yield "";
    });

    const events = [];
    for await (const event of runTurn("show me the income statement", actor, {
      conversationId: "conv_income",
    })) {
      events.push(event);
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "model.report",
      { kind: "income", fromFy: undefined, toFy: undefined },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(
      events.some(
        (event) =>
          event.type === "token" &&
          typeof event.text === "string" &&
          /building it now/i.test(event.text),
      ),
    ).toBe(true);
    expect(
      events.some(
        (event) =>
          event.type === "activity" &&
          event.state === "drafting" &&
          /build/i.test(event.label ?? ""),
      ),
    ).toBe(true);
  });

  it("shows a meeting-lever assumptions glance", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "model.get") {
        return {
          variables: [
            {
              key: "downPaymentPct",
              label: "Client down",
              group: "Lease",
              type: "percent",
              value: 0.4,
            },
            {
              key: "pay.dovLoadedUsd",
              label: "Dov pay",
              group: "People US",
              type: "usd",
              value: 1,
            },
          ],
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* () {
      yield "";
    });

    const events = [];
    for await (const event of runTurn("show my assumptions", actor, {
      conversationId: "conv_assume",
    })) {
      events.push(event);
    }

    const table = events.find(
      (event) => event.type === "token" && typeof event.text === "string" && event.text.includes("Client down"),
    );
    expect(table).toBeTruthy();
    expect((table as { text: string }).text).toContain("40%");
    expect((table as { text: string }).text).not.toContain("Dov pay");
    expect(invokeAgentTool).toHaveBeenCalledWith(
      "model.get",
      {},
      { ...actor, kind: "agent" },
      expect.any(String),
    );
  });

  it("lists ICPs from the live catalog", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "icp.list") {
        return {
          icps: [
            { code: "ICP-1", name: "Poblado Executive", city: "Medellín" },
          ],
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

    for await (const event of runTurn("list the ICPs", actor, {
      conversationId: "conv_icp",
    })) {
      void event;
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "icp.list",
      {},
      { ...actor, kind: "agent" },
      expect.any(String),
    );
  });

  it("queues a structure deck when asked for the entity map", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "artifacts.create") return { id: "art_structure" };
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _message: string,
      _passages: unknown,
      context?: { artifactNote?: string },
    ) {
      yield context?.artifactNote ?? "";
    });

    for await (const event of runTurn("show me the entity map", actor, {
      conversationId: "conv_deck",
    })) {
      void event;
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "artifacts.create",
      {
        kind: "deck",
        title: "Tamarindo corporate structure",
        variant: "structure",
      },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(composeAnswer).toHaveBeenCalledWith(
      "show me the entity map",
      expect.anything(),
      expect.objectContaining({
        artifactNote: expect.stringContaining("art_structure"),
      }),
    );
  });

  it("refuses an unpublished investor raise instead of inventing the ask", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "knowledge.search") return { passages: [] };
      if (name === "artifacts.create") throw new UnpublishedTermsError();
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _message: string,
      _passages: unknown,
      context?: { artifactNote?: string },
    ) {
      yield context?.artifactNote ?? "";
    });

    for await (const event of runTurn("make the investor deck", actor, {
      conversationId: "conv_raise",
    })) {
      void event;
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "artifacts.create",
      {
        kind: "deck",
        title: "Tamarindo investor raise",
        variant: "raise",
      },
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(composeAnswer).toHaveBeenCalledWith(
      "make the investor deck",
      expect.anything(),
      expect.objectContaining({
        artifactNote: expect.stringMatching(/will not invent the ask/i),
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
        whoNote: expect.stringContaining("Given name: Ada"),
        askGivenName: true,
        givenName: "Ada",
      }),
    );
    expect(learnFromTurn).toHaveBeenCalledWith({
      userMessage: "hey, still with me?",
      reply: "I remember.",
      profileId: "prof_1",
      conversationId: "conv_new",
      pendingNameAsk: false,
      givenName: "Ada",
    });
  });

  it("calls media.generate for a Nano Banana ask and streams the fence", async () => {
    profileIdFor.mockResolvedValue("prof_1");
    ensureConversation.mockResolvedValue(undefined);
    appendMessage.mockResolvedValue(undefined);
    invokeAgentTool.mockImplementation(async (name: string) => {
      if (name === "media.generate") {
        return {
          kind: "image",
          status: "ready",
          url: "data:image/png;base64,xx",
          alt: "Poblado dusk",
          title: "Poblado dusk",
          model: "gemini-3-pro-image",
        };
      }
      throw new Error(name);
    });
    composeAnswer.mockImplementation(async function* (
      _m: string,
      _p: unknown,
      ctx?: { mediaNote?: string; onThinking?: (s: string) => void },
    ) {
      ctx?.onThinking?.("Framing the picture.");
      yield "Here is dusk over Provenza.";
    });

    const events = [];
    for await (const event of runTurn(
      "draw me an illustration of a dusk skyline",
      actor,
      { conversationId: "conv_img" },
    )) {
      events.push(event);
    }

    expect(invokeAgentTool).toHaveBeenCalledWith(
      "media.generate",
      expect.objectContaining({ kind: "image" }),
      { ...actor, kind: "agent" },
      expect.any(String),
    );
    expect(events.some((e) => e.type === "media" && e.kind === "image")).toBe(
      true,
    );
    expect(
      events.some((e) => e.type === "activity" && e.state === "generating"),
    ).toBe(true);
    expect(
      events.some((e) => e.type === "activity" && e.state === "thinking"),
    ).toBe(true);
    expect(
      events.some((e) => e.type === "activity" && e.state === "speaking"),
    ).toBe(true);
    expect(invokeAgentTool).not.toHaveBeenCalledWith(
      "knowledge.search",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
