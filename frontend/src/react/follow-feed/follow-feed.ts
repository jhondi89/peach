/* 关注página `/follow`(ADR-0031 No. 10g 步): Datos形状, 取数Claveyesteunopágina自己判定. 
 *
 * Completopáginauno岛, 自己拥Con取数: `/api/follow` y `/api/follow/credentials` 两趟都En TanStack Query
 * dentro. 地址栏esFiltrar唯uno真相源, 归壳写: 壳从 URL 读出 `view`(Estado, 媒体, 创作者, 来源, 题材, 
 * Etiqueta, Ordenar, Semilla)当 props 递进来, 岛改FiltrarSolo调 `actions.route(view)`, 壳写bien地址再经
 * `updateManagedRoute` 推回Nuevo `view`, 岛按NuevoClave取数. 
 *
 * 两粒Semilla分开: `view.seed` es服务端AleatorioOrdenareseuno粒, 写En地址dentro; `seed` esesteuno次进入取样Semilla, 
 * arriba面创作者, 题材, Etiquetatres排露出哪些由它定. pesadoNuevo进入(壳 `enterFollow`)y"换uno批"
 * 才换它, 从别página面回来沿用离开时eseuno粒, 岛pesado画从NopesadoNuevo洗牌. 
 *
 * Detalles(`/posts/:id`)es另uno座岛(`../follow-detail/`), 先扫aquí缓存几página找Entrada
 * (`findFollowItem`), 扫No到才单独取. 侧栏仍归壳画: 岛每取到uno版Lista就经 `actions.loaded`
 * 交回esteuno视Imagenpuede见EntradaEtiqueta计数, TodoBiblioteca口径来源yDuraciónConSin.  */
