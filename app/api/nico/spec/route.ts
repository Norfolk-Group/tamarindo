import { getSessionActor } from "@/lib/auth";
import { jsonErr } from "@/lib/http/api-response";
import {
  TAMARINDO_EXCEL_SPEC_FILENAME,
  TAMARINDO_EXCEL_SPEC_MD,
} from "@/lib/model/excel-spec-md";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor) return jsonErr("No session", 401, { code: "UNAUTHORIZED" });
  return new Response(TAMARINDO_EXCEL_SPEC_MD, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${TAMARINDO_EXCEL_SPEC_FILENAME}"`,
      "cache-control": "no-store",
    },
  });
}
