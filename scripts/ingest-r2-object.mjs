#!/usr/bin/env node
/**
 * One R2 object → local extract + derived R2 copy.
 * Does not migrate. Does not run a full MemoryChunk wipe.
 *
 *   node scripts/ingest-r2-object.mjs --key library/kb/raw/chat/2026-08-24/file.xlsx
 *   node scripts/ingest-r2-object.mjs --key … --file ./local.xlsx
 *   node --env-file=.env scripts/ingest-r2-object.mjs --key … --ocr   # force Mistral OCR
 *
 * Then: npm run knowledge:sync
 *        node --env-file=.env scripts/ingest-memory-chunks.mjs --apply --only knowledge/documents/<extract>.txt
 *        node --env-file=.env scripts/embed-chunks.mjs --only knowledge/documents/<extract>.txt
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ingestDeniedReason } from "./lib/ingest-deny.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const BUCKET = "tamarindo-files";

const VECTOR_PREFIXES = [
  "library/kb/raw/chat/",
  "library/kb/raw/dropbox/",
  "library/kb/derived/",
  "uploads/chat/",
  "source/dropbox/",
];
const METADATA_PREFIXES = [
  "library/kb/raw/brand/",
  "library/illustrations/",
  "library/media/",
  "library/inbox/",
  "source/brand/",
];

function arg(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : null;
}

function classify(key) {
  if (VECTOR_PREFIXES.some((p) => key.startsWith(p))) return "vector";
  if (METADATA_PREFIXES.some((p) => key.startsWith(p))) return "metadata";
  return "none";
}

function safeName(key, explicit) {
  if (explicit) return explicit.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const base = path.basename(key).replace(/\.[^.]+$/, "");
  return base.replace(/[^a-zA-Z0-9._-]+/g, "-") || "extract";
}

function isoDay(at = new Date()) {
  return at.toISOString().slice(0, 10);
}

function wrangler(args) {
  const result = spawnSync("npx", ["wrangler", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      `wrangler ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout;
}

async function extractText(filePath, key) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".txt" || ext === ".md") {
    return readFileSync(filePath, "utf8");
  }
  if (ext === ".xlsx" || ext === ".xlsm") {
    const py = `
import sys, zipfile, xml.etree.ElementTree as ET
ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
z = zipfile.ZipFile(sys.argv[1])
shared = []
if "xl/sharedStrings.xml" in z.namelist():
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    for si in root.findall("m:si", ns):
        shared.append("".join(t.text or "" for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")))
sheets = [n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")]
out = []
for name in sheets:
    root = ET.fromstring(z.read(name))
    rows = []
    for row in root.findall(".//m:sheetData/m:row", ns):
        cells = []
        for c in row.findall("m:c", ns):
            v = c.find("m:v", ns)
            if v is None or v.text is None:
                continue
            cells.append(shared[int(v.text)] if c.get("t") == "s" else v.text)
        if cells:
            rows.append(" | ".join(cells))
    if rows:
        out.append("## " + name)
        out.extend(rows)
print("\\n".join(out))
`;
    const result = spawnSync("python3", ["-c", py, filePath], {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`xlsx extract failed: ${result.stderr}`);
    }
    return result.stdout;
  }
  if (ext === ".pdf") {
    return extractPdf(filePath);
  }
  return `Caption: ${path.basename(key)} (${ext || "unknown type"}). Stored on R2; not fully extracted.`;
}

function pdfTextLooksWeak(text) {
  const trimmed = String(text || "").trim();
  const letters = (trimmed.match(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g) || []).length;
  return trimmed.length < 120 || letters < 80;
}

async function mistralOcrPdf(filePath) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY missing; cannot OCR");
  }
  const bytes = readFileSync(filePath);
  const res = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: `data:application/pdf;base64,${bytes.toString("base64")}`,
      },
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Mistral OCR HTTP ${res.status}: ${body.slice(0, 240)}`);
  }
  const json = JSON.parse(body);
  const pages = Array.isArray(json.pages) ? json.pages : [];
  const markdown = pages
    .map((page, i) => {
      const md = typeof page?.markdown === "string" ? page.markdown.trim() : "";
      return md ? `## Page ${page.index ?? i + 1}\n\n${md}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
  if (!markdown) throw new Error("Mistral OCR returned no page text");
  return markdown;
}

async function extractPdf(filePath) {
  const forceOcr = process.argv.includes("--ocr");
  let local = "";
  const result = spawnSync("pdftotext", ["-layout", filePath, "-"], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status === 0) local = result.stdout || "";
  if (!forceOcr && !pdfTextLooksWeak(local)) return local;
  if (!process.env.MISTRAL_API_KEY) {
    if (local.trim()) return local;
    throw new Error(
      result.status !== 0
        ? `pdftotext failed: ${result.stderr || "not installed"}`
        : "PDF extract empty and MISTRAL_API_KEY is not set",
    );
  }
  console.log(
    forceOcr
      ? "OCR: Mistral (forced)"
      : "OCR: Mistral (pdftotext looked weak or empty)",
  );
  return mistralOcrPdf(filePath);
}

async function main() {
  const key = arg("--key");
  if (!key) {
    console.error("Usage: node scripts/ingest-r2-object.mjs --key <r2-key> [--file <local>] [--extract-name <slug>]");
    process.exit(1);
  }

  const policy = classify(key);
  if (policy === "none") {
    console.log(`skip ${key}: index policy is none (stored, not searched)`);
    process.exit(0);
  }

  let local = arg("--file");
  if (!local) {
    const dest = path.join(tmpdir(), `tamarindo-r2-${path.basename(key)}`);
    wrangler(["r2", "object", "get", `${BUCKET}/${key}`, "--file", dest, "--remote"]);
    local = dest;
  }
  if (!existsSync(local)) {
    console.error(`local file missing: ${local}`);
    process.exit(1);
  }

  const slug = safeName(key, arg("--extract-name"));
  let text =
    policy === "metadata"
      ? `Caption: ${path.basename(key)} on shelf ${key.split("/").slice(0, 3).join("/")}.`
      : await extractText(local, key);

  const denied = ingestDeniedReason(key, text);
  if (denied) {
    console.error(`refusing to index ${key}: ${denied}`);
    process.exit(2);
  }

  if (!text.trim()) {
    console.error(`extract empty for ${key}`);
    process.exit(1);
  }
  if (!/^#\s+/m.test(text)) {
    text = `# ${slug}\n\nSource: R2 ${key}\n\n${text}`;
  }

  const rel = `knowledge/documents/${slug}-extracted.txt`;
  const abs = path.join(ROOT, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, text.endsWith("\n") ? text : `${text}\n`);

  const derivedKey = `library/kb/derived/extracts/${isoDay()}/${slug}-extracted.txt`;
  wrangler([
    "r2",
    "object",
    "put",
    `${BUCKET}/${derivedKey}`,
    "--file",
    abs,
    "--remote",
    "--content-type",
    "text/plain; charset=utf-8",
  ]);

  console.log(`extract: ${rel}`);
  console.log(`derived: ${derivedKey}`);
  console.log("next:");
  console.log("  npm run knowledge:sync");
  console.log(
    `  node --env-file=.env scripts/ingest-memory-chunks.mjs --apply --only ${rel}`,
  );
  console.log(`  node --env-file=.env scripts/embed-chunks.mjs --only ${rel}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
