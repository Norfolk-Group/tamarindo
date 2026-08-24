export type ChartSpec = {
  title?: string;
  type?: "bar" | "hbar";
  labels: string[];
  values: number[];
  unit?: string;
};

export type ChatSegment =
  | { kind: "text"; text: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "chart"; spec: ChartSpec };

const CHART_FENCE = /```chart\s*\n([\s\S]*?)```/g;

export function parseChat(text: string): ChatSegment[] {
  const pieces: ChatSegment[] = [];
  let last = 0;
  const re = new RegExp(CHART_FENCE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    pieces.push(...parseMarkdownTables(text.slice(last, match.index)));
    const spec = parseChart(match[1] ?? "");
    if (spec) pieces.push({ kind: "chart", spec });
    else pieces.push({ kind: "text", text: match[0] });
    last = match.index + match[0].length;
  }
  pieces.push(...parseMarkdownTables(text.slice(last)));
  return pieces.filter((p) => p.kind !== "text" || p.text.trim().length > 0);
}

export function parseChart(raw: string): ChartSpec | null {
  try {
    const json = JSON.parse(raw) as ChartSpec;
    if (!Array.isArray(json.labels) || !Array.isArray(json.values)) return null;
    return json;
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
