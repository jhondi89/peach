/* cinco索引páginaDatos契约: 艺人, 创作者, Sello, Agenciacuatro名册yEtiqueta词表. 
 *
 * 本地eseuno档读 `/api/index?kind=`(`src/peach/web_entity.py`  `q_index`), En线eseuno档读
 * 关注来源en la两词表(`../follow/online-vocab.ts`). cuatro形状uno样: `items` 加 `has_more`, 
 * `limit`/`offset` 翻página, 所以unopáginauno `useInfiniteQuery`, "载入更más"就es取Siguientepágina. 
 *
 * 索引página自己No调 `/api/items`: 点unoEtiqueta或按所选Etiqueta显示Resultado, es回Directorio按它Filtrar, eseuno次
 * 取数归遗Deja壳DirectorioCuadrícula.  */
import type { InfiniteData, QueryKey } from '@tanstack/react-query';

import { firstGrapheme } from '@peach/legacy/core';

import { apiGet } from '../../api';
import { IDENTITY_CATEGORIES } from '../../identity-filter';
import {
  fetchOnlineAuthors, fetchOnlineTags, onlineAuthorsKey, onlineTagsKey,
  type OnlineAuthor, type OnlineTag,
} from '../follow/online-vocab';
import { queryClient } from '../query';

export type IndexKind = 'performers' | 'creators' | 'studios' | 'agencies' | 'tags';
export type IndexScope = 'local' | 'online';
export type TagView = 'alphabet' | 'cloud';
export type PeopleLayout = 'big' | 'compact';

export const INDEX_URL = '/api/index';

/** página头Títuloy名册口径.  */
export const INDEX_TITLES: Record<IndexKind, string> = {
  performers: 'Actriz', creators: 'Vendedor', studios: 'Sello', agencies: 'Agencia', tags: 'Etiqueta',
};

/** 索引格对应实体Tipo, 资料páginay取Imagen链都按它分.  */
export const ENTITY_KINDS: Record<Exclude<IndexKind, 'tags'>, string> = {
  performers: 'performer', creators: 'creator', studios: 'studio', agencies: 'agency',
};

/** 本地Etiquetanueve类. 次序就es浮层arriba排药丸次序.  */
export const TAG_CATEGORIES: readonly (readonly [string, string])[] = [
  ['all', 'Todo'], ['meta', 'Propiedades del video'], ['relationship', 'Relaciones de personas'], ['role', 'Rol设定'],
  ['appearance', 'Apariencia y figura'], ['scene', 'Entorno/Lugar'], ['story', 'Argumento/Historia'], ['position', '性交体 resultado(s)'],
  ['general', 'Otrocontenido'],
];

/** En线EtiquetaCategoría来自arriba游 booru  tag_type.  */
export const ONLINE_TAG_CATEGORIES: readonly (readonly [string, string])[] = [
  ['all', 'Todo'], ['general', 'General'], ['artist', 'Creador'], ['character', 'Rol'],
  ['copyright', 'Obra'], ['metadata', 'Metadatos'],
];
/** 本地艺人名册身Categoría; 卖家名册NoCategoría. 词表y壳骨架共用uno.  */
export { IDENTITY_CATEGORIES };

/** Por página数: uno屏Avatar 120 格, Etiqueta 180 .  */
export const PAGE_SIZE = { people: 120, tags: 180 } as const;

export const isPeople = (kind: IndexKind): kind is Exclude<IndexKind, 'tags'> => kind !== 'tags';
export const isCompany = (kind: IndexKind) => kind === 'studios' || kind === 'agencies';

/** 本地名册uno格. 字段以 `q_index` Como准; 公司另Con标识, Agencia另Con成员数.  */
export interface IndexPerson {
  entity_kind?: string;
  identity_labels?: string[];
  following?: boolean;
  entity_id?: number;
  id?: number;
  k: string;
  n: number;
  rep?: number | null;
  has_image?: boolean;
  image_version?: string;
  has_avatar?: boolean;
  avatar_stand_in?: boolean;
  avatar_focus?: unknown;
  has_logo?: boolean;
  members?: number;
  mark?: number | null;
}

export interface IndexTag {
  entity_id?: number;
  favorite?: boolean;
  k: string;
  n: number;
  cat?: string;
}

export interface IndexPage<T> {
  items: T[];
  has_more: boolean;
  /** Categoría命en procesoCantidad; FiltrarSolo显示ConcontenidoCategoría.  */
  categories?: Record<string, number>;
}

/** 地址栏en laese几项. página面改它们Solo经 `IndexProps.route`, 壳按este拼地址.  */
export interface IndexRoute {
  kind: IndexKind;
  q: string;
  scope: IndexScope;
  view: TagView;
  category: string;
}

