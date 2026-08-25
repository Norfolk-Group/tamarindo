import { PDFDocument } from "pdf-lib";
import { reportPdfBox } from "@/lib/model/report-page";

const HEADER =
  `<div style="font-size:8px;width:100%;padding:0 28px;color:#23a5b4;font-family:Helvetica,sans-serif;">Tamarindo · live model · tamarindo-sheet · 16:9</div>`;
const FOOTER =
  `<div style="font-size:8px;width:100%;padding:0 28px;color:#93a8a5;font-family:Helvetica,sans-serif;display:flex;justify-content:space-between;"><span>Confidential · server-side model · print later</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

function pdfOptions() {
  return {
    ...reportPdfBox(),
    headerTemplate: HEADER,
    footerTemplate: FOOTER,
  };
}

async function stampMetadata(bytes: Uint8Array): Promise<Buffer> {
  const doc = await PDFDocument.load(bytes);
  doc.setTitle("Tamarindo — live financial report");
  doc.setAuthor("Tamarindo / Nico");
  doc.setSubject("16:9 themed statements, returns, or sensitivity");
  doc.setCreator("Tamarindo model engine");
  doc.setProducer("puppeteer + pdf-lib");
  const out = await doc.save();
  return Buffer.from(out);
}

async function viaCloudflare(html: string): Promise<Buffer | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) return null;
  const box = pdfOptions();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html,
        pdfOptions: {
          width: box.width,
          height: box.height,
          printBackground: box.printBackground,
          preferCSSPageSize: box.preferCSSPageSize,
          displayHeaderFooter: box.displayHeaderFooter,
          headerTemplate: box.headerTemplate,
          footerTemplate: box.footerTemplate,
          margin: box.margin,
        },
      }),
    },
  );
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}

async function viaPuppeteer(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf(pdfOptions());
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/** Chrome print of the HTML report. Cloudflare Browser Rendering, then local puppeteer. */
export async function renderCashflowPdf(html: string): Promise<Buffer> {
  const remote = await viaCloudflare(html);
  const raw = remote ?? (await viaPuppeteer(html));
  return stampMetadata(raw);
}
