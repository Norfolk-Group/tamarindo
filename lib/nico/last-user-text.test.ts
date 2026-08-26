import { describe, expect, it } from "vitest";
import { lastUserText } from "@/lib/nico/last-user-text";

describe("lastUserText", () => {
  it("reads a trailing user part", () => {
    expect(
      lastUserText([
        { role: "user", parts: [{ type: "text", text: "what's the IRR" }] },
      ]),
    ).toBe("what's the IRR");
  });

  it("skips an empty assistant stub after the user turn", () => {
    expect(
      lastUserText([
        { role: "user", parts: [{ type: "text", text: "what do we make on a $500k lease" }] },
        { role: "assistant", parts: [] },
      ]),
    ).toBe("what do we make on a $500k lease");
  });

  it("skips a later empty user bubble", () => {
    expect(
      lastUserText([
        { role: "user", content: "show me the books" },
        { role: "user", parts: [{ type: "text", text: "" }] },
      ]),
    ).toBe("show me the books");
  });
});
