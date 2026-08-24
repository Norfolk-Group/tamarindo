import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma";

export class DatabaseConfigError extends Error {
  constructor(message = "DATABASE_URL is not set") {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function createPrisma(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) {
    throw new DatabaseConfigError();
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

type HyperdriveLike = { connectionString?: string };

/** Prefer DATABASE_URL (local Docker). On Workers, use Hyperdrive. */
export function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    // Lazy so Edge middleware / unit tests do not load OpenNext.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- sync Hyperdrive lookup
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as {
      getCloudflareContext: () => { env: { HYPERDRIVE?: HyperdriveLike } };
    };
    return getCloudflareContext().env.HYPERDRIVE?.connectionString;
  } catch {
    return undefined;
  }
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrisma(resolveDatabaseUrl());
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy so importing the capability map does not require DATABASE_URL.
 * First model access constructs the pg adapter (Hyperdrive-ready).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
