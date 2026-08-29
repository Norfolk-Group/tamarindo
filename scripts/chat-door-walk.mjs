/**
 * Live chat-path walk: Next handshake → sibling /turn → glance exports.
 * Expects npm run dev :3000 and wrangler :8788.
 */
import { parseChat } from "../lib/nico/chat-rich-parse.ts";

const NEXT = process.env.NICO_NEXT_ORIGIN ?? "http://127.0.0.1:3000";
const AGENT = process.env.NICO_AGENT_URL ?? "http://127.0.0.1:8788";

async function handshake(conversationId) {
  const res = await fetch(`${NEXT}/api/nico/handshake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });
  if (!res.ok) throw new Error(`handshake ${res.status}`);
  const body = await res.json();
  if (!body.ok || !body.data?.token) throw new Error("handshake envelope");
  return body.data;
}

function parseSse(raw) {
  const events = [];
  for (const block of raw.split("\n\n")) {
    const line = block
      .split("\n")
      .filter((row) => row.startsWith("data: "))
      .map((row) => row.slice(6))
      .join("");
    if (!line) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      /* ignore keep-alives */
    }
  }
  return events;
}

async function turn(token, message) {
  const res = await fetch(`${AGENT}/turn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nico-handshake": token,
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`/turn ${res.status} ${await res.text()}`);
  const events = parseSse(await res.text());
  const spoken = events
    .filter((e) => e.type === "token")
    .map((e) => e.text)
    .join("");
  const labels = events
    .filter((e) => e.type === "activity")
    .map((e) => e.label);
  return { events, spoken, labels, segments: parseChat(spoken) };
}

async function checkExport(path) {
  const url = path.startsWith("http") ? path : `${NEXT}${path}`;
  const res = await fetch(url);
  const bytes = Buffer.from(await res.arrayBuffer());
  return { status: res.status, type: res.headers.get("content-type"), bytes: bytes.length, magic: bytes.subarray(0, 4).toString("latin1") };
}

const conversationId = `chat-walk-${Date.now()}`;
const { token } = await handshake(conversationId);

const doors = [
  { name: "explain", message: "how does Tamarindo work" },
  { name: "statements", message: "show me the books" },
  { name: "returns", message: "what's the IRR" },
  { name: "sensitivity", message: "run a stress test" },
  { name: "ticket", message: "what do we make on a $500k lease" },
];

const out = { conversationId, doors: {} };
for (const door of doors) {
  const result = await turn(token, door.message);
  const report = result.segments.find((s) => s.kind === "report");
  const table = result.segments.find((s) => s.kind === "table");
  const exports = {};
  if (report?.kind === "report") {
    for (const key of ["previewPath", "pdfPath", "csvPath", "xlsxPath"]) {
      const path = report.spec[key];
      if (path) exports[key] = await checkExport(path);
    }
  }
  out.doors[door.name] = {
    thinking: result.labels.includes("Nico is thinking…"),
    spokenStart: result.spoken.trim().slice(0, 180),
    hasReport: Boolean(report),
    reportKind: report?.kind === "report" ? report.spec.kind : null,
    hasTable: Boolean(table),
    exports,
  };
}

console.log(JSON.stringify(out, null, 2));

const statements = out.doors.statements.exports;
const returns = out.doors.returns.exports;
const sens = out.doors.sensitivity.exports;
if (!out.doors.explain.thinking || out.doors.explain.spokenStart.length < 40) {
  throw new Error("explain door failed");
}
if (!out.doors.ticket.hasTable) throw new Error("ticket table missing");
for (const [name, pack] of [
  ["statements", statements],
  ["returns", returns],
  ["sensitivity", sens],
]) {
  if (!pack.xlsxPath || pack.xlsxPath.status !== 200 || !pack.xlsxPath.magic.startsWith("PK")) {
    throw new Error(`${name} excel failed`);
  }
  if (!pack.pdfPath || pack.pdfPath.status !== 200 || !pack.pdfPath.magic.startsWith("%PDF")) {
    throw new Error(`${name} pdf failed`);
  }
  if (!pack.csvPath || pack.csvPath.status !== 200) throw new Error(`${name} csv failed`);
  if (!pack.previewPath || pack.previewPath.status !== 200) throw new Error(`${name} html failed`);
}
console.log("chat-door-walk ok");
