# Prompt para Claude Code: Portfolio de Vega Gómez Muñoz

Actúa como director creativo y desarrollador front-end senior. Vas a construir el portfolio web de **Vega Gómez Muñoz**, estudiante de 4º de Bellas Artes (Universidad Francisco de Vitoria, Madrid, 21 años). El objetivo es que empresas y estudios (ilustración, dirección de arte, publicidad, editorial, concept art, animación) vean en 30 segundos que tiene voz propia, oficio y capacidad de adaptarse a estilos muy distintos. Quiero que sorprenda, pero sin sacrificar rendimiento ni claridad.

**Antes de escribir código:** haz un plan breve (estructura, sistema de animación, lista de assets) y enséñamelo. Después construye por fases y verifica cada una abriendo la web y comprobando capturas (Playwright o similar) en escritorio y móvil.

---

## 1. Material de partida (carpeta actual)

En esta carpeta hay tres PDFs de presentación (18, 13 y 11 páginas, formato 1440x810 pt). Son la fuente de todo el contenido. **Léelos tú mismo** (texto con `pdftotext` y páginas como imagen) antes de planificar.

| Archivo | Proyecto | Qué es |
|---|---|---|
| `Fanzine.pdf` | Fanzine "POLAS" | Fanzine ilustrado, blanco y negro, a bolígrafo y ajustado en digital. Estética oscura y surrealista, metáfora de un "tripi" emocional: la realidad se distorsiona y las emociones se intensifican. No cuenta una historia lineal, es una experiencia mental introspectiva. Incluye moodboard, paleta (negro, blancos y grises), personaje que cambia su propia percepción, ilustraciones de árboles con efecto de movimiento (trazo "garabateado"), amapolas, patrón floral, mockups de portada y una foto de la portada sostenida en mano. |
| `GOAB.pdf` | GOAB | Reinterpretación visual del entorno de Goab de *La historia interminable*: el desierto convertido en una entidad monstruosa de arena que representa la lucha interna de Bastian. Pintura digital con tonos cálidos (ocres, dorados, marrones, arena). Incluye moodboards, paleta, bocetos de caras, siluetas de poses, hoja de anatomía con anotaciones (cola, cráneo humano, pie de huesos humanos, símbolo de Goad como remolino de arena, cara que se derrite), ilustraciones de paisaje y la ilustración final con escala dramática (Bastian diminuto frente a Goab). |
| `Starbucks.pdf` | Campaña Starbucks | Campaña conceptual de tres ilustraciones: 4 de Julio, Navidad y US Open. Referencias al universo visual Disney y la ilustración cinematográfica contemporánea: estética cálida, emocional y narrativa, con luz y atmósfera. Cada pieza tiene paleta propia (morados/azules de atardecer, naranjas de tierra batida, etc.). Incluye mockups en contexto (muro, marquesina, valla urbana, escaparate, tablet). |

### Extracción de assets
1. Ejecuta `pdfimages -list` (o PyMuPDF si poppler no está en Windows) y extrae las imágenes originales a máxima calidad. Donde la imagen sea una página completa o el mockup venga flatten, renderiza la página a 200-300 dpi y recorta.
2. Organiza en `/src/assets/projects/{fanzine,goab,starbucks}/` con nombres descriptivos.
3. Genera derivados optimizados (AVIF + WebP + JPG fallback, varios anchos con `srcset`, placeholders borrosos o color dominante). Los originales no se tocan.
4. **Descarta o recorta** cualquier texto de plantilla que aparezca dentro de las imágenes (ver sección 8).

---

## 2. Concepto creativo: "una web, tres mundos"

Vega trabaja en estilos muy distintos, y eso es su punto fuerte. La web tiene un **marco neutro y elegante** (papel cálido, mucho aire, tipografía editorial) que deja respirar la obra, y **cada proyecto transforma por completo la atmósfera** al entrar: color de fondo, cursor, tipo de movimiento y transición. Que se note que hay una sola autora y tres universos.

- **Marco global:** fondo off-white cálido (tipo papel), texto casi negro. Elige un par tipográfico propio y distintivo (display serif expresiva para titulares + sans/grotesca limpia para texto). Evita combinaciones genéricas tipo Inter + Playfair. Define todo como tokens CSS.
- **Cursor personalizado** (solo en dispositivos con puntero fino): punto discreto en el marco global que se transforma por proyecto (punta de bolígrafo en Fanzine, grano de arena en GOAB, destello cálido en Starbucks).
- **Transiciones entre páginas:** wipe/clip-path con el color del proyecto al que se entra (tinta negra que inunda, barrido de arena, degradado de atardecer).

