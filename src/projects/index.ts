/**
 * Casos de estudio con dirección de arte propia. Un proyecto que no esté aquí
 * usa la plantilla genérica (portada + texto + galería) de ProjectPage.
 */
import GoabCase from './goab/GoabCase.astro';
import PolasCase from './polas/PolasCase.astro';
import StarbucksCase from './starbucks/StarbucksCase.astro';

export const cases: Record<string, any> = {
  goab: GoabCase,
  polas: PolasCase,
  starbucks: StarbucksCase,
};
