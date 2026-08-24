import { describe, expect, it } from "vitest";
import { ndaPdfHash, renderNdaPdf } from "@/lib/nda/pdf";
import { ndaTemplateHash } from "@/lib/nda/template";

describe("NDA PDF", () => {
  it("embeds the typed name and hashes the signed bytes", () => {
    const hash = ndaTemplateHash();
    const pdf = renderNdaPdf({
      typedName: "LP One",
      documentHash: hash,
      signedAt: new Date("2026-08-22T12:00:00Z"),
    });
    const text = pdf.toString("utf8");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("LP One");
    expect(text).toContain(hash);
    expect(ndaPdfHash(pdf)).toMatch(/^[a-f0-9]{64}$/);
  });
});
