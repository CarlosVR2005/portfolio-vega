/**
 * Núcleo de movimiento compartido por todas las páginas.
 * - Registra GSAP + ScrollTrigger una sola vez.
 * - Crea Lenis (scroll suave) salvo con prefers-reduced-motion.
 * - Expone `onPage(fn)` para inicializar efectos en cada navegación
 *   (Astro View Transitions) y limpiarlos automáticamente al salir.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => rmq.matches;
export const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let lenis: Lenis | null = null;

function startLenis() {
  if (lenis || reducedMotion()) return;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, touchMultiplier: 1.2 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function getLenis() {
  return lenis;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

type Cleanup = void | (() => void);
type PageInit = () => Cleanup;

const inits: PageInit[] = [];
let cleanups: (() => void)[] = [];
let ctx: gsap.Context | null = null;

/** Registra una función que se ejecuta en cada carga de página. */
export function onPage(fn: PageInit) {
  inits.push(fn);
  // Si la página ya está montada (script cargado tarde), ejecútala ya.
  if (mounted) run(fn);
}

let mounted = false;

function run(fn: PageInit) {
  ctx ??= gsap.context(() => {});
  ctx.add(() => {
    const c = fn();
    if (typeof c === 'function') cleanups.push(c);
  });
}

function mount() {
  startLenis();
  // ClientRouter sincroniza los atributos de <html>: restaura las clases de estado.
  document.documentElement.classList.add('js');
  if (lenis) document.documentElement.classList.add('lenis', 'lenis-smooth');
  mounted = true;
  ctx = gsap.context(() => {});
  inits.forEach(run);
  warmImages();
  // Los pins se crean en distintos componentes: ordénalos por posición en la página
  // antes de calcular, para que cada sección fijada desplace correctamente a las siguientes.
  ScrollTrigger.sort();
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

/**
 * Precarga: las secciones con [data-warm] (escenas fijadas, imágenes grandes)
 * cargan sus imágenes cuando faltan ~2,5 pantallas, para no verse vacías al llegar.
 */
let warmIO: IntersectionObserver | null = null;
function warmImages() {
  warmIO?.disconnect();
  warmIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
        warmIO?.unobserve(e.target);
      }),
    { rootMargin: '0px 0px 250% 0px' },
  );
  document.querySelectorAll('[data-warm]').forEach((el) => warmIO!.observe(el));
}

function unmount() {
  warmIO?.disconnect();
  mounted = false;
  cleanups.forEach((c) => c());
  cleanups = [];
  ctx?.revert();
  ctx = null;
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

document.addEventListener('astro:page-load', mount);
document.addEventListener('astro:before-swap', unmount);
window.addEventListener('load', () => ScrollTrigger.refresh());

export { gsap, ScrollTrigger };
