/* DatosGestionarpáginaDatos契约. 
 *
 * esteunopáginaes"Bibliotecadentroya经Con东西怎么收拾"唯uno入口. 顶Anterior排读数各esunocontenidoEnBibliotecaen la经过: 
 * 先它说清楚(人工复核, alto清版), 再No该Deja挑出去(RepetirArchivo, 垃圾Archivo), 最posteriores删掉
 * 东西还En哪儿(回收站). 
 *
 * cinco读数dentroCon两No归esteunopágina所Con: alto清版读 `QUALITY_GOALS_KEY`, RepetirArchivo读 `DUPLICATES_KEY`, 
 * 同uno数En两páginaarriba永远es同uno. aquíSolo声明人工复核计数, 垃圾Archivoy回收站. 
 * 复核计数No读 `REVIEW_KEY`: eseunoesCompletoCola, aquíSolo要 `?counts=1` ese几数, Respuesta形状No同, 
 * es另uno资源. 
 *
 * 各卡各自Fallo各自算: 复核Interfaz出错No该回收站ese卡也变成"读取Fallo", 所以escinco
 * `useQuery`, Noesuno次 `Promise.all`.  */
import type { QueryKey } from '@tanstack/react-query';

import { apiGet } from '../../api';
import { DUPLICATES_KEY, fetchDuplicates } from '../duplicates/duplicates';
import { prefetchLibraryProcessing } from '../library-processing/library-processing';
import { prefetchMediaRepair } from '../media-repair/media-repair';
import { prefetchMediaSources } from '../media-sources';
import { fetchQualityGoals, QUALITY_GOALS_KEY } from '../quality-goals/quality-goals';
import { queryClient } from '../query';
import { REVIEW_LABELS, type ReviewCategory } from '../review/review';
import {
  fetchLinkCheck, fetchLinkPrune, fetchLinkStats, LINK_CHECK_KEY, LINK_PRUNE_KEY, LINKS_KEY,
} from './links';
import { prefetchOrganize } from './organize';
import { prefetchResourceSync } from './resource-sync';

export const REVIEW_COUNTS_URL = '/api/review?counts=1';
export const REVIEW_COUNTS_KEY = ['review', 'counts'] as const;

/** 垃圾Archivo: Solo要待判断Total数y分项, uno都No用取回来.  */
export const JUNK_URL = '/api/ads?limit=1';
export const JUNK_KEY = ['junk-summary'] as const;

/** 回收站: DirectorioeseCuadrícula同uno端点, 钉死 `state=trash` SoloComo拿Total数y占用.  */
export const TRASH_URL = '/api/items?state=trash&limit=1';
export const TRASH_KEY = ['trash-summary'] as const;

/** 垃圾判断Categoríay界面en la名字. 次序就es分项eseuno行次序(遗Deja层 `JUNK_KIND_OPTIONS`).  */
export const JUNK_KINDS: [string, string][] = [
  ['video', 'Videos'], ['image', 'Imágenes'], ['archive', 'Archivo comprimido'],
  ['audio', 'Audio'], ['url', 'URL'], ['other', 'Otros'],
];

export interface ReviewCounts { counts: Partial<Record<ReviewCategory, number>> }

export interface JunkSummary {
  pending_total: number;
  dismissed_total: number;
  counts: Record<string, number>;
}

export interface TrashSummary { total: number; bytes: number }

export const fetchReviewCounts = (signal?: AbortSignal) => apiGet<ReviewCounts>(REVIEW_COUNTS_URL, signal);
export const fetchJunkSummary = (signal?: AbortSignal) => apiGet<JunkSummary>(JUNK_URL, signal);
/** 回收站计数跟着侧栏选en proceso媒体Biblioteca走,  y DirectorioCuadrícula同uno口径: 遗Deja层 `api()` 取 `/api/items`
 *  时会补arriba `library=`, `apiGet` No补, aquí自己continuararriba.  */
export const fetchTrashSummary = (signal?: AbortSignal) => {
  const library = sessionStorage.getItem('peach.library');
  const url = library ? `${TRASH_URL}&library=${encodeURIComponent(library)}` : TRASH_URL;
  return apiGet<TrashSummary>(url, signal);
};

const count = (value: number | undefined) => Number(value || 0).toLocaleString();

