import { parseReportGlance, type ReportGlance } from "@/lib/model/report-glance";

export type ChartSeries = { name: string; values: number[] };

export type ChartSpec = {
  title?: string;
  type?: "bar" | "hbar" | "line" | "area" | "pie";
  labels: string[];
  values: number[];
  series?: ChartSeries[];
  unit?: string;
};

export type MediaSpec = {
  url: string;
  alt: string;
  title?: string;
};

export type ChatSegment =
  | { kind: "text"; text: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "chart"; spec: ChartSpec }
  | { kind: "report"; spec: ReportGlance }
  | { kind: "image"; spec: MediaSpec }
  | { kind: "video"; spec: MediaSpec };

const FENCE = /```(chart|image|video|report)\s*\n([\s\S]*?)```/g;

export function parseChat(text: string): ChatSegment[] {
  const pieces: ChatSegment[] = [];
  let last = 0;
  const re = new RegExp(FENCE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    pieces.push(...parseMarkdownTables(text.slice(last, match.index)));
    const tag = match[1];
    const body = match[2] ?? "";
    if (tag === "chart") {
      const spec = parseChart(body);
      pieces.push(spec ? { kind: "chart", spec } : { kind: "text", text: match[0] });
    } else if (tag === "report") {
      const spec = parseReportGlance(body);
      pieces.push(spec ? { kind: "report", spec } : { kind: "text", text: match[0] });
    } else if (tag === "image" || tag === "video") {
      const spec = parseMedia(body);
      pieces.push(spec ? { kind: tag, spec } : { kind: "text", text: match[0] });
    }
    last = match.index + match[0].length;
  }
  pieces.push(...parseMarkdownTables(text.slice(last)));
  return pieces.filter((p) => p.kind !== "text" || p.text.trim().length > 0);
}

export function parseChart(raw: string): ChartSpec | null {
  try {
    const json = JSON.parse(raw) as ChartSpec;
    if (!Array.isArray(json.labels)) return null;
    if (!Array.isArray(json.values) && !Array.isArray(json.series)) return null;
    return {
      ...json,
      values: Array.isArray(json.values) ? json.values : json.series?.[0]?.values ?? [],
    };
  } catch {
    return null;
  }
}

export function parseMedia(raw: string): MediaSpec | null {
  try {
    const json = JSON.parse(raw) as MediaSpec;
    if (typeof json.url !== "string" || !json.url) return null;
    return {
      url: json.url,
      alt: typeof json.alt === "string" ? json.alt : "Illustration",
      title: json.title,
    };
  } catch {
    return null;
  }
}

export function parseMarkdownTables(text: string): ChatSegment[] {
  const lines = text.split("\n");
  const out: ChatSegment[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length) {
      out.push({ kind: "text", text: buffer.join("\n") });
      buffer = [];
    }
  };
  for (let i = 0; i < lines.length; i++) {
    if (isTableDivider(lines[i + 1]) && isTableRow(lines[i])) {
      flush();
      const headers = splitRow(lines[i]);
      i += 1;
      const rows: string[][] = [];
      while (i + 1 < lines.length && isTableRow(lines[i + 1])) {
        i += 1;
        rows.push(splitRow(lines[i]));
      }
      out.push({ kind: "table", headers, rows });
    } else {
      buffer.push(lines[i]);
    }
  }
  flush();
  return out;
}

function isTableRow(line: string | undefined): boolean {
  if (!line) return false;
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.includes("|", 1);
}

function isTableDivider(line: string | undefined): boolean {
  if (!line) return false;
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}