---

## 3. Stack

- **Astro** (salida estática) + **Tailwind**, **GSAP** (ScrollTrigger, SplitText si está disponible; si no, división manual de texto) y **Lenis** para scroll suave. Canvas 2D para partículas; WebGL solo si aporta algo claro y con fallback.
- Islas de JS solo donde haga falta. Nada de frameworks pesados innecesarios.
- Despliegue previsto: Vercel. Deja `README` con cómo añadir un proyecto nuevo (contenido en Markdown/JSON + carpeta de imágenes) para que Vega o yo podamos ampliar el portfolio sin tocar componentes.
- Idiomas: **español por defecto + inglés** (estructura i18n lista; textos en inglés redactados por ti y marcados para que Vega los revise).

---

## 4. Estructura del sitio

1. **Home / Hero**
   - Nombre "Vega Gómez" en tipografía grande que se "dibuja" o se revela con una máscara de tinta al cargar (SVG mask / clip-path animado).
   - Una frase de posicionamiento (placeholder: `[FRASE DE VEGA]`, con una propuesta tuya basada en su obra: ilustración narrativa entre lo onírico y lo cinematográfico).
   - Mini-collage animado de fragmentos de sus tres proyectos que reacciona suavemente al ratón (parallax por capas).
2. **Selected work:** tres paneles grandes, uno por proyecto. Al hacer hover, la imagen se revela con efecto propio del proyecto y el cursor cambia. En móvil, tarjetas verticales con reveal al scroll.
3. **Páginas de proyecto (case study)** con narrativa: concepto, proceso, resultado, detalles. Ver sección 5.
4. **About:** retrato (pendiente), bio corta y larga, formación, habilidades (técnicas manuales + software), exposiciones/premios si los hay. Animación sutil de texto al scroll.
5. **Contact:** email, redes, CV en PDF descargable (pendiente), formulario simple opcional (con validación y sin spam: honeypot).
6. **Footer** discreto con enlaces y año.

---

## 5. Dirección de arte y animaciones por proyecto

Principio: **la animación imita la técnica de la obra**. Nada de efectos gratuitos.

### Fanzine "POLAS" (mundo en blanco y negro)
- Fondo negro/blanco puro con grises de apoyo. Tipografía: serif editorial de contraste alto para titulares.
- **Reveal de imágenes con "trazo de bolígrafo":** máscara de líneas de rayado (hatching) que se desplaza y descubre el dibujo, como si se dibujara.
- Los árboles/tentáculos de la portada como **SVG o capas con parallax** que se enroscan lentamente al scroll.
- **Recorrido horizontal tipo "pasar páginas"** del fanzine (pinned section con ScrollTrigger), texto de justificación y sinopsis integrados.
- Mockup de portada con **tilt 3D** al mover el ratón. Patrón de amapolas como marquesina infinita lenta.
- Sección "Percepción": el personaje cambia de versión según se hace scroll (crossfade con leve distorsión).

### GOAB (mundo de arena y luz cálida)
- Paleta ocre/dorado/marrón/arena extraída de las imágenes (usa muestreo real, no inventes hex).
- **Efecto estrella:** la ilustración de Goab **se deshace en partículas de arena** al hacer scroll y se recompone (canvas 2D, límite de partículas adaptado a la potencia del dispositivo, desactivado con `prefers-reduced-motion`).
- Paisaje con **parallax por capas** (cielo, montañas, silueta de Bastian) y gradiente de atardecer.
- **Escala dramática:** sección pinned en la que Goab crece y Bastian queda diminuto al scroll.
- **Hoja de anatomía interactiva:** hotspots (cola, cráneo, pie, símbolo de Goad, cara que se derrite) con las anotaciones del PDF como tooltips. En móvil, tap para abrir.
- Grid de siluetas de poses que aparecen en cascada.

### Campaña Starbucks (mundo de atardecer cinematográfico)
- Fondo con **degradado crepuscular** (morado → azul → naranja) que cambia suavemente de una campaña a otra al hacer scroll.
- Tres campañas (4 de Julio, Navidad, US Open) como **tabs o scroll por escenas**, cada una con su paleta y transición.
- **Luces/bombillas con parpadeo sutil** (CSS/Canvas) y, en el 4 de Julio, **pequeña explosión de fuegos artificiales** al hacer clic o al entrar en vista (canvas ligero).
- **Mockups en contexto** (muro, marquesina, valla, escaparate, tablet) en carrusel con transición suave y tilt.
- **Importante:** etiquetar como "Proyecto académico / campaña conceptual, sin vinculación con Starbucks".

