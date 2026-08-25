import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProcedureError } from "@/lib/procedures/registry";
import type { ScenarioSummary } from "@/lib/model/cell-store";
import { defaultValues, mergeValues } from "@/lib/model/variables";

const publishSharedCase = vi.fn(async (overrides: Record<string, number | string>) =>
  mergeValues(overrides),
);
const saveModelValues = vi.fn(async (overrides: Record<string, number | string>) =>
  mergeValues(overrides),
);
const loadValuesForActor = vi.fn(async () => defaultValues());

vi.mock("@/lib/model/store", () => ({
  loadModelValues: vi.fn(async () => defaultValues()),
  loadValuesForActor,
  saveModelValues,
  publishSharedCase,
  discardPersonalCase: vi.fn(async () => ({
    source: "seed" as const,
    values: defaultValues(),
  })),
  describeModelCase: vi.fn(async () => ({
    source: "personal" as const,
    values: defaultValues(),
  })),
}));

vi.mock("@/lib/procedures/profile", () => ({
  profileIdFor: vi.fn(async () => "profile-test"),
}));

const saveScenario = vi.fn(async () => ({
  scenarioId: "scen-1",
  cellCount: 10,
  depCount: 4,
}));
const listScenarios = vi.fn(async (): Promise<ScenarioSummary[]> => []);
const diffScenarios = vi.fn(async () => ({
  scenarioA: { id: "a", name: "A" },
  scenarioB: { id: "b", name: "B" },
  changed: [],
  totalChanged: 0,
}));
const getOwnedScenario = vi.fn();
const latestScenarioId = vi.fn(async () => null);
const explainCell = vi.fn();

vi.mock("@/lib/model/cell-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/model/cell-store")>();
  return {
    ...actual,
    saveScenario,
    listScenarios,
    diffScenarios,
    getOwnedScenario,
    latestScenarioId,
    explainCell,
  };
});

const admin = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "admin" as const,
  },
  traceId: "model-case-admin",
};

const member = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Member",
    role: "member" as const,
  },
  traceId: "model-case-member",
};

const adminAgent = {
  actor: {
    kind: "agent" as const,
    id: "dev-local",
    displayName: "Nico",
    role: "admin" as const,
  },
  traceId: "model-case-admin-agent",
};

beforeEach(() => {
  vi.clearAllMocks();
  loadValuesForActor.mockResolvedValue(defaultValues());
  listScenarios.mockResolvedValue([]);
});

describe("model.saveScenario", () => {
  it("inserts the current live values and does not rewrite the personal case", async () => {
    const { registry } = await import("@/lib/procedures");
    await registry.invoke("model.saveScenario", { name: "Rate shock" }, admin);
    expect(saveScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Rate shock",
        createdById: "profile-test",
      }),
    );
    expect(saveModelValues).not.toHaveBeenCalled();
    expect(publishSharedCase).not.toHaveBeenCalled();
  });
});

describe("model.listScenarios", () => {
  it("asks the store for this profile only and hides grey keys from members", async () => {
    listScenarios.mockResolvedValueOnce([
      {
        id: "mine",
        name: "Rate shock",
        description: null,
        isBase: false,
        cellCount: 3,
        createdAt: "2026-08-25T00:00:00.000Z",
        variables: {
          downPaymentPct: 0.35,
          targetUtilizationPct: 0.99,
        },
      },
    ]);
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke("model.listScenarios", {}, member)) as {
      scenarios: { id: string; variables: Record<string, number> }[];
    };
    expect(listScenarios).toHaveBeenCalledWith("profile-test");
    expect(out.scenarios).toHaveLength(1);
    expect(out.scenarios[0]?.variables.downPaymentPct).toBe(0.35);
    expect(out.scenarios[0]?.variables.targetUtilizationPct).toBeUndefined();
  });

  it("does not surface another profile's rows because the store is called with this profile", async () => {
    const { registry } = await import("@/lib/procedures");
    await registry.invoke("model.listScenarios", {}, member);
    expect(listScenarios).toHaveBeenCalledTimes(1);
    expect(listScenarios).toHaveBeenCalledWith("profile-test");
    expect(listScenarios).not.toHaveBeenCalledWith(undefined);
  });
});

