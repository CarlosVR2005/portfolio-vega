/**
 * Arena de partículas (Canvas 2D, sin dependencias).
 * La figura A se deshace con el viento y la arena se recompone en la figura B.
 *   progress 0    → figura A intacta
 *   progress 0.5  → nube de arena
 *   progress 1    → figura B
 * El número de partículas se adapta a la potencia del dispositivo.
 * Se dibuja en un ImageData (puntos de 2×2 px), mucho más rápido que fillRect.
 */

export interface SandOptions {
  from: string;
  to: string;
  /** Fracción del alto del canvas que ocupa la figura. */
  fit?: number;
  /** Centro horizontal de la figura (0–1). */
  anchorX?: number;
}

export interface SandScene {
  setProgress(p: number): void;
  /** Animación de entrada: la arena se reúne en la figura A. */
  gather(duration?: number): Promise<void>;
  destroy(): void;
}

interface Pts {
  x: Float32Array;
  y: Float32Array;
  c: Uint32Array;
  n: number;
  step: number;
}

function budget() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory || 4;
  let n = cores >= 8 && mem >= 8 ? 9000 : cores >= 4 && mem >= 4 ? 6000 : 3200;
  if (window.innerWidth < 768) n = Math.round(n * 0.6);
  return n;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/** Muestrea los píxeles opacos de una imagen ajustada a la caja dada. */
