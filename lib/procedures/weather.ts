import { z } from "zod";
import { defineProcedure } from "@/lib/procedures/registry";
import { cachedWorld, fetchJson } from "@/lib/world/http";
import { wmoSummary } from "@/lib/world/weather-codes";

const Input = z.object({
  place: z.string().min(1).max(80).default("Medellín"),
});

const Output = z.object({
  place: z.string(),
  country: z.string(),
  celsius: z.number(),
  summary: z.string(),
  windKmh: z.number(),
  source: z.string(),
});

type GeoHit = {
  name?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

type Forecast = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

export const weatherGet = defineProcedure({
  name: "weather.get",
  description:
    "Current weather for a city via Open-Meteo geocoding and forecast. No vendor key.",
  input: Input,
  output: Output,
  minRole: "guest",
  requiresApproval: false,
  handler: async ({ place }) => {
    const key = place.trim().toLowerCase();
    return cachedWorld(`weather:${key}`, 2 * 60_000, async () => {
      const geo = await fetchJson<{ results?: GeoHit[] }>(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,
      );
      const hit = geo.results?.[0];
      if (!hit?.latitude || !hit?.longitude) {
        throw new Error(`I could not find a map pin for ${place}.`);
      }
      const wx = await fetchJson<Forecast>(
        `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,weather_code,wind_speed_10m`,
      );
      const current = wx.current ?? {};
      return {
        place: hit.name ?? place,
        country: hit.country ?? "",
        celsius: Number(current.temperature_2m ?? 0),
        summary: wmoSummary(current.weather_code ?? 0),
        windKmh: Number(current.wind_speed_10m ?? 0),
        source: "Open-Meteo",
      };
    });
  },
});