import { keepPreviousData, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { seededRank } from '@peach/legacy/core';

import { apiGet } from '../../api';
import { FOLLOW_CREDENTIALS_URL, type CheckResult } from '../follow-manage/follow-manage';
import { queryClient } from '../query';

/* ── 地址栏eseuno组 ── */

/** Estadoeseuno排. yavereseuno档No摆: ver过就归档, 要再翻出来es"Todo"事.  */
export const FOLLOW_FILTERS = [['', 'Todo'], ['new', 'Nover'], ['saved', 'Guardado'], ['ignored', 'Ignorado']] as const;
export type FollowStatus = (typeof FOLLOW_FILTERS)[number][0];

/** OrdenarClavey各自方向说法; "换uno批"按abajo去es `rand`, Sin自己Clave.  */
export const FOLLOW_FEED_SORTS = [['new', 'Fecha de actualización'], ['hot', 'Popularidad'], ['dur', 'Duración']] as const;
export const FOLLOW_FEED_DIR_WORDS: Record<string, readonly [string, string]> = {
  new: ['Más nuevos primero', 'Más antiguos primero'], hot: ['De mayor a menor', 'De menor a mayor'], dur: ['De más largo a más corto', 'De más corto a más largo'],
};
export const FOLLOW_RANDOM_SORT = 'rand';
export type FollowSort = (typeof FOLLOW_FEED_SORTS)[number][0] | typeof FOLLOW_RANDOM_SORT;
export type FollowMedia = 'videos' | 'images';

/** 地址栏en la关注páginaFiltrar. 创作者, 来源, 题材各按着uno(空串esNo筛), Etiquetaes交集.  */
export interface FollowView {
  status: FollowStatus;
  media: FollowMedia;
  author: string;
  provider: string;
  work: string;
  tags: readonly string[];
  /** Duración两端(秒), 同primeropágina `dur_min`/`dur_max`; 0 esesteuno端No限.  */
  durMin: number;
  durMax: number;
  sort: FollowSort;
  dir: 'asc' | 'desc';
  /** 服务端AleatorioOrdenarSemilla, SoloEn `sort` Como `rand` 时进Por favor求.  */
  seed: number;
}

/** 关注páginauno次取uno屏. `counts` esTodoBiblioteca口径, `groups` Soloesesteunopágina, 所以Lista底部要能ContinuarCargar. 
 *  unopágina 100 组: uno卡trescuatrodiez节点, uno次挂几cien就esprimero屏uno秒máslargoTarea.  */
export const FOLLOW_PAGE = 100;
/** ya经摆出este么más组以posterior, 滚到底No再自己continuarSiguientepágina, 要点"Cargar更más": uno直滚abajo去página面就uno直变pesado, 
 *  滚过头eseunoabajoNo该悄悄再挂几cien卡.  */
export const FOLLOW_AUTO_LOAD_LIMIT = 500;

/** esteunopáginaNo. `offset` 组起Por favor求地址, Parámetro拼法同壳dentro `followPageUrl`: Predeterminadoeseuno档No写进去.  */
export function followPageUrl(view: FollowView, offset: number): string {
  const csv = (values: readonly string[]) => encodeURIComponent(values.join(','));
  return `/api/follow?limit=${FOLLOW_PAGE}&offset=${offset}`
    + (view.status ? `&status=${view.status}` : '')
    + (view.author ? `&author=${csv([view.author])}` : '')
    + (view.provider ? `&provider=${csv([view.provider])}` : '')
    + (view.tags.length ? `&tag=${csv(view.tags)}` : '')
    + (view.work ? `&work=${csv([view.work])}` : '')
    + (view.durMin ? `&dur_min=${view.durMin}` : '')
    + (view.durMax ? `&dur_max=${view.durMax}` : '')
    + (view.sort !== 'new' ? `&sort=${view.sort}` : '')
    + (view.sort === FOLLOW_RANDOM_SORT ? `&seed=${view.seed}` : '')
    + (view.dir !== 'desc' ? `&dir=${view.dir}` : '');
}

/* ── Interfaz形状(`src/peach/web_follow.py`  `q_follow`) ── */

/** Entradadentro嵌着uno媒体: más附件帖每Imagen, 每段视频.  */
export interface FollowMediaItem {
  index: number;
  media_kind?: string;
  thumb_url?: string;
  width?: number;
  height?: number;
  face?: unknown;
  resource_group?: unknown;
}

/** uno抓回来Actualizar. Solo列esteunopágina读到字段, 其余Original样Deja给Detalles.  */
export interface FollowItem {
  id: number;
  title: string;
  status: string;
  provider: string;
  provider_label?: string;
  resource_provider?: string;
  source_id?: number;
  published_at?: string;
  duration?: number;
  thumb_url?: string;
  media_kind?: string;
  media_items?: FollowMediaItem[];
  width?: number;
  height?: number;
  face?: unknown;
  tags?: string[];
  tag_types?: Record<string, string>;
  playable?: boolean;
  [field: string]: unknown;
}

/** 服务端对uno组叠卡判定(`peach.follow_faces`): 去pesadoposterior媒体数, 合y几y翻卡Imagen.  */
export interface FollowStackInfo {
  media?: number;
  copies?: number;
  kind?: string;
  faces?: { thumb_url?: string; face?: unknown; media_kind?: string }[];
}

/** uno卡: 同unoObras主Entrada, 本站 alt y WIP, 跨站另见.  */
export interface FollowGroup {
  primary: FollowItem;
  variants: FollowItem[];
  duplicates: FollowItem[];
  has_wip?: boolean;
  /** 论坛Publicar帖: 组dentro每esuno回复, 正文es回复contenido而Noes线程Título.  */
  is_release?: boolean;
  stack?: FollowStackInfo | null;
}

/** uno关注来源.  */
export interface FollowSource {
  id: number;
  provider: string;
  provider_label?: string;
  author_key?: string;
  last_status?: string;
  can_backfill?: boolean;
  backfill_page?: number;
  [field: string]: unknown;
}

/** 题材eseuno排uno行: Clave, 给人ver写法, 组数, 挑No挑得出代表Imagen, eseImagen取景.  */
export type FollowWorkRow = readonly [key: string, label: string, n: number, icon?: number, focus?: unknown];

export interface FollowFacets {
  authors?: string[];
  providers?: string[];
  tags?: [string, number][];
  works?: FollowWorkRow[];
  /** BibliotecadentroConSinDuración读数: 侧栏据它出No出Duración拉.  */
  duration?: boolean;
}

/** 交给壳画侧栏eseuno: puede见EntradaEtiqueta计数, TodoBiblioteca口径来源(Clave, 显示名, 站标地址)yDuraciónConSin.  */
export interface FollowDrawer {
  tags: readonly (readonly [string, number])[];
  providers: readonly (readonly [key: string, label: string, icon: string])[];
  duration: boolean;
}

export interface FollowPage {
  groups: FollowGroup[];
  counts: Record<string, number>;
  sources: FollowSource[];
  author_aliases?: unknown[];
  facets: FollowFacets;
  /** 正bien按uno作者筛时, Solo数esteuno名abajoeseuno筛Opciones(资料páginaEn线视Imagen读它); 否则es空.  */
  author_facets?: FollowFacets;
  offset: number;
  limit?: number;
  has_more: boolean;
  [field: string]: unknown;
}

export interface FollowCredentials { providers?: { provider: string; present?: boolean }[] }

/* ── 取数Clave ── */

/** 离开关注página以posterior, ListaEn缓存dentroDejamás久. 回到关注página时照esteunoOriginal样画, ya经Cargar几página y 滚动Ubicación
 *  才continuar得arriba; Predeterminado 5 分钟太corto, 点开别处veruno部片子回来就没.  */
export const FOLLOW_FEED_GC_MS = 30 * 60_000;

/** ListaClave. 媒体Cambiares纯anterior端Agrupar, No进Clave: 换视ImagenNopesado取. `revision` es壳要求pesado读代次.  */
export function followFeedQuery(view: FollowView, revision: number) {
  const url = followPageUrl(view, 0);
  return {
    queryKey: ['follow-feed', url, revision] as QueryKey,
    queryFn: ({ pageParam, signal }: { pageParam: number; signal?: AbortSignal }) =>
      apiGet<FollowPage>(followPageUrl(view, pageParam), signal),
    initialPageParam: 0,
    /* 服务端先Completo批Agrupar再按组分página, 同unoObrasNo会跨página, Siguientepágina组直continuarcontinuarEnposterior面.  */
    getNextPageParam: (last: FollowPage) => (last.has_more ? (last.offset || 0) + FOLLOW_PAGE : undefined),
    placeholderData: keepPreviousData,
    gcTime: FOLLOW_FEED_GC_MS,
  };
}

export const FOLLOW_CREDENTIALS_KEY: QueryKey = ['follow-feed', 'credentials'];

/** Credenciales取No到时当作uno都Sin: 它Solo决定"需要Iniciar sesión会话"ese句Sugerencia出No出, No该拦住Completopágina.  */
export const fetchFollowCredentials = (signal?: AbortSignal) =>
  apiGet<FollowCredentials>(FOLLOW_CREDENTIALS_URL, signal).catch((): FollowCredentials => ({ providers: [] }));

/** primero屏: 两趟y行, 挂arriba就es最终样子. 同unoClave(同unoFiltrar, 同uno代次)缓存dentro还Con, 就es离开anterior
 *  ver着eseuno, Original样拿来Continuar viendo, 连同ya经Cargar几página; 要pesado读由壳推unoNuevo代次换Clave. Credenciales每次都pesado取: 
 *  它EnGestionarpáginaarriba改, 回到aquí就该esNuevo.  */
export async function prefetchFollowFeed(props: { view: FollowView; revision: number }, signal: AbortSignal) {
  const query = followFeedQuery(props.view, props.revision);
  queryClient.removeQueries({ queryKey: FOLLOW_CREDENTIALS_KEY, exact: true });
  const kept = queryClient.getQueryData(query.queryKey) !== undefined;
  await Promise.all([
    kept ? null : queryClient.fetchInfiniteQuery({
      queryKey: query.queryKey,
      queryFn: ({ pageParam }) => query.queryFn({ pageParam: pageParam as number, signal }),
      initialPageParam: 0,
      getNextPageParam: query.getNextPageParam,
      gcTime: FOLLOW_FEED_GC_MS,
    }),
    queryClient.fetchQuery({ queryKey: FOLLOW_CREDENTIALS_KEY, queryFn: () => fetchFollowCredentials(signal) }),
  ]);
}

/** 几página合成uno, 形状同壳dentro `followData`: 组continuarEnposterior面, 其余取最posteriorunopágina(来源随Por páginaActualizar).  */
export function mergedPage(data: InfiniteData<FollowPage> | undefined): FollowPage | null {
  if (!data?.pages.length) return null;
  const pages = data.pages;
  const last = pages[pages.length - 1]!;
  return { ...pages[0]!, ...last, groups: pages.flatMap((page) => page.groups || []) };
}

/* ── 取样 ── */

/** 按Semilla打散, 同秩再按Clave名排, ResultadoSolo随Semilla变. 秩取壳eseuno `seededRank`, 同uno粒Semilla两边取到同uno批.  */
export function randomOrder<T>(rows: readonly T[], key: (row: T) => string, seed: number): T[] {
  return [...rows].sort((a, b) =>
    seededRank(seed, key(a)) - seededRank(seed, key(b)) || String(key(a)).localeCompare(String(key(b))));
}

/** 题材eseuno排露出几, 同primeropáginaese排Sello(壳 `ROW_FIRST`).  */
export const FOLLOW_WORKS_FIRST = 24;
/** Etiqueta露出几.  */
export const FOLLOW_TAGS_FIRST = 20;

/* ── 媒体判定 ── */

/** uno组en laTodoEntrada, 主EntradaEnanterior, 按 id 去pesado.  */
export function collectionItems(group: FollowGroup): FollowItem[] {
  const seen = new Set<number>();
  return [group.primary, ...group.variants, ...group.duplicates].filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/** Lista缓存en launo: Entrada本身, 所En组yeseuno版来源 y 别名.  */
export interface FollowItemHit {
  item: FollowItem;
  group: FollowGroup;
  sources: FollowSource[];
  aliases: unknown[];
}

/** Eneste座岛ya缓存每uno版Listadentro找uno(Detalles先扫aquí). 来源y别名取eseuno版最posteriorunopágina, 同 `mergedPage`. 
 *  Nuevo取eseuno版先找: Anterior代次Lista还DejaEn缓存dentro, 同unoEnesedentroesEtiqueta, Guardar之anterior样子.  */
export function findFollowItem(id: number): FollowItemHit | null {
  const versions = queryClient.getQueryCache().findAll({ queryKey: ['follow-feed'] })
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt);
  for (const version of versions) {
    const data = version.state.data as InfiniteData<FollowPage> | undefined;
    if (!Array.isArray(data?.pages) || !data.pages.length) continue;
    const last = data.pages[data.pages.length - 1]!;
    for (const page of data.pages) {
      for (const group of page.groups || []) {
        const item = collectionItems(group).find((member) => member.id === id);
        if (item) return { item, group, sources: last.sources || [], aliases: last.author_aliases || [] };
      }
    }
  }
  return null;
}

/** 每uno版Lista缓存en la同uno换成 `next`(Detalles隐藏或RestaurarunoImagen之posterior, 服务端投影给出Nuevo媒体清单).  */
export function replaceFollowItem(next: FollowItem): void {
  queryClient.setQueriesData<InfiniteData<FollowPage>>({
    queryKey: ['follow-feed'], predicate: (query) => Array.isArray((query.state.data as InfiniteData<FollowPage>)?.pages),
  }, (data) => data && {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      groups: (page.groups || []).map((group) => {
        const swap = (item: FollowItem) => (item.id === next.id ? next : item);
        if (!collectionItems(group).some((item) => item.id === next.id)) return group;
        return { ...group, primary: swap(group.primary), variants: group.variants.map(swap), duplicates: group.duplicates.map(swap) };
      }),
    })),
  });
}