/** 复核ese卡: Total数yanteriortres类, 剩abajo合成"其余 N"—卡片es入口, Noes复核Cola本身.  */
export function reviewSummary(data: ReviewCounts | undefined): { figure: string; meta: string } {
  const labels = REVIEW_LABELS as Record<string, string>;
  const counts = Object.entries(data?.counts ?? {})
    .map(([key, value]) => [labels[key] || key, Number(value) || 0] as const)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = counts.reduce((sum, [, value]) => sum + value, 0);
  const top = counts.slice(0, 3).map(([label, value]) => `${label} ${value.toLocaleString()}`);
  const rest = counts.slice(3).reduce((sum, [, value]) => sum + value, 0);
  if (rest) top.push(`其余 ${rest.toLocaleString()}`);
  return { figure: `${total.toLocaleString()} ResultadoPendiente复核`, meta: top.join(' · ') };
}

/** 垃圾Archivoese卡分项: Solo列真Con东西Categoría, ya忽略continuarEnposterior面.  */
export function junkBreakdown(summary: JunkSummary | undefined): string {
  if (!summary) return '';
  const parts = JUNK_KINDS
    .filter(([key]) => Number(summary.counts?.[key]) > 0)
    .map(([key, label]) => `${label} ${count(summary.counts[key])}`);
  if (Number(summary.dismissed_total) > 0) parts.push(`Ignorado ${count(summary.dismissed_total)}`);
  return parts.join(' · ');
}

/** primero屏Noetc.ese几: 各自 `useQuery` 挂载时取.  */
const LAZY_QUERIES: [QueryKey, (context: { signal: AbortSignal }) => Promise<unknown>][] = [
  [REVIEW_COUNTS_KEY, ({ signal }) => fetchReviewCounts(signal)],
  [QUALITY_GOALS_KEY, ({ signal }) => fetchQualityGoals(signal)],
  [TRASH_KEY, ({ signal }) => fetchTrashSummary(signal)],
  [LINKS_KEY, ({ signal }) => fetchLinkStats(signal)],
  [LINK_CHECK_KEY, ({ signal }) => fetchLinkCheck(signal)],
  [LINK_PRUNE_KEY, ({ signal }) => fetchLinkPrune(signal)],
];

/** primero屏: 顶arribaese排读数, este次会扫哪几来源, 以及两posteriorTarea卡, Organizar卡y资源Sincronizar. 
 *
 *  etc.es画出No.uno屏必需ese几: 遗Deja壳ya经铺骨架, página面自己再转uno次圈就es同uno次进入dentro
 *  两段Esperando态. 复核yalto清版ese两数 y 链continuarEstadísticas各读各, lento时候No该拖住Completopágina, 所以Noetc.. 
 *
 *  Noetc.ese几En缓存dentroya经Conuno版时(又uno次进esteunopágina)要pesado取: 共用 `queryClient` 挂载时
 *  Nopesado取ya缓存Clave, NoEnaquí推uno, 读数就停EnAnterior次进来时样子. No.uno次进来时它们还
 *  Sin缓存, 由各自 `useQuery` 挂载时取. 
 *
 *  直达página底资源Sincronizar(`#resource-sync`)时este几也要etc.: 链continuarGestionarEn它arriba面, 读数yVerificarResultado
 *  En滚动之posterior才continuaren la话, 落点会被撑abajo去几cien像素.  */
export async function prefetchDataCleanup(signal: AbortSignal): Promise<void> {
  const anchored = location.hash === '#resource-sync';
  const lazy = LAZY_QUERIES.map(([queryKey, queryFn]) => {
    if (anchored) return queryClient.fetchQuery({ queryKey, queryFn: () => queryFn({ signal }) }).catch(() => undefined);
    if (queryClient.getQueryState(queryKey)) void queryClient.prefetchQuery({ queryKey, queryFn });
    return undefined;
  });
  await Promise.all([
    ...lazy,
    queryClient.fetchQuery({ queryKey: JUNK_KEY, queryFn: () => fetchJunkSummary(signal) }),
    queryClient.fetchQuery({ queryKey: DUPLICATES_KEY, queryFn: () => fetchDuplicates(signal) }),
    prefetchMediaSources(signal).then(() => prefetchResourceSync(signal)),
    prefetchLibraryProcessing(signal),
    prefetchMediaRepair(signal),
    prefetchOrganize(signal),
  ]);
}
