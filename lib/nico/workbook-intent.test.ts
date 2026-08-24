import { describe, expect, it } from "vitest";
import {
  WHOLE_BUSINESS_LABELS,
  entitiesForWorkbook,
  isWorkbookRequest,
} from "@/lib/nico/workbook-intent";

describe("workbook intent", () => {
  it("detects a worksheet request for the whole business", () => {
    const message =
      "Nico, help me build a worksheet about the Tamarindo business as a whole";
    expect(isWorkbookRequest(message)).toBe(true);
    expect(entitiesForWorkbook(message)).toEqual(WHOLE_BUSINESS_LABELS);
  });

  it("keeps a named-entity workbook on that entity", () => {
    expect(entitiesForWorkbook("excel for Intervest only")).toEqual([
      "Tamarindo-Intervest",
    ]);
  });

  it("defaults a bare excel ask to the family", () => {
    expect(isWorkbookRequest("build the 10-year excel")).toBe(true);
    expect(entitiesForWorkbook("build the 10-year excel")).toEqual(
      WHOLE_BUSINESS_LABELS,
    );
  });
});
