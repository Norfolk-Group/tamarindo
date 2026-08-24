import { artifactObjectStore } from "@/lib/artifacts/complete-job";
import { renderArtifactBytes } from "@/lib/artifacts/render-bytes";
import { DownloadUrlError, verifyDownloadToken } from "@/lib/artifacts/signed-url";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonErr } from "@/lib/http/api-response";
import { profileIdFor } from "@/lib/procedures/profile";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

/** Procedure-issued download. Re-checks owner + NDA via artifacts.get. */
export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  const token = new URL(request.url).searchParams.get("token");
  try {
    const profileId = await profileIdFor(actor.id);
    const claims = await verifyDownloadToken(token, { profileId });
    await registry.invoke(
      "artifacts.get",
      { id: claims.artifactId },
      { actor, traceId: crypto.randomUUID() },
    );
    const row = await prisma.artifact.findUnique({
      where: { id: claims.artifactId },
    });
    if (!row) return jsonErr("Artifact not found", 404, { code: "NOT_FOUND" });
    const stored = row.storageRef;
    const r2 = artifactObjectStore();
    if (r2 && stored && !stored.startsWith("render:")) {
      const object = await r2.get(stored);
      if (object) {
        const meta =
          row.metadata && typeof row.metadata === "object"
            ? (row.metadata as { contentType?: string; filename?: string })
            : {};
        return new Response(new Uint8Array(await object.arrayBuffer()), {
          headers: {
            "content-type": meta.contentType ?? "application/octet-stream",
            "content-disposition": `attachment; filename="${meta.filename ?? "artifact"}"`,
          },
        });
      }
    }
    const file = renderArtifactBytes({
      kind: row.kind,
      title: row.title,
      metadata: row.metadata,
    });
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.contentType,
        "content-disposition": `attachment; filename="${file.filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof DownloadUrlError) {
      return jsonErr(err.message, 403, { code: "FORBIDDEN" });
    }
    const message = err instanceof Error ? err.message : "Download failed";
    const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, {
      code: status === 403 ? "FORBIDDEN" : "VALIDATION",
    });
  }
}
