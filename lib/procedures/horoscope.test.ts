import { describe, expect, it } from "vitest";
import { horoscopeGet } from "@/lib/procedures/horoscope";

const ctx = {
  actor: {
    kind: "agent" as const,
    id: "nico",
    displayName: "Nico",
    role: "investor" as const,
  },
  traceId: "test-horoscope",
};

describe("horoscope.get", () => {
  it("returns a parlor line, not a Tamarindo forecast", async () => {
    const a = await horoscopeGet.handler({ sign: "leo" }, ctx);
    const b = await horoscopeGet.handler({ sign: "leo" }, ctx);
    expect(a.line.length).toBeGreaterThan(20);
    expect(a.disclaimer.toLowerCase()).toMatch(/parlor|not/);
    expect(a.line).toBe(b.line);
    expect(a.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
