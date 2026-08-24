import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeAgentTool = vi.hoisted(() => vi.fn());
const composeAnswer = vi.hoisted(() => vi.fn());
const profileIdFor = vi.hoisted(() => vi.fn());
const ensureConversation = vi.hoisted(() => vi.fn());
const appendMessage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/nico/registry-tools", () => ({ invokeAgentTool }));
vi.mock("@/lib/nico/composer", () => ({ composeAnswer }));
vi.mock("@/lib/procedures/profile", () => ({ profileIdFor }));
vi.mock("@/lib/nico/session", () => ({ ensureConversation, appendMessage }));

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
});
