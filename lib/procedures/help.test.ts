import { describe, expect, it } from "vitest";
import { registry } from "@/lib/procedures";

const guest = {
  actor: {
    kind: "user" as const,
    id: "guest-1",
    displayName: "Guest",
    role: "guest" as const,
  },
  traceId: "test-help",
};

describe("help procedures", () => {
  it("lists the same catalog as the (i) tooltips", async () => {
    const out = (await registry.invoke("help.list", {}, guest)) as {
      topics: Array<{ id: string }>;
    };
    expect(out.topics.length).toBeGreaterThan(10);
    expect(out.topics.some((row) => row.id === "nav.help")).toBe(true);
  });

  it("returns one topic by id", async () => {
    const out = (await registry.invoke("help.get", { id: "icp.catalog" }, guest)) as {
      topic: { title: string };
    };
    expect(out.topic.title).toBe("ICPs");
  });

  it("filters by family or query", async () => {
    const out = (await registry.invoke(
      "help.list",
      { family: "glossary", query: "live" },
      guest,
    )) as { topics: Array<{ id: string }> };
    expect(out.topics.map((row) => row.id)).toEqual(["glossary.live-model"]);
  });
});