/** 每uno版Lista缓存en la同uno换Estado, 挪计数(Detallesen laGuardaryEtiqueta). No移出Completo组: DetallesNo知道每uno版筛着哪uno档.  */
export function setFollowItemStatus(id: number, to: string): void {
  queryClient.setQueriesData<InfiniteData<FollowPage>>({
    queryKey: ['follow-feed'], predicate: (query) => Array.isArray((query.state.data as InfiniteData<FollowPage>)?.pages),
  }, (data) => data && withStatus(data, null, id, to));
}

/** 同arriba, 按PublicarTiempo从Nuevo到antiguo.  */
export function collectionItemsNewest(group: FollowGroup): FollowItem[] {
  return collectionItems(group).sort((a, b) => {
    const byTime = (Date.parse(b.published_at || '') || 0) - (Date.parse(a.published_at || '') || 0);
    return byTime || (+b.id || 0) - (+a.id || 0);
  });
}

/* 关注Entrada y 资料páginaObrasNoes同uno DTO, pero媒体Cambiar语义相同: uno卡Solo要含对应媒体就进入对应
   视Imagen. external SoloDescripciónConexterior部Archivopágina, No能冒充视频; SinpuedeVerificar媒体Tipoantiguo行No进任uno视Imagen.  */
export function itemMediaKinds(item: FollowItem): Set<string> {
  const kinds = new Set<string>();
  const embedded = item.media_items || [];
  if (embedded.length) {
    embedded.forEach((media) => {
      if (media.media_kind === 'image' || media.media_kind === 'video') kinds.add(media.media_kind);
    });
  } else if (item.media_kind === 'image' || item.media_kind === 'video') kinds.add(item.media_kind);
  return kinds;
}

