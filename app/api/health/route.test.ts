import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  const previous = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = previous;
  });

  it("returns the JSON envelope when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev";
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, data: { status: "ok", database: "configured" } });
  });

  it("fails closed with a JSON envelope when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "DATABASE_UNAVAILABLE" },
    });
  });
});
