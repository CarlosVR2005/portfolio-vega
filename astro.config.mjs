// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// [PENDIENTE: dominio definitivo] — se usa para canonical, OG y sitemap.
const SITE = process.env.SITE_URL ?? 'https://vegagomez.vercel.app';

// Pares ES ↔ EN para el sitemap (las rutas no comparten nombre en los dos idiomas).
const pairs = [
  ['/', '/en/'],
  ['/sobre-mi/', '/en/about/'],
  ['/contacto/', '/en/contact/'],
  ...readdirSync('./src/content/projects').flatMap((dir) => {
    try {
      const yaml = readFileSync(`./src/content/projects/${dir}/meta.yaml`, 'utf8');
      const m = yaml.match(/^slug:\s*\{\s*es:\s*([\w-]+),\s*en:\s*([\w-]+)\s*\}/m);
      return m ? [[`/proyectos/${m[1]}/`, `/en/work/${m[2]}/`]] : [];
    } catch {
      return [];
    }
  }),
];
const alternatesFor = (url) => {
  const path = new URL(url).pathname;
  const pair = pairs.find((p) => p.includes(path));
  if (!pair) return undefined;
  return [
    { lang: 'es-ES', url: new URL(pair[0], SITE).href },
    { lang: 'en-US', url: new URL(pair[1], SITE).href },
  ];
};

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize: (item) => ({ ...item, links: alternatesFor(item.url) }),
    }),
  ],
  image: { layout: 'constrained' },
  // CSS en línea: elimina la petición que bloquea el primer pintado
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
