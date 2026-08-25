import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const invoke = vi.hoisted(() => vi.fn());
const inputSchema = vi.hoisted(() => vi.fn());

vi.mock("@/lib/procedures", () => ({
  registry: { invoke, inputSchema },
}));

import { ProcedureError } from "@/lib/procedures/registry";
import {
  agentToolSet,
  invokeAgentTool,
  listAgentTools,
  toolWireName,
} from "@/lib/nico/registry-tools";

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

describe("agentToolSet", () => {
  const capabilities = [
    {
      name: "knowledge.search",
      description: "Search the knowledge base.",
      minRole: "guest",
      requiresApproval: false,
      humanOnly: false,
    },
    {
      name: "communications.send",
      description: "Send a message to an investor.",
      minRole: "member",
      requiresApproval: true,
      humanOnly: false,
    },
    {
      name: "capabilities.list",
      description: "List capabilities.",
      minRole: "guest",
      requiresApproval: false,
      humanOnly: false,
    },
  ];

  function arrange() {
    invoke.mockReset();
    inputSchema.mockReset();
    invoke.mockResolvedValueOnce({ capabilities });
    inputSchema.mockImplementation((name: string) =>
      name === "capabilities.list"
        ? undefined
        : z.object({ query: z.string().optional() }),
    );
  }

  it("maps procedure names to wire-safe tool names and skips introspection", async () => {
    arrange();
    const tools = await agentToolSet(human, "t3");
    expect(Object.keys(tools).sort()).toEqual([
      "communications_send",
      "knowledge_search",
    ]);
    expect(toolWireName("model.saveScenario")).toBe("model_saveScenario");
  });

  it("executes through registry.invoke as kind agent", async () => {
    arrange();
    const tools = await agentToolSet(human, "t4");
    invoke.mockResolvedValueOnce({ passages: [] });
    const result = await tools.knowledge_search.execute?.(
      { query: "thesis" },
      { toolCallId: "call_1", messages: [], context: undefined },
    );
    expect(result).toEqual({ passages: [] });
    expect(invoke).toHaveBeenLastCalledWith(
      "knowledge.search",
      { query: "thesis" },
      { actor: { ...human, kind: "agent" }, traceId: "t4" },
    );
  });

  it("returns a ProcedureError as a tool result so the model can relay it", async () => {
    arrange();
    const tools = await agentToolSet(human, "t5");
    invoke.mockRejectedValueOnce(
      new ProcedureError(
        "approval_required",
        "communications.send needs an approved approvalId",
      ),
    );
    const result = await tools.communications_send.execute?.(
      {},
      { toolCallId: "call_2", messages: [], context: undefined },
    );
    expect(result).toEqual({
      error: "approval_required",
      message: "communications.send needs an approved approvalId",
    });
  });

  it("flags approval-gated procedures in the tool description", async () => {
    arrange();
    const tools = await agentToolSet(human, "t6");
    expect(tools.communications_send.description).toContain("approvalId");
    expect(tools.knowledge_search.description).toBe(
      "Search the knowledge base.",
    );
  });
});
