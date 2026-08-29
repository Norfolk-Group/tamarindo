"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTip, WithTip } from "@/components/nico/info-tip";
import { WhatIfShelf } from "@/components/nico/what-if-shelf";
import { fromDraftValue, toDraftValue } from "@/lib/model/variable-display";
import {
  ASSUMPTION_HIDDEN_GROUPS,
  ASSUMPTION_HIDDEN_KEYS,
  DEFAULT_OPEN_SECTIONS,
  sectionForGroup,
} from "@/lib/model/variable-groups";
import type { CaseSource, CashflowModel, ModelVariableView, VariableValue } from "@/lib/model/types";

function caseCopy(source: CaseSource | null, scope: "user" | "admin"): { kicker: string; title: string; body: string } {
  if (scope === "admin") {
    return {
      kicker: "Live model · every input",
      title: "Assumptions",
      body:
        source === "personal"
          ? "These are your saved numbers. Reports and Nico use them. Reset returns you to the company model."
          : "You are on the company model. Save once and you get your own copy — nobody else's reports move.",
    };
  }
  return {
      kicker: "Live model · published inputs",
      title: "Assumptions",
      body:
        source === "personal"
          ? "These are your saved numbers. Statements, income, and returns run from them."
          : "Company numbers until you save. Save starts your own live model.",
  };
}

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
  const [canEdit, setCanEdit] = useState(true);
  const [caseSource, setCaseSource] = useState<CaseSource | null>(null);

  async function load() {
    const res = await fetch("/api/nico/model");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: {
        variables: ModelVariableView[];
        model: CashflowModel;
        canEdit?: boolean;
        caseSource?: CaseSource;
      };
      error?: { message: string };
    };
    if (!json.ok || !json.data) {
      setError(json.error?.message ?? "Could not load assumptions");
      return;
    }
    setError(null);
    const visible = json.data.variables.filter((row) => {
      if (ASSUMPTION_HIDDEN_GROUPS.has(row.group)) return false;
      if (ASSUMPTION_HIDDEN_KEYS.has(row.key)) return false;
      return scope === "admin" ? true : row.visibility === "user";
    });
    setRows(visible);
    setDraft(
      Object.fromEntries(visible.map((row) => [row.key, toDraftValue(row.type, row.value)])),
    );
    setSummary(json.data.model.summary);
    setCanEdit(json.data.canEdit !== false);
    setCaseSource(json.data.caseSource ?? null);
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
    return [...map.entries()]
      .map(([group, items]) => ({ section: sectionForGroup(group), items }))
      .sort((a, b) => a.section.order - b.section.order);
  }, [rows]);

  const defaultOpen = useMemo(
    () => groups.filter((g) => DEFAULT_OPEN_SECTIONS.includes(g.section.id)).map((g) => g.section.id),
    [groups],
  );

  async function save() {
    setSaving(true);
    const values: Record<string, VariableValue> = {};
    for (const row of rows) {
      const raw = draft[row.key];
      if (raw == null) continue;
      values[row.key] = fromDraftValue(row.type, raw);
    }
    const res = await fetch("/api/nico/model", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { model: CashflowModel; caseSource?: CaseSource };
      error?: { message: string };
    };
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Could not save");
      return;
    }
    setSummary(json.data?.model.summary ?? null);
    setCaseSource(json.data?.caseSource ?? "personal");
    await load();
  }

  async function publish() {
    setSaving(true);
    const values: Record<string, VariableValue> = {};
    for (const row of rows) {
      const raw = draft[row.key];
      if (raw == null) continue;
      values[row.key] = fromDraftValue(row.type, raw);
    }
    const res = await fetch("/api/nico/model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: { message: string };
    };
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Could not publish");
      return;
    }
    await load();
  }

  async function resetToShared() {
    setSaving(true);
    const res = await fetch("/api/nico/model", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToShared: true }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not reset");
      return;
    }
    await load();
  }

  const copy = caseCopy(caseSource, scope);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5">
      <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
        {copy.kicker}
      </p>
      <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
        {copy.title}
        <InfoTip topic="assumptions.blue" />
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.body}</p>
      {summary && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          FY1 cash {summary.fy1ClosingCashUsd.toLocaleString()} · FY10{" "}
          {summary.fy10ClosingCashUsd.toLocaleString()} · {summary.autosOriginated} autos ·{" "}
          {summary.aircraftOriginated} aircraft
        </p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <Accordion
        key={groups.map((g) => g.section.id).join("|")}
        type="multiple"
        defaultValue={defaultOpen}
        className="mt-5"
      >
        {groups.map(({ section, items }) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger>
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                <span>{section.title}</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {items.length} {items.length === 1 ? "input" : "inputs"}
                  {section.blurb ? ` · ${section.blurb}` : ""}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((row) => (
                  <div key={row.key} className="space-y-1.5">
                    <Label htmlFor={row.key} className="inline-flex items-center gap-1">
                      {row.label}
                      <InfoTip text={row.citation.note} />
                    </Label>
                    <Input
                      id={row.key}
                      type={row.type === "text" ? "text" : "number"}
                      disabled={!canEdit}
                      className={
                        row.visibility === "user"
                          ? "border-[#23a5b4]/40 text-[#23a5b4]"
                          : undefined
                      }
                      step={row.type === "percent" ? 1 : (row.step ?? 1)}
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
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {canEdit ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <WithTip topic="assumptions.save">
            <Button type="button" onClick={() => void save()} disabled={saving}>
              Save
            </Button>
          </WithTip>
          {caseSource === "personal" ? (
            <WithTip topic="assumptions.reset">
              <Button
                type="button"
                variant="outline"
                onClick={() => void resetToShared()}
                disabled={saving}
              >
                Reset
              </Button>
            </WithTip>
          ) : null}
          {scope === "admin" ? (
            <WithTip topic="assumptions.publish">
              <Button
                type="button"
                variant="outline"
                onClick={() => void publish()}
                disabled={saving}
              >
                Publish
              </Button>
            </WithTip>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">View only — members can save their own numbers.</p>
      )}
      {canEdit ? (
        <WhatIfShelf
          saving={saving}
          setSaving={setSaving}
          setError={setError}
          onApplied={async (result) => {
            if (result.model) setSummary(result.model.summary);
            if (result.caseSource) setCaseSource(result.caseSource);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}