describe("model.applyScenario", () => {
  it("loads owned snapshot keys onto the personal case and never publishes", async () => {
    getOwnedScenario.mockResolvedValueOnce({
      id: "snap-1",
      name: "Rate shock",
      variables: {
        ...defaultValues(),
        downPaymentPct: 0.35,
        targetUtilizationPct: 0.99,
      },
    });
    loadValuesForActor.mockResolvedValueOnce({
      ...defaultValues(),
      downPaymentPct: 0.4,
      targetUtilizationPct: 0.85,
    });
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "model.applyScenario",
      { scenarioId: "snap-1" },
      member,
    )) as { caseSource: string; applied: string[] };
    expect(getOwnedScenario).toHaveBeenCalledWith("snap-1", "profile-test");
    expect(publishSharedCase).not.toHaveBeenCalled();
    expect(saveModelValues).toHaveBeenCalledWith(
      expect.objectContaining({
        downPaymentPct: 0.35,
        targetUtilizationPct: 0.85,
      }),
      "profile-test",
    );
    expect(out.caseSource).toBe("personal");
    expect(out.applied).toContain("downPaymentPct");
    expect(out.applied).not.toContain("targetUtilizationPct");
  });

  it("refuses a missing or foreign snapshot id", async () => {
    getOwnedScenario.mockRejectedValueOnce(new Error("Scenario not found"));
    const { registry } = await import("@/lib/procedures");
    await expect(
      registry.invoke("model.applyScenario", { scenarioId: "foreign" }, member),
    ).rejects.toThrow(/not found/i);
    expect(saveModelValues).not.toHaveBeenCalled();
    expect(publishSharedCase).not.toHaveBeenCalled();
  });
});

describe("model.diffScenarios", () => {
  it("diffs only snapshots this profile owns", async () => {
    const { registry } = await import("@/lib/procedures");
    await registry.invoke(
      "model.diffScenarios",
      { scenarioA: "a", scenarioB: "b" },
      member,
    );
    expect(diffScenarios).toHaveBeenCalledWith("a", "b", "profile-test", 40, "member");
  });
});

describe("model.explain", () => {
  it("refuses a foreign scenario id", async () => {
    getOwnedScenario.mockRejectedValueOnce(new Error("Scenario not found"));
    const { registry } = await import("@/lib/procedures");
    await expect(
      registry.invoke(
        "model.explain",
        { key: "us.spread.fy3", scenarioId: "foreign" },
        member,
      ),
    ).rejects.toThrow(/not found/i);
    expect(explainCell).not.toHaveBeenCalled();
    expect(saveScenario).not.toHaveBeenCalled();
  });

  it("auto-creates an owned Base case (auto) when this profile has none", async () => {
    latestScenarioId.mockResolvedValueOnce(null);
    explainCell.mockResolvedValueOnce({ key: "us.spread.fy3", inputs: [] });
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "model.explain",
      { key: "us.spread.fy3" },
      member,
    )) as { scenarioId: string };
    expect(latestScenarioId).toHaveBeenCalledWith("profile-test");
    expect(saveScenario).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Base case (auto)",
        createdById: "profile-test",
        isBase: true,
      }),
    );
    expect(explainCell).toHaveBeenCalledWith("scen-1", "us.spread.fy3", 2);
    expect(out.scenarioId).toBe("scen-1");
  });
});

describe("model.publishShared", () => {
  it("lets an admin human write the shared company case", async () => {
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "model.publishShared",
      { values: { downPaymentPct: 0.35 } },
      admin,
    )) as { caseSource: string; applied: string[] };
    expect(publishSharedCase).toHaveBeenCalled();
    expect(out.caseSource).toBe("shared");
    expect(out.applied).toEqual(["__shared__"]);
  });

  it("refuses a member human", async () => {
    const { registry } = await import("@/lib/procedures");
    await expect(
      registry.invoke(
        "model.publishShared",
        { values: { downPaymentPct: 0.35 } },
        member,
      ),
    ).rejects.toMatchObject({ code: "forbidden" } satisfies Pick<ProcedureError, "code">);
    expect(publishSharedCase).not.toHaveBeenCalled();
    expect(saveModelValues).not.toHaveBeenCalled();
  });

  it("refuses an admin agent", async () => {
    const { registry } = await import("@/lib/procedures");
    await expect(
      registry.invoke("model.publishShared", {}, adminAgent),
    ).rejects.toMatchObject({ code: "forbidden" } satisfies Pick<ProcedureError, "code">);
    expect(publishSharedCase).not.toHaveBeenCalled();
  });
});

describe("model.setVariables cannot publish", () => {
  it("ignores publishShared and writes the personal case only", async () => {
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "model.setVariables",
      { values: { downPaymentPct: 0.35 }, publishShared: true },
      admin,
    )) as { caseSource: string; applied: string[] };
    expect(publishSharedCase).not.toHaveBeenCalled();
    expect(saveModelValues).toHaveBeenCalled();
    expect(out.caseSource).toBe("personal");
    expect(out.applied).toEqual(["downPaymentPct"]);
  });
});
