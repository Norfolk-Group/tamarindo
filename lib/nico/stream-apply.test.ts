import { describe, expect, it } from "vitest";
import {
  applyStreamEvent,
  applyStreamEvents,
  applyUiDataPart,
  appliedPresenceFromUiMessages,
  emptyAppliedTurn,
} from "@/lib/nico/stream-apply";
import type { StreamEvent } from "@/lib/contracts/events";

describe("applyStreamEvent", () => {
  it("continues tokens after a mid-stream disconnect (AE2)", () => {
    const beforeReload = applyStreamEvents([
      { type: "activity", state: "drafting", label: "Drafting a reply…" },
      { type: "token", text: "Hel" },
      { type: "token", text: "lo" },
    ]);
    expect(beforeReload.reply).toBe("Hello");
    expect(beforeReload.avatarState).toBe("drafting");
    expect(beforeReload.done).toBe(false);

    const afterReload = applyStreamEvents(
      [
        { type: "token", text: ", Rossi" },
        { type: "activity", state: "idle", label: "Ready" },
        { type: "done" },
      ],
      beforeReload,
    );
    expect(afterReload.reply).toBe("Hello, Rossi");
    expect(afterReload.done).toBe(true);
    expect(afterReload.avatarState).toBe("idle");
  });

  it("can reach every contracted avatar state from a real activity event", () => {
    const states = [
      "idle",
      "listening",
      "thinking",
      "researching",
      "drafting",
      "generating",
      "speaking",
      "awaiting_approval",
    ] as const;
    for (const state of states) {
      const next = applyStreamEvent(emptyAppliedTurn(), {
        type: "activity",
        state,
        label: state,
      });
      expect(next.avatarState).toBe(state);
      expect(next.activityLabel).toBe(state);
    }
  });

  it("maps researching and awaiting_approval from real events", () => {
    const researching = applyStreamEvent(emptyAppliedTurn(), {
      type: "activity",
      state: "researching",
      label: "Reading Q2 transcript…",
    });
    expect(researching.avatarState).toBe("researching");
    expect(researching.activityLabel).toBe("Reading Q2 transcript…");

    const waiting = applyStreamEvent(researching, {
      type: "activity",
      state: "awaiting_approval",
      label: "Waiting for approval…",
    });
    expect(waiting.avatarState).toBe("awaiting_approval");
  });

  it("ignores an unknown activity state from a stale client", () => {
    const prev = applyStreamEvent(emptyAppliedTurn(), {
      type: "activity",
      state: "thinking",
      label: "Working…",
    });
    const stale = {
      type: "activity",
      state: "searching",
      label: "legacy",
    } as unknown as StreamEvent;
    expect(applyStreamEvent(prev, stale)).toEqual(prev);
  });

  it("returns the orb to idle on model failure", () => {
    const next = applyStreamEvent(emptyAppliedTurn(), {
      type: "error",
      message: "Gateway down",
    });
    expect(next.avatarState).toBe("idle");
    expect(next.error).toBe("Gateway down");
  });

  it("maps useAgentChat data-activity parts onto the orb (U10)", () => {
    const next = applyUiDataPart(emptyAppliedTurn(), {
      type: "data-activity",
      data: {
        type: "activity",
        state: "researching",
        label: "Searching the Tamarindo knowledge base…",
      },
    });
    expect(next.avatarState).toBe("researching");
    expect(next.activityLabel).toBe(
      "Searching the Tamarindo knowledge base…",
    );
  });

  it("reads the last activity part after a mid-stream hydrate", () => {
    const presence = appliedPresenceFromUiMessages([
      {
        parts: [
          {
            type: "data-activity",
            data: { type: "activity", state: "thinking", label: "Reading…" },
          },
          {
            type: "data-activity",
            data: {
              type: "activity",
              state: "drafting",
              label: "Drafting a reply…",
            },
          },
        ],
      },
    ]);
    expect(presence.avatarState).toBe("drafting");
    expect(presence.activityLabel).toBe("Drafting a reply…");
  });

  it("keeps a real progress fraction and a media card", () => {
    const withProgress = applyStreamEvent(emptyAppliedTurn(), {
      type: "activity",
      state: "generating",
      label: "Painting with Nano Banana Pro…",
      progress: 0.15,
    });
    expect(withProgress.progress).toBe(0.15);
    const withMedia = applyStreamEvent(withProgress, {
      type: "media",
      kind: "image",
      url: "data:image/png;base64,xx",
      alt: "Poblado stack",
      title: "Poblado stack",
    });
    expect(withMedia.media).toHaveLength(1);
    expect(withMedia.media[0]?.kind).toBe("image");
  });
});
