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

export function ChatThinkingRow({ presence }: { presence: AppliedTurn }) {
  if (!isLivePresence(presence.avatarState) || presence.avatarState === "speaking") {
    return null;
  }
  return (
    <div
      className="nico-msg-enter flex items-center gap-2 text-xs text-muted-foreground"
      aria-live="polite"
    >
      <span className="nico-think-dots" data-state={presence.avatarState}>
        <i />
        <i />
        <i />
      </span>
      <span>{presence.activityLabel}</span>
    </div>
  );
}
