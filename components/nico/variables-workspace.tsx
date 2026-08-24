"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CashflowModel, ModelVariableView, VariableValue } from "@/lib/model/types";

export function VariablesWorkspace({
  scope,
}: {
  scope: "user" | "admin";
}) {
  const [rows, setRows] = useState<ModelVariableView[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CashflowModel["summary"] | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/nico/model");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { variables: ModelVariableView[]; model: CashflowModel };
      error?: { message: string };
    };
    if (!json.ok || !json.data) {
      setError(json.error?.message ?? "Could not load variables");
      return;
    }
    setError(null);
    const visible =
      scope === "admin"
        ? json.data.variables
        : json.data.variables.filter((row) => row.visibility === "user");
    setRows(visible);
    setDraft(
      Object.fromEntries(visible.map((row) => [row.key, String(row.value)])),
    );
    setSummary(json.data.model.summary);
  }

  useEffect(() => {
    void load();
  }, [scope]);

  const groups = useMemo(() => {
    const map = new Map<string, ModelVariableView[]>();
    for (const row of rows) {
      const list = map.get(row.group) ?? [];
      list.push(row);
      map.set(row.group, list);
    }
    return [...map.entries()];
  }, [rows]);

  async function save() {
    setSaving(true);
    const values: Record<string, VariableValue> = {};
    for (const row of rows) {
      const raw = draft[row.key];
      if (raw == null) continue;
      values[row.key] = row.type === "text" ? raw : Number(raw);
    }
    const res = await fetch("/api/nico/model", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { model: CashflowModel };
      error?: { message: string };
    };
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Could not save");
      return;
    }
    setSummary(json.data?.model.summary ?? null);
    await load();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
      <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
        {scope === "admin" ? "ALL VARIABLES" : "KEY VARIABLES"}
      </p>
      <h2 className="mt-1 text-lg font-semibold">
        {scope === "admin" ? "Admin model controls" : "Dial the published set"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Math runs on the server. Colombia fees are real revenue lines — try
        them; the sucursal does not have to wash to zero.
      </p>
      {summary && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          FY1 cash {summary.fy1ClosingCashUsd.toLocaleString()} · FY10{" "}
          {summary.fy10ClosingCashUsd.toLocaleString()} · {summary.autosOriginated}{" "}
          autos · {summary.aircraftOriginated} aircraft
        </p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 space-y-8">
        {groups.map(([group, items]) => (
          <section key={group}>
            <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground">
              {group}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((row) => (
                <div key={row.key} className="space-y-1.5">
                  <Label htmlFor={row.key}>{row.label}</Label>
                  <Input
                    id={row.key}
                    type="number"
                    step={row.step ?? (row.type === "percent" ? 0.01 : 1)}
                    value={draft[row.key] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [row.key]: event.target.value,
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {row.citation.label} · {row.citation.note}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-6">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Recalculating…" : "Save and recalculate"}
        </Button>
      </div>
    </div>
  );
}
