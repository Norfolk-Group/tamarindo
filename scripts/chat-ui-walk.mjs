/**
 * Browser walk of Nico chat: attach, hit every door, prove glance downloads.
 */
import puppeteer from "puppeteer";

const NEXT = process.env.NICO_NEXT_ORIGIN ?? "http://127.0.0.1:3000";

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
page.setDefaultTimeout(120_000);
await page.setViewport({ width: 1440, height: 900 });
await page.goto(NEXT, { waitUntil: "networkidle0" });

const blocked = await page.evaluate(() => document.body.innerText);
if (/Set NEXT_PUBLIC_NICO_AGENT_URL|Could not attach/i.test(blocked)) {
  await browser.close();
  throw new Error(`copilot not attached: ${blocked.slice(0, 200)}`);
}

await page.waitForSelector('input[placeholder="Ask Nico about Tamarindo…"]');

async function ask(text) {
  const input = await page.$('input[placeholder="Ask Nico about Tamarindo…"]');
  if (!input) throw new Error("chat input missing");
  await input.click({ clickCount: 3 });
  await input.type(text, { delay: 8 });
  await page.keyboard.press("Enter");
}

async function waitUntilIdle(timeout = 180_000) {
  await page.waitForFunction(
    () => Boolean(document.querySelector(".nico-think-dots")),
    { timeout: 20_000 },
  ).catch(() => undefined);
  await page.waitForFunction(
    () => !document.querySelector(".nico-think-dots"),
    { timeout },
  );
}

await ask("how does Tamarindo work");
await waitUntilIdle();

await ask("what's the IRR");
await waitUntilIdle();

await ask("run a stress test");
await waitUntilIdle();

await ask("what do we make on a $500k lease");
await waitUntilIdle();

await ask("show me the books");
await waitUntilIdle();

const snapshot = await page.evaluate(() => {
  const links = [...document.querySelectorAll("a")].map((a) => ({
    text: a.textContent?.trim(),
    href: a.getAttribute("href"),
  }));
  const titles = [...document.querySelectorAll("h3")].map((h) => h.textContent?.trim());
  return {
    bodyHasLease: /lease-to-own/i.test(document.body.innerText),
    bodyHasWarehouse: /warehouse|InterVest/i.test(document.body.innerText),
    bodyHasTicket: /\$5,000|5,000|Live seed/i.test(document.body.innerText),
    titles,
    excel: links.filter((l) => l.text === "Excel").map((l) => l.href),
    pdf: links.filter((l) => l.text === "PDF").map((l) => l.href),
    csv: links.filter((l) => l.text === "CSV").map((l) => l.href),
    fullBook: [...document.querySelectorAll("button")].some((b) =>
      /Full book/i.test(b.textContent ?? ""),
    ),
    snippet: document.body.innerText.slice(-2500),
  };
});

if (!snapshot.bodyHasLease) {
  console.error(snapshot.snippet);
  throw new Error("explain missing in chat");
}
if (!snapshot.bodyHasTicket) {
  console.error(snapshot.snippet);
  throw new Error("ticket math missing in chat");
}
if (!snapshot.titles.some((t) => /Investor returns/i.test(t ?? ""))) {
  throw new Error("returns glance missing");
}
if (!snapshot.titles.some((t) => /Sensitivity/i.test(t ?? ""))) {
  throw new Error("sensitivity glance missing");
}
if (!snapshot.fullBook) throw new Error("Full book button missing");
if (snapshot.excel.length < 3) throw new Error("expected Excel on three reports");

const sample = snapshot.excel[0];
const xlsx = await fetch(sample.startsWith("http") ? sample : `${NEXT}${sample}`);
const magic = Buffer.from(await xlsx.arrayBuffer()).subarray(0, 2).toString();
if (xlsx.status !== 200 || magic !== "PK") throw new Error("UI Excel href is not a workbook");

await browser.close();
console.log(JSON.stringify(snapshot, null, 2));
console.log("chat-ui-walk ok");
