import { describe, expect, it, vi } from "vitest";
import { computeContracts } from "@/lib/model/contracts";
import { runCashflowModel } from "@/lib/model/engine";
import { defaultValues, mergeValues } from "@/lib/model/variables";
import { buildPlannedVintages } from "@/lib/model/vintages";
import {
  filterPlannedVintages,
  icpVariableKey,
  toIcpCatalog,
} from "@/lib/procedures/icp";

vi.mock("@/lib/model/store", () => ({
  loadModelValues: vi.fn(async () => defaultValues()),
  loadValuesForActor: vi.fn(async () => defaultValues()),
  saveModelValues: vi.fn(async (overrides: Record<string, number | string>) =>
    mergeValues(overrides),
  ),
}));

vi.mock("@/lib/procedures/profile", () => ({
  profileIdFor: vi.fn(async () => "profile-test"),
}));

const investor = {
  actor: {
    kind: "agent" as const,
    id: "dev-local",
    displayName: "Nico",
    role: "investor" as const,
  },
  traceId: "icp-investor",
};

const member = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "member" as const,
  },
  traceId: "icp-member",
};

const admin = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "admin" as const,
  },
  traceId: "icp-admin",
};

describe("ICP catalog and vintages", () => {
  it("maps computeContracts into the six property rows", () => {
    const contracts = computeContracts(defaultValues());
    const catalog = contracts.map(toIcpCatalog);
    expect(catalog).toHaveLength(6);
    expect(catalog.map((row) => row.id)).toEqual([
      "icp1",
      "icp2",
      "icp3",
      "icp4",
      "icp5",
      "icp6",
    ]);
    const icp1 = catalog[0]!;
    expect(icp1.code).toBe("ICP-1");
    expect(icp1.name).toBe("Poblado Executive");
    expect(icp1.city).toBe("Medellín");
    expect(icp1.purchasePriceUsd).toBe(420_000);
    expect(icp1.residualUsd).toBeGreaterThan(0);
    expect(icp1.monthlyLeaseUsd).toBeGreaterThan(0);
    expect(icp1.mixWeight).toBe(0.25);
    expect(icp1.citation.label).toBe("ASSUMPTION");
  });

  it("filters planned vintages by month without writing originations", () => {
    const values = defaultValues();
    const planned = buildPlannedVintages(values, computeContracts(values));
    const january = filterPlannedVintages(planned, {
      year: 2027,
      month: 1,
    });
    expect(january.total).toBeGreaterThan(0);
    expect(january.vintages.every((row) => row.year === 2027 && row.month === 1)).toBe(
      true,
    );
    expect(january.byMonth).toEqual([{ year: 2027, month: 1, count: january.total }]);
    expect(january.byIcp.reduce((sum, row) => sum + row.count, 0)).toBe(january.total);
  });

  it("maps set fields onto icp.{id}.* keys", () => {
    expect(icpVariableKey("icp1", "purchasePriceUsd")).toBe(
      "icp.icp1.purchasePriceUsd",
    );
    expect(icpVariableKey("icp4", "mixWeight")).toBe("icp.icp4.mixWeight");
  });
});

describe("ICP procedures", () => {
  it("lists and gets ICPs through the registry", async () => {
    const { registry } = await import("@/lib/procedures");
    const listed = (await registry.invoke("icp.list", {}, investor)) as {
      icps: { id: string; explanation?: string }[];
    };
    expect(listed.icps).toHaveLength(10);
    expect(listed.icps.map((row) => row.id)).toContain("auto1");
    expect(listed.icps.map((row) => row.id)).toContain("air2");
    const one = (await registry.invoke("icp.get", { id: "icp1" }, investor)) as {
      icp: { id: string; code: string };
      years: { fy: number; icpId: string }[];
    };
    expect(one.icp.id).toBe("icp1");
    expect(one.icp.code).toBe("ICP-1");
    expect(one.years).toHaveLength(runCashflowModel(defaultValues()).fyCount);
    expect(one.years[0]?.icpId).toBe("icp1");
  });

  it("returns planned January 2027 vintages", async () => {
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "icp.vintages",
      { year: 2027, month: 1 },
      investor,
    )) as { total: number; vintages: { year: number; month: number }[] };
    expect(out.total).toBeGreaterThan(0);
    expect(out.vintages.every((row) => row.year === 2027 && row.month === 1)).toBe(
      true,
    );
  });

  it("lets an admin set an ICP key and recalculates", async () => {
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "icp.set",
      { id: "icp1", values: { purchasePriceUsd: 450_000 } },
      admin,
    )) as { icp: { purchasePriceUsd: number }; applied: string[] };
    expect(out.applied).toEqual(["icp.icp1.purchasePriceUsd"]);
    expect(out.icp.purchasePriceUsd).toBe(450_000);
  });

  it("forbids a member from icp.set", async () => {
    const { registry } = await import("@/lib/procedures");
    await expect(
      registry.invoke(
        "icp.set",
        { id: "icp1", values: { purchasePriceUsd: 450_000 } },
        member,
      ),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("forbids an investor from icp.set", async () => {
    const { registry } = await import("@/lib/procedures");
    await expect(
      registry.invoke(
        "icp.set",
        { id: "icp1", values: { mixWeight: 0.2 } },
        investor,
      ),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});