export function groupMediaKinds(group: FollowGroup): Set<string> {
  const kinds = new Set<string>();
  collectionItems(group).forEach((item) => itemMediaKinds(item).forEach((kind) => kinds.add(kind)));
  return kinds;
}

/** 卡面摆哪uno: 组dentro最Nuevo, 含当anterior视Imagenese媒体ese, 都Sin就es主Entrada.  */
export function itemForMedia(group: FollowGroup, view: FollowMedia): FollowItem {
  const wanted = view === 'images' ? 'image' : 'video';
  return collectionItemsNewest(group).find((item) => itemMediaKinds(item).has(wanted)) || group.primary;
}

/** 资料páginaEn线视Imagen取数用eseuno: Solo按创作者筛, EstadoTodo, 按ActualizarTiempo从Nuevo到antiguo.  */
export function entityFollowView(author: string): FollowView {
  return { status: '', media: 'videos', author, provider: '', work: '', tags: [], durMin: 0, durMax: 0,
    sort: 'new', dir: 'desc', seed: 0 };
}

/* F95 "8 动态"puede能SoloConuno网盘página, 也puede能uno实际视频都Sin. Mix esReproducir语义, Solo能由ya解析, 
   puedeEn Peach interiorReproducir视频触发, No能拿回复数或exterior链数冒充.  */
