/**
 * HTTP surface of the sibling Nico Worker. Kept out of the DO class so
 * tests can prove handshake / resume / disclosure without `cloudflare:`.
 */
import { fetchAgentInstance, isPublicNicoPath, isResumePath, isTurnPath } from "@/lib/nico/agent-http";
import { type HandshakeClaims, verifyHandshake } from "@/lib/nico/handshake";
import { meetingAvatarHtml } from "@/lib/nico/meeting-avatar";
import { sessionKey } from "@/lib/nico/session-key";

export type SiblingEnv = {
  NICO_HANDSHAKE_SECRET?: string;
  WORKOS_COOKIE_PASSWORD?: string;
  ALLOWED_ORIGINS?: string;
  DATABASE_URL?: string;
  NicoAgent?: unknown;
  [key: string]: unknown;
};

/**
 * Prisma reads process.env.DATABASE_URL. Prefer the Worker var; only
 * touch Hyperdrive when a turn actually needs Postgres.
 *
 * `HYPERDRIVE.connectionString` on OPTIONS / get-messages / WS upgrade
 * wedges wrangler local after reloads — the isolate accepts TCP but
 * never finishes fetch, so useAgentChat never attaches.
 */
const LLM_ENV_KEYS = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "CF_AIG_GATEWAY_ID",
  "AI_GATEWAY_URL",
  "ANTHROPIC_API_KEY",
  "NICO_MODEL",
] as const;

/** Copy AI Gateway keys onto process.env so composeAnswer can reach Sonnet. */
export function bindLlmEnv(env: SiblingEnv): void {
  for (const key of LLM_ENV_KEYS) {
    const value = env[key];
    if (typeof value === "string" && value.length > 0 && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function bindTurnEnv(env: SiblingEnv): void {
  bindDatabaseUrl(env);
  bindLlmEnv(env);
}

export function bindDatabaseUrl(env: SiblingEnv): void {
  if (process.env.DATABASE_URL) return;
  if (typeof env.DATABASE_URL === "string" && env.DATABASE_URL.length > 0) {
    process.env.DATABASE_URL = env.DATABASE_URL;
    return;
  }
  const hd = env.HYPERDRIVE as { connectionString?: string } | undefined;
  if (hd?.connectionString) {
    process.env.DATABASE_URL = hd.connectionString;
  }
}

export async function handleSiblingWorkerFetch(
  request: Request,
  env: SiblingEnv,
  fallback?: (request: Request, env: SiblingEnv) => Promise<Response | undefined>,
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  if (isPublicNicoPath(url.pathname)) {
    return withCors(
      request,
      env,
      new Response(meetingAvatarHtml(), {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );
  }

  if (isResumePath(url.pathname) && request.method === "POST") {
    bindDatabaseUrl(env);
    const expected = env.NICO_HANDSHAKE_SECRET || env.WORKOS_COOKIE_PASSWORD;
    const provided = request.headers.get("x-nico-resume-secret");
    if (!expected || provided !== expected) {
      return withCors(request, env, new Response("Unauthorized", { status: 401 }));
    }
    const body = (await request.json().catch(() => null)) as {
      sessionKey?: string;
      approvalId?: string;
      conversationId?: string;
    } | null;
    if (!body?.sessionKey) {
      return withCors(request, env, new Response("ok"));
    }
    const internal = new Request(new URL("/resume-internal", request.url), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return withCors(
      request,
      env,
      await fetchAgentInstance(env, body.sessionKey, internal),
    );
  }

  const origin = request.headers.get("Origin");
  const allowed = allowedOrigins(env);
  let claims: HandshakeClaims;
  try {
    claims = await verifyHandshake(
      request.headers.get("x-nico-handshake") ??
        url.searchParams.get("handshake") ??
        bearerToken(request.headers.get("Authorization")),
      {
        secret: env.NICO_HANDSHAKE_SECRET || env.WORKOS_COOKIE_PASSWORD,
        origin,
        allowedOrigins: allowed.length ? allowed : undefined,
      },
    );
  } catch {
    return withCors(request, env, new Response("Unauthorized", { status: 401 }));
  }

  const key = sessionKey(claims.profileId, claims.conversationId);
  if (isTurnPath(url.pathname) && request.method === "POST") {
    bindDatabaseUrl(env);
    return withCors(request, env, await fetchAgentInstance(env, key, request));
  }

  return withCors(
    request,
    env,
    (await fallback?.(request, env)) ??
      new Response("Not found", { status: 404 }),
  );
}

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

function allowedOrigins(env: SiblingEnv): string[] {
  return (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(request: Request, env: SiblingEnv): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowed = allowedOrigins(env);
  if (!origin || !allowed.includes(origin)) return {};
  const requested = request.headers.get("Access-Control-Request-Headers");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      requested || "content-type, x-nico-handshake, authorization",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    Vary: "Origin",
  };
  // localhost:3000 → 127.0.0.1:8788 is cross-origin loopback. Chrome's
  // Local Network Access preflight needs this or get-messages never fires.
  if (request.headers.get("Access-Control-Request-Private-Network") === "true") {
    headers["Access-Control-Allow-Private-Network"] = "true";
  }
  return headers;
}

function withCors(
  request: Request,
  env: SiblingEnv,
  response: Response,
): Response {
  // Recreating a 101 drops the WebSocket — useAgentChat never attaches.
  if (
    response.status === 101 ||
    request.headers.get("Upgrade")?.toLowerCase() === "websocket"
  ) {
    return response;
  }
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}
