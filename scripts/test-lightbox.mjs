// Comprueba que la imagen ampliada cabe entera en pantalla (sin recortes).
// node scripts/test-lightbox.mjs [base]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const base = process.argv[2] ?? 'http://localhost:4321';
mkdirSync('shots/lightbox', { recursive: true });
const cases = [
  ['/proyectos/campana-starbucks/', '.scene[data-scene="july"] a[data-lightbox]'],
  ['/proyectos/goab/', '.process a[data-lightbox]'],
  ['/proyectos/goab/', '.final-zoom'],
  ['/proyectos/polas/', '.process a[data-lightbox]'],
];
const browser = await chromium.launch();
let bad = 0;
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 800, mobile: true }]) {
  for (const [path, sel] of cases) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const link = page.locator(sel).first();
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await link.evaluate((a) => a.click());
    await page.waitForFunction(() => { const i = document.querySelector('.lb-img'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const i = document.querySelector('.lb-img');
      const b = i.getBoundingClientRect();
      // Caja real de la imagen dibujada (object-fit: contain)
      const ratio = i.naturalWidth / i.naturalHeight;
      let w = b.width, h = b.height;
      if (getComputedStyle(i).objectFit === 'contain') { if (w / h > ratio) w = h * ratio; else h = w / ratio; }
      const x = b.left + (b.width - w) / 2, y = b.top + (b.height - h) / 2;
      return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), vw: innerWidth, vh: innerHeight };
    });
    const ok = r.x >= 0 && r.y >= 0 && r.x + r.w <= r.vw && r.y + r.h <= r.vh && r.w > 50;
    if (!ok) bad++;
    console.log(`${ok ? 'OK ' : 'MAL'} ${vp.width}px ${path} ${sel} → img ${r.w}×${r.h} en (${r.x},${r.y}) / pantalla ${r.vw}×${r.vh}`);
    await page.screenshot({ path: `shots/lightbox/${vp.width}-${path.replace(/\W+/g, '_')}-${sel.replace(/\W+/g, '').slice(0, 20)}.png` });
    await page.close();
  }
}
await browser.close();
process.exit(bad ? 1 : 0);
