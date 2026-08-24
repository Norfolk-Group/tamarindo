import { describe, expect, it } from "vitest";
import { parseChat } from "@/lib/nico/chat-rich-parse";

describe("parseChat", () => {
  it("keeps prose as text", () => {
    const segments = parseChat("Here is the honest version.");
    expect(segments).toEqual([
      { kind: "text", text: "Here is the honest version." },
    ]);
  });

  it("parses a markdown table", () => {
    const segments = parseChat(
      [
        "Pilot mix:",
        "| City | Funded |",
        "| --- | --- |",
        "| Poblado | $5.0M |",
        "| Cartagena | $5.9M |",
        "",
      ].join("\n"),
    );
    const table = segments.find((s) => s.kind === "table");
    expect(table).toEqual({
      kind: "table",
      headers: ["City", "Funded"],
      rows: [
        ["Poblado", "$5.0M"],
        ["Cartagena", "$5.9M"],
      ],
    });
  });

  it("parses a fenced chart block", () => {
    const segments = parseChat(
      [
        "Compare the two cities:",
        "```chart",
        '{"title":"Pilot funded mix","type":"bar","labels":["Poblado","Cartagena"],"values":[5,5.9],"unit":"$M"}',
        "```",
        "That is FACT from the ICP sheets.",
      ].join("\n"),
    );
    expect(segments.some((s) => s.kind === "chart")).toBe(true);
    const chart = segments.find((s) => s.kind === "chart");
    expect(chart).toMatchObject({
      kind: "chart",
      spec: {
        title: "Pilot funded mix",
        type: "bar",
        labels: ["Poblado", "Cartagena"],
        values: [5, 5.9],
        unit: "$M",
      },
    });
  });
});
