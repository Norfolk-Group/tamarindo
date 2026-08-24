import { describe, expect, it } from "vitest";
import { registry } from "@/lib/procedures";
import { horoscopeGet } from "@/lib/procedures/horoscope";

const ctx = {
  actor: {
    kind: "user" as const,
    id: "guest-1",
    displayName: "Ada",
    role: "guest" as const,
  },
  traceId: "scope-test",
};

describe("horoscope.get", () => {
  it("is deterministic for a sign and UTC day", async () => {
    const a = (await registry.invoke(
      "horoscope.get",
      { sign: "leo" },
      ctx,
    )) as Awaited<ReturnType<typeof horoscopeGet.handler>>;
    const b = (await registry.invoke(
      "horoscope.get",
      { sign: "leo" },
      ctx,
    )) as Awaited<ReturnType<typeof horoscopeGet.handler>>;
    expect(a.line).toBe(b.line);
    expect(a.disclaimer.toLowerCase()).toMatch(/parlor|not astronomy|not investment/);
  });
});
