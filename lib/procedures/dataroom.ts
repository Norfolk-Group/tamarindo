import { z } from "zod";
import { prisma } from "@/lib/db";
import { canReadConfidential } from "@/lib/domain/access";
import { profileIdFor } from "@/lib/procedures/profile";
import { defineProcedure } from "@/lib/procedures/registry";

const DocSchema = z.object({
  id: z.string(),
  title: z.string(),
  mimeType: z.string(),
  confidential: z.boolean(),
  published: z.boolean(),
});

export const dataroomList = defineProcedure({
  name: "dataroom.list",
  description: "List published data-room files the caller may see.",
  input: z.object({}),
  output: z.object({ documents: z.array(DocSchema) }),
  minRole: "investor",
  requiresApproval: false,
  handler: async (_input, ctx) => {
    const allowConfidential = await canReadConfidential(ctx.actor);
    const isAdmin = ctx.actor.role === "admin";
    const rows = await prisma.dataRoomDocument.findMany({
      where: isAdmin ? undefined : { published: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      documents: rows
        .filter((row) => !row.confidential || allowConfidential)
        .map((row) => ({
          id: row.id,
          title: row.title,
          mimeType: row.mimeType,
          confidential: row.confidential,
          published: row.published,
        })),
    };
  },
});

export const dataroomDownload = defineProcedure({
  name: "dataroom.download",
  description:
    "Download a data-room file. Writes a DataRoomView. Confidential files need a current NDA, except for admins.",
  input: z.object({ documentId: z.string() }),
  output: z.object({
    id: z.string(),
    title: z.string(),
    storageRef: z.string(),
    mimeType: z.string(),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async ({ documentId }, ctx) => {
    const row = await prisma.dataRoomDocument.findUnique({
      where: { id: documentId },
    });
    if (!row || (!row.published && ctx.actor.role !== "admin")) {
      throw new Error("Document not found");
    }
    if (row.confidential && !(await canReadConfidential(ctx.actor))) {
      throw new Error("NDA required for this document");
    }
    const profileId = await profileIdFor(ctx.actor.id);
    await prisma.dataRoomView.create({
      data: {
        documentId: row.id,
        profileId,
        action: "download",
      },
    });
    return {
      id: row.id,
      title: row.title,
      storageRef: row.storageRef,
      mimeType: row.mimeType,
    };
  },
});

export const dataroomPublish = defineProcedure({
  name: "dataroom.publish",
  description: "Publish a data-room file. Requires a one-time approval.",
  input: z.object({
    approvalId: z.string(),
    documentId: z.string(),
  }),
  output: z.object({ id: z.string(), published: z.literal(true) }),
  minRole: "admin",
  requiresApproval: true,
  handler: async ({ documentId }) => {
    const row = await prisma.dataRoomDocument.update({
      where: { id: documentId },
      data: { published: true },
    });
    return { id: row.id, published: true as const };
  },
});