---

## 6. Contenido

- Usa los textos reales de los PDFs como base y **corrige ortografía y erratas** (p. ej. "SIPNOPSIS", "resienta", "trasmitir", "griposo/triposos", "tambeiem") manteniendo el tono de Vega. Señálame en una lista cada cambio relevante para que ella lo apruebe.
- Escribe microcopy (títulos, subtítulos, descripciones breves de cada proyecto, ALT text descriptivos) en ES y EN.
- **No inventes** datos de Vega (premios, exposiciones, prácticas, software, contacto). Si falta, deja un placeholder visible `[PENDIENTE: ...]` en un único archivo de contenido (`/src/content/site.json`) y haz una lista final de pendientes.

---

## 7. Calidad (criterios de aceptación)

- **Rendimiento:** Lighthouse móvil ≥ 90 en Performance, Accessibility, Best Practices y SEO. LCP < 2,5 s en 4G simulada. Imágenes responsive, `loading="lazy"` salvo el hero, fuentes con `font-display: swap` y subset. Animaciones a 60 fps usando solo `transform`/`opacity` cuando sea posible.
- **Móvil primero:** probar a 360, 390, 768, 1024, 1440 y 1920 px. Sin scroll horizontal accidental. Las experiencias pinned/horizontales deben tener una versión móvil bien resuelta.
- **Accesibilidad:** contraste AA, navegación por teclado, foco visible, ALT en todas las obras, `prefers-reduced-motion` respetado (versión estática elegante de cada animación), el cursor personalizado nunca oculta el nativo en táctil.
- **SEO y compartir:** metadatos, Open Graph con imagen propia, `sitemap.xml`, `robots.txt`, datos estructurados `Person` y `CreativeWork`, `hreflang` para ES/EN.
- **Sin música ni sonido automáticos.** Sin efectos que mareen. Nada que bloquee el acceso al contenido en el primer segundo (la intro no debe durar más de ~2 s y debe poder saltarse).

---

## 8. Cosas que debes vigilar

- **Texto de plantilla en los PDFs:** aparecen "ALBA CASTRO / FOTÓGRAFA PROFESIONAL" (Fanzine), "ESTUDIO BORCELLE" (GOAB) y un cartel con "Divided" (mockup Starbucks). Son restos de plantillas de Canva, **no son de Vega**. No los uses en la web ni en metadatos; recorta o evita esas imágenes y avísame de cada caso.
- Los mockups de Starbucks usan marca real: la web debe dejar claro que es un ejercicio académico.
- GOAB reinterpreta una obra literaria ajena (*La historia interminable*): citarla como inspiración, y que quede claro que es reinterpretación.
- Los PDFs pesan entre 24 y 70 MB: no los sirvas tal cual en la web. Ofrece, si acaso, una versión comprimida para descarga.
- Solo hay tres proyectos: dales **profundidad** (proceso, bocetos, detalles ampliables con lightbox/zoom) en vez de rellenar. La estructura debe permitir añadir más proyectos fácilmente.

---

## 9. Método de trabajo y entrega

1. Inspecciona los PDFs, extrae assets y enséñame el plan.
2. Fase 1: marco global + hero + índice de proyectos + sistema de transiciones.
3. Fase 2: un proyecto completo (empieza por GOAB, que lleva la animación más ambiciosa) y valida conmigo.
4. Fase 3: Fanzine y Starbucks.
5. Fase 4: About, Contact, i18n, SEO, auditoría de rendimiento y accesibilidad.
6. Entrega final: repo limpio, `README`, lista de pendientes para Vega y resumen de decisiones de diseño.

Pregúntame solo lo imprescindible; ante dudas menores toma una decisión razonable, anótala y sigue.

---

## Pendientes para Vega (no bloquean el arranque)
- Nombre con el que quiere firmar y frase que la defina como artista.
- Para qué lo usará (prácticas, estudios, galerías...) y a qué empresas apunta.
- Foto/retrato, bio, formación, premios, exposiciones, prácticas.
- Software y técnicas que domina.
- Email, Instagram, Behance, LinkedIn y CV en PDF.
- Dominio (¿tiene o hay que comprarlo?) y quién actualizará la web.
- Confirmar que los textos corregidos le representan y que está de acuerdo con las etiquetas de proyecto académico.
- ¿Tiene más proyectos o bocetos de proceso en alta calidad para ampliar los case studies?
