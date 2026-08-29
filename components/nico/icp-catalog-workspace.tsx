"use client";

import { useEffect, useMemo, useState } from "react";
import { InfoTip } from "@/components/nico/info-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATALOG_BY_ID } from "@/lib/model/icp-catalog";
import { fieldHelpId } from "@/lib/nico/help-catalog";
import { fromDraftValue, toDraftValue } from "@/lib/model/variable-display";
import type { AssetClass, CatalogIcpId, ModelVariableView, VariableValue } from "@/lib/model/types";

type CatalogRow = {
  id: CatalogIcpId;
  assetClass: AssetClass;
  code: string;
  name: string;
  city: string;
  neighborhood: string;
  asset: string;
  persona: string;
  explanation: string;
  researchNote: string;
  sources: { label: string; url: string }[];
  purchasePriceUsd: number;
  fundedUsd: number;
  residualUsd: number;
  monthlyLeaseUsd: number;
  clientRate: number;
  termMonths: number;
  mixWeight: number;
};

const GROUPS: Array<{ id: AssetClass; title: string; blurb: string; topic: string }> = [
  {
    id: "property",
    title: "Properties",
    blurb: "Six named home contracts. Medellín and Cartagena only at launch.",
    topic: "icp.property",
  },
  {
    id: "auto",
    title: "Cars",
    blurb: "Two Colombia dealer tickets. Same US-FICO lessee as the home book.",
    topic: "icp.auto",
  },
  {
    id: "aircraft",
    title: "Aircraft",
    blurb: "Two hulls: Andes utility and a US–Colombia light jet.",
    topic: "icp.aircraft",
  },
];

const FIELD_KEYS = [
  "purchasePriceUsd",
  "termMonths",
  "clientRate",
  "mixWeight",
  "rentedTimePct",
  "rentFactor",
] as const;

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

function pct(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

export function IcpCatalogWorkspace() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [defs, setDefs] = useState<ModelVariableView[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [catalogRes, modelRes] = await Promise.all([
      fetch("/api/nico/icp"),
      fetch("/api/nico/model"),
    ]);
    const catalogJson = (await catalogRes.json()) as {
      ok?: boolean;
      data?: { icps?: CatalogRow[] };
      error?: { message: string };
    };
    const modelJson = (await modelRes.json()) as {
      ok?: boolean;
      data?: { variables?: ModelVariableView[] };
      error?: { message: string };
    };
    if (!catalogJson.ok || !catalogJson.data?.icps) {
      setError(catalogJson.error?.message ?? "Could not load ICPs");
      return;
    }
    if (!modelJson.ok || !modelJson.data?.variables) {
      setError(modelJson.error?.message ?? "Could not load ICP inputs");
      return;
    }
    setError(null);
    setRows(catalogJson.data.icps);
    const icpVars = modelJson.data.variables.filter((row) => row.key.startsWith("icp."));
    setDefs(icpVars);
    setDraft(
      Object.fromEntries(icpVars.map((row) => [row.key, toDraftValue(row.type, row.value)])),
    );
  }

  useEffect(() => {
    void load();
  }, []);

  const byClass = useMemo(() => {
    return GROUPS.map((group) => ({
      ...group,
      items: rows.filter((row) => row.assetClass === group.id),
    }));
  }, [rows]);

  async function save(keys: string[]) {
    setSaving(true);
    const values: Record<string, VariableValue> = {};
    for (const key of keys) {
      const def = defs.find((row) => row.key === key);
      const raw = draft[key];
      if (!def || raw == null) continue;
      values[key] = fromDraftValue(def.type, raw);
    }
    const res = await fetch("/api/nico/model", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
    setSaving(false);
    if (!json.ok) {
      setError(json.error?.message ?? "Could not save");
      return;
    }
    await load();
  }

  function restoreSeed(id: CatalogIcpId) {
    const next = { ...draft };
    for (const field of FIELD_KEYS) {
      const def = defs.find((row) => row.key === `icp.${id}.${field}`);
      if (!def) continue;
      next[def.key] = toDraftValue(def.type, def.defaultValue);
    }
    setDraft(next);
  }

  function keysFor(id: CatalogIcpId) {
    return defs.filter((row) => row.key.startsWith(`icp.${id}.`)).map((row) => row.key);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8">
      <div>
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
          ADMIN · IDEAL CONTRACT PROFILES
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold">
          ICPs
          <InfoTip topic="icp.catalog" />
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Ten named contracts: six properties, two cars, two aircraft. Seeds come from
          Colombia housing and dealer lists (2026), Bancolombia vehicle-lease terms, and
          used-aircraft / Colombia charter tapes. Only an admin can edit. Members see the
          live book; they do not change these profiles.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {byClass.map((group) => (
        <section key={group.id} className="space-y-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              {group.title}
              <InfoTip topic={group.topic} />
            </h3>
            <p className="text-sm text-muted-foreground">{group.blurb}</p>
          </div>
          <div className="grid gap-4">
            {group.items.map((row) => (
              <IcpCard
                key={row.id}
                row={row}
                defs={defs}
                draft={draft}
                saving={saving}
                onDraft={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
                onRestore={() => restoreSeed(row.id)}
                onSave={() => void save(keysFor(row.id))}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IcpCard({
  row,
  defs,
  draft,
  saving,
  onDraft,
  onRestore,
  onSave,
}: {
  row: CatalogRow;
  defs: ModelVariableView[];
  draft: Record<string, string>;
  saving: boolean;
  onDraft: (key: string, value: string) => void;
  onRestore: () => void;
  onSave: () => void;
}) {
  const profile = CATALOG_BY_ID[row.id];
  const fields = defs.filter((def) => def.key.startsWith(`icp.${row.id}.`));
  return (
    <article className="rounded-lg border border-border bg-card/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
            {row.code} · {row.city}
          </p>
          <h4 className="text-base font-semibold">{row.name}</h4>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {money(row.purchasePriceUsd)} · {money(row.monthlyLeaseUsd)}/mo · {row.termMonths} mo ·{" "}
          {pct(row.clientRate)} · mix {pct(row.mixWeight)}
        </p>
      </div>
      <p className="mt-3 text-sm">{row.explanation}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Who / what. </span>
        {row.persona}. {row.asset}. {row.neighborhood}.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{row.researchNote}</p>
      {row.sources.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
          {row.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((def) => (
          <div key={def.key} className="space-y-1.5">
            <Label htmlFor={def.key} className="inline-flex items-center gap-1">
              {def.label.replace(`${profile.code} ${profile.name} `, "")}
              <InfoTip topic={fieldHelpId(def.key)} text={def.citation.note} />
            </Label>
            <Input
              id={def.key}
              type="number"
              value={draft[def.key] ?? ""}
              onChange={(event) => onDraft(def.key, event.target.value)}
              step={def.type === "percent" ? 1 : (def.step ?? 1)}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onSave} disabled={saving}>
          Save this ICP
        </Button>
        <span className="inline-flex items-center gap-1">
          <Button type="button" size="sm" variant="outline" onClick={onRestore} disabled={saving}>
            Restore research seed
          </Button>
          <InfoTip topic="icp.seed" />
        </span>
      </div>
    </article>
  );
}
