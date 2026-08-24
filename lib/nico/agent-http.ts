/** Paths the sibling Worker serves without a handshake. */
export function isPublicNicoPath(pathname: string): boolean {
  return pathname === "/meeting-avatar";
}

export function isResumePath(pathname: string): boolean {
  return pathname === "/resume";
}

export function isTurnPath(pathname: string): boolean {
  return pathname === "/turn";
}

type AgentNamespace = {
  idFromName: (name: string) => unknown;
  get: (id: unknown) => { fetch: (request: Request) => Promise<Response> };
};

export function agentNamespace(
  env: Record<string, unknown>,
): AgentNamespace | null {
  const ns = env.NicoAgent;
  if (
    ns &&
    typeof ns === "object" &&
    "idFromName" in ns &&
    "get" in ns &&
    typeof (ns as AgentNamespace).idFromName === "function"
  ) {
    return ns as AgentNamespace;
  }
  return null;
}

export async function fetchAgentInstance(
  env: Record<string, unknown>,
  name: string,
  request: Request,
): Promise<Response> {
  const ns = agentNamespace(env);
  if (!ns) return new Response("NicoAgent binding missing", { status: 503 });
  return ns.get(ns.idFromName(name)).fetch(request);
}