export function videoItems(group: FollowGroup): FollowItem[] {
  return collectionItemsNewest(group).filter((item) => item.playable && item.media_kind === 'video');
}

/* ── 叠卡 ──
   哪几es同unoImagen由服务端判(`peach.follow_faces`, Archivocontenido哈希, 缩略Imagen dHash, 8×8 色加Duración): 
   每成员 y 媒体带 `face`, 编号相同就es同unoImagen; 组en la `stack` 给出去pesadoposterior媒体数 `media`, 合y
   几 `copies`, 媒体Tipo `kind`  y 彼此No同翻卡Imagen `faces`. aquíSolo决定怎么说, 翻哪几. 

   角标Solo报uno数: este卡合y几No同媒体. 同uno视频En两站各传unoesuno媒体, 两来源; 
   去pesadoposteriorSolo剩uno媒体时, 报就es来源数. 量词随媒体Tipo走: 视频论"", Imagen片论"", yDetallesdentro
   "No. 1 , 共 11 "同uno套; Imagen y 视频混Enuno起时说"媒体", No说"项"—"项"En关注página数es
   ActualizarEntrada, 读起来像又En数帖子.  */
const UNITS: Record<string, string> = { video: ' video(s)', image: ' imagen(es)', mixed: ' medio(s)' };

