import { describe, expect, it } from "vitest";
import { isWorkbookRequest } from "@/lib/nico/workbook-intent";
import { excelSpecDownloadNote, parseExcelSpecAsk } from "@/lib/nico/spec-intent";

describe("excel spec intent", () => {
  it("matches Claude-for-Excel phrasing", () => {
    expect(parseExcelSpecAsk("download the excel spec")).toBe(true);
    expect(parseExcelSpecAsk("Claude for Excel spec please")).toBe(true);
    expect(parseExcelSpecAsk("especificacion para excel")).toBe(true);
    expect(parseExcelSpecAsk("build the 10-year excel")).toBe(false);
  });

  it("does not steal a live workbook queue", () => {
    expect(isWorkbookRequest("download the excel spec")).toBe(false);
    expect(isWorkbookRequest("build the 10-year excel")).toBe(true);
  });

  it("points at the signed-in download", () => {
    expect(excelSpecDownloadNote("download the excel spec")).toContain(
      "/api/nico/spec",
    );
    expect(excelSpecDownloadNote("descarga la especificacion para excel")).toContain(
      "tamarindo-excel-spec.md",
    );
  });
});
