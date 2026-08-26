import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultValues } from "@/lib/model/variables";

vi.mock("@/lib/model/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/model/store")>();
  return {
    ...actual,
    loadValuesForActor: vi.fn(async () => defaultValues()),
  };
});

vi.mock("@/lib/model/report-store", () => ({
  saveReportWorkbook: vi.fn(async () => undefined),
  REPORT_WORKBOOK_TITLE: "__tamarindo_report_workbook__",
}));

vi.mock("@/lib/procedures/profile", () => ({
  profileIdFor: vi.fn(async () => "prof_export"),
}));

vi.mock("@/lib/model/pdf", () => ({
  renderCashflowPdf: vi.fn(async () => Buffer.from("%PDF-1.4 mock")),
}));

import { modelExport } from "@/lib/procedures/model";

const ctx = {
  actor: {
    kind: "user" as const,
    id: "user_export",
    displayName: "Export",
    role: "investor" as const,
  },
  traceId: "export-test",
};

describe("model.export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds HTML, CSV, Excel, and PDF for each live report kind", async () => {
    const kinds = ["statements", "returns", "sensitivity", "income"] as const;
    for (const kind of kinds) {
      const html = await modelExport.handler({ format: "html", kind }, ctx);
      expect(html.contentType).toMatch(/text\/html/);
      expect(Buffer.from(html.base64, "base64").toString("utf8")).toMatch(
        /<table/i,
      );

      const csv = await modelExport.handler({ format: "csv", kind }, ctx);
      expect(csv.contentType).toMatch(/text\/csv/);
      expect(Buffer.from(csv.base64, "base64").length).toBeGreaterThan(20);

      const xlsx = await modelExport.handler({ format: "xlsx", kind }, ctx);
      expect(xlsx.contentType).toMatch(/spreadsheetml/);
      expect(xlsx.filename).toMatch(/\.xlsx$/);
      expect(Buffer.from(xlsx.base64, "base64").subarray(0, 2).toString()).toBe(
        "PK",
      );
    }
    const pdf = await modelExport.handler(
      { format: "pdf", kind: "returns" },
      ctx,
    );
    expect(pdf.contentType).toBe("application/pdf");
    expect(Buffer.from(pdf.base64, "base64").toString("utf8")).toMatch(/%PDF/);
  });
});
