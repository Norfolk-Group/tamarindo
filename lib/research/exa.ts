/**
 * Exa HTTP client (Q9). No SDK package — fetch only.
 * Hits without a source URL are dropped (KTD15).
 */

export type ExaHit = {
  title: string;
  url: string;
};

export class WatchProviderError extends Error {
  readonly code = "watch_provider_unconfigured";
  constructor(message = "EXA_API_KEY is not set — watch does not invent findings") {
    super(message);
    this.name = "WatchProviderError";
  }
}

export function requireExaKey(): string {
  const key = process.env.EXA_API_KEY?.trim();
  if (!key) throw new WatchProviderError();
  return key;
}

export async function searchExa(
  query: string,
  fetchImpl: typeof fetch = fetch,
  options?: { numResults?: number },
): Promise<ExaHit[]> {
  const key = requireExaKey();
  const res = await fetchImpl("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query,
      numResults: options?.numResults ?? 5,
      contents: { text: false },
    }),
  });
  if (!res.ok) {
    throw new WatchProviderError(`Exa search failed (${res.status})`);
  }
  const json = (await res.json()) as {
    results?: { title?: string; url?: string }[];
  };
  return (json.results ?? [])
    .map((row) => ({
      title: row.title?.trim() ?? "",
      url: row.url?.trim() ?? "",
    }))
    .filter((hit) => hit.url.length > 0);
}
