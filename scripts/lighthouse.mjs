// Auditoría Lighthouse (móvil por defecto) usando el Chromium de Playwright.
// node scripts/lighthouse.mjs [--desktop] /ruta1 /ruta2 ...
import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const desktop = args.includes('--desktop');
const paths = args.filter((a) => a.startsWith('/'));
const base = process.env.BASE ?? 'http://localhost:4321';
const port = 9333;
mkdirSync('shots/lh', { recursive: true });

const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
const rows = [];
for (const path of paths.length ? paths : ['/']) {
  const res = await lighthouse(base + path, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: desktop ? 'desktop' : 'mobile',
    screenEmulation: desktop ? { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false } : undefined,
    throttlingMethod: 'simulate',
  }, desktop ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined);
  const lhr = res.lhr;
  const c = lhr.categories;
  const score = (k) => Math.round((c[k]?.score ?? 0) * 100);
  const fails = Object.values(lhr.audits)
    .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
    .map((a) => `${a.id}${a.displayValue ? ` (${a.displayValue})` : ''}`);
  rows.push({ path, perf: score('performance'), a11y: score('accessibility'), bp: score('best-practices'), seo: score('seo'), lcp: lhr.audits['largest-contentful-paint'].displayValue, cls: lhr.audits['cumulative-layout-shift'].displayValue, tbt: lhr.audits['total-blocking-time'].displayValue, fails });
  writeFileSync(`shots/lh/${(desktop ? 'd' : 'm') + path.replace(/\W+/g, '_')}.json`, JSON.stringify(lhr));
}
await browser.close();
for (const r of rows) {
  console.log(`${r.path}  P${r.perf} A${r.a11y} BP${r.bp} SEO${r.seo}  LCP ${r.lcp}  CLS ${r.cls}  TBT ${r.tbt}`);
  if (r.fails.length) console.log('   ⚠ ' + r.fails.join(', '));
}
