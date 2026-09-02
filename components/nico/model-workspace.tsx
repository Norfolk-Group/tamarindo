"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { InfoTip } from "@/components/nico/info-tip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPct, formatUsd } from "@/lib/model/format";
import type {
  CapTableView,
  CashflowModel,
  DivisionStatement,
  StatementLine,
} from "@/lib/model/types";

const SCF_SECTIONS: Array<{
  key: StatementLine["section"];
  title: string;
}> = [
  { key: "operatingIn", title: "Cash from operations — receipts" },
  { key: "operatingOut", title: "Cash from operations — payments" },
  { key: "investing", title: "Cash from investing" },
  { key: "financing", title: "Cash from financing" },
  { key: "memo", title: "Supplementary (not in cash totals)" },
];

function sectionedLines(
  division: DivisionStatement,
): Array<{ kind: "section"; title: string } | { kind: "line"; line: StatementLine }> {
  const out: Array<
    { kind: "section"; title: string } | { kind: "line"; line: StatementLine }
  > = [];
  for (const section of SCF_SECTIONS) {
    const lines = division.lines.filter((line) => line.section === section.key);
    if (lines.length === 0) continue;
    out.push({ kind: "section", title: section.title });
    for (const line of lines) out.push({ kind: "line", line });
  }
  return out;
}

type Payload = {
  model: CashflowModel;
};

type ExplainNode = {
  key: string;
  label: string;
  sheet: string;
  fy: number | null;
  kind: string;
  value: number;
  formula: string | null;
  inputs: ExplainNode[];
};

