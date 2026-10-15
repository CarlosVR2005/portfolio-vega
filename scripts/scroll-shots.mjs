// Capturas a lo largo del scroll (útil con secciones fijadas):
// node scripts/scroll-shots.mjs <ruta> <ancho> [pasos]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const [path = '/', width = '1440', stepsArg = '14'] = process.argv.slice(2);
const w = +width;
const h = w < 768 ? 800 : 900;
const mobile = w < 768;
mkdirSync('shots/scroll', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const steps = +stepsArg;
const slug = path.replace(/\W+/g, '_');
for (let i = 0; i <= steps; i++) {
  const y = Math.round((total * i) / steps);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/scroll/${slug}-${w}-${String(i).padStart(2, '0')}.png` });
}
const fps = await page.evaluate(async () => {
  // Mide fps mientras se recorre la escena de arena
  const el = document.querySelector('[data-sand]');
  if (!el) return null;
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 300));
  let frames = 0;
  const t0 = performance.now();
  return await new Promise((res) => {
    const tick = () => {
      frames++;
      window.scrollBy(0, 12);
      if (performance.now() - t0 < 2000) requestAnimationFrame(tick);
      else res(Math.round((frames * 1000) / (performance.now() - t0)));
    };
    requestAnimationFrame(tick);
  });
});
console.log(`total=${total}px fps(sand)=${fps} overflowX=${await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)} errors=${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
