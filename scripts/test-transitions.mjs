// Comprueba la cortinilla entre páginas: muestrea #wipe durante la navegación.
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:4321';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
for (const sel of ['a.panel[data-effect="hatch"]', '.p-next', '.p-next', '.p-next', 'a.brand']) {
  const el = await page.$(sel);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const el0 = 0;
  await page.evaluate(() => {
    window.__s = [];
    const t0 = performance.now();
    window.__iv = setInterval(() => {
      const el = document.getElementById('wipe');
      const r = el.getBoundingClientRect();
      window.__s.push(`${Math.round(performance.now() - t0)}ms ${el.style.visibility[0]} ${el.dataset.kind} clip=${el.style.clipPath.slice(0, 22)} top=${Math.round(r.top)} path=${location.pathname}`);
    }, 100);
  });
  const box = await el.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + Math.min(box.height / 2, 300));
  await page.waitForTimeout(2200);
  const s = await page.evaluate(() => (clearInterval(window.__iv), window.__s));
  console.log(`--- ${sel}\n` + s.filter((_, i) => i % 2 === 0).join('\n'));
  await page.screenshot({ path: `shots/nav-${sel.replace(/\W+/g, '')}.png` });
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
