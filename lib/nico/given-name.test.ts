import { describe, expect, it } from "vitest";
import {
  addressStyleFromMemory,
  askedGivenNamePermission,
  familyNameFromDisplayName,
  givenNameFromDisplayName,
  offeredGivenName,
  parseAddressConsent,
} from "@/lib/nico/given-name";

describe("givenNameFromDisplayName", () => {
  it("takes the first token and ignores a parenthetical", () => {
    expect(givenNameFromDisplayName("Ricardo (dev)")).toBe("Ricardo");
    expect(givenNameFromDisplayName("Ada Lovelace")).toBe("Ada");
  });

  it("rejects emails and auth subjects", () => {
    expect(givenNameFromDisplayName("ada@tamarindo.com")).toBeNull();
    expect(givenNameFromDisplayName("user_01ABC")).toBeNull();
    expect(givenNameFromDisplayName("")).toBeNull();
    expect(givenNameFromDisplayName("by")).toBeNull();
  });
});

describe("offeredGivenName", () => {
  it("reads a name from a normal introduction", () => {
    expect(offeredGivenName("Hey, I'm Luca")).toBe("Luca");
    expect(offeredGivenName("call me Sam")).toBe("Sam");
    expect(offeredGivenName("my name is María")).toBe("María");
  });

  it("ignores a message that is not an introduction", () => {
    expect(offeredGivenName("what is the thesis?")).toBeNull();
  });
});

describe("familyNameFromDisplayName", () => {
  it("takes the last real token", () => {
    expect(familyNameFromDisplayName("Ricardo Cidale")).toBe("Cidale");
    expect(familyNameFromDisplayName("Ada Lovelace")).toBe("Lovelace");
    expect(familyNameFromDisplayName("Ricardo (dev)")).toBeNull();
  });
});

describe("parseAddressConsent", () => {
  it("reads an explicit yes or no without waiting for the ask", () => {
    expect(parseAddressConsent("you can call me by my first name")).toBe("first");
    expect(parseAddressConsent("please don't use my first name")).toBe("formal");
    expect(parseAddressConsent("yes, run the model")).toBeNull();
  });

  it("accepts a short yes or no only after Nico asked", () => {
    expect(parseAddressConsent("yes", { pendingAsk: true })).toBe("first");
    expect(parseAddressConsent("no thanks", { pendingAsk: true })).toBe("formal");
    expect(parseAddressConsent("yes", { pendingAsk: false })).toBeNull();
  });
});

describe("addressStyleFromMemory", () => {
  it("reads the standing preference notes", () => {
    expect(
      addressStyleFromMemory("Nico may call this person by first name (Ada)"),
    ).toBe("first");
    expect(
      addressStyleFromMemory(
        "Nico must not use this person's first name; they declined",
      ),
    ).toBe("formal");
    expect(addressStyleFromMemory("First close is Q1")).toBe("unknown");
  });
});

describe("askedGivenNamePermission", () => {
  it("recognizes the first-name question", () => {
    expect(
      askedGivenNamePermission(
        "Hey Ricardo — mind if I keep using your first name, or would you rather I didn't?",
      ),
    ).toBe(true);
    expect(askedGivenNamePermission("FY1 cash is still positive.")).toBe(false);
  });
});
