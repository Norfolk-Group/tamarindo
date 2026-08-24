/**
 * Server-side OpenNext → Nico Worker. Prefer the NICO_AGENT service
 * binding (Q7); fall back to NICO_AGENT_URL. Browser attach stays on
 * the signed handshake + NEXT_PUBLIC_NICO_AGENT_URL.
 */

type FetcherLike = {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const BINDING_ORIGIN = "https://nico-agent.internal";

function bindingFromGlobal(): FetcherLike | null {
  const candidate = (globalThis as { NICO_AGENT?: FetcherLike }).NICO_AGENT;
  if (candidate && typeof candidate.fetch === "function") return candidate;
  return null;
}

export function siblingAgentUrl(): string | null {
  const url = process.env.NICO_AGENT_URL?.trim();
  return url || null;
}

export function siblingAgentBinding(): FetcherLike | null {
  return bindingFromGlobal();
}

export async function fetchSiblingAgent(
  path: string,
  init: RequestInit,
): Promise<Response | null> {
  const binding = siblingAgentBinding();
  if (binding) {
    return binding.fetch(new URL(path, BINDING_ORIGIN), init);
  }
  const host = siblingAgentUrl();
  if (!host) return null;
  return fetch(new URL(path, host), init);
}
