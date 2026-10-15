/**
 * Cursor personalizado (solo con puntero fino). Su forma depende del mundo:
 *   dot  → punto de tinta (marco global)
 *   pen  → punta de bolígrafo (POLAS)
 *   sand → grano de arena con estela (GOAB)
 *   glow → destello cálido (Starbucks)
 * Un elemento con data-cursor="goab|pen|…" lo sobrescribe localmente y
 * data-cursor-label muestra una etiqueta ("Ver").
 */
import { gsap, finePointer, reducedMotion } from './motion';

type Kind = 'dot' | 'pen' | 'sand' | 'glow';

function init() {
  if (!finePointer()) return;
  const root = document.getElementById('cursor');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  document.documentElement.classList.add('has-cursor');

  const label = root.querySelector<HTMLElement>('.cursor-label')!;
  const grains = Array.from(document.querySelectorAll<HTMLElement>('.cursor-grain'));
  const xTo = gsap.quickTo(root, 'x', { duration: reducedMotion() ? 0 : 0.18, ease: 'power3' });
  const yTo = gsap.quickTo(root, 'y', { duration: reducedMotion() ? 0 : 0.18, ease: 'power3' });
  const trail = grains.map((g, i) => ({
    x: gsap.quickTo(g, 'x', { duration: 0.35 + i * 0.12, ease: 'power2' }),
    y: gsap.quickTo(g, 'y', { duration: 0.35 + i * 0.12, ease: 'power2' }),
  }));

  let current = '';
  let visible = false;

  const setKind = (kind: Kind, text: string | null) => {
    const key = `${kind}|${text ?? ''}`;
    if (key === current) return;
    current = key;
    root.dataset.kind = kind;
    root.classList.toggle('is-label', !!text);
    label.textContent = text ?? '';
  };

  const resolve = (target: EventTarget | null) => {
    const el = target instanceof Element ? target : null;
    const local = el?.closest<HTMLElement>('[data-cursor]');
    const base = (document.documentElement.dataset.cursor as Kind) || 'dot';
    const kind = (local?.dataset.cursor as Kind) || base;
    const labelEl = el?.closest<HTMLElement>('[data-cursor-label]');
    const interactive = el?.closest('a, button, [role="button"], input, textarea, select, label');
    root.classList.toggle('is-hover', !!interactive && !labelEl);
    root.classList.toggle('is-text', !!el?.closest('input, textarea'));
    setKind(kind, labelEl?.dataset.cursorLabel ?? null);
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!visible) {
        visible = true;
        gsap.set([root, ...grains], { x: e.clientX, y: e.clientY });
        root.classList.add('is-visible');
      }
      xTo(e.clientX);
      yTo(e.clientY);
      trail.forEach((t) => (t.x(e.clientX), t.y(e.clientY)));
      resolve(e.target);
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => {
    visible = false;
    root.classList.remove('is-visible');
  });
  window.addEventListener('pointerdown', () => root.classList.add('is-down'));
  window.addEventListener('pointerup', () => root.classList.remove('is-down'));
  // Tras navegar, el mundo cambia: recalcula con el último objetivo.
  document.addEventListener('astro:page-load', () => {
    document.documentElement.classList.add('has-cursor');
    current = '';
    resolve(document.elementFromPoint(gsap.getProperty(root, 'x') as number, gsap.getProperty(root, 'y') as number));
  });
}

document.addEventListener('astro:page-load', init);
