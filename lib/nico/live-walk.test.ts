/**
 * Live signed-in substitute: real procedures + real composer.
 * Skipped in CI. Run: LIVE_NICO=1 node --env-file=.env ./node_modules/.bin/vitest run lib/nico/live-walk.test.ts
 */
import { describe, expect, it } from "vitest";
import { parseChat } from "@/lib/nico/chat-rich-parse";
import { runTurn } from "@/lib/nico/orchestrator";

const actor = {
  kind: "user" as const,
  id: "dev-local",
  displayName: "Ricardo (dev)",
  role: "admin" as const,
};

async function play(message: string) {
  const events = [];
  for await (const event of runTurn(message, actor, {
    conversationId: `live-walk-${Date.now()}`,
  })) {
    events.push(event);
  }
  const spoken = events
    .filter((event) => event.type === "token")
    .map((event) => (event.type === "token" ? event.text : ""))
    .join("");
  const activities = events
    .filter((event) => event.type === "activity")
    .map((event) => (event.type === "activity" ? event.label : ""));
  return { events, spoken, activities, segments: parseChat(spoken) };
}

describe.skipIf(!process.env.LIVE_NICO)("live Nico doors", () => {
  it(
    "explains Tamarindo, runs books / IRR / stress / ticket, and shows artifacts",
    async () => {
      const explain = await play("how does Tamarindo work");
      expect(explain.activities).toContain("Nico is thinking…");
      expect(explain.spoken.length).toBeGreaterThan(40);
      expect(explain.spoken).not.toMatch(/broker fee/i);

      const books = await play("show me the books");
      const book = books.segments.find((segment) => segment.kind === "report");
      expect(book?.kind).toBe("report");
      if (book?.kind === "report") {
        expect(book.spec.xlsxPath).toContain("format=xlsx");
        expect(book.spec.pdfPath).toContain("format=pdf");
        expect(book.spec.csvPath).toContain("format=csv");
        expect(book.spec.previewPath).toContain("format=html");
      }

      const irr = await play("what's the IRR");
      const returns = irr.segments.find((segment) => segment.kind === "report");
      expect(returns?.kind).toBe("report");
      if (returns?.kind === "report") {
        expect(returns.spec.kind).toBe("returns");
        expect(returns.spec.xlsxPath).toContain("kind=returns");
      }

      const shock = await play("run a stress test");
      const grid = shock.segments.find((segment) => segment.kind === "report");
      expect(grid?.kind).toBe("report");
      if (grid?.kind === "report") {
        expect(grid.spec.kind).toBe("sensitivity");
        expect(grid.spec.xlsxPath).toContain("kind=sensitivity");
      }

      const ticket = await play("what do we make on a $500k lease");
      expect(ticket.segments.some((segment) => segment.kind === "table")).toBe(
        true,
      );
      expect(ticket.spoken).toMatch(/\$5,000|\$8,750|origination/i);
    },
    600_000,
  );
});
