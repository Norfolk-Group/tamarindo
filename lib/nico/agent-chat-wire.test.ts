import { describe, expect, it } from "vitest";
import {
  applyStreamEvent,
  emptyAppliedTurn,
} from "@/lib/nico/stream-apply";
import { tokenEventsFromAgentWire } from "@/lib/nico/agent-chat-wire";

describe("Agents chat wire (AE2)", () => {
  it("replays leftover text-deltas onto the already-received prefix", () => {
    const first = [
      JSON.stringify({
        type: "cf_agent_use_chat_response",
        id: "ae2-turn-1",
        body: JSON.stringify({ type: "text-delta", id: "nico-reply", delta: "Hel" }),
      }),
    ];
    const replay = [
      JSON.stringify({
        type: "cf_agent_use_chat_response",
        id: "ae2-turn-1",
        replay: true,
        body: JSON.stringify({ type: "text-delta", id: "nico-reply", delta: "Hel" }),
      }),
      JSON.stringify({
        type: "cf_agent_use_chat_response",
        id: "ae2-turn-1",
        replay: true,
        body: JSON.stringify({ type: "text-delta", id: "nico-reply", delta: "lo, Rossi" }),
      }),
    ];

    const before = tokenEventsFromAgentWire(first).reduce(
      applyStreamEvent,
      emptyAppliedTurn(),
    );
    expect(before.reply).toBe("Hel");

    // Replay is from the start of the in-flight message (useAgentChat).
    const after = tokenEventsFromAgentWire(replay).reduce(
      applyStreamEvent,
      emptyAppliedTurn(),
    );
    expect(after.reply.startsWith(before.reply)).toBe(true);
    expect(after.reply).toBe("Hello, Rossi");
  });
});
