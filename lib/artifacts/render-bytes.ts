import { renderDeckPptx } from "@/lib/artifacts/pptx";
import { renderPitchHtml } from "@/lib/artifacts/pitch-html";
import { renderPitchPdf } from "@/lib/artifacts/pitch-pdf";
import { renderWorkbookXlsx } from "@/lib/artifacts/excel";
import { tenYearWorkbookSpec, type TenYearWorkbookSpec } from "@/lib/artifacts/workbook";
import type { DeckFormat, DeckSpec } from "@/lib/artifacts/deck";
import type { PodcastScript } from "@/lib/artifacts/podcast";
import { parseEntity, type TamarindoEntity } from "@/lib/artifacts/centers";

export type RenderedArtifact = {
  bytes: Buffer;
  contentType: string;
  filename: string;
};

export function renderArtifactBytes(input: {
  kind: string;
  title: string;
  metadata: unknown;
  format?: DeckFormat;
}): RenderedArtifact {
  const meta =
    input.metadata && typeof input.metadata === "object"
      ? (input.metadata as { spec?: unknown })
      : {};
  if (input.kind === "excel") {
    const spec = (meta.spec as TenYearWorkbookSpec | undefined) ?? fallbackWorkbook(meta);
    return {
      bytes: renderWorkbookXlsx(spec),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${safeName(input.title)}.xlsx`,
    };
  }
  if (input.kind === "deck") {
    const spec = meta.spec as DeckSpec | undefined;
    if (!spec) throw new Error("Deck spec missing");
    const format = input.format ?? "pptx";
    if (format === "html") {
      return {
        bytes: Buffer.from(renderPitchHtml(spec, input.title), "utf8"),
        contentType: "text/html; charset=utf-8",
        filename: `${safeName(input.title)}.html`,
      };
    }
    return {
      bytes: renderDeckPptx(spec),
      contentType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      filename: `${safeName(input.title)}.pptx`,
    };
  }
  if (input.kind === "memo") {
    const spec = meta.spec as { title?: string; body?: string } | undefined;
    const body = spec?.body ?? "";
    const title = spec?.title ?? input.title;
    return {
      bytes: Buffer.from(`# ${title}\n\n${body}\n`, "utf8"),
      contentType: "text/markdown; charset=utf-8",
      filename: `${safeName(input.title)}.md`,
    };
  }
  if (input.kind === "podcast") {
    const spec = meta.spec as PodcastScript | undefined;
    if (!spec) throw new Error("Podcast spec missing");
    const text = [
      spec.title,
      ...spec.lines.map((line) => `${line.speaker}: ${line.text}`),
      "",
      "Audio render is deferred — this file is the podcast script.",
    ].join("\n");
    return {
      bytes: Buffer.from(text, "utf8"),
      contentType: "text/plain; charset=utf-8",
      filename: `${safeName(input.title)}.txt`,
    };
  }
  throw new Error(`No renderer for ${input.kind}`);
}

export async function renderArtifactFile(input: {
  kind: string;
  title: string;
  metadata: unknown;
  format?: DeckFormat;
}): Promise<RenderedArtifact> {
  if (input.kind === "deck" && input.format === "pdf") {
    const meta =
      input.metadata && typeof input.metadata === "object"
        ? (input.metadata as { spec?: DeckSpec })
        : {};
    if (!meta.spec) throw new Error("Deck spec missing");
    return {
      bytes: await renderPitchPdf(meta.spec, input.title),
      contentType: "application/pdf",
      filename: `${safeName(input.title)}.pdf`,
    };
  }
  return renderArtifactBytes(input);
}

function fallbackWorkbook(meta: { spec?: unknown; entities?: unknown }): TenYearWorkbookSpec {
  if (meta.spec && typeof meta.spec === "object" && "sheets" in meta.spec) {
    return meta.spec as TenYearWorkbookSpec;
  }
  const raw = Array.isArray(meta.entities) ? meta.entities : [];
  const entities = raw
    .map((value) => parseEntity(String(value)))
    .filter((value): value is TamarindoEntity => Boolean(value));
  if (entities.length === 0) {
    throw new Error("Excel artifact has no entity spec");
  }
  return tenYearWorkbookSpec(entities);
}

function safeName(title: string): string {
  return title.replace(/[^\w.-]+/g, "-").slice(0, 80) || "artifact";
}

