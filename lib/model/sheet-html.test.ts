import { describe, expect, it } from "vitest";
import { runCashflowModel } from "@/lib/model/engine";
import {
  REPORT_PAGE,
  reportPageCssSize,
  reportPageIsLandscape,
} from "@/lib/model/report-page";
import { returnsWorkbook, statementsWorkbook } from "@/lib/model/report-workbook";
import { computeInvestorReturns } from "@/lib/model/returns";
import { renderReportHtml } from "@/lib/model/sheet-html";
import { defaultValues } from "@/lib/model/variables";

describe("report HTML print", () => {
  it("uses a 16:9 page and repeating thead", () => {
    const html = renderReportHtml(statementsWorkbook(runCashflowModel(defaultValues())));
    expect(REPORT_PAGE.ratio).toBe("16:9");
    expect(html).toContain(`size: ${reportPageCssSize()}`);
    expect(html).toContain("<thead>");
    expect(html).toContain("display: table-header-group");
    expect(html).toContain("TAMARINDO · LIVE MODEL");
    expect(html).not.toContain("tamarindo-sheet");
    expect(html).not.toContain("16:9");
    expect(html).toContain("data-depth=\"summary\"");
    expect(reportPageIsLandscape()).toBe(true);
    expect(html).toContain("Summary");
    expect(html).toContain("Extended");
    expect(html).toContain('data-format="pdf"');
    expect(html).toContain('data-format="csv"');
    expect(html).toContain("format=pdf&amp;kind=statements&amp;depth=summary");
    expect(html).toContain("format=csv&amp;kind=statements&amp;depth=summary");
    expect(html).toContain("data-hide-lines=\"1\"");
    expect(html).toContain("tbody class=\"sec\"");
    expect(html).toContain("<button type=\"button\">");
  });

  it("marks extra return columns as summary-hidden", () => {
    const model = runCashflowModel(defaultValues());
    const html = renderReportHtml(
      returnsWorkbook(computeInvestorReturns(defaultValues(), model)),
    );
    expect(html).toContain("sum-hide");
    expect(html).toContain("data-hide-lines=\"0\"");
  });
});
