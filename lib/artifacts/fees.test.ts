import { describe, expect, it } from "vitest";
import { PNL_CENTERS } from "@/lib/artifacts/centers";
import {
  FEE_LINES,
  assertFeeCentersExist,
  feeWorkbookSpec,
  feesCharged,
  feesForEntity,
  feesPaid,
  parseFeeDirection,
} from "@/lib/artifacts/fees";

describe("fee ledger", () => {
  it("has both charged and paid lines", () => {
    expect(feesCharged().length).toBeGreaterThanOrEqual(6);
    expect(feesPaid().length).toBeGreaterThanOrEqual(6);
  });

  it("gives each line a unique id and a citation path", () => {
    const ids = FEE_LINES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const line of FEE_LINES) {
      expect(line.citation.path.length).toBeGreaterThan(0);
      expect(["FACT", "OPINION", "ASSUMPTION"]).toContain(line.citation.label);
    }
  });

  it("points pnlCenterId at a real center", () => {
    expect(assertFeeCentersExist()).toEqual([]);
    const known = new Set(PNL_CENTERS.map((c) => c.id));
    for (const line of FEE_LINES) {
      if (line.pnlCenterId) expect(known.has(line.pnlCenterId)).toBe(true);
    }
  });

  it("leaves unlabeled vendor and legal amounts blank", () => {
    const unlabeled = FEE_LINES.filter((f) =>
      ["pay.cloudflare", "pay.legal_opinions", "pay.sucursal_tax", "chg.ashoka_pm"].includes(f.id),
    );
    expect(unlabeled.every((f) => f.rate === null)).toBe(true);
  });

  it("keeps the sourced activation fee at 2% of drawdown", () => {
    const activation = FEE_LINES.find((f) => f.id === "chg.activation");
    expect(activation?.rate).toBe(0.02);
    expect(activation?.citation.label).toBe("FACT");
  });

  it("groups lines onto entity workbook sheets", () => {
    const spec = feeWorkbookSpec(["tamarindo_us", "ashoka"]);
    expect(spec[0]?.charged.some((f) => f.id === "chg.activation")).toBe(true);
    expect(spec[0]?.paid.some((f) => f.id === "pay.workos")).toBe(true);
    expect(feesForEntity("tamarindo_colombia").some((f) => f.id === "pay.notary_title")).toBe(true);
  });

  it("parses direction aliases", () => {
    expect(parseFeeDirection("inbound")).toBe("charged");
    expect(parseFeeDirection("outbound")).toBe("paid");
    expect(parseFeeDirection("nope")).toBeNull();
  });
});
