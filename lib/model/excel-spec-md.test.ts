import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  TAMARINDO_EXCEL_SPEC_FILENAME,
  TAMARINDO_EXCEL_SPEC_MD,
} from "@/lib/model/excel-spec-md";

describe("tamarindo excel spec", () => {
  it("embeds the docs/nico markdown for Workers", () => {
    const onDisk = readFileSync(
      path.join(process.cwd(), "docs/nico/tamarindo-excel-spec.md"),
      "utf8",
    );
    expect(TAMARINDO_EXCEL_SPEC_FILENAME).toBe("tamarindo-excel-spec.md");
    expect(TAMARINDO_EXCEL_SPEC_MD).toBe(onDisk);
  });

  it("covers the four companies, who-pays-whom, and the seed catalog", () => {
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("Tamarindo Credit, LLC");
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("Tamarindo Intervest, LLC");
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("Sucursal Colombia");
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("Ashoka");
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("Who pays whom");
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("lineTranche1Usd");
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("Dov Tuzman");
    expect(TAMARINDO_EXCEL_SPEC_MD).toContain("their own");
    expect(TAMARINDO_EXCEL_SPEC_MD).not.toMatch(/=PMT\(/);
  });
});
