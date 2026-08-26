import { describe, expect, it } from "vitest";
import {
  isCashflowModelRequest,
  parseVariableSet,
} from "@/lib/nico/model-intent";

describe("model intent", () => {
  it("recognizes a cash-flow request", () => {
    expect(isCashflowModelRequest("show the 10-year cash flow")).toBe(true);
    expect(isCashflowModelRequest("build a worksheet")).toBe(false);
  });

  it("parses a step-up change", () => {
    expect(parseVariableSet("set the step-up to 15%")).toEqual({
      lineStepUpPct: 0.15,
    });
  });

  it("parses a balloon change", () => {
    expect(parseVariableSet("change the balloon to 25%")).toEqual({
      minResidualOfAssetPct: 0.25,
    });
  });

  it("parses a spread change", () => {
    expect(parseVariableSet("set the spread to 15%")).toEqual({
      spreadSharePct: 0.15,
    });
  });

  it("parses origination and servicing seeds", () => {
    expect(parseVariableSet("set origination to 1.5%")).toEqual({
      originationFeePct: 0.015,
    });
    expect(parseVariableSet("set servicing to 75 bps")).toEqual({
      servicingBps: 0.0075,
    });
    expect(parseVariableSet("cambia la originación a 1.5%")).toEqual({
      originationFeePct: 0.015,
    });
    expect(parseVariableSet("pon la cuota inicial a 35%")).toEqual({
      downPaymentPct: 0.35,
    });
    expect(parseVariableSet("ajusta el globo a 25%")).toEqual({
      minResidualOfAssetPct: 0.25,
    });
  });
});
