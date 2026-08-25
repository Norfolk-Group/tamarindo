/**
 * Google Gemini REST — no extra SDK so this stays Workers-safe.
 * Images: Nano Banana Pro (`gemini-3-pro-image`) via Interactions API.
 * Video: Veo 3.1 Fast via predictLongRunning.
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 */

const GEMINI_ROOT = "https://generativelanguage.googleapis.com/v1beta";
const IMAGE_MODEL = "gemini-3-pro-image";
const VIDEO_MODEL = "veo-3.1-fast-generate-preview";
const VIDEO_POLL_MS = 5_000;
const VIDEO_POLLS = 8;

export type GeminiImage = {
  mimeType: string;
  bytes: Uint8Array;
};

export type GeminiVideo =
  | { status: "ready"; mimeType: string; bytes: Uint8Array }
  | { status: "pending"; operation: string };

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set — I cannot make pictures yet.");
  }
  return key;
}

async function geminiFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<unknown> {
  const { timeoutMs = 45_000, ...rest } = init;
  const res = await fetch(`${GEMINI_ROOT}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey(),
      "Api-Revision": "2026-05-20",
      ...(rest.headers ?? {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message ?? `Gemini HTTP ${res.status}`);
  }
  return json;
}

function decodeB64(data: string): Uint8Array {
  const binary = atob(data.replace(/\s/g, ""));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function walkImage(node: unknown, depth = 0): GeminiImage | null {
  if (!node || depth > 8) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = walkImage(item, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const row = node as Record<string, unknown>;
  const data =
    (typeof row.data === "string" && row.data) ||
    (typeof row.b64_json === "string" && row.b64_json) ||
    (typeof (row.inline_data as { data?: string } | undefined)?.data ===
      "string" &&
      (row.inline_data as { data: string }).data) ||
    (typeof (row.inlineData as { data?: string } | undefined)?.data ===
      "string" &&
      (row.inlineData as { data: string }).data);
  const mime =
    (typeof row.mime_type === "string" && row.mime_type) ||
    (typeof row.mimeType === "string" && row.mimeType) ||
    (typeof (row.inline_data as { mime_type?: string } | undefined)
      ?.mime_type === "string" &&
      (row.inline_data as { mime_type: string }).mime_type) ||
    (typeof (row.inlineData as { mimeType?: string } | undefined)?.mimeType ===
      "string" &&
      (row.inlineData as { mimeType: string }).mimeType) ||
    "image/png";
  if (data && data.length > 80 && !data.startsWith("http")) {
    return { mimeType: mime, bytes: decodeB64(data) };
  }
  for (const value of Object.values(row)) {
    const hit = walkImage(value, depth + 1);
    if (hit) return hit;
  }
  return null;
}

export async function generateNanoBananaPro(
  prompt: string,
): Promise<GeminiImage> {
  const branded = [
    "Tamarindo / Nico illustration. Quiet instrument aesthetic:",
    "near-black canvas, teal #23a5b4 accent, gold only for money figures,",
    "editorial, no stock-photo smiles, no fake logos.",
    prompt,
  ].join(" ");
  const json = await geminiFetch("/interactions", {
    method: "POST",
    timeoutMs: 60_000,
    body: JSON.stringify({
      model: IMAGE_MODEL,
      input: [{ type: "text", text: branded }],
      response_format: {
        type: "image",
        mime_type: "image/png",
        aspect_ratio: "16:9",
        image_size: "2K",
      },
    }),
  });
  const image = walkImage(json);
  if (!image) throw new Error("Nano Banana Pro returned no image bytes.");
  return image;
}

function operationName(json: Record<string, unknown>): string | null {
  if (typeof json.name === "string") return json.name;
  if (typeof json.operation === "string") return json.operation;
  return null;
}

async function downloadVideoUri(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri, {
    headers: { "x-goog-api-key": apiKey() },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Veo download HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

function walkVideoUri(node: unknown, depth = 0): string | null {
  if (!node || depth > 10) return null;
  if (typeof node === "string" && /^https?:\/\//.test(node)) return node;
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = walkVideoUri(item, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const row = node as Record<string, unknown>;
  for (const key of ["uri", "videoUri", "downloadUri"]) {
    if (typeof row[key] === "string" && /^https?:\/\//.test(row[key] as string)) {
      return row[key] as string;
    }
  }
  for (const value of Object.values(row)) {
    const hit = walkVideoUri(value, depth + 1);
    if (hit) return hit;
  }
  return null;
}

export async function generateVeoClip(prompt: string): Promise<GeminiVideo> {
  const started = (await geminiFetch(
    `/models/${VIDEO_MODEL}:predictLongRunning`,
    {
      method: "POST",
      timeoutMs: 30_000,
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio: "16:9", resolution: "720p" },
      }),
    },
  )) as Record<string, unknown>;
  const name = operationName(started);
  if (!name) throw new Error("Veo did not start an operation.");

  for (let i = 0; i < VIDEO_POLLS; i += 1) {
    await new Promise((r) => setTimeout(r, VIDEO_POLL_MS));
    const op = (await geminiFetch(`/${name.replace(/^\//, "")}`, {
      method: "GET",
      timeoutMs: 20_000,
    })) as Record<string, unknown>;
    if (op.done !== true) continue;
    const uri = walkVideoUri(op);
    if (!uri) throw new Error("Veo finished without a video URI.");
    return {
      status: "ready",
      mimeType: "video/mp4",
      bytes: await downloadVideoUri(uri),
    };
  }
  return { status: "pending", operation: name };
}
