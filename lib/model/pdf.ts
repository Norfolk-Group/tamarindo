import { PDFDocument } from "pdf-lib";

const HEADER =
  `<div style="font-size:8px;width:100%;padding:0 28px;color:#1E2D45;font-family:Helvetica,sans-serif;">Tamarindo · Statement of cash flows</div>`;
const FOOTER =
  `<div style="font-size:8px;width:100%;padding:0 28px;color:#5C6573;font-family:Helvetica,sans-serif;display:flex;justify-content:space-between;"><span>Confidential · server-side model</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

async function stampMetadata(bytes: Uint8Array): Promise<Buffer> {
  const doc = await PDFDocument.load(bytes);
  doc.setTitle("Tamarindo — 10-year statement of cash flows");
  doc.setAuthor("Tamarindo / Nico");
  doc.setSubject("US, sucursal, and consolidated cash flows");
  doc.setCreator("Tamarindo model engine");
  doc.setProducer("puppeteer + pdf-lib");
  const out = await doc.save();
  return Buffer.from(out);
}

async function viaCloudflare(html: string): Promise<Buffer | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) return null;
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
          format: "letter",
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: HEADER,
          footerTemplate: FOOTER,
          margin: { top: "56px", bottom: "56px", left: "36px", right: "36px" },
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
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: HEADER,
      footerTemplate: FOOTER,
      margin: { top: "56px", bottom: "56px", left: "36px", right: "36px" },
    });
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
