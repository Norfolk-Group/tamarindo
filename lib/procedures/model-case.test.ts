import { describe, expect, it, vi } from "vitest";
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
    source: "seed" as const,
    values: defaultValues(),
  })),
}));

vi.mock("@/lib/procedures/profile", () => ({
  profileIdFor: vi.fn(async () => "profile-test"),
}));

const admin = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "admin" as const,
  },
  traceId: "model-publish-admin",
};

const member = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Member",
    role: "member" as const,
  },
  traceId: "model-publish-member",
};

describe("model.setVariables publish", () => {
  it("lets an admin write the shared company case", async () => {
    const { registry } = await import("@/lib/procedures");
    const out = (await registry.invoke(
      "model.setVariables",
      { values: { downPaymentPct: 0.35 }, publishShared: true },
      admin,
    )) as { caseSource: string; applied: string[] };
    expect(publishSharedCase).toHaveBeenCalled();
    expect(out.caseSource).toBe("shared");
    expect(out.applied).toEqual(["__shared__"]);
  });

  it("refuses a member publish", async () => {
    const { registry } = await import("@/lib/procedures");
    await expect(
      registry.invoke(
        "model.setVariables",
        { values: { downPaymentPct: 0.35 }, publishShared: true },
        member,
      ),
    ).rejects.toThrow(/admin/i);
    expect(saveModelValues).not.toHaveBeenCalled();
  });
});
