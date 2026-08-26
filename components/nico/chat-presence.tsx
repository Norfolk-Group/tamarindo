"use client";

import type { AppliedTurn } from "@/lib/nico/stream-apply";

const LIVE: AppliedTurn["avatarState"][] = [
  "listening",
  "thinking",
  "researching",
  "drafting",
  "generating",
  "speaking",
];

export function isLivePresence(state: AppliedTurn["avatarState"]): boolean {
  return LIVE.includes(state);
}

export function ChatPresenceBar({ presence }: { presence: AppliedTurn }) {
  const live = isLivePresence(presence.avatarState);
  const width =
    presence.progress !== undefined
      ? `${Math.round(presence.progress * 100)}%`
      : live
        ? "40%"
        : "0%";
  return (
    <div
      className="nico-progress"
      data-state={presence.avatarState}
      aria-hidden={!live}
    >
      <div className="nico-progress-fill" style={{ width }} />
    </div>
  );
}

export function ChatThinkingRow({
  presence,
  hasStreamText = false,
}: {
  presence: AppliedTurn;
  hasStreamText?: boolean;
}) {
  if (!isLivePresence(presence.avatarState)) return null;
  if (presence.avatarState === "speaking" && hasStreamText) return null;
  return (
    <div
      className="nico-stream-live nico-msg-enter"
      data-state={presence.avatarState}
      aria-live="polite"
    >
      <span className="nico-stream-live-rail" aria-hidden />
      <div className="flex items-center gap-2">
        <span className="nico-think-dots" data-state={presence.avatarState}>
          <i />
          <i />
          <i />
        </span>
        <span className="text-xs text-muted-foreground">
          {presence.activityLabel}
        </span>
      </div>
      <div className="nico-stream-bars" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
