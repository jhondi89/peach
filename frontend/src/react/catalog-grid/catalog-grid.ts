/* 馆藏卡片CuadrículaDatos: Directorio(`/` ycuatroFiltrar态, 回收站), 资料páginaObras区, 以及壳直continuar给uno批
 * Entradaese两处(DetallespáginaContinuar viendo). 
 *
 * Directorio y Obras区都esunopáginauno `useInfiniteQuery`, "载入更más"就es取Siguientepágina. 
 *
 * uno屏卡片排法Todo由aquí算, 渲染Solo照着画: 
 * - 分卷y版次各自折叠. 同uno组SoloDejaNo.uno次出现eseuno, 跨página也算(Configuración关掉就No折). 
 * - Directorio每unopáginapuede见卡够 8 时, No. 8 插uno Mix; Semilla从 Mix 再往abajo隔uno屏Empezar找, 
 *   No会 y 同屏卡撞Imagen. 
 * - 竖屏带每continuarunopágina出现uno, 落点EnesteunopáginaAgregarese几行之间行边界arribaAleatorio取uno.  */
import type { InfiniteData, QueryKey } from '@tanstack/react-query';

import { apiGet } from '../../api';
import { javImageKind } from '../../jav-artwork';
import type { CatalogGridProps, MediaItem, MediaPage } from './types';
import { queryClient } from '../query';
import { catalogView } from './catalog-view';

/** 竖屏带uno放几.  */
export const SHORTS_BATCH = 18;
/** Mix 卡插En每unopáginaesteuno, 也就esNo. 8 .  */
export const MIX_SLOT = 7;

/** unopáginaResultado, exterior加No.unopáginaComo空时"Completo馆藏esNoes空": 空态据此说"还SinObras"还es
 *  "Sinque cumple".  */
export interface GridPage extends MediaPage {
  offset: number;
  libraryEmpty?: boolean;
}

/** DirectorioConsulta串, No含 `limit`/`offset`. `exclude_vertical` 判据归壳: primeropáginaPredeterminadoLista另Con
 *  竖屏带承continuar竖屏, Buscar y 显筛竖屏时候NoExcluir.  */
export function catalogParams(filters: Readonly<Record<string, string>>, excludeVertical: boolean): string {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  if (excludeVertical) params.set('exclude_vertical', '1');
  return params.toString();
}

export const catalogKey = (params: string, revision: number): QueryKey => ['catalog-grid', 'catalog', params, revision];
export const entityKey = (key: string, revision: number): QueryKey => ['catalog-grid', 'entity', key, revision];

/** Directoriounopágina. No.unopáginaComo空, 又Noes回收站时, 再问uno次Completo馆藏ConSin东西.  */
export async function fetchCatalogPage(
  params: string, offset: number, batch: number, trash: boolean, signal: AbortSignal,
): Promise<GridPage> {
  const query = new URLSearchParams(params);
  query.set('limit', String(batch));
  query.set('offset', String(offset));
  if (offset) query.set('count', '0');
  const page = await apiGet<MediaPage>(`/api/items?${query}`, signal);
  const result: GridPage = { ...page, items: page.items || [], offset };
  if (!offset && !result.items.length && !trash) {
    const library = await apiGet<MediaPage>('/api/items?limit=1&thumb=0', signal);
    result.libraryEmpty = library.total === 0;
  }
  return result;
}

/** Siguientepágina从哪儿取. No.unopágina按Total数判断, 往posteriorpáginaNo带Total数, ver `has_more`.  */
export const nextOffset = (batch: number) => (last: GridPage): number | undefined => {
  const more = last.offset === 0 ? last.items.length < (last.total || 0) : !!last.has_more;
  return more ? last.offset + batch : undefined;
};

/** 资料páginaObras区SiguientePágina: 壳给No.unopáginapuede能带 `has_more`, 也puede能SoloConTotal数.  */
export const nextEntityOffset = (last: GridPage, pages: GridPage[]): number | undefined => {
  const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
  const more = last.has_more == null ? loaded < (last.total || 0) : !!last.has_more;
  return more ? loaded : undefined;
};

export function catalogQuery(props: CatalogGridProps) {
  const params = catalogParams(props.filters || {}, !!props.excludeVertical);
  const batch = props.batchSize || 60;
  const trash = props.filters?.state === 'trash';
  return {
    queryKey: catalogKey(params, props.revision || 0),
    queryFn: ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) =>
      fetchCatalogPage(params, pageParam, batch, trash, signal),
    initialPageParam: 0,
    getNextPageParam: nextOffset(batch),
  };
}

