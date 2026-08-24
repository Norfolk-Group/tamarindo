import type { TenYearWorkbookSpec, WorkbookCell, WorkbookSheet } from "@/lib/artifacts/workbook";
import { zipStore } from "@/lib/artifacts/zip-store";

export class ExcelEngineError extends Error {
  readonly code = "excel_engine_failed";
  constructor(message: string) {
    super(message);
  }
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function colLetter(index: number): string {
  let n = index;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function cellXml(cell: WorkbookCell, ref: string): string {
  if (cell.kind === "blank") return `<c r="${ref}"/>`;
  if (cell.kind === "text") {
    return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(cell.value)}</t></is></c>`;
  }
  if (cell.kind === "number") {
    return `<c r="${ref}"><v>${cell.value}</v></c>`;
  }
  const formula = cell.formula.startsWith("=") ? cell.formula.slice(1) : cell.formula;
  return `<c r="${ref}"><f>${xmlEscape(formula)}</f></c>`;
}

function sheetXml(sheet: WorkbookSheet): string {
  const headerRow = sheet.headers
    .map((header, i) => cellXml({ kind: "text", value: header }, `${colLetter(i + 1)}1`))
    .join("");
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((cell, i) => cellXml(cell, `${colLetter(i + 1)}${r + 2}`))
        .join("");
      return `<row r="${r + 2}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">${headerRow}</row>
    ${rows}
  </sheetData>
</worksheet>`;
}

/**
 * Office Open XML workbook from the cited spec. Formulas recompute in Excel.
 * Uncited cells stay blank. No ExcelJS / HyperFormula package.
 */
export function renderWorkbookXlsx(spec: TenYearWorkbookSpec): Buffer {
  if (spec.sheets.length === 0) {
    throw new ExcelEngineError("Workbook spec has no sheets");
  }
  const files: { name: string; data: Buffer }[] = [
    {
      name: "[Content_Types].xml",
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${spec.sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("\n  ")}
</Types>`),
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${spec.sheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join("\n  ")}
</Relationships>`),
    },
    {
      name: "xl/workbook.xml",
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${spec.sheets
      .map(
        (sheet, i) =>
          `<sheet name="${xmlEscape(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("\n    ")}
  </sheets>
</workbook>`),
    },
  ];
  spec.sheets.forEach((sheet, i) => {
    files.push({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(sheetXml(sheet)),
    });
  });
  return zipStore(files);
}