export function ModelWorkspace() {
  const [model, setModel] = useState<CashflowModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [probeKey, setProbeKey] = useState<string | null>(null);
  const [probe, setProbe] = useState<ExplainNode | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);

  async function explain(key: string) {
    setProbeKey(key);
    setProbe(null);
    setProbeError(null);
    const res = await fetch(`/api/nico/model/explain?key=${encodeURIComponent(key)}`);
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { cell: ExplainNode };
      error?: { message: string };
    };
    if (!json.ok || !json.data) {
      setProbeError(json.error?.message ?? "Could not trace this cell");
      return;
    }
    setProbe(json.data.cell);
  }

  async function load() {
    const res = await fetch("/api/nico/model");
    const json = (await res.json()) as {
      ok?: boolean;
      data?: Payload;
      error?: { message: string };
    };
    if (!json.ok || !json.data) {
      setError(json.error?.message ?? "Could not load the model");
      return;
    }
    setError(null);
    setModel(json.data.model);
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) {
    return <p className="p-6 text-sm text-destructive">{error}</p>;
  }
  if (!model) {
    return <p className="p-6 text-sm text-muted-foreground">Calculating on the server…</p>;
  }

  const s = model.summary;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
            STATEMENTS · LIVE MODEL
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            US · Colombia sucursal · Consolidated · Intervest vehicle
            <InfoTip topic="statements.live" />
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {s.homesOriginated} homes · {s.autosOriginated} autos ·{" "}
            {s.aircraftOriginated} aircraft · January cohort {s.januaryCohortYear}.
            Five equal partners; $6.5M equity across three rounds pays the venture.
            Intervest is the funding vehicle — down, remittance, balloon — not
            OpCo cash and not on the cap table. Colombia bills clients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportTip topic="statements.income">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("/api/nico/model/export?format=html&kind=income", "_blank", "noopener,noreferrer")
              }
            >
              Income
            </Button>
          </ExportTip>
          <ExportTip topic="statements.book">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("/api/nico/model/export?format=html&kind=statements", "_blank", "noopener,noreferrer")
              }
            >
              Statements
            </Button>
          </ExportTip>
          <ExportTip topic="statements.returns">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("/api/nico/model/export?format=html&kind=returns", "_blank", "noopener,noreferrer")
              }
            >
              Returns
            </Button>
          </ExportTip>
          <ExportTip topic="statements.sensitivity">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("/api/nico/model/export?format=html&kind=sensitivity", "_blank", "noopener,noreferrer")
              }
            >
              Sensitivity
            </Button>
          </ExportTip>
          <ExportTip topic="statements.csv">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href="/api/nico/model/export?format=csv&kind=statements">CSV</a>
            </Button>
          </ExportTip>
          <ExportTip topic="statements.pdf">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href="/api/nico/model/export?format=pdf&kind=statements">PDF</a>
            </Button>
          </ExportTip>
          <ExportTip topic="statements.excel">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href="/api/nico/model/export?format=xlsx">Excel</a>
            </Button>
          </ExportTip>
          <ExportTip topic="statements.excelSpec">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href="/api/nico/spec" download="tamarindo-excel-spec.md">
                Excel spec
              </a>
            </Button>
          </ExportTip>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="FY1 cash" value={formatUsd(s.fy1ClosingCashUsd)} topic="statements.fy1" />
        <Stat label="FY10 cash" value={formatUsd(s.fy10ClosingCashUsd)} topic="statements.fy10" />
        <Stat label="Property book, FY10" value={formatUsd(s.homeAumEndUsd)} />
        <Stat label="Auto book, FY10" value={formatUsd(s.autoAumEndUsd)} />
        <Stat label="Aircraft book, FY10" value={formatUsd(s.aircraftAumEndUsd)} />
        <Stat label="Intervest, FY10" value={formatUsd(s.intervestLineEndUsd)} />
        <Stat label="Other partners, FY10" value={formatUsd(s.partnerLineEndUsd)} />
        <Stat label="Funded AUM, FY10" value={formatUsd(s.fundedAumEndUsd)} />
      </div>

      <Tabs defaultValue="consolidated" className="mt-8">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="us">Tamarindo US</TabsTrigger>
          <TabsTrigger value="sucursal">Colombia sucursal</TabsTrigger>
          <TabsTrigger value="consolidated">Consolidated</TabsTrigger>
          <TabsTrigger value="vehicle">Intervest vehicle</TabsTrigger>
          <TabsTrigger value="equity">Equity</TabsTrigger>
        </TabsList>
        <TabsContent value="us">
          <DivisionTable division={model.us} onProbe={explain} />
        </TabsContent>
        <TabsContent value="sucursal">
          <DivisionTable division={model.sucursal} onProbe={explain} />
        </TabsContent>
        <TabsContent value="consolidated">
          <DivisionTable division={model.consolidated} onProbe={explain} />
        </TabsContent>
        <TabsContent value="vehicle">
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            The lessee pays this vehicle the down payment, monthly remittance
            (after Tamarindo’s strip), and the purchase-option balloon. Title
            stays here until that balloon is paid. Not consolidated into OpCo.
          </p>
          <DivisionTable division={model.vehicle} onProbe={explain} />
        </TabsContent>
        <TabsContent value="equity">
          <CapTableBlock table={model.capTable} />
        </TabsContent>
      </Tabs>

      {probeKey ? (
        <ProvenancePanel
          cellKey={probeKey}
          node={probe}
          error={probeError}
          onClose={() => {
            setProbeKey(null);
            setProbe(null);
            setProbeError(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ProvenancePanel({
  cellKey,
  node,
  error,
  onClose,
}: {
  cellKey: string;
  node: ExplainNode | null;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
            WHERE THIS NUMBER COMES FROM
            <InfoTip topic="statements.probe" />
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{cellKey}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : node ? (
        <div className="mt-3">
          <ExplainTree node={node} depth={0} />
          <p className="mt-3 text-[11px] text-muted-foreground">
            From the stored cell graph (latest scenario). Save a scenario after
            changing variables to refresh provenance.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Tracing…</p>
      )}
    </div>
  );
}

function ExplainTree({ node, depth }: { node: ExplainNode; depth: number }) {
  return (
    <div className={depth > 0 ? "mt-1.5 border-l border-border pl-3" : ""}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-xs font-medium">
          {formatUsd(node.value)}
        </span>
        <span className="text-xs text-muted-foreground">
          {node.label}
          {node.fy ? ` · FY${node.fy}` : ""}
          {node.kind === "input" ? " · variable" : ""}
        </span>
      </div>
      {node.formula ? (
        <p className="mt-0.5 text-[11px] italic text-muted-foreground">
          = {node.formula}
        </p>
      ) : null}
      {node.inputs.map((child) => (
        <ExplainTree key={child.key} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function CapTableBlock({ table }: { table: CapTableView }) {
  return (
    <div className="mt-4 space-y-6">
      <p className="text-sm text-muted-foreground">
        {table.founderCount} equal partners (names TBD). Raised{" "}
        {formatUsd(table.raisedUsd)}. Each founder starts at{" "}
        {formatPct(table.eachFounderStart)} and ends at{" "}
        {formatPct(table.eachFounderEnd)}. Intervest is not on this table.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Round</TableHead>
            <TableHead>Pre-money</TableHead>
            <TableHead>Raise</TableHead>
            <TableHead>Post-money</TableHead>
            <TableHead>Sold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rounds.map((round) => (
            <TableRow key={round.id}>
              <TableCell>{round.label}</TableCell>
              <TableCell>{formatUsd(round.preMoneyUsd)}</TableCell>
              <TableCell>{formatUsd(round.amountUsd)}</TableCell>
              <TableCell>{formatUsd(round.postMoneyUsd)}</TableCell>
              <TableCell>{formatPct(round.percentSold)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Holder</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Ownership</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.holdersEnd.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.klass}</TableCell>
              <TableCell>{formatPct(row.percent)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function Stat({
  label,
  value,
  topic,
}: {
  label: string;
  value: string;
  topic?: string;
}) {
  return (
    <div className="border-t border-border pt-3">
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {label}
        {topic ? <InfoTip topic={topic} /> : null}
      </p>
    </div>
  );
}

function ExportTip({
  topic,
  children,
}: {
  topic: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {children}
      <InfoTip topic={topic} />
    </span>
  );
}

function DivisionTable({
  division,
  onProbe,
}: {
  division: DivisionStatement;
  onProbe: (key: string) => void;
}) {
  const sections = useMemo(() => {
    const out: Array<{ title: string; lines: StatementLine[] }> = [];
    for (const row of sectionedLines(division)) {
      if (row.kind === "section") {
        out.push({ title: row.title, lines: [] });
      } else {
        const last = out[out.length - 1];
        if (last) last.lines.push(row.line);
        else out.push({ title: "Lines", lines: [row.line] });
      }
    }
    return out;
  }, [division]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  function isOpen(title: string): boolean {
    return open[title] !== false;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-52">Line</TableHead>
            {division.years.map((year) => (
              <TableHead key={year.fy} className="text-right">
                FY{year.fy}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <Fragment key={section.title}>
              <TableRow>
                <TableCell colSpan={division.years.length + 1} className="p-0">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2 pt-5 pb-1 text-left text-[11px] font-medium tracking-[0.14em] text-muted-foreground hover:text-foreground"
                    aria-expanded={isOpen(section.title)}
                    onClick={() =>
                      setOpen((current) => ({
                        ...current,
                        [section.title]: !isOpen(section.title),
                      }))
                    }
                  >
                    <ChevronDown
                      className={`size-3.5 transition-transform ${isOpen(section.title) ? "" : "-rotate-90"}`}
                      aria-hidden
                    />
                    {section.title}
                  </button>
                </TableCell>
              </TableRow>
              {isOpen(section.title)
                ? section.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-muted-foreground">{line.label}</TableCell>
                      {line.values.map((value, i) => (
                        <TableCell key={`${line.id}-${i}`} className="p-0 text-right">
                          <button
                            type="button"
                            className="w-full px-2 py-2 text-right font-mono text-xs hover:bg-muted/60"
                            title="Trace this number"
                            onClick={() => onProbe(`${division.id}.${line.id}.fy${i + 1}`)}
                          >
                            {formatUsd(value)}
                          </button>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
            </Fragment>
          ))}
          <TableRow>
            <TableCell className="font-medium">Closing cash</TableCell>
            {division.years.map((year) => (
              <TableCell key={`close-${year.fy}`} className="p-0 text-right">
                <button
                  type="button"
                  className="w-full px-2 py-2 text-right font-mono text-xs font-medium hover:bg-muted/60"
                  title="Trace this number"
                  onClick={() => onProbe(`${division.id}.closingCash.fy${year.fy}`)}
                >
                  {formatUsd(year.closingCashUsd)}
                </button>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
