import { describe, expect, it } from "vitest";
import { createPrisma, DatabaseConfigError, resolveDatabaseUrl } from "@/lib/db";

describe("createPrisma", () => {
  it("throws a named error when DATABASE_URL is missing", () => {
    expect(() => createPrisma("")).toThrow(DatabaseConfigError);
    expect(() => createPrisma("")).toThrow(/DATABASE_URL is not set/);
  });

  it("resolves DATABASE_URL when set", () => {
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev";
    expect(resolveDatabaseUrl()).toMatch(/localhost/);
    process.env.DATABASE_URL = previous;
  });
});
