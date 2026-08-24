import { describe, expect, it } from "vitest";
import type { StreamEvent } from "@/lib/contracts/events";
import { turnToUiResponse } from "@/lib/nico/ui-stream";

async function* events(): AsyncGenerator<StreamEvent> {
  yield { type: "activity", state: "drafting", label: "Drafting a reply…" };
  yield { type: "token", text: "Hello" };
  yield { type: "done" };
}

describe("turnToUiResponse", () => {
  it("returns an SSE UI stream for useAgentChat", async () => {
    const res = turnToUiResponse(events());
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream|text\/plain/);
    const body = await res.text();
    expect(body).toContain("Hello");
    expect(body).toContain("text-delta");
  });
});
