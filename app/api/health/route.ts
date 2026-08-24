import { jsonErr, jsonOk } from "@/lib/http/api-response";
import { resolveDatabaseUrl } from "@/lib/db";

/** GET /api/health — process health. Missing DATABASE_URL is a JSON 503. */
export async function GET(): Promise<Response> {
  if (!resolveDatabaseUrl()) {
    return jsonErr("DATABASE_URL is not set", 503, {
      code: "DATABASE_UNAVAILABLE",
    });
  }
  return jsonOk({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "configured",
  });
}
