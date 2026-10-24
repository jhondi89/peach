import { JAV_RELEASE_SORT } from '../../sort-preferences';

export const DISCOVERY_SORTS = [
  ['taste', 'Gustos', 'Ordenar por afinidad con tus gustos'],
  ['release_date', JAV_RELEASE_SORT[1], 'Ordenar por fecha de lanzamiento'],
  ['source_score', 'Puntuación de la fuente', 'Ordenar por puntuación de la fuente'],
  ['duration', 'Duración', 'Ordenar por duración'],
  ['code', 'Código', 'Ordenar por código'],
] as const;
export type DiscoverySort = typeof DISCOVERY_SORTS[number][0];
export type DiscoveryDirection = 'asc' | 'desc';

export function discoveryScore(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : '—';
}

/** 口味相关度使用固定百分制；未知读数保留空值。 */
export function recommendationScore(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return { score: '—', label: 'Sin datos', color: 'neutral' as const };
  const score = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tier = score >= 75 ? { label: 'Muy recomendado', color: 'lime' as const }
    : score >= 50 ? { label: 'Recomendado', color: 'blue' as const }
    : score >= 25 ? { label: 'Vale la pena', color: 'yellow' as const }
    : { label: 'Explorar', color: 'neutral' as const };
  return { score: String(score), ...tier };
}
