# Decisiones de diseño y técnicas

## Concepto: una web, tres mundos
Vega trabaja en estilos muy distintos y eso es su fuerza. La web tiene un **marco neutro** (papel cálido `#F3EEE6`, tinta `#16130F`, grano de papel muy sutil, mucho aire) y **cada proyecto transforma la atmósfera**: color de fondo, cursor, cortinilla de entrada y tipo de movimiento. Principio rector: **la animación imita la técnica de la obra**. Nada de efectos gratuitos.

| | Marco | GOAB | POLAS | Starbucks |
|---|---|---|---|---|
| Fondo | Papel | Marrón oscuro `#251C1A` | Negro | Crepúsculo cambiante |
| Cursor | Punto de tinta | Grano de arena con estela | Punta de bolígrafo | Destello cálido |
| Cortinilla | Papel que sube | Barrido de arena granulada | Tinta que inunda desde el clic | Telón de atardecer |
| Movimiento | Editorial, preciso | Partículas, escala | Rayado, páginas, deformación | Luz, parpadeo, fuegos |

Los colores de GOAB y Starbucks están **muestreados de las obras** (k-means sobre la ilustración final y la portada del PDF), no inventados. El texto secundario de GOAB se aclaró (`#A37B4F` → `#B58C5C`) para cumplir el contraste AA; la paleta original sigue visible en la sección de paleta.

## Tipografía
- **Gloock** (display): serif de alto contraste con aire de grabado. Encaja con el bolígrafo de POLAS, con la gravedad de GOAB y con el cine de Starbucks, y evita el par habitual Inter + Playfair.
- **Familjen Grotesk** (texto): grotesca limpia con algo de calidez humana.
- Ambas autoalojadas (Fontsource, subconjunto latino, `font-display: swap`). Llevan **fuentes de respaldo con métricas ajustadas** (`size-adjust`, `ascent-override`) para que el texto no salte al cargar la fuente (CLS 0).

## Home
- **Nombre que se "pinta":** cinco trazos de pincel con borde irregular (filtro SVG de turbulencia) revelan "Vega Gómez" en ≤ 1,8 s. Se puede saltar (clic, tecla o botón), solo dura completo en la primera visita de la sesión y no existe con movimiento reducido. Las letras llevan un halo de papel para leerse cuando se superponen al collage.
- **Collage** de fragmentos de los tres proyectos con parallax por capas (ratón y scroll).
- **Índice:** cada panel tiene ya el color de su mundo, y la imagen se revela al pasar el ratón con el efecto propio de su proyecto: el rayado de bolígrafo se rellena (POLAS), la arena se aparta desde el cursor (GOAB) o amanece desde abajo (Starbucks). En táctil, el reveal ocurre al entrar en pantalla.

## GOAB: partículas y escala
- **Arena de partículas** (Canvas 2D, sin librerías): la figura se muestrea a partir de su recorte con transparencia. El viento la deshace de izquierda a derecha y la arena se recompone en otra pose. Usa entre 2.000 y 9.000 partículas según núcleos y memoria del dispositivo, dibujadas en un `ImageData` (mucho más rápido que `fillRect`). Va a 60 fps y solo dibuja mientras está en pantalla.
- **Escala dramática**: el PDF no traía capas, así que se generaron por script: cresta detectada por color, cielo reconstruido y Bastian aislado por diferencia entre las dos versiones del paisaje. Goab emerge tras la cresta y crece mientras Bastian sigue diminuto, y la escena **termina fundiéndose en la ilustración final** (sin duplicarla debajo). En móvil tiene un encuadre propio para que se vean los dos.
- **Hoja de anatomía**: 7 puntos con las notas del PDF. Hover y foco en escritorio, tap en móvil, Esc para cerrar. Los puntos solo aparecen cuando la lámina ha cargado, y las notas también existen como lista para lectores de pantalla.
- Las 16 **siluetas** se separaron una a una (componentes conexos) para que aparezcan en cascada.