function sample(img: HTMLImageElement, boxW: number, boxH: number, target: number, anchorX: number, canvasW: number, canvasH: number): Pts {
  const ratio = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * ratio));
  const h = Math.max(1, Math.round(img.naturalHeight * ratio));
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 140) opaque++;
  const step = Math.max(1, Math.sqrt(opaque / target));
  const ox = canvasW * anchorX - w / 2;
  const oy = (canvasH - h) / 2;
  const xs: number[] = [];
  const ys: number[] = [];
  const cs: number[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = (y / step) % 2 ? step / 2 : 0; x < w; x += step) {
      const i = (Math.floor(y) * w + Math.floor(x)) * 4;
      if (data[i + 3] > 140) {
        // Jitter para romper la rejilla de muestreo
        xs.push(ox + x + (Math.random() - 0.5) * step);
        ys.push(oy + y + (Math.random() - 0.5) * step);
        // ABGR (little-endian) para escribir directamente en Uint32Array
        cs.push((255 << 24) | (data[i + 2] << 16) | (data[i + 1] << 8) | data[i]);
      }
    }
  }
  return { x: Float32Array.from(xs), y: Float32Array.from(ys), c: Uint32Array.from(cs), n: xs.length, step };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export async function createSandScene(canvas: HTMLCanvasElement, opts: SandOptions): Promise<SandScene> {
  const ctx = canvas.getContext('2d')!;
  const [imgA, imgB] = await Promise.all([loadImage(opts.from), loadImage(opts.to)]);
  const fit = opts.fit ?? 0.78;
  const anchorX = opts.anchorX ?? 0.5;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  let W = 0;
  let H = 0;
  let image: ImageData;
  let buf: Uint32Array;
  let N = 0;
  let dot = 2;
  // Estado por partícula
  let ax: Float32Array, ay: Float32Array, bx: Float32Array, by: Float32Array;
  let sx: Float32Array, sy: Float32Array, delay: Float32Array, seed: Float32Array;
  let ca: Uint32Array, cb: Uint32Array;

  let progress = 0;
  let gatherT = 1; // 0 → arena dispersa, 1 → figura reunida (intro)
  let raf = 0;
  let visible = true;
  let dirty = true;

  function build() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(2, Math.round(rect.width * dpr));
    H = Math.max(2, Math.round(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    image = ctx.createImageData(W, H);
    buf = new Uint32Array(image.data.buffer);

    const target = budget();
    const boxH = H * fit;
    const boxW = W * (W > H ? 0.62 : 0.94);
    const A = sample(imgA, boxW, boxH, target, anchorX, W, H);
    const B = sample(imgB, boxW, boxH, target, anchorX, W, H);
    N = Math.max(A.n, B.n);
    dot = A.step > 3.2 ? 3 : 2;
    ax = new Float32Array(N);
    ay = new Float32Array(N);
    bx = new Float32Array(N);
    by = new Float32Array(N);
    sx = new Float32Array(N);
    sy = new Float32Array(N);
    delay = new Float32Array(N);
    seed = new Float32Array(N);
    ca = new Uint32Array(N);
    cb = new Uint32Array(N);

    // Emparejar por orden vertical para que la recomposición sea coherente
    const order = (p: Pts) => Array.from({ length: p.n }, (_, i) => i).sort((i, j) => p.y[i] - p.y[j] || p.x[i] - p.x[j]);
    const oa = order(A);
    const ob = order(B);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let k = 0; k < N; k++) {
      const ia = oa[Math.floor((k / N) * A.n)];
      const ib = ob[Math.floor((k / N) * B.n)];
      ax[k] = A.x[ia];
      ay[k] = A.y[ia];
      bx[k] = B.x[ib];
      by[k] = B.y[ib];
      ca[k] = A.c[ia];
      cb[k] = B.c[ib];
      minX = Math.min(minX, ax[k]);
      maxX = Math.max(maxX, ax[k]);
    }
    for (let k = 0; k < N; k++) {
      const r = Math.random();
      seed[k] = Math.random() * Math.PI * 2;
      // El viento sopla de izquierda a derecha: empieza a erosionar por la izquierda
      const nx = (ax[k] - minX) / Math.max(1, maxX - minX);
      delay[k] = nx * 0.55 + Math.random() * 0.25;
      sx[k] = ax[k] + W * (0.25 + r * 0.75) * (0.6 + nx * 0.6);
      sy[k] = ay[k] - H * (0.05 + Math.random() * 0.35) + Math.sin(seed[k]) * H * 0.08;
    }
    dirty = true;
  }

  function draw(time: number) {
    buf.fill(0);
    const p = progress;
    // Fase 1 (0 → 0.5): A se deshace.  Fase 2 (0.5 → 1): la arena forma B.
    const p1 = clamp01(p / 0.5);
    const p2 = clamp01((p - 0.5) / 0.5);
    const g = easeInOut(gatherT);
    const t = time * 0.001;
    for (let k = 0; k < N; k++) {
      const d = delay[k];
      const t1 = easeInOut(clamp01((p1 - d * 0.6) / 0.4));
      const t2 = easeInOut(clamp01((p2 - (1 - d) * 0.5) / 0.5));
      let x = ax[k] + (sx[k] - ax[k]) * t1;
      let y = ay[k] + (sy[k] - ay[k]) * t1;
      x += (bx[k] - x) * t2;
      y += (by[k] - y) * t2;
      // Ondulación de la arena en suspensión
      const air = t1 * (1 - t2);
      if (air > 0.01) {
        x += Math.sin(t * 1.3 + seed[k]) * 6 * air * dpr;
        y += Math.cos(t * 1.1 + seed[k] * 1.7) * 4 * air * dpr;
      }
      // Intro: la arena llega desde abajo a la izquierda
      if (g < 1) {
        x = sx[k] - W * 0.9 + (x - (sx[k] - W * 0.9)) * g;
        y = H + seed[k] * 20 + (y - H - seed[k] * 20) * g;
      }
      const xi = x | 0;
      const yi = y | 0;
      if (xi < 0 || yi < 0 || xi >= W - dot || yi >= H - dot) continue;
      const c = t2 > 0.5 ? cb[k] : ca[k];
      // En el aire los granos son más pequeños
      const sz = air > 0.5 ? 2 : dot;
      for (let dy = 0; dy < sz; dy++) {
        const row = (yi + dy) * W + xi;
        for (let dx = 0; dx < sz; dx++) buf[row + dx] = c;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  function loop(time: number) {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    const airborne = progress > 0.02 && progress < 0.98;
    if (dirty || airborne || gatherT < 1) {
      draw(time);
      dirty = false;
    }
  }

  build();
  raf = requestAnimationFrame(loop);

  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);
  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 150);
  });
  ro.observe(canvas);

  return {
    setProgress(p: number) {
      if (p !== progress) {
        progress = p;
        dirty = true;
      }
    },
    gather(duration = 1.6) {
      return new Promise((res) => {
        const start = performance.now();
        gatherT = 0;
        const tick = (now: number) => {
          gatherT = clamp01((now - start) / (duration * 1000));
          if (gatherT < 1) requestAnimationFrame(tick);
          else res();
        };
        requestAnimationFrame(tick);
      });
    },
    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    },
  };
}
