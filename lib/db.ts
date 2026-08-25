import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";

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
  // maxUses: 1 — Hyperdrive connections must not be reused across
  // Worker requests. A global pool is what produced Cloudflare 1101.
  const adapter = new PrismaPg({ connectionString, maxUses: 1 });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

type HyperdriveLike = { connectionString?: string };

export function isLoopbackDatabaseUrl(url: string | undefined): boolean {
  return Boolean(url && /(?:localhost|127\.0\.0\.1)/.test(url));
}

/**
 * OpenNext copies laptop `.env` into the Worker. A loopback URL is
 * unreachable from Cloudflare — use Hyperdrive when that happens.
 * Local `next dev` has no Hyperdrive binding, so Docker DATABASE_URL wins.
 */
export function pickDatabaseUrl(
  envUrl: string | undefined,
  hyperdriveUrl: string | undefined,
): string | undefined {
  if (hyperdriveUrl && isLoopbackDatabaseUrl(envUrl)) return hyperdriveUrl;
  return envUrl || hyperdriveUrl;
}

const CLOUDFLARE_CONTEXT = Symbol.for("__cloudflare-context__");

function readHyperdriveUrl(): string | undefined {
  const fromAls = (
    globalThis as unknown as {
      [CLOUDFLARE_CONTEXT]?: { env?: { HYPERDRIVE?: HyperdriveLike } };
    }
  )[CLOUDFLARE_CONTEXT]?.env?.HYPERDRIVE?.connectionString;
  if (fromAls) return fromAls;
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

/** Prefer DATABASE_URL (local Docker). On Workers, use Hyperdrive. */
export function resolveDatabaseUrl(): string | undefined {
  return pickDatabaseUrl(process.env.DATABASE_URL, readHyperdriveUrl());
}

/** One client per incoming request. Safe no-op memo outside React. */
const prismaForRequest = cache(() => createPrisma(resolveDatabaseUrl()));

function getPrisma(): PrismaClient {
  // Workers + Hyperdrive: never keep a Pool on globalThis.
  if (readHyperdriveUrl()) return prismaForRequest();
  const existing = globalForPrisma.prisma;
  // A long-lived `next dev` can keep a client from before the last generate.
  if (existing?.modelScenario) return existing;
  globalForPrisma.prisma = createPrisma(resolveDatabaseUrl());
  return globalForPrisma.prisma;
}

/**
 * Lazy so importing the capability map does not require DATABASE_URL.
 * First model access constructs the pg adapter (Hyperdrive-ready).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
