/**
 * Utilitários de sanitização e abertura segura de links externos.
 * Previne vulnerabilidades XSS (ex.: popups Leaflet) e tabnabbing.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function openExternalUrlSafely(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
