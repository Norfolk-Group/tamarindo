import { describe, expect, it } from "vitest";
import {
  canonicalR2Key,
  chatUploadKey,
  classifyR2Key,
  illustrationKey,
  shouldVectorIndex,
  userArtifactKey,
} from "@/lib/storage/r2-schema";

describe("R2 library", () => {
  it("puts chat uploads on the raw-KB shelf", () => {
    expect(chatUploadKey("Plan.pdf", new Date("2026-08-24T12:00:00Z"))).toBe(
      "library/kb/raw/chat/2026-08-24/Plan.pdf",
    );
  });

  it("maps legacy keys without dropping the filename", () => {
    expect(canonicalR2Key("uploads/chat/2026-08-23/x.pdf")).toBe(
      "library/kb/raw/chat/2026-08-23/x.pdf",
    );
    expect(canonicalR2Key("source/dropbox/overview.docx")).toBe(
      "library/kb/raw/dropbox/overview.docx",
    );
    expect(canonicalR2Key("artifacts/abc/book.xlsx")).toBe(
      "library/share/users/artifacts/abc/book.xlsx",
    );
  });

  it("indexes source material and skips scratch charts", () => {
    expect(shouldVectorIndex("library/kb/raw/dropbox/a.docx")).toBe(true);
    expect(shouldVectorIndex("library/kb/derived/extracts/2026-08-24/a.txt")).toBe(
      true,
    );
    expect(shouldVectorIndex("library/charts/specs/x.json")).toBe(false);
    expect(shouldVectorIndex("library/share/users/artifacts/a/book.xlsx")).toBe(
      false,
    );
    expect(classifyR2Key("library/illustrations/generated/2026-08-24/a.png")?.audience).toBe(
      "entitled",
    );
  });

  it("keeps generated pictures and user artifacts on their shelves", () => {
    expect(illustrationKey("png", new Date("2026-08-24T12:00:00Z"), "id1")).toBe(
      "library/illustrations/generated/2026-08-24/id1.png",
    );
    expect(userArtifactKey("art1", "raise.pptx")).toBe(
      "library/share/users/artifacts/art1/raise.pptx",
    );
  });
});
