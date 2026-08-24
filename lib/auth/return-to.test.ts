import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/lib/auth/return-to";

describe("safeReturnTo", () => {
  it("keeps a relative path with query", () => {
    expect(safeReturnTo("/login?invite=1")).toBe("/login?invite=1");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeReturnTo("https://evil.example/phish")).toBe("/invite");
    expect(safeReturnTo("//evil.example/phish")).toBe("/invite");
  });
});
