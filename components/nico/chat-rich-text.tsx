"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseChat,
  type ChartSpec,
} from "@/lib/nico/chat-rich-parse";

export function ChatRichText({ text }: { text: string }) {
  const segments = parseChat(text);
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      {segments.map((segment, i) => {
        if (segment.kind === "chart") {
          return <InlineBarChart key={i} spec={segment.spec} />;
        }
        if (segment.kind === "table") {
          return (
            <Table key={i}>
              <TableHeader>
                <TableRow>
                  {segment.headers.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {segment.rows.map((row, r) => (
                  <TableRow key={r}>
                    {row.map((cell, c) => (
                      <TableCell key={c}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          );
        }
        return (
          <div key={i} className="whitespace-pre-wrap">
            {renderInline(segment.text)}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function InlineBarChart({ spec }: { spec: ChartSpec }) {
  const max = Math.max(...spec.values.map((v) => Math.abs(v)), 1);
  const horizontal = spec.type === "hbar";
  return (
    <figure className="rounded-lg border border-border p-3">
      {spec.title ? (
        <figcaption className="mb-2 text-xs text-muted-foreground">
          {spec.title}
          {spec.unit ? ` (${spec.unit})` : ""}
        </figcaption>
      ) : null}
      <div className={horizontal ? "flex flex-col gap-2" : "flex items-end gap-2 h-36"}>
        {spec.labels.map((label, i) => {
          const value = spec.values[i] ?? 0;
          const pct = Math.max(4, (Math.abs(value) / max) * 100);
          return (
            <div
              key={label}
              className={
                horizontal
                  ? "grid grid-cols-[7rem_1fr_auto] items-center gap-2"
                  : "flex min-w-0 flex-1 flex-col items-center gap-1"
              }
            >
              {horizontal ? (
                <span className="truncate text-xs text-muted-foreground">
                  {label}
                </span>
              ) : null}
              <div
                className={
                  horizontal
                    ? "h-2 rounded-sm bg-primary/80"
                    : "w-full rounded-sm bg-primary/80"
                }
                style={
                  horizontal
                    ? { width: `${pct}%` }
                    : { height: `${pct}%` }
                }
              />
              {horizontal ? (
                <span className="text-xs tabular-nums">{value}</span>
              ) : (
                <>
                  <span className="text-xs tabular-nums">{value}</span>
                  <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                    {label}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
