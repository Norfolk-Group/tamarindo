import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/health/route";

const queryRaw = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", async () => {
  const actual = await vi.importActual<typeof import("@/lib/db")>("@/lib/db");
  return { ...actual, prisma: { $queryRaw: queryRaw } };
});

function request(path = "/api/health") {
  return new Request(`http://localhost${path}`);
}

describe("GET /api/health", () => {
  const previous = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = previous;
    queryRaw.mockReset();
  });

  it("returns the JSON envelope when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev";
    const res = await GET(request());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, data: { status: "ok", database: "configured" } });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("fails closed with a JSON envelope when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET(request());
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "DATABASE_UNAVAILABLE" },
    });
  });

  it("round-trips a query when ?deep is set", async () => {
    process.env.DATABASE_URL = "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev";
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const res = await GET(request("/api/health?deep=1"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, data: { database: "reachable" } });
    expect(queryRaw).toHaveBeenCalledOnce();
  });

  it("reports 503 when the deep check cannot reach Postgres", async () => {
    process.env.DATABASE_URL = "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev";
    queryRaw.mockRejectedValue(new Error("connection refused"));
    const res = await GET(request("/api/health?deep=1"));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "DATABASE_UNREACHABLE", message: "connection refused" },
    });
  });
});
