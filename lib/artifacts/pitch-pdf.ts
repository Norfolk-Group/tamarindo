import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { DeckSpec } from "@/lib/artifacts/deck";

const NAVY = rgb(0.035, 0.078, 0.078);
const INK = rgb(0.95, 0.97, 0.96);
const DIM = rgb(0.58, 0.66, 0.65);
const TEAL = rgb(0.14, 0.65, 0.71);
const GOLD = rgb(1, 0.79, 0.3);

/**
 * Thin landscape print of the same spec. HTML/PPTX are the product;
 * this exists so PDF is a real format, not a promise.
 */
export async function renderPitchPdf(spec: DeckSpec, title = "Tamarindo pitch"): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const width = 792;
  const height = 445;

  for (const slide of spec.slides) {
    const page = doc.addPage([width, height]);
    page.drawRectangle({ x: 0, y: 0, width, height, color: NAVY });
    page.drawText("TAMARINDO", {
      x: 36,
      y: height - 28,
      size: 8,
      font: regular,
      color: TEAL,
    });
    page.drawText(slide.title, {
      x: 36,
      y: height - 56,
      size: 18,
      font: bold,
      color: INK,
    });
    let y = height - 84;
    for (const line of slide.bullets.filter(Boolean)) {
      const clipped = line.slice(0, 110);
      page.drawText(`• ${clipped}`, { x: 40, y, size: 10, font: regular, color: INK });
      y -= 16;
      if (y < 80) break;
    }
    if (slide.table && y > 100) {
      y -= 8;
      const headers = slide.table.headers.join("   ");
      page.drawText(headers.slice(0, 120), { x: 40, y, size: 8, font: bold, color: DIM });
      y -= 14;
      for (const row of slide.table.rows) {
        const isTotal = /total|closing|receipts|payments|operations/i.test(row[0] ?? "");
        page.drawText(row.join("   ").slice(0, 120), {
          x: 40,
          y,
          size: 8,
          font: regular,
          color: isTotal ? GOLD : INK,
        });
        y -= 12;
        if (y < 40) break;
      }
    }
    page.drawText("Confidential · not an offer", {
      x: 36,
      y: 18,
      size: 8,
      font: regular,
      color: DIM,
    });
  }

  doc.setTitle(title);
  doc.setAuthor("Tamarindo / Nico");
  doc.setSubject("Investor pitch — live model tables");
  const bytes = await doc.save();
  return Buffer.from(bytes);
}
