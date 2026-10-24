import { JAV_RELEASE_SORT } from '../../sort-preferences';

export const DISCOVERY_SORTS = [
  ['taste', 'Preferencias', '按Preferencias匹配Ordenar'],
  ['release_date', JAV_RELEASE_SORT[1], '按Fecha de lanzamientoOrdenar'],
  ['source_score', 'FuentePuntuación', '按FuentePuntuaciónOrdenar'],
  ['duration', 'Duración', 'Ordenar por duración'],
  ['code', 'Código JAV', '按Código JAVOrdenar'],
] as const;
export type DiscoverySort = typeof DISCOVERY_SORTS[number][0];
export type DiscoveryDirection = 'asc' | 'desc';

export function discoveryScore(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : '—';
}

/** 口味相关度使用固定cien分制; no知读数保Deja空值.  */
export function recommendationScore(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return { score: '—', label: 'DetallesNo disponible', color: 'neutral' as const };
  const score = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tier = score >= 75 ? { label: '强烈Recomendado', color: 'lime' as const }
    : score >= 50 ? { label: 'Recomendado', color: 'blue' as const }
    : score >= 25 ? { label: 'Vale la pena ver', color: 'yellow' as const }
    : { label: 'Explorar', color: 'neutral' as const };
  return { score: String(score), ...tier };
}
