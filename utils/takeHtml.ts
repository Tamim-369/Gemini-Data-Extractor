import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";
import { Browser, Page } from "puppeteer";
import UserAgent from "user-agents";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function takeHTML(url: string): Promise<string> {
  puppeteer.use(StealthPlugin());

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    page = await browser.newPage();

    await page.setViewport({
      width: Math.floor(Math.random() * (1920 - 1366) + 1366),
      height: Math.floor(Math.random() * (1080 - 768) + 768),
    });

    const userAgent = new UserAgent({ deviceCategory: "desktop" });
    await page.setUserAgent(userAgent.toString());

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-User": "?1",
      "Sec-Fetch-Dest": "document",
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => Math.floor(Math.random() * (16 - 2) + 2),
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => Math.floor(Math.random() * (32 - 2) + 2),
      });

      Object.defineProperty(window.screen, "colorDepth", {
        get: () => Math.floor(Math.random() * (32 - 24) + 24),
      });
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 100000,
    });

    await humanLikeInteraction(page);

    const html = await page.content();

    return html;
  } catch (error) {
    console.error("Scraping error:", error);
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function humanLikeInteraction(page: Page): Promise<void> {
  // Initial random pause
  await sleep(Math.random() * 2000 + 1000);

  // Multiple random scrolls
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      window.scrollTo({
        top: Math.random() * document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    });

    // Random pause between scrolls
    await sleep(Math.random() * 1000 + 500);
  }

  // Random mouse movements
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(Math.random() * 800, Math.random() * 600, {
      steps: Math.floor(Math.random() * 10) + 5,
    });

    await sleep(Math.random() * 500 + 200);
  }

  // Final wait
  await sleep(Math.random() * 2000 + 1000);
}

export { takeHTML };
