# Portfolio — Vega Gómez Muñoz

Web portfolio de Vega Gómez Muñoz, ilustradora (4º de Bellas Artes, UFV). Un marco editorial neutro y tres "mundos", uno por proyecto, cada uno con su color, su cursor, su transición y sus animaciones.

- **Stack:** [Astro 7](https://astro.build) (salida estática) · Tailwind 4 · GSAP 3 (ScrollTrigger, SplitText) · Lenis · Canvas 2D
- **Idiomas:** español (por defecto, `/`) e inglés (`/en/`)
- **Despliegue:** Vercel (estático, sin servidor)

Documentos relacionados:
- [PENDIENTES.md](PENDIENTES.md): lo que falta de Vega antes de publicar.
- [CORRECCIONES.md](CORRECCIONES.md): cambios en los textos de los PDFs, para que Vega los apruebe.
- [DECISIONES.md](DECISIONES.md): decisiones de diseño y técnicas.

---

## Puesta en marcha

Requisitos: **Node 22.22 o superior**. Python 3 solo si vas a regenerar recortes de imágenes.

```bash
npm install
```

```bash
npm run dev
```

Abre http://localhost:4321 (o el puerto que indique la consola). Para la versión de producción:

```bash
npm run build
```

```bash
npm run preview
```

`build` genera `dist/`. La primera vez tarda ~1 minuto porque convierte todas las imágenes a AVIF y WebP; después usa la caché.

---

## Estructura

```
src/
├─ content/
│  ├─ site.json                 ← datos de Vega (bio, contacto, redes, CV…) y PENDIENTES
│  └─ projects/{slug}/
│     ├─ meta.yaml              ← ficha del proyecto: títulos ES/EN, colores, portada, galería…
│     └─ case.json              ← textos largos de los casos con diseño propio
├─ assets/projects/{slug}/      ← imágenes originales (Astro genera AVIF/WebP/JPG en el build)
├─ projects/                    ← casos con dirección de arte propia (GOAB, POLAS, Starbucks)
│  └─ index.ts                  ← registro: proyecto → componente
├─ components/                  ← Header, Footer, Hero, índice, Cursor, Lightbox, Img…
├─ views/                       ← páginas compartidas por los dos idiomas
├─ pages/                       ← rutas (ES en la raíz, EN en /en/)
├─ scripts/                     ← motion.ts (GSAP+Lenis), transiciones, cursor, partículas, rayado
├─ i18n/ui.ts                   ← textos de interfaz ES/EN y rutas
└─ styles/global.css            ← tokens de diseño, tipografías, utilidades
scripts/                        ← capturas, Lighthouse, test de transiciones y recortes de imágenes
source/                         ← (ignorado por git) extracción completa de los PDFs
```

---

## Añadir un proyecto nuevo (sin tocar componentes)

1. **Imágenes:** crea `src/assets/projects/mi-proyecto/` y copia las imágenes a máxima calidad (JPG o PNG, PNG si tienen transparencia). No hace falta optimizarlas.
2. **Ficha:** crea `src/content/projects/mi-proyecto/meta.yaml`. Puedes copiar este modelo:

```yaml
order: 4                      # posición en el índice
draft: false                  # true = no se publica
slug: { es: mi-proyecto, en: my-project }   # URL: /proyectos/mi-proyecto y /en/work/my-project
title: Mi proyecto
kicker: { es: "Ilustración · Acuarela", en: "Illustration · Watercolour" }
year: "2026"
discipline: { es: "Ilustración editorial", en: "Editorial illustration" }
teaser:
  es: "Una o dos frases que resuman el proyecto."
  en: "One or two sentences summing up the project."
# disclaimer: { es: "…", en: "…" }   # opcional (p. ej. proyecto académico con marca real)

world:                        # el "mundo" del proyecto
  id: mi-proyecto
  bg: "#1e2a24"               # fondo de la página
  ink: "#eef2ec"              # texto
  accent: "#9fd1b2"           # detalles
  muted: "#a9bbb0"            # texto secundario (contraste AA sobre bg, ≥ 4,5:1)
  cursor: dot                 # dot | pen | sand | glow
  transition: plain           # plain | ink | sand | dusk
  wipe: "#1e2a24"             # color o degradado CSS de la cortinilla al entrar

cover:
  src: ../../../assets/projects/mi-proyecto/portada.jpg
  position: "50% 50%"         # encuadre de la portada
  alt: { es: "Descripción de la imagen", en: "Image description" }

intro:
  es: "Texto principal. Admite *cursiva* y **negrita**."
  en: "Main text. Supports *italics* and **bold**."
facts:
  - { k: { es: Técnica, en: Technique }, v: { es: Acuarela, en: Watercolour } }
gallery:
  - src: ../../../assets/projects/mi-proyecto/01.jpg
    alt: { es: "…", en: "…" }
    caption: { es: "Boceto", en: "Sketch" }   # opcional
  - src: ../../../assets/projects/mi-proyecto/02.jpg
    alt: { es: "…", en: "…" }
    wide: true                # ocupa todo el ancho
```

3. Ejecuta `npm run dev`. El proyecto aparece en el índice de la home, en el sitemap y en la navegación de "Siguiente proyecto", en los dos idiomas. Las imágenes de la galería se pueden ampliar.

> Si quieres una dirección de arte propia (como GOAB, POLAS o Starbucks), crea un componente en `src/projects/mi-proyecto/` y regístralo en `src/projects/index.ts`. Mientras no lo hagas, se usa la plantilla genérica.

### Editar datos de Vega
Todo está en `src/content/site.json`. Cualquier valor que empiece por `[PENDIENTE` se muestra en la web con un recuadro discontinuo, para que nada falte sin que se note. Ejemplos:
- **CV:** deja el PDF en `public/cv/vega-gomez-cv.pdf` y pon `"cv": "/cv/vega-gomez-cv.pdf"`.
- **Formulario:** crea un formulario en [Formspree](https://formspree.io) o [Web3Forms](https://web3forms.com) y pega la URL de envío en `"formEndpoint"`. Hasta entonces, el botón aparece desactivado con un aviso.
- **Redes y email:** sustituye los `[PENDIENTE: …]` por las URLs reales.

### Textos de interfaz
Botones, menús y avisos están en `src/i18n/ui.ts`, y algunos textos de página en las propias vistas (`src/views/`).

---

## Despliegue en Vercel

1. Sube el repositorio a GitHub e impórtalo en Vercel. Detecta Astro automáticamente: build `npm run build`, salida `dist`.
2. En **Settings → Environment Variables** añade `SITE_URL` con el dominio definitivo (p. ej. `https://vegagomez.com`). Se usa en las URLs canónicas, Open Graph, `hreflang`, `sitemap-index.xml` y `robots.txt`.
3. Conecta el dominio en **Settings → Domains**.

---

## Calidad y verificación

Hay scripts de comprobación que trabajan contra `npm run preview` (puerto 4321):

| Script | Qué hace |
|---|---|
| `npm run shots -- http://localhost:4321 / /proyectos/goab/` | Capturas a 360, 390, 768, 1024, 1440 y 1920 px y aviso de scroll horizontal o errores de consola (en `shots/`) |
| `npm run shots:scroll -- /proyectos/goab/ 1440 16` | Capturas a lo largo del scroll (útil con secciones fijadas) y fps de la escena de arena |
| `npm run test:transitions` | Comprueba las cortinillas entre páginas |
| `npm run lighthouse -- / /proyectos/goab/` | Lighthouse móvil (añade `--desktop` para escritorio) |

Último resultado: Performance 95–100, Accessibility 100, Best Practices 100 y SEO 100 en todas las páginas, en móvil y escritorio. LCP ≤ 2,4 s en 4G simulada y CLS 0.

**Accesibilidad:** contraste AA, navegación por teclado (incluido el recorrido horizontal de POLAS y el carrusel), foco visible, ALT en todas las obras, lightbox con `<dialog>` y `prefers-reduced-motion` respetado (sin Lenis, sin secciones fijadas, sin partículas: versión estática de cada escena). El cursor personalizado solo se activa con ratón.

### Regenerar recortes
Algunas imágenes derivan de los originales mediante script:
- `npm run prepare:goab`: capas del paisaje (cielo, montañas, Bastian) y las 16 siluetas separadas.
- `npm run prepare:polas`: portada frontal y las cuatro versiones del personaje.

Necesitan `pip install pillow numpy scipy`.
