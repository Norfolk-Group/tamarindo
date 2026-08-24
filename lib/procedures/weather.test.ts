import { describe, expect, it, vi, afterEach } from "vitest";
import { weatherGet } from "@/lib/procedures/weather";

const ctx = {
  actor: {
    kind: "agent" as const,
    id: "nico",
    displayName: "Nico",
    role: "investor" as const,
  },
  traceId: "test-weather",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("weather.get", () => {
  it("geocodes then reads Open-Meteo current conditions", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("geocoding-api")) {
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
      return new Response(
        JSON.stringify({
          current: {
            temperature_2m: 23.4,
            weather_code: 2,
            wind_speed_10m: 8,
          },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const out = await weatherGet.handler({ place: "Medellín" }, ctx);
    expect(out.place).toBe("Medellín");
    expect(out.celsius).toBe(23.4);
    expect(out.summary).toBe("partly cloudy");
    expect(out.source).toBe("open-meteo");
  });
});
