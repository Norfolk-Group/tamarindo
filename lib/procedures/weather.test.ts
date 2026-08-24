import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registry } from "@/lib/procedures";
import { weatherGet } from "@/lib/procedures/weather";
import { clearWorldCache } from "@/lib/world/http";

const ctx = {
  actor: {
    kind: "user" as const,
    id: "guest-1",
    displayName: "Ada",
    role: "guest" as const,
  },
  traceId: "wx-test",
};

describe("weather.get", () => {
  beforeEach(() => {
    clearWorldCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("geocoding-api.open-meteo.com")) {
          return new Response(
            JSON.stringify({
              results: [
                {
                  name: "Medellín",
                  country: "Colombia",
                  latitude: 6.25,
                  longitude: -75.56,
                },
              ],
            }),
            { status: 200 },
          );
        }
        if (url.includes("api.open-meteo.com")) {
          return new Response(
            JSON.stringify({
              current: {
                temperature_2m: 22.4,
                weather_code: 2,
                wind_speed_10m: 6,
              },
            }),
            { status: 200 },
          );
        }
        return new Response("missing", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("geocodes then reads Open-Meteo current conditions", async () => {
    const out = (await registry.invoke(
      "weather.get",
      { place: "Medellín" },
      ctx,
    )) as Awaited<ReturnType<typeof weatherGet.handler>>;
    expect(out.place).toBe("Medellín");
    expect(out.country).toBe("Colombia");
    expect(out.celsius).toBe(22.4);
    expect(out.summary).toMatch(/partly cloudy|cloud/i);
    expect(out.windKmh).toBe(6);
  });
});
