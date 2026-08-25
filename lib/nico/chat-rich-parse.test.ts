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

  it("parses a report glance fence", () => {
    const segments = parseChat(
      [
        "Here is the take.",
        "```report",
        JSON.stringify({
          kind: "statements",
          title: "Consolidated cash",
          takeaway: "FY1 to FY10",
          headers: ["Line", "FY1"],
          rows: [{ cells: ["Closing cash", "$1"], tone: "gold" }],
          previewPath: "/api/nico/model/export?format=html&kind=statements",
          pdfPath: "/api/nico/model/export?format=pdf&kind=statements",
          csvPath: "/api/nico/model/export?format=csv&kind=statements",
        }),
        "```",
      ].join("\n"),
    );
    expect(segments.some((s) => s.kind === "report")).toBe(true);
  });

  it("parses a line chart and an image fence", () => {
    const segments = parseChat(
      [
        "```chart",
        '{"title":"Cash","type":"line","labels":["Y1","Y2"],"values":[1,2],"unit":"$M"}',
        "```",
        "```image",
        '{"url":"https://example.com/x.png","alt":"Poblado","title":"Dusk"}',
        "```",
      ].join("\n"),
    );
    expect(segments).toMatchObject([
      { kind: "chart", spec: { type: "line", labels: ["Y1", "Y2"] } },
      { kind: "image", spec: { alt: "Poblado", title: "Dusk" } },
    ]);
  });
});
