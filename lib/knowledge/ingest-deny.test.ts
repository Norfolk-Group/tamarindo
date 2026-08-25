import { describe, expect, it } from "vitest";
import { ingestDeniedReason } from "../../scripts/lib/ingest-deny.mjs";

describe("ingest deny list", () => {
  it("lets ordinary Tamarindo extracts through", () => {
    expect(
      ingestDeniedReason(
        "knowledge/documents/natalia-competitor-benchmark-extracted.txt",
        "Volvé is the closest conceptual competitor.",
      ),
    ).toBeNull();
  });

  it("drops excluded personal-history filenames", () => {
    expect(ingestDeniedReason("kit-digital-clipping.pdf", "press")).toMatch(
      /excluded/,
    );
  });
});
