"use client";

import { useState } from "react";
import { ChatChart } from "@/components/nico/chat-chart";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GlanceRow, GlanceTable, ReportDepth, ReportGlance } from "@/lib/model/report-glance";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  gold: "text-[#ffc94d]",
  blue: "text-[#23a5b4]",
  dim: "text-muted-foreground",
  plain: "",
};

function hasExtended(spec: ReportGlance): spec is ReportGlance & { extended: GlanceTable } {
  if (!spec.extended) return false;
  if (spec.extended.headers.join("\0") !== spec.headers.join("\0")) return true;
  return spec.extended.rows.length !== spec.rows.length;
}

function GlanceGrid({ headers, rows }: { headers: string[]; rows: GlanceRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header} className="font-mono text-[10px] uppercase tracking-wider">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={`${row.cells[0]}-${i}`}>
            {row.cells.map((cell, c) => (
              <TableCell
                key={`${i}-${c}`}
                className={cn("font-mono text-xs", c > 0 && "text-right", TONE[row.tone ?? "plain"])}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ChatReportGlance({ spec }: { spec: ReportGlance }) {
  const extended = hasExtended(spec);
  const [depth, setDepth] = useState<ReportDepth>(
    spec.defaultDepth === "extended" && extended ? "extended" : "summary",
  );
  const table: GlanceTable =
    depth === "extended" && spec.extended
      ? spec.extended
      : { headers: spec.headers, rows: spec.rows };

  return (
    <figure className="nico-rich-enter overflow-hidden rounded-lg border border-border bg-card">
      <figcaption className="border-b border-border px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#23a5b4]">
            Live model · {depth}
            <InfoTip topic="statements.live" />
          </p>
          {extended ? (
            <Tabs
              value={depth}
              onValueChange={(value) => setDepth(value === "extended" ? "extended" : "summary")}
            >
              <TabsList variant="line" className="h-7">
                <TabsTrigger value="summary" className="px-2 text-[11px]">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="extended" className="px-2 text-[11px]">
                  Extended
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
        </div>
        <h3 className="mt-1 text-sm font-medium tracking-tight">{spec.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{spec.takeaway}</p>
      </figcaption>
      <div className="px-1 py-1">
        <GlanceGrid headers={table.headers} rows={table.rows} />
      </div>
      {spec.chart ? (
        <div className="border-t border-border px-2 py-2">
          <ChatChart spec={spec.chart} />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2">
        <span className="inline-flex items-center gap-0.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => window.open(spec.previewPath, "_blank", "noopener,noreferrer")}
          >
            {spec.kind === "structure" ? "Diagram" : "Full book"}
          </Button>
          <InfoTip topic={spec.kind === "structure" ? "statements.structure" : "statements.book"} />
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={spec.pdfPath}>PDF</a>
          </Button>
          <InfoTip topic="statements.pdf" />
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={spec.csvPath}>CSV</a>
          </Button>
          <InfoTip topic="statements.csv" />
        </span>
        {spec.xlsxPath ? (
          <span className="inline-flex items-center gap-0.5">
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={spec.xlsxPath}>Excel</a>
            </Button>
            <InfoTip topic="statements.excel" />
          </span>
        ) : null}
      </div>
    </figure>
  );
}
