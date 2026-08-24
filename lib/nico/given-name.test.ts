import { describe, expect, it } from "vitest";
import { givenNameFromDisplayName, offeredGivenName } from "@/lib/nico/given-name";

describe("givenNameFromDisplayName", () => {
  it("takes the first token and ignores a parenthetical", () => {
    expect(givenNameFromDisplayName("Ricardo (dev)")).toBe("Ricardo");
    expect(givenNameFromDisplayName("Ada Lovelace")).toBe("Ada");
  });

  it("rejects emails and auth subjects", () => {
    expect(givenNameFromDisplayName("ada@tamarindo.com")).toBeNull();
    expect(givenNameFromDisplayName("user_01ABC")).toBeNull();
    expect(givenNameFromDisplayName("")).toBeNull();
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
