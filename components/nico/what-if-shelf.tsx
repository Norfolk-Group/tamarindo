"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatDiffValue,
  pickScenarioDiffGlanceRows,
  type ScenarioDiffGlanceRow,
} from "@/lib/nico/assumption-intent";
import type { CaseSource, CashflowModel } from "@/lib/model/types";

type NamedScenario = { id: string; name: string };

type ScenarioDiffView = {
  scenarioA: { name: string };
  scenarioB: { name: string };
  changed: ScenarioDiffGlanceRow[];
};

type ApplyResult = {
  model?: CashflowModel;
  caseSource?: CaseSource;
};

export function WhatIfShelf({
  saving,
  setSaving,
  setError,
  onApplied,
}: {
  saving: boolean;
  setSaving: (next: boolean) => void;
  setError: (message: string | null) => void;
  onApplied: (result: ApplyResult) => Promise<void>;
}) {
  const [scenarios, setScenarios] = useState<NamedScenario[]>([]);
  const [saveAsName, setSaveAsName] = useState("");
  const [loadId, setLoadId] = useState<string | undefined>(undefined);
  const [compareA, setCompareA] = useState<string | undefined>(undefined);
  const [compareB, setCompareB] = useState<string | undefined>(undefined);
  const [compareDiff, setCompareDiff] = useState<ScenarioDiffView | null>(null);
  const [shelfNote, setShelfNote] = useState<string | null>(null);

  async function loadScenarios() {
    const res = await fetch("/api/nico/model/scenarios");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { scenarios?: NamedScenario[] };
    };
    if (!json.ok) return;
    setScenarios(
      (json.data?.scenarios ?? []).map((row) => ({
        id: row.id,
        name: row.name,
      })),
    );
  }

  useEffect(() => {
    void loadScenarios();
  }, []);

  async function saveAs() {
    const name = saveAsName.trim();
    if (!name) {
      setError("Name the what-if first");
      return;
    }
    setSaving(true);
    setShelfNote(null);
    const res = await fetch("/api/nico/model/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", name }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: { message: string };
    };
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Could not save as");
      return;
    }
    setError(null);
    setSaveAsName("");
    setShelfNote(`Saved as ${name}. Live case unchanged — not a sensitivity grid.`);
    await loadScenarios();
  }

  async function applyNamed() {
    if (!loadId) {
      setError("Pick a what-if to load");
      return;
    }
    setSaving(true);
    setShelfNote(null);
    const res = await fetch("/api/nico/model/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "apply", scenarioId: loadId }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: ApplyResult;
      error?: { message: string };
    };
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Could not load that what-if");
      return;
    }
    setError(null);
    setShelfNote(
      "Loaded onto your personal case. Reset returns to the company case, not the previous one.",
    );
    await onApplied(json.data ?? {});
  }

  async function compareNamed() {
    if (!compareA || !compareB) {
      setError("Pick two what-ifs to compare");
      return;
    }
    setSaving(true);
    setShelfNote(null);
    const res = await fetch("/api/nico/model/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "diff",
        scenarioA: compareA,
        scenarioB: compareB,
      }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: ScenarioDiffView;
      error?: { message: string };
    };
    setSaving(false);
    if (!json.ok || !json.data) {
      setError(json.error?.message ?? "Could not compare");
      return;
    }
    setError(null);
    setCompareDiff(json.data);
  }

  const compareRows = compareDiff
    ? pickScenarioDiffGlanceRows(compareDiff.changed)
    : [];

  return (
    <div className="mt-6 space-y-4 border-t border-border/60 pt-5">
      <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
        Named what-ifs
      </p>
      <p className="text-sm text-muted-foreground">
        Snapshots of the saved live case. Unsaved edits and sensitivity grids stay off
        the shelf. Load replaces the live case — Reset goes back to the company case,
        not the previous one.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="save-as-name">Save as</Label>
          <Input
            id="save-as-name"
            value={saveAsName}
            disabled={saving}
            className="w-48"
            placeholder="Rate shock"
            onChange={(event) => setSaveAsName(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void saveAs()}
          disabled={saving}
        >
          Save as
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label>Load</Label>
          <Select
            value={loadId}
            onValueChange={setLoadId}
            disabled={saving || scenarios.length === 0}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pick a what-if" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((row) => (
                <SelectItem key={row.id} value={row.id}>
                  {row.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void applyNamed()}
          disabled={saving || !loadId}
        >
          Load
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1.5">
          <Label>Compare</Label>
          <Select
            value={compareA}
            onValueChange={setCompareA}
            disabled={saving || scenarios.length === 0}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="First" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((row) => (
                <SelectItem key={`a-${row.id}`} value={row.id}>
                  {row.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="sr-only">Compare with</Label>
          <Select
            value={compareB}
            onValueChange={setCompareB}
            disabled={saving || scenarios.length === 0}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Second" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((row) => (
                <SelectItem key={`b-${row.id}`} value={row.id}>
                  {row.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void compareNamed()}
          disabled={saving || !compareA || !compareB}
        >
          Compare
        </Button>
      </div>
      {shelfNote ? (
        <p className="text-sm text-muted-foreground">{shelfNote}</p>
      ) : null}
      {compareDiff ? (
        <div className="overflow-x-auto">
          <table className="w-full max-w-xl text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Input</th>
                <th className="py-1.5 pr-3 font-medium">
                  {compareDiff.scenarioA.name}
                </th>
                <th className="py-1.5 pr-3 font-medium">
                  {compareDiff.scenarioB.name}
                </th>
                <th className="py-1.5 font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.length === 0 ? (
                <tr>
                  <td className="py-2 text-muted-foreground" colSpan={4}>
                    No input or FY cash deltas.
                  </td>
                </tr>
              ) : (
                compareRows.map((row) => (
                  <tr key={row.key} className="border-b border-border/40">
                    <td className="py-1.5 pr-3">{row.label}</td>
                    <td className="py-1.5 pr-3">{formatDiffValue(row, row.a)}</td>
                    <td className="py-1.5 pr-3">{formatDiffValue(row, row.b)}</td>
                    <td className="py-1.5">{formatDiffValue(row, row.delta)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
