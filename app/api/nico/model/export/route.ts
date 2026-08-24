import { getSessionActor } from "@/lib/auth";
import { jsonErr } from "@/lib/http/api-response";
import { registry } from "@/lib/procedures";
import { ProcedureError } from "@/lib/procedures/registry";

export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  const format = new URL(request.url).searchParams.get("format") ?? "html";
  if (format !== "html" && format !== "pdf" && format !== "xlsx") {
    return jsonErr("format must be html, pdf, or xlsx", 400, { code: "VALIDATION" });
  }
  try {
    const data = (await registry.invoke(
      "model.export",
      { format },
      { actor, traceId: crypto.randomUUID() },
    )) as { filename: string; contentType: string; base64: string };
    const bytes = Buffer.from(data.base64, "base64");
    const disposition = format === "html" ? "inline" : "attachment";
    return new Response(bytes, {
      headers: {
        "content-type": data.contentType,
        "content-disposition": `${disposition}; filename="${data.filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    const status = err instanceof ProcedureError && err.code === "forbidden" ? 403 : 400;
    return jsonErr(message, status, {
      code: status === 403 ? "FORBIDDEN" : "VALIDATION",
    });
  }
}
