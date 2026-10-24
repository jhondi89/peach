/** Capa i18n mínima para Peach (Vite + React).
 *
 * - Locale por defecto: `es`.
 * - Los msgid son el texto fuente chino del UI (migración gradual).
 * - NO usar para claves de protocolo API, regexes ni enums del servidor
 *   (中字/无码/有码, 速食/短/中/长, 【】, etc.).
 *
 * Cómo añadir cadenas:
 * 1. Añade `msgid chino: 'Traducción española'` en `./es.ts`.
 * 2. En el UI, sustituye el literal por `t('msgid chino')` o `{t('…')}`.
 * 3. Rebuild: `npm run build` en `frontend/`.
 */
import { es } from './es';

export type Locale = 'es' | 'zh';

const catalogs: Record<Locale, Record<string, string>> = {
  es,
  // Identidad: sin entradas → t() devuelve el msgid chino.
  zh: {},
};

let locale: Locale = 'es';

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  locale = next;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next === 'zh' ? 'zh-Hans' : 'es';
  }
}

/** Traduce un msgid. Si falta en el catálogo activo, cae a `es` y luego al propio msgid. */
export function t(id: string, vars?: Record<string, string | number>): string {
  const table = catalogs[locale] ?? catalogs.es;
  let out = table[id] ?? catalogs.es[id] ?? id;
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = vars[key];
      return value === undefined ? `{${key}}` : String(value);
    });
  }
  return out;
}

/** True si el texto coincide con el msgid o con su traducción en cualquier catálogo cargado. */
export function matchesMessage(text: string, id: string): boolean {
  if (text === id) return true;
  for (const table of Object.values(catalogs)) {
    if (table[id] === text) return true;
  }
  return false;
}

export { es };
