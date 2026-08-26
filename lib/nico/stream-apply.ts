import {
  AvatarStateSchema,
  type AvatarState,
  type StreamEvent,
} from "@/lib/contracts/events";

export type AppliedMedia = {
  kind: "image" | "video";
  url: string;
  alt: string;
  title?: string;
};

export type AppliedTurn = {
  reply: string;
  sources: { title: string; path: string; excerpt: string }[];
  avatarState: AvatarState;
  activityLabel: string;
  progress?: number;
  media: AppliedMedia[];
  done: boolean;
  error?: string;
};

export function emptyAppliedTurn(): AppliedTurn {
  return {
    reply: "",
    sources: [],
    avatarState: "idle",
    activityLabel: "Here to help",
    media: [],
    done: false,
  };
}

/**
 * Fold one orchestrator event into turn state. Unknown activity states are
 * ignored so a stale client does not crash (U10).
 *
 * Reloading mid-stream continues by applying leftover token events onto the
 * already-received `reply` (AE2).
 */
export function applyStreamEvent(
  prev: AppliedTurn,
  event: StreamEvent,
): AppliedTurn {
  switch (event.type) {
    case "activity": {
      const state = AvatarStateSchema.safeParse(event.state);
      if (!state.success) return prev;
      return {
        ...prev,
        avatarState: state.data,
        activityLabel: event.label,
        progress: event.progress,
      };
    }
    case "media":
      return {
        ...prev,
        media: [
          ...prev.media,
          {
            kind: event.kind,
            url: event.url,
            alt: event.alt,
            title: event.title,
          },
        ],
      };
    case "source":
      return {
        ...prev,
        sources: [
          ...prev.sources,
          { title: event.title, path: event.path, excerpt: event.excerpt },
        ],
      };
    case "token":
      return { ...prev, reply: prev.reply + event.text };
    case "error":
      return {
        ...prev,
        error: event.message,
        avatarState: "idle",
        activityLabel: "Here to help",
      };
    case "done":
      return { ...prev, done: true, avatarState: "idle", activityLabel: "Here to help" };
    default:
      return prev;
  }
}

export function applyStreamEvents(
  events: StreamEvent[],
  start: AppliedTurn = emptyAppliedTurn(),
): AppliedTurn {
  return events.reduce(applyStreamEvent, start);
}

/**
 * Fold a `useAgentChat` `data-*` part. The UI stream writes the original
 * orchestrator event on `data` (U10). Unknown shapes are ignored.
 */
export function applyUiDataPart(prev: AppliedTurn, part: unknown): AppliedTurn {
  if (!part || typeof part !== "object") return prev;
  const row = part as { type?: unknown; data?: unknown };
  const payload = row.data ?? row;
  if (!payload || typeof payload !== "object") return prev;
  const event = payload as StreamEvent;
  if (
    event.type === "activity" ||
    event.type === "error" ||
    event.type === "done" ||
    event.type === "source" ||
    event.type === "media"
  ) {
    return applyStreamEvent(prev, event);
  }
  return prev;
}

export function appliedPresenceFromUiMessages(
  messages: { parts?: unknown[] }[],
): AppliedTurn {
  let applied = emptyAppliedTurn();
  for (const message of messages) {
    for (const part of message.parts ?? []) {
      applied = applyUiDataPart(applied, part);
    }
  }
  return applied;
}
