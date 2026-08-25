import { afterEach, describe, expect, it, vi } from "vitest";

const upsert = vi.hoisted(() => vi.fn());
const findFirstInvite = vi.hoisted(() => vi.fn());
const withAuth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    profile: { upsert },
    invitation: { findFirst: findFirstInvite },
  },
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth,
}));

import { allowDevActor, getSessionActor, workosConfigState } from "@/lib/auth";

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

const VALID_COOKIE = "a".repeat(32);

describe("allowDevActor", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    ALLOW_DEV_LOCAL: process.env.ALLOW_DEV_LOCAL,
    CF_PAGES: process.env.CF_PAGES,
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
  };

  afterEach(() => {
    setEnv("NODE_ENV", previous.NODE_ENV);
    setEnv("DATABASE_URL", previous.DATABASE_URL);
    setEnv("ALLOW_DEV_LOCAL", previous.ALLOW_DEV_LOCAL);
    setEnv("CF_PAGES", previous.CF_PAGES);
    setEnv("WORKOS_API_KEY", previous.WORKOS_API_KEY);
    setEnv("WORKOS_CLIENT_ID", previous.WORKOS_CLIENT_ID);
    setEnv("WORKOS_COOKIE_PASSWORD", previous.WORKOS_COOKIE_PASSWORD);
  });

  it("allows the local admin when the database is localhost", () => {
    setEnv("NODE_ENV", "development");
    setEnv(
      "DATABASE_URL",
      "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev?schema=public",
    );
    expect(allowDevActor()).toBe(true);
  });

  it("denies the local admin in production even on localhost", () => {
    setEnv("NODE_ENV", "production");
    setEnv(
      "DATABASE_URL",
      "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev?schema=public",
    );
    expect(allowDevActor()).toBe(false);
  });

  it("denies the local admin when ALLOW_DEV_LOCAL is 0", () => {
    setEnv("NODE_ENV", "development");
    setEnv("ALLOW_DEV_LOCAL", "0");
    setEnv(
      "DATABASE_URL",
      "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev?schema=public",
    );
    expect(allowDevActor()).toBe(false);
  });

  it("denies the local admin when DATABASE_URL is a remote host", () => {
    setEnv("NODE_ENV", "development");
    setEnv(
      "DATABASE_URL",
      "postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/neondb",
    );
    expect(allowDevActor()).toBe(false);
  });
});

describe("workosConfigState", () => {
  const previous = {
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    ALLOW_DEV_LOCAL: process.env.ALLOW_DEV_LOCAL,
  };

  afterEach(() => {
    setEnv("WORKOS_API_KEY", previous.WORKOS_API_KEY);
    setEnv("WORKOS_CLIENT_ID", previous.WORKOS_CLIENT_ID);
    setEnv("WORKOS_COOKIE_PASSWORD", previous.WORKOS_COOKIE_PASSWORD);
    setEnv("DATABASE_URL", previous.DATABASE_URL);
    setEnv("NODE_ENV", previous.NODE_ENV);
    setEnv("ALLOW_DEV_LOCAL", previous.ALLOW_DEV_LOCAL);
    withAuth.mockReset();
    upsert.mockReset();
    findFirstInvite.mockReset();
    findFirstInvite.mockResolvedValue(null);
  });

  it("is absent when all keys are empty", () => {
    delete process.env.WORKOS_API_KEY;
    delete process.env.WORKOS_CLIENT_ID;
    delete process.env.WORKOS_COOKIE_PASSWORD;
    expect(workosConfigState()).toBe("absent");
  });

  it("is partial when only one key is set", () => {
    process.env.WORKOS_API_KEY = "sk_test";
    delete process.env.WORKOS_CLIENT_ID;
    delete process.env.WORKOS_COOKIE_PASSWORD;
    expect(workosConfigState()).toBe("partial");
  });

  it("is partial when the cookie password is shorter than 32 characters", () => {
    process.env.WORKOS_API_KEY = "sk_test";
    process.env.WORKOS_CLIENT_ID = "client_test";
    process.env.WORKOS_COOKIE_PASSWORD = "too-short";
    expect(workosConfigState()).toBe("partial");
  });

  it("is ready when key, client, and cookie password are set", () => {
    process.env.WORKOS_API_KEY = "sk_test";
    process.env.WORKOS_CLIENT_ID = "client_test";
    process.env.WORKOS_COOKIE_PASSWORD = VALID_COOKIE;
    expect(workosConfigState()).toBe("ready");
  });

  it("fails closed when keys are ready but AuthKit has no session on a remote DB (AE1)", async () => {
    process.env.WORKOS_API_KEY = "sk_test";
    process.env.WORKOS_CLIENT_ID = "client_test";
    process.env.WORKOS_COOKIE_PASSWORD = VALID_COOKIE;
    process.env.DATABASE_URL =
      "postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/neondb";
    withAuth.mockResolvedValue({ user: null });
    await expect(getSessionActor()).resolves.toBeNull();
  });

  it("falls back to dev-local on loopback when WorkOS is ready but there is no cookie", async () => {
    process.env.NODE_ENV = "development";
    process.env.WORKOS_API_KEY = "sk_test";
    process.env.WORKOS_CLIENT_ID = "client_test";
    process.env.WORKOS_COOKIE_PASSWORD = VALID_COOKIE;
    process.env.DATABASE_URL =
      "postgresql://norfolk:norfolk@localhost:5432/norfolk_dev?schema=public";
    delete process.env.ALLOW_DEV_LOCAL;
    upsert.mockResolvedValue({ displayName: "Ricardo (dev)", role: "admin" });
    withAuth.mockResolvedValue({ user: null });
    const actor = await getSessionActor();
    expect(actor).toEqual({
      kind: "user",
      id: "dev-local",
      displayName: "Ricardo (dev)",
      role: "admin",
    });
  });

  it("maps a WorkOS session to an actor whose role comes from Profile", async () => {
    process.env.WORKOS_API_KEY = "sk_test";
    process.env.WORKOS_CLIENT_ID = "client_test";
    process.env.WORKOS_COOKIE_PASSWORD = VALID_COOKIE;
    withAuth.mockResolvedValue({
      user: {
        id: "user_workos_1",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      },
    });
    upsert.mockResolvedValue({ displayName: "Ada Lovelace", role: "member" });

    const actor = await getSessionActor();
    expect(actor).toEqual({
      kind: "user",
      id: "user_workos_1",
      displayName: "Ada Lovelace",
      role: "member",
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authSubject: "user_workos_1" },
        create: expect.objectContaining({
          role: "guest",
          email: "ada@example.com",
        }),
        update: {
          displayName: "Ada Lovelace",
          email: "ada@example.com",
        },
      }),
    );
  });
});
