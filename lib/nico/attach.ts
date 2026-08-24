import type { UIMessage } from "ai";

/**
 * Browser attach to the sibling Nico Worker. Cookie sessions do not cross
 * origins — the handshake assertion does (KTD10).
 *
 * When the Worker host is unset, the copilot shows an attach error
 * rather than a local runTurn proxy (KTD1).
 *
 * Pass `configured` from a Server Component. Next inlines `NEXT_PUBLIC_*`
 * into the client bundle at compile time; that misses `.dev.vars` and can
 * miss `.env` under Turbopack, so `useAgent` would default to the Next
 * origin and never reach the Worker.
 */
export function nicoAgentHost(configured?: string | null): string | null {
  const host = (configured ?? process.env.NEXT_PUBLIC_NICO_AGENT_URL)?.trim();
  return host ? host.replace(/\/$/, "") : null;
}

/** Runtime origin for the copilot prop — server `process.env`, not client inlining. */
export function nicoAgentHostFromEnv(): string | null {
  return nicoAgentHost(process.env.NEXT_PUBLIC_NICO_AGENT_URL);
}

export type HandshakeBundle = {
  token: string;
  profileId: string;
  conversationId: string;
};

export async function issueHandshake(
  conversationId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<HandshakeBundle | null> {
  try {
    const res = await fetchImpl("/api/nico/handshake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      ok?: boolean;
      data?: HandshakeBundle;
    };
    if (!body.ok || !body.data?.token) return null;
    return body.data;
  } catch {
    return null;
  }
}

/** Hydrate `useAgentChat` without throwing on CORS / network (AE2). */
export async function fetchAgentMessages(
  url: string | null | undefined,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<UIMessage[]> {
  if (!url) return [];
  try {
    const target = new URL(url);
    if (!target.pathname.endsWith("/get-messages")) {
      target.pathname = `${target.pathname.replace(/\/$/, "")}/get-messages`;
    }
    if (!target.searchParams.get("handshake")) {
      target.searchParams.set("handshake", token);
    }
    const res = await fetchImpl(target.toString(), {
      headers: { "x-nico-handshake": token },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim()) return [];
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}
