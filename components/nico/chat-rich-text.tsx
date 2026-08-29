"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChatChart } from "@/components/nico/chat-chart";
import { ChatMedia } from "@/components/nico/chat-media";
import { ChatReportGlance } from "@/components/nico/chat-report-glance";
import { parseChat } from "@/lib/nico/chat-rich-parse";

export function ChatRichText({
  text,
  streaming = false,
}: {
  text: string;
  streaming?: boolean;
}) {
  const segments = parseChat(text);
  return (
    <div
      className={
        streaming
          ? "nico-stream-ink flex flex-col gap-3 text-sm leading-relaxed"
          : "flex flex-col gap-3 text-sm leading-relaxed"
      }
    >
      {segments.map((segment, i) => {
        const last = i === segments.length - 1;
        if (segment.kind === "chart") {
          return <ChatChart key={i} spec={segment.spec} />;
        }
        if (segment.kind === "report") {
          return <ChatReportGlance key={i} spec={segment.spec} />;
        }
        if (segment.kind === "image" || segment.kind === "video") {
          return <ChatMedia key={i} kind={segment.kind} spec={segment.spec} />;
        }
        if (segment.kind === "table") {
          return (
            <Table key={i} className="nico-rich-enter">
              <TableHeader>
                <TableRow>
                  {segment.headers.map((h) => (
                    <TableHead key={h} className="font-mono">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {segment.rows.map((row, r) => (
                  <TableRow key={r}>
                    {row.map((cell, c) => (
                      <TableCell key={c} className="font-mono">
                        {cell}
                      </TableCell>
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
            {streaming && last ? (
              <span className="nico-caret ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-teal-400 align-middle" />
            ) : null}
          </div>
        );
      })}
      {streaming && segments.length === 0 ? (
        <span className="nico-caret inline-block h-4 w-1.5 bg-teal-400" />
      ) : null}
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
