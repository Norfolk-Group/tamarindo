import { describe, expect, it } from "vitest";
import { parseIcpAsk } from "@/lib/nico/icp-intent";

describe("icp intent", () => {
  it("maps an identity question to icp.get", () => {
    expect(parseIcpAsk("what is ICP-1")).toEqual({ kind: "get", id: "icp1" });
    expect(parseIcpAsk("tell me about ICP 3")).toEqual({ kind: "get", id: "icp3" });
    expect(parseIcpAsk("what is AUTO-1")).toEqual({ kind: "get", id: "auto1" });
    expect(parseIcpAsk("explain the Phenom")).toEqual({ kind: "get", id: "air2" });
  });

  it("maps a catalog ask to icp.list", () => {
    expect(parseIcpAsk("list the ICPs")).toEqual({ kind: "list" });
    expect(parseIcpAsk("what are the ICPs")).toEqual({ kind: "list" });
  });

  it("maps January 2027 originations to icp.vintages", () => {
    expect(parseIcpAsk("show originations in Jan 2027")).toEqual({
      kind: "vintages",
      year: 2027,
      month: 1,
    });
    expect(parseIcpAsk("planned vintages for 2028")).toEqual({
      kind: "vintages",
      year: 2028,
    });
  });

  it("parses a per-ICP variable change", () => {
    expect(parseIcpAsk("set ICP-1 purchase price to 450000")).toEqual({
      kind: "set",
      id: "icp1",
      values: { purchasePriceUsd: 450000 },
    });
    expect(parseIcpAsk("change ICP-2 rate to 12%")).toEqual({
      kind: "set",
      id: "icp2",
      values: { clientRate: 0.12 },
    });
  });

  it("does not steal cash-flow or origination-fee asks", () => {
    expect(parseIcpAsk("show the 10-year cash flow")).toBeNull();
    expect(parseIcpAsk("set the origination fee to 2%")).toBeNull();
    expect(parseIcpAsk("FY3 cash flow")).toBeNull();
  });
});