export interface FollowStack {
  isMix: boolean;
  label: string;
  glyph: 'pics' | 'play';
  faces: string[];
}

export function followStack({ cover = '', coverFace = null, stack = null, imageView = false, limit = 9 }: {
  cover?: string; coverFace?: unknown; stack?: FollowStackInfo | null; imageView?: boolean; limit?: number;
} = {}): FollowStack {
  const media = stack?.media || 0;
  const copies = stack?.copies || 0;
  const kind = stack?.kind || '';
  const label = media > 1 ? `${media} ${UNITS[kind] || UNITS.mixed}`
    : copies > 1 ? `${copies}  fuente(s)` : '';
  /* 字形说es点开以posteriorver什么: 视频起播es play, Imagen片es pics. Imagen y 视频混Enuno起时, 点开落En哪uno由
     视Imagen决定, 字形跟着视Imagen走.  */
  const glyph = kind === 'image' || (kind !== 'video' && imageView) ? 'pics' : 'play';
  /* Imagen片视ImagendentroSolo翻Imagen片: esteuno叠说就eseste几Imagen. No.unoes静止Portada本身, 否则uno翻就露出取景差别; 
      y Portada同unoImagenNo再翻. Imagen彼此相同服务端ya经y成uno.  */
  const seen = new Set<unknown>([coverFace ?? cover]);
  const faces = cover ? [cover] : [];
  for (const face of stack?.faces || []) {
    if (imageView && face.media_kind !== 'image') continue;
    if (!face.thumb_url || face.thumb_url === cover || seen.has(face.face)) continue;
    seen.add(face.face);
    faces.push(face.thumb_url);
  }
  return { isMix: Boolean(label), label, glyph, faces: faces.length > 1 ? faces.slice(0, limit) : [] };
}

/* ── 往回抓 ──
   往回抓到哪儿. No说话, 用户点uno次Solover到Lista变largouno点, No知道自己走到No.几página, 也No知道还要点
   几次. página码es 0 起游标(0 = Solo抓过No.unopágina), 显示成人读No.几página.  */
export function backfillState(sources: readonly FollowSource[]): string {
  const pages = sources.filter((source) => source.can_backfill).map((source) => (source.backfill_page || 0) + 1);
  if (!pages.length) return '';
  const deepest = Math.max(...pages);
  const shallowest = Math.min(...pages);
  if (deepest <= 1) return '每 fuente(s)都Solo抓No. 1 página';
  return shallowest === deepest ? `每 fuente(s)都抓到No. ${deepest} página` : `Ya抓到No. ${shallowest}–${deepest} página`;
}

/* ── OrdenarClave ── */

/** 点no选en proceso项换列y用该列Predeterminado方向, 点选en proceso项翻方向; 同壳dentro `nextSortState` 配arribaesteunopágina词表.  */
export function nextSort(key: string, current: string, dir: 'asc' | 'desc') {
  if (key !== current) return { sort: key as FollowSort, dir: 'desc' as const };
  if (!FOLLOW_FEED_DIR_WORDS[key]) return null;
  return { sort: key as FollowSort, dir: dir === 'asc' ? 'desc' as const : 'asc' as const };
}

/** Sin障碍名称播报点abajo去会得到什么, Noes当anteriorEstado.  */
export function sortAriaLabel(key: string, label: string, current: string, dir: 'asc' | 'desc'): string {
  const next = nextSort(key, current, dir);
  if (!next) return '';
  const words = FOLLOW_FEED_DIR_WORDS[next.sort];
  return `按${label}${words ? words[next.dir === 'asc' ? 1 : 0] : ''}Ordenar`;
}

