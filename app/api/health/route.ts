import { prisma, resolveDatabaseUrl } from "@/lib/db";
import { jsonErr, jsonOk } from "@/lib/http/api-response";

/**
 * GET /api/health — process health. Missing DATABASE_URL is a JSON 503.
 * `?deep=1` also round-trips a query, which is the only unauthenticated way
 * to prove the Worker can actually reach Postgres through Hyperdrive.
 */
export async function GET(request: Request): Promise<Response> {
  if (!resolveDatabaseUrl()) {
    return jsonErr("DATABASE_URL is not set", 503, {
      code: "DATABASE_UNAVAILABLE",
    });
  }

  const deep = new URL(request.url).searchParams.has("deep");
  if (deep) {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      return jsonErr(err instanceof Error ? err.message : "Database unreachable", 503, {
        code: "DATABASE_UNREACHABLE",
      });
    }
  }

  return jsonOk({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: deep ? "reachable" : "configured",
  });
}