export function entityQuery(props: CatalogGridProps) {
  return {
    queryKey: entityKey(props.entityKey || '', props.revision || 0),
    queryFn: async ({ pageParam, signal }: { pageParam: number; signal: AbortSignal }) => {
      if (!props.fetchPage) return { items: [], total: 0, offset: pageParam } as GridPage;
      const page = await props.fetchPage(pageParam, signal);
      return { ...page, items: page.items || [], offset: pageParam } as GridPage;
    },
    initialPageParam: 0,
    getNextPageParam: nextEntityOffset,
  };
}

/** primero屏取数(DirectorioCuadrículaese路由 `prefetch`). SoloConDirectorio要etc.: 资料páginaObras区No.unopágina跟着资料página递进来, 
 *  Cuadrícula挂arriba时自己落进缓存(`initialData`).  */
export async function prefetchCatalogGrid(props: CatalogGridProps, signal: AbortSignal): Promise<void> {
  if (props.mode !== 'catalog' || props.wall || catalogView() === 'list') return;
  const query = catalogQuery(props);
  await queryClient.fetchInfiniteQuery({
    ...query, queryFn: ({ pageParam }) => query.queryFn({ pageParam: pageParam as number, signal }),
  });
}

/** 同uno集合分páginaGuardarEn Query en proceso; Actualizar代次之间认领Completo分página, NoCopiarObras到界面Estado.  */
export function latestCatalogPages(key: QueryKey): InfiniteData<GridPage, number> | undefined {
  const exact = JSON.stringify(key);
  const cached = queryClient.getQueryCache().findAll({ queryKey: key.slice(0, -1) })
    .filter(query => JSON.stringify(query.queryKey) !== exact && Array.isArray((query.state.data as InfiniteData<GridPage> | undefined)?.pages))
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)[0];
  return cached?.state.data as InfiniteData<GridPage, number> | undefined;
}

/** 分卷y版次各自折叠: 分卷esuno部片被切成几段, 版次es同uno部片几来源, 两者能同时
 *  出现EnunoCódigo JAVarriba, 所以两套 key 分开记. `seen` 跨página累积, uno组SoloDejaNo.uno次出现eseuno.  */
export function collapseGroups(
  items: readonly MediaItem[], seen: { parts: Set<string>; editions: Set<string> }, enabled: boolean,
): MediaItem[] {
  if (!enabled) return [...items];
  return items.filter((item) => {
    const part = item.part_group?.key;
    if (part) {
      if (seen.parts.has(part)) return false;
      seen.parts.add(part);
    }
    const edition = item.edition_group?.key;
    if (edition) {
      if (seen.editions.has(edition)) return false;
      seen.editions.add(edition);
    }
    return true;
  });
}

/** esteuno真能画出Imagen吗:  y 卡片Portada分支uno致, Solover `has_cover` 会SoloConOficial封套, 却按
 *  Vista previaImagen偏bien画Entrada当成ConImagen.  */
export const mixHasPicture = (item: MediaItem | undefined, javImage: string) =>
  !!item && Boolean(javImageKind(item, javImage));

/** Semilla决定 Mix Portada y 署名. 从 Mix 再往abajo隔uno屏Empezar找ConImagen, Con署名, 找No到逐级放ancho.  */
export function mixSeed(visible: readonly MediaItem[], javImage: string): MediaItem | undefined {
  const named = (item: MediaItem) => mixHasPicture(item, javImage)
    && Boolean(item.creator || (item.performers || []).length || item.studio);
  return visible.slice(MIX_SLOT + 8).find(named)
    || visible.slice(MIX_SLOT + 1).find(named)
    || visible.slice(MIX_SLOT + 1).find((item) => mixHasPicture(item, javImage))
    || visible[visible.length - 1];
}

/** Cuadrículaen launo格: unoObras卡, 或uno Mix.  */
export type Tile = { kind: 'card'; item: MediaItem } | { kind: 'mix'; seed: MediaItem };

/** ya取回各página排成uno列格子. 每unopágina各自折叠, 各自插 Mix,  y 逐páginacontinuararriba来时uno样. 
 *  `pageStarts[i]` esNo. i páginaEnesteuno列en la起点, 竖屏带落点要落EneseunopáginaAgregar格子之间.  */
