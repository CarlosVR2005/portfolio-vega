export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

/** Rutas por idioma. Los textos EN están marcados para revisión de Vega. */
export const routes = {
  home: { es: '/', en: '/en/' },
  work: { es: '/#obra', en: '/en/#work' },
  project: { es: '/proyectos/', en: '/en/work/' },
  about: { es: '/sobre-mi/', en: '/en/about/' },
  contact: { es: '/contacto/', en: '/en/contact/' },
} as const;

export const ui = {
  es: {
    'nav.work': 'Obra',
    'nav.about': 'Sobre mí',
    'nav.contact': 'Contacto',
    'nav.skip': 'Saltar al contenido',
    'nav.lang': 'English',
    'nav.langShort': 'EN',
    'hero.scroll': 'Desliza',
    'hero.skip': 'Saltar intro',
    'work.title': 'Obra seleccionada',
    'work.intro': 'Cada proyecto, un mundo. Una sola mano.',
    'work.view': 'Ver proyecto',
    'project.back': 'Volver a la obra',
    'project.next': 'Siguiente proyecto',
    'project.soon': 'Caso de estudio en construcción',
    'footer.rights': 'Todas las ilustraciones © Vega Gómez Muñoz.',
    'footer.top': 'Volver arriba',
  },
  en: {
    'nav.work': 'Work',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.skip': 'Skip to content',
    'nav.lang': 'Español',
    'nav.langShort': 'ES',
    'hero.scroll': 'Scroll',
    'hero.skip': 'Skip intro',
    'work.title': 'Selected work',
    'work.intro': 'Each project, its own world. One hand.',
    'work.view': 'View project',
    'project.back': 'Back to work',
    'project.next': 'Next project',
    'project.soon': 'Case study in progress',
    'footer.rights': 'All illustrations © Vega Gómez Muñoz.',
    'footer.top': 'Back to top',
  },
} as const;

export type UIKey = keyof (typeof ui)['es'];

export function t(locale: Locale, key: UIKey): string {
  return ui[locale][key] ?? ui[defaultLocale][key];
}

export function projectHref(locale: Locale, slug: { es: string; en: string }) {
  return `${routes.project[locale]}${slug[locale]}/`;
}

export const isPending = (v: string) => /^\[(PENDIENTE|PENDING)/.test(v);