## POLAS: el bolígrafo
- **Reveal de rayado**: un rayado diagonal barre la imagen y después se rellena (máscaras CSS animadas con GSAP). Es reutilizable con `data-hatch`.
- **Tentáculos de la portada** en dos capas que se enroscan en sentidos opuestos al hacer scroll.
- **Pasar páginas**: recorrido horizontal fijado en el que cada doble página gira levemente como una hoja. En móvil pasa a ser una lista vertical. El cuento de Trini está dibujado en las páginas: en español la transcripción solo la leen los lectores de pantalla (ya se ve en la ilustración) y en inglés se muestra como traducción.
- **Percepción**: cuatro versiones del personaje que se funden con una deformación (`feDisplacementMap`). El filtro solo se aplica en pantallas grandes. La sección invierte el mundo a papel blanco.
- La portada en 3D con tilt y la marquesina lenta de amapolas completan "el objeto".

## Starbucks: luz de cine
- El fondo crepuscular **interpola entre la paleta de cada cartel** (muestreada) mientras se hace scroll por las escenas.
- Bombillas con parpadeo desfasado, focos del estadio que respiran (localizados en la imagen por brillo) y **fuegos artificiales** en el 4 de julio al entrar en pantalla o al hacer clic sobre el cielo.
- Carrusel de mockups con scroll-snap, botones y flechas de teclado.
- El **aviso académico** aparece tres veces (portada, índice y pie del caso): la marca es real y el proyecto no lo es.

## Transiciones y navegación
- **Astro View Transitions** con una capa propia: se cubre la pantalla con el material del destino, se cambia de página y se descubre. Cursor y cortinilla persisten entre páginas.
- **Lenis** sincronizado con el ticker de GSAP. Al navegar se limpian todos los ScrollTriggers, y los pins se ordenan por posición en la página antes de calcularse.
- Las secciones con escenas fijadas **precargan sus imágenes** 2,5 pantallas antes de llegar, para que nunca se vean vacías.

## Rendimiento
- Imágenes en **AVIF + WebP + respaldo JPG/PNG** con `srcset`, generadas en el build. Los originales no se tocan.
- CSS en línea (sin petición que bloquee el renderizado). JS solo en islas: GSAP + Lenis más los scripts de cada caso.
- Resultado en Lighthouse móvil: Performance 95–100, LCP ≤ 2,4 s, CLS 0.

## Accesibilidad
- Contraste AA en todos los mundos, foco visible, skip link y navegación por teclado (el recorrido horizontal desplaza la página al elemento enfocado).
- ALT descriptivo en todas las obras, en ES y EN.
- `prefers-reduced-motion`: sin Lenis, sin pins y sin partículas; cada escena tiene su versión estática compuesta.
- El cursor personalizado solo se activa con ratón (`pointer: fine`) y nunca oculta el cursor en táctil.

## SEO
- Metadatos por página, Open Graph con imagen propia por proyecto (1200×630), `hreflang` ES/EN/x-default, sitemap con los pares de idioma, `robots.txt` generado con el dominio y datos estructurados `WebSite`, `Person` y `CreativeWork` (`isBasedOn` en GOAB).

## Contenido
- **No se ha inventado ningún dato de Vega**: lo que falta queda marcado como `[PENDIENTE: …]` en `site.json`. Las técnicas de Sobre mí son solo las que se ven en el portfolio. El texto breve de presentación es provisional y está marcado como tal.
- Los textos de los PDFs se corrigieron manteniendo su voz (ver CORRECCIONES.md).
- Los moodboards y los restos de plantillas de terceros se excluyeron (ver PENDIENTES.md).

## Extensibilidad
- Un proyecto nuevo es **una carpeta de imágenes y un `meta.yaml`**: usa la plantilla genérica (portada, texto, ficha y galería ampliable) con su propio color, cursor y transición. Si un día merece dirección de arte propia, se le crea un componente y se registra en `src/projects/index.ts`.
