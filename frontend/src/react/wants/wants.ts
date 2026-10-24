/* "想要"清单Datos契约(ADR-0090): `/api/wants` En `frontend/src` dentroSoloEnaquí声明uno次. 
 *
 * 两Clave: 清单Completopáginauno(关注Gestionar"想要"página签), 关注Detalles问"esteuno想要过Sin"按Entrada各uno. 
 * 写完两族都作废: EnDetallesdentro点想要, 回到página签时清单要ya经Con它; Enpágina签dentroQuitar, DetalleseseClave也要
 * 跟着弹起.  */
import { apiGet, apiSend } from '../../api';
import { queryClient } from '../query';

export const WANTS_URL = '/api/wants';

export const WANTS_KEY = ['wants'] as const;
export const wantFollowKey = (itemId: number) => ['wants', 'follow', itemId] as const;

/** 清单en lacuatro段, 次序就espágina签dentro排次序.  */
export const PHASES = [
  ['searching', 'Pendiente找'], ['unreleased', 'No发售'], ['given_up', 'Abandonar temporalmente'], ['acquired', 'Catalogado'],
] as const;
export type Phase = (typeof PHASES)[number][0];

/** uno想要. 字段y `src/peach/web_wants.py`  `_payload` 对齐.  */
export interface Want {
  id: number;
  code: string | null;
  has_magnets?: boolean | null;
  origin: 'code' | 'feed' | 'follow';
  title: string | null;
  link: string | null;
  release_date: string | null;
  studio: string | null;
  performers: string | null;
  phase: Phase;
  fresh: boolean;
  search_count: number;
  last_search_at: string | null;
  last_search_outcome: 'found' | 'none' | 'error' | null;
  given_up_at: string | null;
  acquired_asset_id: number | null;
  acquired_at: string | null;
  follow_item_id: number | null;
  follow_provider: string | null;
  cover: string | null;
  /** Portada还es来源给远程地址: 要带 `no-referrer` 去取.  */
  remote_cover: boolean;
  scraped: boolean;
  scrape_error: string | null;
  created_at: string;
}

export interface WantsData {
  items: Want[];
  counts: Record<Phase, number>;
  /** 取资料eseuno轮还En跑: 刚登记ese几资料还没回来.  */
  scraping: boolean;
}

export const fetchWants = (signal?: AbortSignal) => apiGet<WantsData>(WANTS_URL, signal);

export function recordWantMagnets(id: number, available: boolean) {
  queryClient.setQueryData<WantsData>(WANTS_KEY, current => {
    if (!current?.items.some(want => want.id === id && want.has_magnets !== available)) return current;
    return { ...current, items: current.items.map(want => want.id === id ? { ...want, has_magnets: available } : want) };
  });
}

export const fetchFollowWant = (itemId: number, signal?: AbortSignal) =>
  apiGet<{ want: Want | null }>(`${WANTS_URL}?follow=${encodeURIComponent(itemId)}`, signal);

type AddTarget = { code: string } | { follow: number };

export const addWant = (target: AddTarget, signal?: AbortSignal) =>
  apiSend<{ created: boolean; want: Want }>(WANTS_URL, { action: 'add', ...target }, 'POST', signal);

export const removeWants = (ids: number[], signal?: AbortSignal) =>
  apiSend(WANTS_URL, { action: 'remove', ids }, 'POST', signal);

export const resetWants = (ids: number[], signal?: AbortSignal) =>
  apiSend(WANTS_URL, { action: 'reset', ids }, 'POST', signal);

/** 写完之posterior: 清单y各关注Detalles想要Estadouno起pesado取.  */
export const invalidateWants = () => queryClient.invalidateQueries({ queryKey: WANTS_KEY });

/** uno想要叫什么: Código JAV打头, SinCódigo JAV关注Entrada用Título.  */
export const wantName = (want: Want) => want.code || want.title || `SeguirResultado目 ${want.follow_item_id ?? want.id}`;

/** "待找"eseuno段Descripción: Nuevo片查No到No计数, 老片查满tres次就暂时放弃.  */
export function searchNote(want: Want): string {
  if (want.phase === 'acquired') return want.acquired_at ? `入Biblioteca于 ${want.acquired_at.slice(0, 10)}` : 'Catalogado';
  if (want.phase === 'unreleased') return want.release_date ? `${want.release_date} 发售` : 'Aún no lanzado';
  if (want.phase === 'given_up') return `查过 ${want.search_count} 次都没找到`;
  if (want.fresh) return 'Nuevo片: 查No到也uno直DejaEnPendiente找';
  return want.search_count ? `查过 ${want.search_count} 次` : 'Nunca verificado';
}
