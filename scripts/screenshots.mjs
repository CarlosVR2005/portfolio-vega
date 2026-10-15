// Capturas de verificación: node scripts/screenshots.mjs [url-base] [ruta...]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:4321';
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ['/'];
const widths = [360, 390, 768, 1024, 1440, 1920];
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch();
for (const path of paths) {
  for (const w of widths) {
    const h = w < 768 ? 800 : w < 1440 ? 900 : 1000;
    const mobile = w < 768;
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    const slug = path.replace(/\W+/g, '_') || 'home';
    await page.screenshot({ path: `shots/${slug}-${w}-a.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    // Recorre la página para disparar los ScrollTriggers y captura a pantalla completa
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h * 0.6) {
      await page.mouse.wheel(0, h * 0.6);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `shots/${slug}-${w}-full.png`, fullPage: true });
    console.log(`${path} @${w}: overflowX=${overflow}px errors=${errors.length ? errors.join(' | ') : 'none'}`);
    await page.close();
  }
}
await browser.close();
