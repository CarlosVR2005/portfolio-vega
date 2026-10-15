import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const i18n = z.object({ es: z.string(), en: z.string() });

/**
 * Un proyecto = una carpeta en src/content/projects/{slug}/ con meta.yaml
 * (datos compartidos y textos breves ES/EN). Las imágenes viven en
 * src/assets/projects/{slug}/ y se referencian con rutas relativas.
 */
const projects = defineCollection({
  loader: glob({ pattern: '*/meta.yaml', base: './src/content/projects', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      draft: z.boolean().default(false),
      slug: i18n,
      title: z.string(),
      kicker: i18n,
      year: z.string(),
      discipline: i18n,
      teaser: i18n,
      disclaimer: i18n.optional(),
      /** Mundo visual: define tokens de color, cursor y transición. */
      world: z.object({
        id: z.string(),
        bg: z.string(),
        ink: z.string(),
        accent: z.string(),
        muted: z.string(),
        cursor: z.enum(['dot', 'pen', 'sand', 'glow']),
        transition: z.enum(['ink', 'sand', 'dusk', 'plain']),
        /** Fondo para la transición (color o gradiente CSS). */
        wipe: z.string(),
      }),
      cover: z.object({ src: image(), alt: i18n, position: z.string().default('50% 50%') }),
      /** Fragmento para el collage del hero (idealmente PNG con transparencia). */
      fragment: z.object({ src: image(), alt: i18n }).optional(),
      /** Obra en la que se inspira (datos estructurados CreativeWork.isBasedOn). */
      basedOn: z.object({ name: i18n, author: z.string(), type: z.string().default('CreativeWork') }).optional(),

      // ---- Plantilla genérica (proyectos sin componente propio) ----
      /** Texto principal del caso. Admite *cursiva* y **negrita**. */
      intro: i18n.optional(),
      /** Ficha: pares etiqueta / valor. */
      facts: z.array(z.object({ k: i18n, v: i18n })).default([]),
      /** Galería: imágenes ampliables, en orden. wide = ocupa todo el ancho. */
      gallery: z
        .array(z.object({ src: image(), alt: i18n, caption: i18n.optional(), wide: z.boolean().default(false) }))
        .default([]),
    }),
});

export const collections = { projects };