/** uno格Avatar: 圆框dentroese段 HTML  y 人脸取景 `object-position`.  */
export interface PersonAvatar {
  html: string;
  /** `faceOrigin()` Resultado; 没检出人脸时es空串, 维持几何居en proceso.  */
  face: string;
}

/** 索引página. 地址栏es唯uno真相: `kind`, `q`, `scope`, `view`, `category` 由壳从地址读出, 
 *  `layout` 从esteExplorar dispositivo偏bien读出, 都Solo作初值; página面换档时经 `route` y `savePreference`
 *  写回去. 取Imagen, 回落链y去处仍es遗Deja层唯unoeseuno, 经 props 递进来.  */
export interface IndexProps extends IndexRoute {
  layout: PeopleLayout;
  /** 写回地址栏. `replace` 用En打字Filtrareseuno路改写场合, No往Historialdentro塞uno串.  */
  route(params: IndexRoute, options?: { replace?: boolean }): void;
  /** 版偏bien改: 存储归壳(`appSettings.peopleLayout`), 资料página名册读也es它.  */
  savePreference(patch: { layout: PeopleLayout }): void;
  /** 顶栏eseSeleccionarClaveEstado. SoloEn本地EtiquetapáginaCon意义: 所选Etiqueta拼成DirectorioFiltrar. Clave归壳, 关掉时
   *  壳经 `updateManagedRoute`  `false` 推进来, página面随之清空所选.  */
  selectMode: boolean;
  /** página面自己要Cerrar sesiónSeleccionarModo两处: 按所选Etiqueta显示Resultado,  y 艺人página切到En线名册.  */
  exitSelectMode(): void;
  /** 本地名册uno格Avatar(`card-art`  `avatarInner` ese回落链).  */
  personAvatar(item: IndexPerson, entityKind: string, big: boolean): PersonAvatar;
  /** En线创作者uno格Avatar: 主páginaAvatar优先, 归档兜底, 都取No到落回primero字母.  */
  authorAvatar(author: OnlineAuthor): string;
  tagLabel(tag: string): string;
  /** Abrir资料página.  */
  openEntity(entityKind: string, name: string): void;
  /** 回Directorio, 按esteuno或este几本地EtiquetaFiltrar.  */
  showTags(tags: string[], match: 'any' | 'all'): void;
  /** 去关注página, Soloveresteuno创作者或esteunoEn线EtiquetaActualizar.  */
  openFollowAuthor(key: string): void;
  openFollowTag(tag: string): void;
  /** 本机能改Configuración: 空态dentro给"添加contenido".  */
  configurable: boolean;
}

/** 地址栏en laTipopuede能es手敲或拼错: 认No出回到"Todo", No拿它去问posterior端. 
 *  SoloCon艺人 y Etiqueta两página分本地yEn线. 动画作者归艺人名册unoCategoría, 
 *  卖家名册en la `category=animation` 链continuar转到esedentro.  */
export function indexRoute(route: IndexRoute): IndexRoute {
  if (route.kind === 'creators' && route.category === 'animation') {
    return indexRoute({ ...route, kind: 'performers', scope: 'local' });
  }
  const scope = route.kind === 'tags' || route.kind === 'performers' ? route.scope : 'local';
  const categories = route.kind === 'tags' ? (scope === 'online' ? ONLINE_TAG_CATEGORIES : TAG_CATEGORIES)
    : route.kind === 'performers' && scope === 'local' ? IDENTITY_CATEGORIES : [];
  const known = categories.some(([key]) => key === route.category);
  return { ...route, scope, category: known ? route.category : 'all' };
}

/** unoEstadoabajo该读哪uno: 本地名册, 本地词表, En线创作者或En线Etiqueta.  */
export type IndexSource =
  | { what: 'people'; kind: Exclude<IndexKind, 'tags'>; q: string; category?: string }
  | { what: 'tags'; q: string; category: string }
  | { what: 'online-authors'; q: string }
  | { what: 'online-tags'; q: string; category: string };

export function indexSource(route: Pick<IndexRoute, 'kind' | 'q' | 'scope' | 'category'>): IndexSource {
  const { kind, q, scope, category } = route;
  if (kind === 'tags') return scope === 'online' ? { what: 'online-tags', q, category } : { what: 'tags', q, category };
  if (kind === 'performers' && scope === 'online') return { what: 'online-authors', q };
  return { what: 'people', kind, q, ...(category && category !== 'all' ? { category } : {}) };
}

export const indexKey = (kind: IndexKind, q: string, category = 'all') =>
  ['index', kind, q, ...(kind === 'tags' || category !== 'all' ? [category] : [])] as const;

export function indexUrl(kind: IndexKind, q: string, category: string, limit: number, offset: number): string {
  const params = new URLSearchParams({ kind, limit: String(limit), offset: String(offset) });
  if (q) params.set('q', q);
  if (category !== 'all') params.set('category', category);
  return `${INDEX_URL}?${params}`;
}

