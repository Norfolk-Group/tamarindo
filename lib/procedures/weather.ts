import { z } from "zod";
import { defineProcedure } from "@/lib/procedures/registry";

/**
 * Live weather via Open-Meteo (no API key). Same procedure the UI
 * or Nico's orchestrator can call — agent-native.
 */

const WMO: Record<number, string> = {
  0: "clear",
  1: "mostly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "rime fog",
  51: "light drizzle",
  61: "rain",
  63: "rain",
  65: "heavy rain",
  71: "snow",
  80: "showers",
  95: "thunder",
};

export const weatherGet = defineProcedure({
  name: "weather.get",
  description:
    "Current weather for a city. Open-Meteo geocoding + forecast. No vendor key.",
  input: z.object({
    place: z.string().min(2).max(80).default("Medellín"),
  }),
  output: z.object({
    place: z.string(),
    country: z.string(),
    celsius: z.number(),
    summary: z.string(),
    windKmh: z.number(),
    source: z.literal("open-meteo"),
  }),
  minRole: "investor",
  requiresApproval: false,
  handler: async ({ place }) => {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1`,
    );
    if (!geoRes.ok) {
      throw new Error(`Geocoding failed (${geoRes.status})`);
    }
    const geo = (await geoRes.json()) as {
      results?: Array<{
        name: string;
        country?: string;
        latitude: number;
        longitude: number;
      }>;
    };
    const hit = geo.results?.[0];
    if (!hit) {
      throw new Error(`I could not place "${place}" on a map.`);
    }
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,weather_code,wind_speed_10m`,
    );
    if (!wxRes.ok) {
      throw new Error(`Forecast failed (${wxRes.status})`);
    }
    const wx = (await wxRes.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };
    const code = wx.current?.weather_code ?? 0;
    return {
      place: hit.name,
      country: hit.country ?? "",
      celsius: wx.current?.temperature_2m ?? 0,
      summary: WMO[code] ?? "mixed",
      windKmh: wx.current?.wind_speed_10m ?? 0,
      source: "open-meteo" as const,
    };
  },
});
