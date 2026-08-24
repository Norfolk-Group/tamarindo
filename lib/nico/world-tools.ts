import type { Actor } from "@/lib/contracts/procedure";
import type { WorldAsk } from "@/lib/nico/world-intent";
import { formatMarketsNote } from "@/lib/procedures/markets";
import { formatNewsNote } from "@/lib/procedures/news";

type Invoke = (
  name: string,
  input: unknown,
  actor: Actor,
  traceId: string,
) => Promise<unknown>;

export function worldActivityLabel(ask: WorldAsk): string {
  switch (ask.kind) {
    case "weather":
      return "Checking the sky…";
    case "horoscope":
      return "Reading the stars…";
    case "markets":
      return "Checking the tape…";
    case "news":
      if (ask.region === "medellin_re") return "Checking Aburrá housing…";
      if (ask.region === "cartagena_re") return "Checking the walled city…";
      return "Scanning headlines…";
    case "pulse":
      return "Looking outside…";
  }
}

export async function runWorldAsk(
  ask: WorldAsk,
  invoke: Invoke,
  actor: Actor,
  traceId: string,
): Promise<string> {
  switch (ask.kind) {
    case "weather":
      return weatherNote(ask.place, invoke, actor, traceId);
    case "horoscope":
      return horoscopeNote(ask.sign, invoke, actor, traceId);
    case "markets":
      return marketsNote(ask.focus, invoke, actor, traceId);
    case "news":
      return newsNote(ask.window, ask.region, invoke, actor, traceId);
    case "pulse": {
      const [tape, headlines] = await Promise.all([
        marketsNote("all", invoke, actor, traceId),
        newsNote("day", "world", invoke, actor, traceId),
      ]);
      return `${tape} ${headlines}`;
    }
  }
}

async function weatherNote(
  place: string,
  invoke: Invoke,
  actor: Actor,
  traceId: string,
): Promise<string> {
  const wx = (await invoke("weather.get", { place }, actor, traceId)) as {
    place: string;
    country: string;
    celsius: number;
    summary: string;
    windKmh: number;
  };
  return `Live weather in ${wx.place}${
    wx.country ? `, ${wx.country}` : ""
  }: ${wx.celsius}°C, ${wx.summary}, wind ${Math.round(wx.windKmh)} km/h (Open-Meteo).`;
}

async function horoscopeNote(
  sign: string | null,
  invoke: Invoke,
  actor: Actor,
  traceId: string,
): Promise<string> {
  if (!sign) {
    return "Tell me the sign and I will play the parlor card. I am not the cosmos.";
  }
  const scope = (await invoke("horoscope.get", { sign }, actor, traceId)) as {
    sign: string;
    line: string;
    disclaimer: string;
  };
  return `${scope.sign} today: ${scope.line} (${scope.disclaimer})`;
}

async function marketsNote(
  focus: "all" | "indices" | "fx" | "coffee",
  invoke: Invoke,
  actor: Actor,
  traceId: string,
): Promise<string> {
  const mapped =
    focus === "indices" ? "indices" : focus === "all" ? "all" : focus;
  const data = (await invoke("markets.get", { focus: mapped }, actor, traceId)) as Parameters<
    typeof formatMarketsNote
  >[0];
  return formatMarketsNote(data);
}

async function newsNote(
  window: "hour" | "day",
  region: "world" | "us" | "colombia" | "medellin_re" | "cartagena_re",
  invoke: Invoke,
  actor: Actor,
  traceId: string,
): Promise<string> {
  const data = (await invoke(
    "news.headlines",
    { window, region, limit: 5 },
    actor,
    traceId,
  )) as Parameters<typeof formatNewsNote>[0];
  return formatNewsNote(data);
}
