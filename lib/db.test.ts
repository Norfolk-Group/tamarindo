import { describe, expect, it, vi } from "vitest";
import {
  createPrisma,
  DatabaseConfigError,
  isLoopbackDatabaseUrl,
  pickDatabaseUrl,
  resolveDatabaseUrl,
} from "@/lib/db";

const { PrismaPg, PrismaClient } = vi.hoisted(() => {
  class PrismaPg {
    config: unknown;
    constructor(config: unknown) {
      this.config = config;
    }
  }
  class PrismaClient {
    modelScenario = true;
    constructor(_opts: unknown) {}
  }
  return { PrismaPg: vi.fn(PrismaPg), PrismaClient: vi.fn(PrismaClient) };
});

vi.mock("@prisma/adapter-pg", () => ({ PrismaPg }));
vi.mock("@prisma/client", () => ({ PrismaClient }));

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

  it("opens the pg pool with maxUses: 1 so Workers cannot reuse a Hyperdrive connection", () => {
    PrismaPg.mockClear();
    createPrisma("postgresql://norfolk@localhost:5432/norfolk_dev");
    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: "postgresql://norfolk@localhost:5432/norfolk_dev",
      maxUses: 1,
    });
  });
});

describe("pickDatabaseUrl", () => {
  it("treats localhost and 127.0.0.1 as loopback", () => {
    expect(isLoopbackDatabaseUrl("postgresql://norfolk@localhost:5432/norfolk_dev")).toBe(
      true,
    );
    expect(
      isLoopbackDatabaseUrl("postgresql://norfolk@127.0.0.1:5432/norfolk_dev"),
    ).toBe(true);
    expect(
      isLoopbackDatabaseUrl(
        "postgresql://neondb_owner@ep-plain-bird.aws.neon.tech/neondb",
      ),
    ).toBe(false);
  });

  it("keeps Docker DATABASE_URL when Hyperdrive is absent", () => {
    expect(
      pickDatabaseUrl("postgresql://norfolk@localhost:5432/norfolk_dev", undefined),
    ).toMatch(/localhost/);
  });

  it("skips a baked loopback URL when Hyperdrive is present", () => {
    expect(
      pickDatabaseUrl(
        "postgresql://norfolk@localhost:5432/norfolk_dev",
        "postgresql://hyperdrive.internal/neondb",
      ),
    ).toBe("postgresql://hyperdrive.internal/neondb");
  });

  it("keeps an explicit remote DATABASE_URL over Hyperdrive", () => {
    expect(
      pickDatabaseUrl(
        "postgresql://neondb_owner@ep-plain-bird.aws.neon.tech/neondb",
        "postgresql://hyperdrive.internal/neondb",
      ),
    ).toMatch(/neon.tech/);
  });
});
