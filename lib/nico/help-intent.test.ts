import { describe, expect, it } from "vitest";
import { parseHelpAsk } from "@/lib/nico/help-intent";
import { parseIcpAsk } from "@/lib/nico/icp-intent";

describe("help intent", () => {
  it("opens the catalog for a bare help ask", () => {
    expect(parseHelpAsk("help")).toEqual({ kind: "list" });
    expect(parseHelpAsk("how does this app work")).toEqual({ kind: "list" });
  });

  it("maps how-do-I questions to a topic", () => {
    expect(parseHelpAsk("how do I save")).toEqual({
      kind: "get",
      id: "assumptions.save",
    });
    expect(parseHelpAsk("what is residual")).toMatchObject({ kind: "get" });
  });

  it("does not steal a task that starts with help me", () => {
    expect(parseHelpAsk("Help me build a worksheet about the Tamarindo business as a whole")).toBeNull();
  });

  it("does not steal a named ICP identity question", () => {
    expect(parseIcpAsk("what is ICP-1")).toEqual({ kind: "get", id: "icp1" });
    const help = parseHelpAsk("what is ICP-1");
    expect(help?.kind).not.toBe("get");
  });
});