export function arrangeTiles(
  pages: readonly GridPage[], { collapse, mix, javImage }: { collapse: boolean; mix: boolean; javImage: string },
): { tiles: Tile[]; pageStarts: number[] } {
  const seen = { parts: new Set<string>(), editions: new Set<string>() };
  /* 翻página期间BibliotecadentroNuevo进Obras, 偏移量Completo体posterior挪, Anteriorpáginaúltimo尾ese几会EnSiguientepágina再出现uno次. 
     同unoSolo画No.uno次: uno屏dentro两uno样卡什么也NoDescripción.  */
  const ids = new Set<number>();
  const tiles: Tile[] = [];
  const pageStarts: number[] = [];
  for (const page of pages) {
    pageStarts.push(tiles.length);
    const fresh = page.items.filter((item) => !ids.has(item.id) && Boolean(ids.add(item.id)));
    const visible = collapseGroups(fresh, seen, collapse);
    const cards: Tile[] = visible.map((item) => ({ kind: 'card', item }));
    if (mix && visible.length >= 8) {
      const seed = mixSeed(visible, javImage);
      if (seed) cards.splice(MIX_SLOT, 0, { kind: 'mix', seed });
    }
    tiles.push(...cards);
  }
  return { tiles, pageStarts };
}

/** 竖屏带落点候选: 从esteunopáginaAgregarese几行Empezar, 每行边界uno; 两端各Deja至menosuno行, 剪En
 *  头尾就成"置顶"或"垫底", Noes穿插. `addedFrom` y `count` 都按最posterioruno段计.  */
export function shortsBoundaries(count: number, addedFrom: number, columns: number): number[] {
  const step = Math.max(1, columns);
  const boundaries: number[] = [];
  for (let at = Math.max(step, Math.ceil(Math.max(0, addedFrom) / step) * step); at < count; at += step) {
    boundaries.push(at);
  }
  return boundaries;
}

/** ya经插进Cuadrículauno竖屏带: `at` es它abajo面eseuno段EnCompleto列格子en la起点.  */
export interface ShortsCut {
  at: number;
  total: number;
  items: MediaItem[];
}

/** 竖屏带Consulta串: 跟着主ListaFiltraryOrdenar走, 换uno批时它也uno起换.  */
export function shortsParams(filters: Readonly<Record<string, string>>, offset: number): string {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  params.set('orient', 'Pantalla vertical');
  params.set('limit', String(SHORTS_BATCH));
  params.set('offset', String(offset));
  return params.toString();
}

/** uno列格子按竖屏带切成几段, 段y段之间插带子.  */
export function splitSections(tiles: readonly Tile[], cuts: readonly ShortsCut[]) {
  const ordered = [...cuts].sort((a, b) => a.at - b.at);
  const sections: { start: number; tiles: Tile[]; strip: ShortsCut | null }[] = [];
  let start = 0;
  for (const cut of ordered) {
    sections.push({ start, tiles: tiles.slice(start, cut.at), strip: cut });
    start = cut.at;
  }
  sections.push({ start, tiles: tiles.slice(start), strip: null });
  return sections;
}

/** 每uno版ya缓存DirectorioyObras区en la同uno卡换arriba `patch`(DetallesdentroPuntuación, Comentarios, 稍posteriorver之posterior). 
 *  Solo改字段No增删卡: DetallesNo知道每uno版筛着哪uno档, 移出y否etc.abajo次取数.  */
export function replaceCatalogItem(id: number, patch: Partial<MediaItem>): void {
  patchCatalogItems((item) => item.id === id, patch);
}

/** 同arriba, 换es `match` 认出来每uno: unoCódigo JAV几段, 几Versión共用同unoPortada.  */
export function patchCatalogItems(match: (item: MediaItem) => boolean, patch: Partial<MediaItem>): void {
  queryClient.setQueriesData<MediaPage>({ queryKey: ['catalog-grid', 'table'] }, data => {
    if (!data?.items.some(match)) return data;
    return { ...data, items: data.items.map(item => match(item) ? { ...item, ...patch } : item) };
  });
  queryClient.setQueriesData<InfiniteData<GridPage>>({
    queryKey: ['catalog-grid'], predicate: (query) => Array.isArray((query.state.data as InfiniteData<GridPage>)?.pages),
  }, (data) => {
    if (!data || !data.pages.some((page) => page.items.some(match))) return data;
    return {
      ...data,
      pages: data.pages.map((page) => (page.items.some(match)
        ? { ...page, items: page.items.map((item) => (match(item) ? { ...item, ...patch } : item)) } : page)),
    };
  });
}
