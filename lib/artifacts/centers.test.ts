import { describe, expect, it } from "vitest";
import {
  ENTITY_LABELS,
  PNL_CENTERS,
  TAMARINDO_ENTITIES,
  centersFor,
  manpowerWorkbookSpec,
  parseEntity,
  parseEntityList,
  seedManpower,
} from "@/lib/artifacts/centers";

describe("P&L centers", () => {
  it("covers every Tamarindo entity with at least one revenue or cost center", () => {
    for (const entity of TAMARINDO_ENTITIES) {
      const centers = centersFor(entity);
      expect(centers.length, entity).toBeGreaterThan(0);
    }
  });

  it("gives each center a unique id and a citation path", () => {
    const ids = PNL_CENTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const center of PNL_CENTERS) {
      expect(center.citation.path.startsWith("knowledge/thesis/")).toBe(true);
      expect(center.functions.length).toBeGreaterThan(0);
    }
  });

  it("parses common entity aliases", () => {
    expect(parseEntity("Tamarindo US")).toBe("tamarindo_us");
    expect(parseEntity("Intervest")).toBe("tamarindo_intervest");
    expect(parseEntity("Ashoka")).toBe("ashoka");
    expect(parseEntity("unknown")).toBeNull();
    expect(parseEntityList(undefined)).toEqual([...TAMARINDO_ENTITIES]);
    expect(parseEntityList(["family"])).toEqual([...TAMARINDO_ENTITIES]);
    expect(parseEntityList(["Tamarindo US"])).toEqual(["tamarindo_us"]);
  });

  it("seeds Y1–2 headcount from the cited lean team and leaves pay unlabeled", () => {
    const ga = PNL_CENTERS.find((c) => c.id === "tus.ga");
    if (!ga) throw new Error("missing tus.ga");
    const y1 = seedManpower(ga, 1);
    expect(y1.fte).toBe(3);
    expect(y1.avgSalaryUsd).toBeNull();
    expect(y1.benefitsLoad).toBeNull();
    expect(y1.turnoverRate).toBeNull();
    expect(y1.citation.label).toBe("OPINION");
  });

  it("builds a 10-year manpower spec per requested entity", () => {
    const spec = manpowerWorkbookSpec(["tamarindo_us", "ashoka"]);
    expect(spec.map((s) => s.label)).toEqual([
      ENTITY_LABELS.tamarindo_us,
      ENTITY_LABELS.ashoka,
    ]);
    expect(spec[0]?.centers[0]?.years).toHaveLength(10);
    expect(spec.some((s) => s.entity === "tamarindo_colombia")).toBe(false);
  });
});
