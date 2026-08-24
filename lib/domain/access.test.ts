import { afterEach, describe, expect, it } from "vitest";
import {
  CURRENT_NDA_TEMPLATE_VERSION,
  canReadConfidential,
  hasCurrentNda,
  setCurrentNdaForTests,
} from "@/lib/domain/access";

describe("current-template NDA", () => {
  it("rejects timestamp-only signatures", () => {
    expect(
      hasCurrentNda({
        ndaSignedAt: new Date("2026-08-01"),
        ndaSignatures: [],
      }),
    ).toBe(false);
  });

  it("rejects a signature on a stale template", () => {
    expect(
      hasCurrentNda({
        ndaSignedAt: new Date("2026-08-01"),
        ndaSignatures: [{ templateVersion: "nda-v0" }],
      }),
    ).toBe(false);
  });

  it("accepts ndaSignedAt plus the current template", () => {
    expect(
      hasCurrentNda({
        ndaSignedAt: new Date("2026-08-01"),
        ndaSignatures: [{ templateVersion: CURRENT_NDA_TEMPLATE_VERSION }],
      }),
    ).toBe(true);
  });
});

describe("canReadConfidential", () => {
  afterEach(() => {
    setCurrentNdaForTests(null);
  });

  it("lets an admin through without an NDA", async () => {
    setCurrentNdaForTests(false);
    await expect(
      canReadConfidential({ id: "admin-unsigned", role: "admin" }),
    ).resolves.toBe(true);
  });

  it("still requires a current NDA for investors", async () => {
    setCurrentNdaForTests(false);
    await expect(
      canReadConfidential({ id: "investor-unsigned", role: "investor" }),
    ).resolves.toBe(false);
    setCurrentNdaForTests(true);
    await expect(
      canReadConfidential({ id: "investor-signed", role: "investor" }),
    ).resolves.toBe(true);
  });
});
