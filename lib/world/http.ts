const USER_AGENT = "TamarindoNico/0.1 (world pulse)";

const cache = new Map<string, { at: number; value: unknown }>();

export function clearWorldCache(): void {
  cache.clear();
}

export async function cachedWorld<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  cache.set(key, { at: now, value });
  return value;
}

export async function fetchText(
  url: string,
  timeoutMs = 8000,
): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`World fetch ${res.status} for ${url}`);
  }
  return res.text();
}

export async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  return JSON.parse(await fetchText(url, timeoutMs)) as T;
}
