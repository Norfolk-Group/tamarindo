import { createHash } from "node:crypto";
import { NDA_TEMPLATE_BODY } from "@/lib/nda/template";

function pdfEscape(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

/** Minimal PDF. No pdf-lib. Hash of these bytes is signedPdfRef. */
export function renderNdaPdf(input: {
  typedName: string;
  documentHash: string;
  signedAt?: Date;
}): Buffer {
  const signedAt = (input.signedAt ?? new Date()).toISOString();
  const lines = [
    ...NDA_TEMPLATE_BODY.split("\n"),
    "",
    `Typed name: ${input.typedName}`,
    `Template hash: ${input.documentHash}`,
    `Signed at: ${signedAt}`,
    "I'm Nico, Tamarindo's AI consultant — this record is click-wrap.",
  ];
  const ops = [
    "BT",
    "/F1 11 Tf",
    "72 720 Td",
    "14 TL",
    ...lines.map((line) => `(${pdfEscape(line)}) '`),
    "ET",
  ].join("\n");
  const stream = Buffer.from(ops, "utf8");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${stream.length} >> stream\n${ops}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];
  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  let body = "%PDF-1.4\n";
  for (const obj of objects) {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    body += obj;
    offset += Buffer.byteLength(obj);
  }
  const xrefStart = offset;
  body += `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\n`;
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, "utf8");
}

export function ndaPdfHash(pdf: Buffer): string {
  return createHash("sha256").update(pdf).digest("hex");
}
