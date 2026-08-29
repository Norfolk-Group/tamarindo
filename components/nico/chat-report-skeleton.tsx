"use client";

import type { AppliedTurn } from "@/lib/nico/stream-apply";

export function isReportBuild(presence: AppliedTurn): boolean {
  if (presence.avatarState !== "drafting" && presence.avatarState !== "generating") {
    return false;
  }
  return /build|laying out the sheet|cash-flow engine|worksheet/i.test(
    presence.activityLabel,
  );
}

export function ChatReportSkeleton({ presence }: { presence: AppliedTurn }) {
  if (!isReportBuild(presence)) return null;
  const rows = 6;
  return (
    <div
      className="nico-report-skel nico-rich-enter rounded-lg border border-border bg-card px-3 py-3"
      aria-live="polite"
      aria-label={presence.activityLabel}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#23a5b4]">
        Building live
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{presence.activityLabel}</p>
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="nico-report-skel-row h-3 rounded-sm bg-border/80"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
