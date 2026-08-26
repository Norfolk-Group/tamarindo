"use client";

import { InfoTip } from "@/components/nico/info-tip";

type ArtifactRow = { id: string; kind: string; title: string; createdAt: string };
type DocumentRow = {
  id: string;
  title: string;
  mimeType: string;
  confidential: boolean;
  published: boolean;
};

export function ArtifactsPanel({
  rows,
  error,
  onRefresh,
}: {
  rows: ArtifactRow[];
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <section className="p-3">
      <PanelHead label="ARTIFACTS" topic="artifacts.list" onRefresh={onRefresh} />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border border-border p-2">
            <p className="text-[11px]">{row.title}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{row.kind}</p>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-[11px] text-muted-foreground">No artifacts yet.</li>
        )}
      </ul>
    </section>
  );
}

export function DataRoomPanel({
  rows,
  error,
  onRefresh,
}: {
  rows: DocumentRow[];
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <section className="p-3">
      <PanelHead label="DATA ROOM" topic="dataroom.list" onRefresh={onRefresh} />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border border-border p-2">
            <p className="text-[11px]">{row.title}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {row.published ? "" : "draft · "}
              {row.confidential ? "confidential" : "public"}
            </p>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-[11px] text-muted-foreground">
            No files you can see.
          </li>
        )}
      </ul>
    </section>
  );
}

function PanelHead({
  label,
  topic,
  onRefresh,
}: {
  label: string;
  topic: string;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-muted-foreground">
        {label}
        <InfoTip topic={topic} />
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="text-[11px] text-muted-foreground underline"
      >
        Refresh
      </button>
    </div>
  );
}
