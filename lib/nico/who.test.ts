import { describe, expect, it } from "vitest";
import { formatWhoNote } from "@/lib/nico/who";

describe("formatWhoNote", () => {
  it("asks permission and names the person when address is still open", () => {
    const note = formatWhoNote({
      displayName: "Ricardo Cidale",
      givenName: "Ricardo",
      familyName: "Cidale",
      org: "Tamarindo",
      bio: "Founder.",
      role: "admin",
      nda: "not required",
      addressStyle: "unknown",
      askGivenName: true,
    });
    expect(note).toContain("Given name: Ricardo");
    expect(note).toContain("NDA: not required");
    expect(note).toContain('Say "Ricardo" once');
    expect(note).toContain("keep using that first name");
    expect(note).toContain("Build a little rapport");
  });

  it("stops asking once they said yes", () => {
    const note = formatWhoNote({
      displayName: "Ada Lovelace",
      givenName: "Ada",
      familyName: "Lovelace",
      org: null,
      bio: null,
      role: "member",
      nda: "pending",
      addressStyle: "first",
      askGivenName: false,
    });
    expect(note).toContain("they said yes — use Ada once");
    expect(note).not.toContain("RAPPORT");
  });

  it("honors a declined first name", () => {
    const note = formatWhoNote({
      displayName: "Ada Lovelace",
      givenName: "Ada",
      familyName: "Lovelace",
      org: null,
      bio: null,
      role: "investor",
      nda: "pending",
      addressStyle: "formal",
      askGivenName: false,
    });
    expect(note).toContain("they declined the first name");
    expect(note).toContain("Last name Lovelace");
    expect(note).not.toContain("Say \"Ada\"");
  });
});