/* ── 壳递进来ese几样 ── */

/** 署名: 名字, 圆框dentroese段Avatar HTML, "署名含"eseuno行.  */
export interface FollowIdentity { author: string; avatar: string; credited: string; entityName: string }

/** esteunopáginaarribaabajo文: 卡片y两排身, Avatar读都esesteuno版来源, 别名yCredenciales, No读壳Todo局.  */
export interface FollowContext {
  sources: readonly FollowSource[];
  aliases: readonly unknown[];
  credentials: ReadonlySet<string>;
}

/** 仍由遗Deja层给 HTML ycontinuar线: Detalles用es同uno, SoloConuno处实现. 署名, Avatar, 来源Imagen标yTítuloanteriorposterior
 *  ese几处字样En岛dentro(`follow-marks.ts`).  */
export interface FollowFeedHelpers {
  /** 题材圆标dentroese段(Con代表Imagen出 `<img>`, Sin写两字母); 取景y放grande走资料páginaese两函数.  */
  workMark(row: FollowWorkRow): string;
  /** Etiqueta界面名称, 关注Detalles(舞)读它; Listapáginay卡片从 `@peach/legacy/tags` 直continuar import 同uno函数.  */
  tagLabel(tag: string): string;
  /** 横滚行continuararriba拖动y滚轮(`wireDrag`); Solocontinuar滚轮y两端渐隐(`wireHorizontalScroller`).  */
  wireDrag(row: Element | null): void;
  wireScroller(row: Element | null): void;
  /** 进páginaCompleto骨架(`followSkeletonHtml`)之exterior, 换Filtrar时Lista区eseuno骨架.  */
  listSkeletonHtml(media: FollowMedia): string;
  /** VerificarActualizary往回抓eseuno趟posteriorTareaProgreso(`peach-ui`  `followJobProgress`), 作业 id 记En
   *  `sessionStorage`  `peach-follow-job`, Actualizar或换página回来还continuar得arriba.  */
  jobProgress(options: FollowJobProgressOptions): void;
}

export interface FollowJobState { status?: string; job_id?: string; error?: string; results?: CheckResult[]; [field: string]: unknown }

export interface FollowJobProgressOptions {
  host: HTMLElement;
  active(): boolean;
  read(signal: AbortSignal): Promise<FollowJobState>;
  busy(running: boolean): void;
  complete(state: FollowJobState): void;
}

export interface FollowFeedActions {
  /** 换Filtrar或Ordenar: 壳它写进地址栏, 再推回Nuevo `view`.  */
  route(view: FollowView): void;
  /** 换uno批: 壳掷uno粒NuevoSemilla, 两排取样yLista次序都换.  */
  shuffle(): void;
  /** 岛取到uno版Lista(primero屏, 续página, 写操作之posterior): 侧栏要Etiqueta计数, 来源yDuraciónConSin, 壳拿去画侧栏.  */
  loaded(drawer: FollowDrawer): void;
  openDetail(id: number): void;
  openAuthor(name: string): void;
  openManage(): void;
  /** más选en launo: `range` es Shift 连选.  */
  toggleSelection(id: number, range: boolean): void;
  /** 照片Muro"仅显示Imagen片"yImagen片Diseño两样偏bien, 壳存起来再推回.  */
  setImagesOnly(on: boolean): void;
  setPhotoLayout(layout: FollowPhotoLayout): void;
  /** 此刻能No能Pasar el ratón翻卡(más选, 遮挡, 减menos动效, 滚动en proceso都回 false).  */
  canFlip(): boolean;
  /** 操作回执; 给 `undo` 就带unoDeshacerClave. Fallo走 `failure`.  */
  toast(message: string, options?: { undo?: () => Promise<void> }): void;
  failure(action: string, error: unknown): void;
  /** VerificarActualizarResultado(`followCheckToast`): Agregar, SinActualizaryFallo各说清.  */
  checkReport(report: unknown): void;
}

