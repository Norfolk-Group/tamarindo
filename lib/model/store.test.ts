import { describe, expect, it } from "vitest";
import { personalVarsTitle, resolveModelCase } from "@/lib/model/store";
import { groupedVariableIds, sectionForGroup } from "@/lib/model/variable-groups";

describe("personal case", () => {
  it("namespaces the artifact title by profile", () => {
    expect(personalVarsTitle("prof_1")).toBe("__tamarindo_model_variables__:prof_1");
  });

  it("prefers a personal override over the shared company row", () => {
    const personal = resolveModelCase({ downPaymentPct: 0.35 }, { downPaymentPct: 0.4 });
    expect(personal.source).toBe("personal");
    expect(personal.values.downPaymentPct).toBe(0.35);
    const shared = resolveModelCase(null, { downPaymentPct: 0.4 });
    expect(shared.source).toBe("shared");
    expect(shared.values.downPaymentPct).toBe(0.4);
    const seed = resolveModelCase(null, null);
    expect(seed.source).toBe("seed");
  });
});

describe("assumption sections", () => {
  it("maps every variable group to a titled section", () => {
    for (const group of groupedVariableIds()) {
      const section = sectionForGroup(group);
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.id).toBe(group);
    }
  });
});
