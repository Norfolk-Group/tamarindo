import { describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());

vi.mock("@/lib/procedures", () => ({
  registry: { invoke },
}));

import { invokeAgentTool, listAgentTools } from "@/lib/nico/registry-tools";

const human = {
  kind: "user" as const,
  id: "user_1",
  displayName: "Ada",
  role: "admin" as const,
};

describe("registry tools", () => {
  it("lists capabilities as kind agent", async () => {
    invoke.mockResolvedValue({ capabilities: [{ name: "artifacts.create" }] });
    const tools = await listAgentTools(human, "trace_1");
    expect(tools[0]?.name).toBe("artifacts.create");
    expect(invoke).toHaveBeenCalledWith(
      "capabilities.list",
      {},
      {
        actor: { ...human, kind: "agent" },
        traceId: "trace_1",
      },
    );
  });

  it("invokes a tool as kind agent with the session authSubject", async () => {
    invoke.mockResolvedValue({ ok: true });
    await invokeAgentTool("knowledge.search", { query: "thesis" }, human, "t2");
    expect(invoke).toHaveBeenCalledWith(
      "knowledge.search",
      { query: "thesis" },
      {
        actor: { ...human, kind: "agent" },
        traceId: "t2",
      },
    );
  });
});
