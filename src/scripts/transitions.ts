/**
 * Transiciones entre páginas: una capa (#wipe) cubre la pantalla con el
 * "material" del mundo al que se entra y luego se retira.
 *   ink  → tinta negra que inunda desde el punto de clic (círculo irregular)
 *   sand → barrido de arena de abajo arriba con borde granulado
 *   dusk → degradado de atardecer que cae como un telón
 *   plain→ papel que sube (volver al marco global)
 * Los enlaces declaran el destino con data-transition y data-wipe.
 */
import { gsap, reducedMotion, scrollToTop } from './motion';

type Kind = 'ink' | 'sand' | 'dusk' | 'plain';

let pending: { kind: Kind; wipe: string; x: number; y: number } | null = null;
let lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener('pointerdown', (e) => (lastPointer = { x: e.clientX, y: e.clientY }), { passive: true });

const layer = () => document.getElementById('wipe') as HTMLDivElement | null;

function inkShape(x: number, y: number, p: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) * 1.1;
  return `circle(${r * p}px at ${x}px ${y}px)`;
}

function cover(kind: Kind, wipe: string, x: number, y: number) {
  const el = layer();
  if (!el) return Promise.resolve();
  el.dataset.kind = kind;
  el.style.setProperty('--wipe', wipe);
  gsap.set(el, { visibility: 'visible', opacity: 1, yPercent: 0, clipPath: 'none' });
  if (reducedMotion()) {
    return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 }).then();
  }
  if (kind === 'ink') {
    const o = { p: 0 };
    return gsap
      .to(o, {
        p: 1,
        duration: 0.8,
        ease: 'power2.in',
        onUpdate: () => (el.style.clipPath = inkShape(x, y, o.p)),
      })
      .then();
  }
  // sand / plain suben desde abajo; dusk cae desde arriba como un telón.
  const from = kind === 'dusk' ? -110 : 110;
  return gsap.fromTo(el, { yPercent: from }, { yPercent: 0, duration: 0.7, ease: 'power3.inOut' }).then();
}

function reveal() {
  const el = layer();
  if (!el || el.style.visibility !== 'visible') return;
  const done = () => gsap.set(el, { visibility: 'hidden', clipPath: 'none', yPercent: 0 });
  if (reducedMotion()) {
    gsap.to(el, { opacity: 0, duration: 0.25, onComplete: done });
    return;
  }
  el.style.clipPath = 'none';
  gsap.to(el, { yPercent: -110, duration: 0.8, ease: 'power3.inOut', delay: 0.05, onComplete: done });
}

document.addEventListener('astro:before-preparation', (event) => {
  const e = event as Event & { sourceElement?: Element; loader: () => Promise<void>; from: URL; to: URL };
  const src = e.sourceElement as HTMLElement | undefined;
  // Mismo documento con ancla → sin cortinilla.
  if (e.from.pathname === e.to.pathname) return;
  const kind = (src?.dataset.transition as Kind) ?? 'plain';
  const wipe = src?.dataset.wipe ?? 'var(--color-paper)';
  pending = { kind, wipe, x: lastPointer.x, y: lastPointer.y };
  const original = e.loader;
  e.loader = async () => {
    await Promise.all([cover(kind, wipe, pending!.x, pending!.y), original()]);
  };
});

document.addEventListener('astro:after-swap', () => {
  if (pending) scrollToTop();
});

document.addEventListener('astro:page-load', () => {
  if (pending) {
    pending = null;
    reveal();
  }
});
