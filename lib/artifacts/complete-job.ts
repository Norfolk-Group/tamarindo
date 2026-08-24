import { prisma } from "@/lib/db";
import { renderArtifactBytes } from "@/lib/artifacts/render-bytes";

type R2Like = {
  put: (key: string, value: ArrayBuffer | Uint8Array) => Promise<unknown>;
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>;
};

export function artifactObjectStore(): R2Like | null {
  return (globalThis as { R2?: R2Like }).R2 ?? null;
}

/**
 * Run the cited artifact engines and mark the row ready (KTD7).
 * Writes R2 when the binding exists; otherwise keeps on-demand `render:` refs.
 */
export async function completeArtifactJob(artifactId: string): Promise<{
  artifactId: string;
  status: "ready";
  storageRef: string;
  engine: "custom_ooxml";
}> {
  const row = await prisma.artifact.findUnique({ where: { id: artifactId } });
  if (!row) throw new Error(`Artifact not found: ${artifactId}`);

  const file = renderArtifactBytes({
    kind: row.kind,
    title: row.title,
    metadata: row.metadata,
  });

  let storageRef = row.storageRef ?? `render:${row.kind}`;
  const r2 = artifactObjectStore();
  if (r2) {
    storageRef = `artifacts/${row.id}/${file.filename}`;
    await r2.put(storageRef, file.bytes);
  }

  const previous =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
      : {};
  await prisma.artifact.update({
    where: { id: artifactId },
    data: {
      storageRef,
      metadata: {
        ...previous,
        status: "ready",
        filename: file.filename,
        contentType: file.contentType,
      },
    },
  });

  return {
    artifactId,
    status: "ready",
    storageRef,
    engine: "custom_ooxml",
  };
}
