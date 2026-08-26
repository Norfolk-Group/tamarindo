"use client";

import { useState } from "react";
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
      <PanelHead label="FILES" topic="artifacts.list" onRefresh={onRefresh} />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <ArtifactItem key={row.id} row={row} />
        ))}
        {rows.length === 0 && (
          <li className="text-[11px] text-muted-foreground">No files yet.</li>
        )}
      </ul>
    </section>
  );
}

function ArtifactItem({ row }: { row: ArtifactRow }) {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`/api/nico/artifacts/${row.id}`);
      const body = (await res.json()) as {
        ok: boolean;
        data?: { status: string; downloadUrl: string | null };
        error?: { message: string };
      };
      if (!body.ok || !body.data) {
        setNote(body.error?.message ?? "Couldn't open this file.");
        return;
      }
      if (body.data.status !== "ready" || !body.data.downloadUrl) {
        setNote(body.data.status === "queued" ? "Still rendering — try again in a moment." : `Not ready (${body.data.status}).`);
        return;
      }
      window.open(body.data.downloadUrl, "_blank", "noopener");
    } catch {
      setNote("Couldn't open this file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border border-border p-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px]">{row.title}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{row.kind}</p>
        </div>
        <button
          type="button"
          onClick={() => void open()}
          disabled={busy}
          className="text-[11px] text-muted-foreground underline disabled:opacity-50"
        >
          {busy ? "…" : "Open"}
        </button>
      </div>
      {note && <p className="mt-1 text-[10px] text-muted-foreground">{note}</p>}
    </li>
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
