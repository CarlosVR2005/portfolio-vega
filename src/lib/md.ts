/** Markdown mínimo para textos de contenido: *cursiva* y **negrita**. Escapa el resto. */
export function md(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/** Elimina las marcas de markdown (para atributos y metadatos). */
export const plain = (text: string) => text.replace(/\*+/g, '');