/** Estado写Interfaz回eseuno: 换es哪uno, 换成什么.  */
export interface FollowStatusWrite { item: number; to: string }

/** 写完之posteriorEn缓存dentro换局部: EntradaEstado, Estado计数, 筛着某uno档而NuevoEstadoNoEnesteuno档时Completo组移出. 
 *  `view` Como空时Solo换Estadoy计数, No移出(Detallesen la写操作).  */
export function withStatus(data: InfiniteData<FollowPage>, view: FollowView | null, id: number, to: string):
InfiniteData<FollowPage> {
  let before = '';
  const pages = data.pages.map((page) => ({
    ...page,
    groups: (page.groups || []).flatMap((group) => {
      let hit = false;
      const swap = (item: FollowItem) => {
        if (item.id !== id) return item;
        hit = true;
        before = before || item.status;
        return { ...item, status: to };
      };
      const next = { ...group, primary: swap(group.primary), variants: group.variants.map(swap), duplicates: group.duplicates.map(swap) };
      if (hit && view?.status && next.primary.id === id && to !== view.status) return [];
      return [next];
    }),
  }));
  if (!before || before === to) return { ...data, pages };
  return {
    ...data,
    pages: pages.map((page) => {
      const counts = { ...page.counts };
      if (counts[before] !== undefined) counts[before] = Math.max(0, (counts[before] || 0) - 1);
      counts[to] = (counts[to] || 0) + 1;
      return { ...page, counts };
    }),
  };
}

export type FollowPhotoSize = 'big' | 'small';
export type FollowPhotoLayout = 'fixed' | 'masonry';

export interface FollowFeedProps {
  view: FollowView;
  /** esteuno次进入取样Semilla.  */
  seed: number;
  /** 壳要求pesado读代次(批量Etiqueta之posterior, 从别处写完回来), 加uno就pesado取, Nopesado挂.  */
  revision: number;
  selectMode: boolean;
  selected: ReadonlySet<number>;
  photoSize: FollowPhotoSize;
  photoLayout: FollowPhotoLayout;
  imagesOnly: boolean;
  helpers: FollowFeedHelpers;
  actions: FollowFeedActions;
}

/** 当anterior按abajoFiltrarCondición, cuatro维度收成uno清单, 顺序照Filtrar从粗到细: 创作者, 来源, 题材, Etiqueta.  */
export interface FollowCondition { kind: 'Creador' | 'Fuente' | 'Género/Temática' | 'Etiqueta'; key: string; label: string }

export function followConditions(view: FollowView, names: {
  authors: ReadonlyMap<string, string>; providers: ReadonlyMap<string, string>; works: ReadonlyMap<string, string>;
}): FollowCondition[] {
  const rows: FollowCondition[] = [];
  if (view.author) rows.push({ kind: 'Creador', key: view.author, label: names.authors.get(view.author) || view.author });
  if (view.provider) rows.push({ kind: 'Fuente', key: view.provider, label: names.providers.get(view.provider) || view.provider });
  if (view.work) rows.push({ kind: 'Género/Temática', key: view.work, label: names.works.get(view.work) || view.work });
  view.tags.forEach((tag) => rows.push({ kind: 'Etiqueta', key: tag, label: tag }));
  return rows;
}

/** 撤掉uno: 按维度撤, 同uno字符串En两维度dentro都puede能出现.  */
export function dropCondition(view: FollowView, row: FollowCondition): FollowView {
  if (row.kind === 'Creador') return { ...view, author: '' };
  if (row.kind === 'Fuente') return { ...view, provider: '' };
  if (row.kind === 'Género/Temática') return { ...view, work: '' };
  return { ...view, tags: view.tags.filter((tag) => tag !== row.key) };
}

/** EtiquetaEnesteunopáginaTipo: 取No.uno记Tipo组, Sin就按 general 着色.  */
export function groupTagType(groups: readonly FollowGroup[], tag: string): string {
  for (const group of groups) {
    const type = group.primary?.tag_types?.[tag];
    if (type) return type;
  }
  return 'general';
}
