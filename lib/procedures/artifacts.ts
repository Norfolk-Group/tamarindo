import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db";
import { UnpublishedTermsError } from "@/lib/artifacts/deck";
import {
  deckSpecFromPublishedTerms,
  raiseDeckSpec,
  structureOnlyDeckSpec,
} from "@/lib/artifacts/raise-deck";
import { structureMemoMarkdown } from "@/lib/artifacts/structure-memo";
import { parseEntityList } from "@/lib/artifacts/centers";
import { podcastScriptFromMemo } from "@/lib/artifacts/podcast";
import { tenYearWorkbookSpec } from "@/lib/artifacts/workbook";
import { runCashflowModel } from "@/lib/model/engine";
import { loadValuesForActor } from "@/lib/model/store";
import { signDownloadToken } from "@/lib/artifacts/signed-url";
import { completeArtifactJob } from "@/lib/artifacts/complete-job";
import { startArtifactJob } from "@/lib/artifacts/start-job";
import { canReadConfidential } from "@/lib/domain/access";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

const ArtifactKindSchema = z.enum(["excel", "deck", "podcast", "memo", "chart"]);

export const artifactsList = defineProcedure({
  name: "artifacts.list",
  description:
    "List generated artifacts (models, decks, podcasts, memos) visible to the caller.",
  input: z.object({}),
  output: z.object({
    artifacts: z.array(
      z.object({
        id: z.string(),
        kind: ArtifactKindSchema,
        title: z.string(),
        createdAt: z.string(),
      }),
    ),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (_input, ctx) => {
    if (ctx.actor.role === "investor" && !(await canReadConfidential(ctx.actor))) {
      return { artifacts: [] };
    }
    const rows = await prisma.artifact.findMany({
      where:
        ctx.actor.role === "admin"
          ? undefined
          : { createdBy: { authSubject: ctx.actor.id } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return {
      artifacts: rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        title: row.title,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  },
});

export const artifactsCreate = defineProcedure({
  name: "artifacts.create",
  description:
    "Queue a shared workspace artifact. kind=deck uses variant raise (published Deal Terms), raise-draft (admin working copy), or structure (corporate map, no ask). kind=excel: omit entities or pass family/all for the whole Tamarindo business.",
  input: z.object({
    kind: ArtifactKindSchema,
    title: z.string().min(1).max(200),
    entities: z.array(z.string()).optional(),
    variant: z.enum(["raise", "raise-draft", "structure"]).optional(),
    omitPersonIds: z.array(z.string()).optional(),
    memo: z.object({ title: z.string(), body: z.string() }).optional(),
  }),
  output: z.object({ id: z.string(), status: z.literal("queued") }),
  minRole: "member",
  requiresApproval: false,
  handler: async (input, ctx) => {
    if (input.variant === "raise-draft" && ctx.actor.role !== "admin") {
      throw new Error("raise-draft decks are admin only");
    }
    const createdById = await profileIdFor(ctx.actor.id);
    const metadata = await specMetadata(input, ctx.actor);
    const row = await prisma.artifact.create({
      data: {
        kind: input.kind,
        title: input.title,
        createdById,
        metadata: metadata as Prisma.InputJsonValue,
        storageRef: `render:${input.kind}`,
      },
    });
    const started = await startArtifactJob(row.id);
    if (!started) await completeArtifactJob(row.id);
    return { id: row.id, status: "queued" as const };
  },
});

async function specMetadata(
  input: {
    kind: "excel" | "deck" | "podcast" | "memo" | "chart";
    entities?: string[];
    variant?: "raise" | "raise-draft" | "structure";
    omitPersonIds?: string[];
    memo?: { title: string; body: string };
  },
  actor: { id: string },
): Promise<Record<string, unknown>> {
  if (input.kind === "excel") {
    const entities = parseEntityList(input.entities);
    return { status: "queued", spec: tenYearWorkbookSpec(entities) };
  }
  if (input.kind === "deck") {
    const variant = input.variant ?? "raise";
    if (variant === "structure") {
      return { status: "queued", spec: structureOnlyDeckSpec(), variant };
    }
    const current = await prisma.dealTerms.findFirst({
      where: { status: "published" },
      orderBy: { version: "desc" },
    });
    const terms = {
      version: current?.version ?? null,
      status: current?.status ?? null,
      payload:
        current?.payload && typeof current.payload === "object"
          ? (current.payload as Record<string, unknown>)
          : null,
    };
    try {
      const model = runCashflowModel(await loadValuesForActor(actor));
      const options = { omitPersonIds: input.omitPersonIds };
      const spec =
        variant === "raise-draft"
          ? raiseDeckSpec(terms, "raise-draft", model, options)
          : deckSpecFromPublishedTerms(terms, model, options);
      return { status: "queued", spec, variant };
    } catch (err) {
      if (err instanceof UnpublishedTermsError) throw err;
      throw err;
    }
  }
  if (input.kind === "podcast") {
    if (!input.memo) throw new Error("Podcast needs a memo body");
    return { status: "queued", spec: podcastScriptFromMemo(input.memo) };
  }
  if (input.kind === "memo") {
    if (input.variant === "structure") {
      return { status: "queued", spec: structureMemoMarkdown(), variant: "structure" };
    }
    if (input.memo) {
      return { status: "queued", spec: input.memo, variant: "memo" };
    }
    return { status: "queued" };
  }
  return { status: "queued" };
}

export const artifactsGet = defineProcedure({
  name: "artifacts.get",
  description:
    "Return one artifact the caller may see. Re-checks owner and current NDA.",
  input: z.object({ id: z.string() }),
  output: z.object({
    id: z.string(),
    kind: ArtifactKindSchema,
    title: z.string(),
    status: z.string(),
    storageRef: z.string().nullable(),
    downloadUrl: z.string().nullable(),
    createdAt: z.string(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async ({ id }, ctx) => {
    if (ctx.actor.role === "investor" && !(await canReadConfidential(ctx.actor))) {
      throw new Error("NDA required for this artifact");
    }
    const row = await prisma.artifact.findUnique({ where: { id } });
    if (!row) throw new Error("Artifact not found");
    if (ctx.actor.role !== "admin") {
      const ownerId = await profileIdFor(ctx.actor.id);
      if (row.createdById !== ownerId) throw new Error("Artifact not found");
    }
    const metadata =
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as { status?: string })
        : {};
    const viewerId = await profileIdFor(ctx.actor.id);
    let downloadUrl: string | null = null;
    if (row.storageRef) {
      try {
        const token = await signDownloadToken({
          artifactId: row.id,
          profileId: viewerId,
        });
        downloadUrl = `/api/nico/artifacts/download?token=${encodeURIComponent(token)}`;
      } catch {
        downloadUrl = null;
      }
    }
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      status: metadata.status ?? (row.storageRef ? "ready" : "queued"),
      storageRef: row.storageRef,
      downloadUrl,
      createdAt: row.createdAt.toISOString(),
    };
  },
});
