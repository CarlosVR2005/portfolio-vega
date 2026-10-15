/**
 * Reveal "trazo de bolígrafo": cualquier elemento con [data-hatch] se descubre
 * con un rayado diagonal que barre la imagen y después se rellena, como si se
 * dibujara. Sin JS o con movimiento reducido la imagen se ve directamente.
 * data-hatch="load" lo dispara al cargar en vez de al entrar en pantalla.
 */
import { onPage, gsap, reducedMotion } from './motion';

onPage(() => {
  const els = gsap.utils.toArray<HTMLElement>('[data-hatch]');
  if (!els.length) return;
  if (reducedMotion()) {
    els.forEach((el) => el.classList.add('is-drawn'));
    return;
  }
  els.forEach((el) => {
    el.classList.add('is-hatching');
    gsap.set(el, { '--sweep': '-25%', '--h': '0.8px' });
    const tl = gsap.timeline({
      paused: el.dataset.hatch !== 'load',
      onComplete: () => el.classList.add('is-drawn'),
    });
    tl.to(el, { '--sweep': '135%', duration: 1.1, ease: 'power2.inOut' })
      .to(el, { '--h': '2.2px', duration: 0.5, ease: 'none' }, 0.2)
      .to(el, { '--h': '9.6px', duration: 0.7, ease: 'power2.in' }, 0.9);
    if (el.dataset.hatch !== 'load') {
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true, onEnter: () => tl.play() } });
    }
  });
});
