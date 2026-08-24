"use client";

import { cn } from "@/lib/utils";

type ApprovalRow = {
  id: string;
  procedure: string;
  reason: string;
  status: string;
};

export function ApprovalsPanel({
  rows,
  error,
  onDecide,
  onRefresh,
  className,
}: {
  rows: ApprovalRow[];
  error: string | null;
  onDecide: (approvalId: string, decision: "approved" | "rejected") => void;
  onRefresh: () => void;
  className?: string;
}) {
  return (
    <section className={cn("p-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
          PENDING APPROVALS
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="text-[11px] text-muted-foreground underline"
        >
          Refresh
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border border-border p-2">
            <p className="font-mono text-[11px]">{row.procedure}</p>
            <p className="text-[11px] text-muted-foreground">{row.reason}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onDecide(row.id, "approved")}
                className="rounded bg-primary px-2 py-1 text-[11px] text-primary-foreground"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onDecide(row.id, "rejected")}
                className="rounded border border-border px-2 py-1 text-[11px]"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-[11px] text-muted-foreground">No pending cards.</li>
        )}
      </ul>
    </section>
  );
}
