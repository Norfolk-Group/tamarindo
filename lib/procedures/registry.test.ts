import { describe, expect, it } from "vitest";
import { z } from "zod";
import { registry } from "@/lib/procedures";
import {
  ProcedureError,
  ProcedureRegistry,
  defineProcedure,
} from "@/lib/procedures/registry";

const adminUser = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "admin" as const,
  },
  traceId: "test-human-user",
};

const adminAgent = {
  actor: {
    kind: "agent" as const,
    id: "dev-local",
    displayName: "Nico",
    role: "admin" as const,
  },
  traceId: "test-human-agent",
};

const memberAgent = {
  actor: {
    kind: "agent" as const,
    id: "member-1",
    displayName: "Nico",
    role: "member" as const,
  },
  traceId: "test-member-agent",
};

describe("humanOnly capability map (KTD4 / AE3)", () => {
  it("lets a member agent see artifacts.create but not approvals.decide", () => {
    const names = registry
      .capabilities({ role: "member", kind: "agent" })
      .map((c) => c.name);
    expect(names).toContain("artifacts.create");
    expect(names).toContain("media.generate");
    expect(names).toContain("model.report");
    expect(names).toContain("icp.list");
    expect(names).toContain("icp.get");
    expect(names).toContain("help.list");
    expect(names).toContain("help.get");
    expect(names).not.toContain("icp.set");
    expect(names).toContain("icp.vintages");
    expect(names).not.toContain("approvals.decide");
    expect(names).not.toContain("dealTerms.publish");
    expect(names).not.toContain("model.publishShared");
    expect(names).toContain("model.applyScenario");
    expect(names).toContain("model.listScenarios");
  });

  it("lets an investor agent read period reports and ICPs but not icp.set", () => {
    const names = registry
      .capabilities({ role: "investor", kind: "agent" })
      .map((c) => c.name);
    expect(names).toContain("model.report");
    expect(names).toContain("icp.list");
    expect(names).toContain("icp.get");
    expect(names).toContain("help.list");
    expect(names).toContain("help.get");
    expect(names).toContain("icp.vintages");
    expect(names).not.toContain("icp.set");
    expect(names).not.toContain("model.setVariables");
    expect(names).not.toContain("model.listScenarios");
    expect(names).not.toContain("model.publishShared");
  });

  it("shows approvals.decide and nda.sign to a human admin, not to an admin agent", () => {
    const local = new ProcedureRegistry()
      .register(
        defineProcedure({
          name: "approvals.decide",
          description: "decide",
          input: z.object({}),
          output: z.object({}),
          minRole: "admin",
          humanOnly: true,
          requiresApproval: false,
          handler: async () => ({}),
        }),
      )
      .register(
        defineProcedure({
          name: "nda.sign",
          description: "sign",
          input: z.object({}),
          output: z.object({}),
          minRole: "investor",
          humanOnly: true,
          requiresApproval: false,
          handler: async () => ({}),
        }),
      );

    const userNames = local
      .capabilities({ role: "admin", kind: "user" })
      .map((c) => c.name);
    const agentNames = local
      .capabilities({ role: "admin", kind: "agent" })
      .map((c) => c.name);
    expect(userNames).toEqual(expect.arrayContaining(["approvals.decide", "nda.sign"]));
    expect(agentNames).not.toContain("approvals.decide");
    expect(agentNames).not.toContain("nda.sign");
  });

  it("rejects a direct agent invoke of approvals.decide even with admin role", async () => {
    await expect(
      registry.invoke(
        "approvals.decide",
        { approvalId: "x", decision: "approved" },
        adminAgent,
      ),
    ).rejects.toMatchObject({ code: "forbidden" } satisfies Pick<ProcedureError, "code">);
  });

  it("lists the same names the left rail receives for a human admin session", () => {
    const rail = registry.capabilities({
      role: adminUser.actor.role,
      kind: adminUser.actor.kind,
    });
    expect(rail.map((c) => c.name)).toEqual(
      registry
        .capabilities({ role: "admin", kind: "user" })
        .map((c) => c.name),
    );
    expect(rail.some((c) => c.name === "approvals.decide")).toBe(true);
    expect(rail.some((c) => c.name === "nda.sign")).toBe(true);
  });

  it("does not let a member agent invent approvals.decide by guessing the name", async () => {
    await expect(
      registry.invoke(
        "approvals.decide",
        { approvalId: "x", decision: "approved" },
        memberAgent,
      ),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("hides model.publishShared from agents and forbids a direct invoke", async () => {
    const agentNames = registry
      .capabilities({ role: "admin", kind: "agent" })
      .map((c) => c.name);
    const userNames = registry
      .capabilities({ role: "admin", kind: "user" })
      .map((c) => c.name);
    expect(userNames).toContain("model.publishShared");
    expect(agentNames).not.toContain("model.publishShared");
    await expect(
      registry.invoke("model.publishShared", {}, adminAgent),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});