type AnyItem = IndexPerson | IndexTag | OnlineAuthor | OnlineTag;

export interface IndexQuery {
  queryKey: QueryKey;
  queryFn(context: { pageParam: number; signal?: AbortSignal }): Promise<IndexPage<AnyItem>>;
  initialPageParam: number;
  getNextPageParam(last: IndexPage<AnyItem>, pages: IndexPage<AnyItem>[]): number | undefined;
}

/** cuatroDatos共用uno副分Página: Siguientepágina offset 就esya经取到数.  */
export function indexQuery(source: IndexSource): IndexQuery {
  const limit = source.what === 'people' || source.what === 'online-authors' ? PAGE_SIZE.people : PAGE_SIZE.tags;
  const next = (last: IndexPage<AnyItem>, pages: IndexPage<AnyItem>[]) =>
    last.has_more ? pages.reduce((sum, page) => sum + page.items.length, 0) : undefined;
  const base = { initialPageParam: 0, getNextPageParam: next };
  switch (source.what) {
    case 'people':
      return { ...base, queryKey: indexKey(source.kind, source.q, source.category || 'all'),
        queryFn: ({ pageParam, signal }) => apiGet(indexUrl(source.kind, source.q, source.category || 'all', limit, pageParam), signal) };
    case 'tags':
      return { ...base, queryKey: indexKey('tags', source.q, source.category),
        queryFn: ({ pageParam, signal }) => apiGet(indexUrl('tags', source.q, source.category, limit, pageParam), signal) };
    case 'online-authors':
      return { ...base, queryKey: onlineAuthorsKey(source.q),
        queryFn: ({ pageParam, signal }) => fetchOnlineAuthors(source.q, limit, pageParam, signal) };
    case 'online-tags':
      return { ...base, queryKey: onlineTagsKey(source.q, source.category),
        queryFn: ({ pageParam, signal }) => fetchOnlineTags(source.q, source.category, limit, pageParam, signal) };
  }
}

/** primero屏: 遗Deja壳挂载anterior先取回No.unopágina. 每次进入都从No.unopáginaEmpezar: 缓存dentroAnterior次载入过几página, 
 *  `fetchInfiniteQuery` 就会ese几página挨pesado取uno遍再返回, primero屏etc.es几来回而Noesuno.  */
export async function prefetchIndex(props: IndexRoute, signal: AbortSignal) {
  const query = indexQuery(indexSource(indexRoute(props)));
  queryClient.removeQueries({ queryKey: query.queryKey, exact: true });
  await queryClient.fetchInfiniteQuery({
    queryKey: query.queryKey,
    queryFn: ({ pageParam }) => query.queryFn({ pageParam: pageParam as number, signal }),
    initialPageParam: 0,
    getNextPageParam: query.getNextPageParam,
  });
}

export const flatItems = <T>(data: InfiniteData<IndexPage<T>> | undefined): T[] =>
  data ? data.pages.flatMap((page) => page.items) : [];

/** 读数: 取到几, posterior面还Con就带uno加号.  */
export const countText = (count: number, more: boolean) => `${count.toLocaleString()}${more ? '+' : ''} 项`;

/** unoEtiquetaTipo色Clave(`../styles.css`  `[data-tag-cat]`). En线eseuno套取arriba游 tag_type, 
 *  加 `r34-` anterior缀y本地同名类分开: 本地 `artist` es橙色, En线es红色.  */
export const tagColorKey = (online: boolean, cat: string | undefined) =>
  online ? `r34-${cat || 'unknown'}` : cat || 'general';

/** 格子底abajoese读数. Agencia数es人: 它名abajo视频es成员拍, Solo报视频数会让它唯uno独Con
 *  读数消失. 数字uno律带单, 同uno排格子才读得出数es人还es片, 单独uno"0"也No像漏字.  */
export const personReadout = (kind: IndexKind, item: IndexPerson) =>
  kind === 'agencies' ? `${(item.members || 0).toLocaleString()} 人` : `${(item.n || 0).toLocaleString()}  video(s)`;

const COLLATOR = { numeric: true, sensitivity: 'base' } as const;

/** 字母表Agrupar: 按显示名primero字归到 A–Z, `#`(数字), `en proceso文` 或 `其他`, 组interior按名字排.  */
export function tagGroups<T extends { k: string }>(items: T[], label: (tag: string) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) => a.k.localeCompare(b.k, 'zh-CN', COLLATOR))) {
    const first = firstGrapheme(label(item.k).normalize('NFKC'), '').toUpperCase();
    const key = /[A-Z]/.test(first) ? first : /[0-9]/.test(first) ? '#' : /[㐀-鿿]/.test(first) ? 'Chino' : 'Otro';
    const group = groups.get(key);
    if (group) group.push(item); else groups.set(key, [item]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b, 'zh-CN'));
}
