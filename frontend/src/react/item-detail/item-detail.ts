/* ObrasDetalles `/assets/:id` ycuatroCola(Mix, 分卷, Versión, ReproducirLista)Datosy判定(ADR-0031). 
 *
 * esteunoes舞岛(`../stage/`)树en la子组件, 舞本身, 进出场, pequeño窗y Video.js 归舞岛, 
 * 关注Detalles也En用同uno套. Entrada归aquí: `/api/items` 卡片Sin `entity_refs`, Etiqueta也Soloes
 * 字符串, 拿来当DetallesSolo会让身区yEtiqueta区先画uno版再跳, 所以uno律单取 `GET /api/item?id=`. 
 *
 * Cola也归岛, 按 `{kind, seedId|playlistId}` 取, Clavedentro带arriba它们: 同unoColadentro换uno走缓存, 
 * 从exterior面pesadoNuevo进来(`fresh`)才pesado取—壳Solo记着此刻开es哪unoCola, 用来判esteunoabajo.  */
import type { QueryKey } from '@tanstack/react-query';
import { esc, foldName } from '@peach/legacy/core';
import { mixLabel, type FaceRef } from '@peach/card-art';

import { apiGet } from '../../api';
import type { MediaCardActions, MediaCardHelpers, MediaCardLayout, MediaItem } from '../catalog-grid/types';
import { queryClient } from '../query';

/* ── Interfaz形状(`src/peach/web_catalog.py`  `q_item`) ── */

/** DetallesdentrounoEtiqueta: `cat` esCategoría, `official` es来源站点给.  */
export interface DetailTag { k: string; cat?: string; official?: boolean }

/** 身区en launo实体. 扁平字段兜底来eseuno格Sin `id`, Solo画, No能点.  */
export interface DetailEntityRef extends FaceRef {
  id: number | null;
  name: string;
  has_logo?: boolean;
  /** 标识ArchivocontenidoVersión, 拼进 `/logo` 地址 `&v=`.  */
  logo_version?: string;
  /** Selloes某家片商旗abajo label 时(ADR-0049), 从近到远arriba级片商链.  */
  makers?: DetailEntityRef[];
}

/** 卡片Entradadentro声明过ese些字段. `MediaItem` 带着 `[field: string]: unknown`, 直continuar `Omit` 会
 *  声明过Claveuno起抹掉(`keyof` 成 `string`), 先摘掉索引Firma再挑.  */
type CardFields = { [K in keyof MediaItem as string extends K ? never : K]: MediaItem[K] };

/** `/api/item` uno. Solo列Detalles读到字段, 其余Original样带着, 壳缓存要esCompleto.  */
export interface DetailItem extends Omit<CardFields, 'tags'> {
  [field: string]: unknown;
  error?: string;
  title?: string;
  width?: number | null;
  height?: number | null;
  release_date?: string | null;
  region?: string | null;
  region_label?: string | null;
  region_settled?: boolean;
  rating?: number | null;
  liked?: boolean | number;
  like_reason?: string;
  o_count?: number;
  better_version?: boolean | number;
  better_version_reason?: string;
  has_studio_logo?: boolean;
  studio_logo_version?: string;
  poster_box?: { x0: number; y0: number; x1: number; y1: number; px: number[] } | null;
  part_label?: string;
  tags?: DetailTag[];
  entity_refs?: Partial<Record<'performer' | 'studio' | 'creator' | 'series', DetailEntityRef[]>>;
  sample_images?: { n: number }[];
}

/** Colaen launo: 卡片eseuno, exterior加版次y卷标.  */
export interface QueueItem extends MediaItem { edition_label?: string; part_label?: string; version_id?: number }

export type QueueKind = 'mix' | 'parts' | 'editions' | 'playlist';

/** 壳递进来Cola引用. `fresh` Como真表示esteunoabajoes从exterior面进esteCola, 要pesado取; 同unoColadentro
 *  换uno时Como假, 读缓存. ReproducirLista每次都pesado取: 它顺序 y contenido别处也En改.  */
export interface QueueRef { kind: QueueKind; seedId?: number; playlistId?: number; fresh?: boolean; autoplay?: boolean }

export interface DetailQueue {
  kind: QueueKind;
  seedId?: number;
  playlistId?: number;
  title: string;
  items: QueueItem[];
  /** ReproducirLista记abajo续播Ubicación.  */
  currentAssetId?: number | null;
  versionCount?: number;
}

/** `/api/playlist` 写操作都回CompletoLista(`web_playlists.w_playlist`).  */
export interface PlaylistPayload {
  id: number;
  name: string;
  items: QueueItem[];
  current_asset_id: number | null;
}

/* ── 取数 ── */

export const itemKey = (id: number): QueryKey => ['item', id];
export const queueKey = (ref: QueueRef): QueryKey => ['item-queue', ref.kind, ref.kind === 'playlist' ? ref.playlistId : ref.seedId];
export const relatedKey = (id: number, limit: number): QueryKey => ['item-related', id, limit];

export const ITEM_URL = (id: number) => `/api/item?id=${id}`;
export const RELATED_URL = (id: number, limit: number) => `/api/related?id=${id}&limit=${limit}`;
export const PLAYLIST_URL = '/api/playlist';
export const FEEDBACK_URL = '/api/feedback';
export const ITEM_TAG_URL = '/api/item-tag';
export const WATCH_LATER_URL = '/api/watch-later';
export const QUALITY_GOAL_URL = '/api/quality-goal';
export const PREFERENCE_URL = '/api/preference';

/** EntradayaNoEnDatosBibliotecadentro: 服务端回 `{error}`, Noesuno次FalloPor favor求.  */
export class ItemGone extends Error {}

export async function fetchItem(id: number, signal?: AbortSignal): Promise<DetailItem> {
  const item = await apiGet<DetailItem>(ITEM_URL(id), signal);
  if (item.error) throw new ItemGone(item.error);
  return item;
}

interface GroupPayload { error?: string; title?: string; items?: QueueItem[]; count?: number }

/** unoColaTodoEntrada. Mix esSemilla加arriba它相关Obras(相关eseuno每SemillaSolo取uno次,  y Directoriodentro
 *  Mix 卡Pasar el ratón翻página共用); 分卷yVersiónes同unoCódigo JAVabajo几puede播Entrada; ReproducirLista按它自己顺序.  */
export async function fetchQueue(ref: QueueRef, helpers: Pick<ItemDetailHelpers, 'mixRelated' | 'tagLabel'>, signal?: AbortSignal): Promise<DetailQueue> {
  if (ref.kind === 'mix') {
    const seedId = ref.seedId!;
    const [seed, related] = await Promise.all([fetchItem(seedId, signal), helpers.mixRelated(seedId)]);
    queryClient.setQueryData(itemKey(seed.id), seed);
    return {
      kind: 'mix', seedId, title: `Mix · ${mixLabel(seed as unknown as QueueItem, helpers.tagLabel)}`,
      items: [seed as unknown as QueueItem, ...related.filter((item) => item.id !== seed.id)],
    };
  }
  if (ref.kind === 'playlist') {
    const playlist = await apiGet<PlaylistPayload>(`${PLAYLIST_URL}?id=${ref.playlistId}`, signal);
    return playlistQueue(playlist);
  }
  const group = await apiGet<GroupPayload>(`/api/${ref.kind}?id=${ref.seedId}`, signal);
  if (group.error || !group.items?.length) throw new Error(group.error || 'esteunoGrupoYaNo存En');
  return {
    kind: ref.kind, seedId: ref.seedId!, title: `${ref.kind === 'parts' ? 'Volumen' : 'Versión'} · ${group.title || ''}`,
    items: group.items,
    versionCount: ref.kind === 'editions' ? group.count : undefined,
  };
}

export const playlistQueue = (playlist: PlaylistPayload): DetailQueue => ({
  kind: 'playlist', playlistId: playlist.id, title: playlist.name, items: playlist.items || [],
  currentAssetId: playlist.current_asset_id,
});

/** ReproducirListadentro标"ya消失"Entrada: ArchivoNoEn盘arriba, 列出来, 标出来, peroNoAbrir去Reproducir(ADR-0087).  */
export const isVanished = (item: QueueItem) => item.disposal === 'vanished';

/** Coladentro停En哪uno. Mix 就es点eseuno; 分卷yVersión点eseunoNoEn组dentro(profundo链写错, 组变)
 *  就退到No.uno; ReproducirLista退到它记abajo续播Ubicación, ya消失EntradaNo停, 退到No.uno能播. 
 *  uno都停Noes null.  */
export function chooseItem(queue: DetailQueue, requested: number | null): number | null {
  if (queue.kind === 'mix') return requested;
  const items = queue.kind === 'playlist' ? queue.items.filter((item) => !isVanished(item)) : queue.items;
  if (!items.length) return null;
  if (requested != null && items.some((item) => item.id === requested)) return requested;
  if (queue.kind === 'playlist' && items.some((item) => item.id === queue.currentAssetId)) return queue.currentAssetId!;
  return items[0]!.id;
}

/** 卷标SoloCon分卷Cola知道: `/api/item` es单口径, 它答No出"esteesNo.几卷". No补话Título栏en la
 *  卷号Enprofundo链进来 y 点开Cola另uno时都No出现.  */
export function withPartLabel(item: DetailItem, queue: DetailQueue | null): DetailItem {
  if (queue?.kind !== 'parts' && queue?.kind !== 'editions') return item;
  const part_label = queue.items.find((part) => part.id === item.id)?.part_label || '';
  return item.part_label === part_label ? item : { ...item, part_label };
}

/** 播完uno卷Solocontinuar同unoVersiónSiguiente卷; 选另unoVersión由用户发起.  */
export function nextPart(queue: DetailQueue | null, id: number): QueueItem | null {
  if (!queue || (queue.kind !== 'parts' && queue.kind !== 'editions')) return null;
  const index = queue.items.findIndex((row) => row.id === id);
  const current = queue.items[index];
  const next = queue.items[index + 1];
  if (!current?.part_label || !next?.part_label) return null;
  return queue.kind === 'parts' || (current.version_id != null && current.version_id === next.version_id) ? next : null;
}

/** primero屏: 先定Cola(esteunoabajo要No要pesado取由壳说), 再定停En哪uno, 最posterior取eseuno. 要转走几情形
 *  (En线Obras转关注Detalles, Cola取No到退回普通Detalles, ReproducirLista空回Listapágina, EntradayaNoEn)交给壳, 
 *  壳uno换舞, esteuno次挂载就作废, No会画出来.  */
export async function prefetchItemDetail(props: ItemDetailProps, signal: AbortSignal): Promise<void> {
  const { queue: ref, actions } = props;
  let queue: DetailQueue | null = null;
  let seeded = false;
  if (ref) {
    const key = queueKey(ref);
    try {
      const cached = ref.fresh ? undefined : queryClient.getQueryData<DetailQueue>(key);
      seeded = !cached && ref.kind === 'mix';
      queue = cached || await queryClient.fetchQuery({ queryKey: key, queryFn: () => fetchQueue(ref, props.helpers, signal), staleTime: 0 });
    } catch (error) {
      if (signal.aborted) throw error;
      if (props.id != null) actions.redirect({ kind: 'item', id: props.id });
      else actions.redirect({ kind: 'gone' });
      return;
    }
  }
  const id = queue ? chooseItem(queue, props.id) : props.id;
  if (id == null) {
    actions.redirect(queue?.kind === 'playlist' ? { kind: 'playlists' } : { kind: 'gone' });
    return;
  }
  let item: DetailItem;
  /* pesado开同uno也pesado取: 缓存dentroeseesAnterior次Abrir时, este期间Portada, Puntuación, Etiqueta都puede能En别处改过, 
     而挂载Nopesado取(`query.ts`). SoloCon Mix SemillaNopesado取, 取Colaeseuno步刚它写进缓存.  */
  const cachedItem = seeded && id === queue?.seedId ? queryClient.getQueryData<DetailItem>(itemKey(id)) : undefined;
  try {
    item = cachedItem
      || await queryClient.fetchQuery({ queryKey: itemKey(id), queryFn: () => fetchItem(id, signal), staleTime: 0 });
  } catch (error) {
    if (signal.aborted) throw error;
    if (error instanceof ItemGone) { actions.redirect({ kind: 'gone' }); return }
    throw error;
  }
  if (!signal.aborted && item.location === 'online' && item.follow_item_id) actions.redirect({ kind: 'follow', id: Number(item.follow_item_id) });
}

/* ── 壳递进来ese几样 ── */

/** EtiquetaSeleccionarDispositivouno候选: 馆藏dentro带esteEtiquetaObras数.  */
export interface TagCount { k: string; n?: number }

/** Detallesdentro仍由遗Deja层拼几段 HTML y读数. 都esTodo站语义契约唯uno实现, aquíNo另写uno. 
 *  身格yCola行Imagen, Avatar y 署名直continuar取 `@peach/card-art`.  */
export interface ItemDetailHelpers {
  /** 来源角标(遗Deja层 `srcBadge`); `cls` es `srcbig` este类尺寸档.  */
  badgeHtml(location: string, cost: string, cls?: string): string;
  /** Código JAV + 版次徽章 + 片名(遗Deja层 `javTitleHtml`).  */
  titleHtml(item: DetailItem): string;
  /** 同unoTítulo纯文本(遗Deja层 `javDisplayName`).  */
  displayName(item: QueueItem): string;
  /** "Portada predeterminada JAV"Configuración, 每次现读: Colauno行pequeñoImagen按它取封套或Vista previaImagen.  */
  javImage(): string;
  tagLabel(tag: string): string;
  /** Duración分档ese几Etiqueta: 由Duración推出来, NoEnDetallesdentro列.  */
  isDurationTag(tag: string): boolean;
  /** EtiquetaSeleccionarDispositivoen laTodo候选(DirectorioEtiqueta读数).  */
  tagCandidates(): TagCount[];
  /** 来源此刻esNoes没挂载.  */
  sourceOffline(location: string): boolean;
  offlineReason(location: string): string;
  /** "Continuar viendo"eseuno排骨架(遗Deja层 `pageSkeletonHtml`),  y 壳dentro别处es同uno.  */
  relatedSkeletonHtml(): string;
  /** Mix 相关Obras, 每SemillaSolo取uno次,  y Directoriodentro Mix 卡Pasar el ratón翻página共用.  */
  mixRelated(seedId: number): Promise<QueueItem[]>;
  /** 横排continuararriba拖动滚动(遗Deja层 `wireDrag`).  */
  wireDrag(el: HTMLElement): void;
  /** ReproducirListaeseuno列拖着Ordenar(遗Deja层 `wireDragReorder`): 拖动en proceso行由它挂 `dragging`, 
   *  `drop-before`/`drop-after`, 落abajo时回调NuevoUbicación.  */
  wireDragReorder(root: HTMLElement, options: {
    selector: string; attribute: string; onMove(from: string, target: string, after: boolean): Promise<void> | void;
  }): void;
}

/** 壳要转走几情形.  */
export type ItemDetailRedirect =
  | { kind: 'follow'; id: number }
  | { kind: 'item'; id: number }
  | { kind: 'playlists' }
  | { kind: 'gone' };

export interface ItemDetailActions {
  /** CerrarDetalles回到来处(壳 `closeItemDetail`: 退场动画, 拆舞, 推回Lista地址yFiltrar).  */
  close(): void;
  /** esteuno画出来: 壳据此Actualizarpequeño窗Metadatos, 顶栏实体arribaabajo文, 氛围光y剧场Modo, Cola地址
   *  也Eneste时推(停En哪uno要etc.岛定abajo来).  */
  present(item: DetailItem, queue: DetailQueue | null): void;
  redirect(to: ItemDetailRedirect): void;
  /** Coladentro点另uno: 舞en laReproducirDispositivo要先拆, 地址要换, 经壳pesado挂. `push` Como假时No推地址.  */
  openQueueItem(queue: QueueRef, id: number, push?: boolean): void;
  /** 媒体框交给舞挂ReproducirDispositivo: `<video>` 由舞建En框dentro, 交给 Video.js, No进este棵 React 树—
   *  从pequeño窗展开回来时同uno实例要Completo搬进este框. 返回LimpiarEneste媒体区卸abajo时调. Firmay关注
   *  Detalles同uno: ObrasDetallesSin"No.几媒体", `media` 传 null; `autoplay` No给就按Configuración, 计费
   *  拦截点开eseunoabajo给 true.  */
  mountPlayer(frame: HTMLElement, item: DetailItem, media: null, options?: { autoplay?: boolean }): () => void;
  /** 盘回来: 按正常Rutapesado开esteuno, NoEnmedio路挂ReproducirDispositivo.  */
  reopen(): void;
  /** pesadoNuevo检测uno来源挂没挂arriba.  */
  checkSource(location: string): Promise<boolean>;
  /** En线Obras反查No到关注Entrada时出口: Abrir关注página"yaGuardar"eseuno档.  */
  openSavedFollow(): void;
  openEntity(kind: string, name: string): void;
  openUnowned(): void;
  openRegion(region: string): void;
  /** 点unoEtiqueta: 回ListaSolover它.  */
  openTag(tag: string): void;
  /** 加入ReproducirListaeseuno屏(壳表单弹层: 舞es `showModal()` 开Original生 dialog, 弹层要进同uno层).  */
  addToPlaylist(item: DetailItem): void;
  /** Guardar Mix eseuno屏: 壳弹表单, Confirmar时调 `save(name)`; 存bien壳转去eseReproducirListay给Deshacer.  */
  saveMix(options: { title: string; count: number; save(name: string): Promise<PlaylistPayload> }): void;
  /** EditarReproducirLista: 去ReproducirListapágina.  */
  editPlaylist(): void;
  /** ReproducirLista被移空: 回ReproducirListapágina.  */
  openPlaylists(): void;
  /** 定源Archivo; 回esFalloOriginal因, Éxitoes空串(Éxito回执归Todo站 Toast).  */
  reveal(id: number): Promise<string>;
  /** 核对esteuno所EnDirectorio; 回Estadouno行, exterior加被移入回收站ese几.  */
  sync(id: number): Promise<{ text: string; removed: number[] }>;
  /** Directorio"垃圾Archivo"eseuno档按回收站Estado列: 移入回收站之posterior(`undo` Como假), Deshacer任何uno次Comentarios之posterior
   *  (`undo` Como真)由壳判要No要pesado读Lista.  */
  trashChanged(disposal: string | null, undo: boolean): Promise<void>;
  /** 操作回执; 给 `undo` 就带unoDeshacerClave. Fallo走 `failure`.  */
  toast(message: string, options?: { undo?: () => Promise<void> }): void;
  failure(action: string, error: unknown): void;
}

export interface ItemDetailProps {
  /** 点eseuno; ReproducirLista从Listapágina进来时puede以Sin, 退到续播Ubicación.  */
  id: number | null;
  queue: QueueRef | null;
  /** "Continuar viendo"uno排取几; 0 es关掉. ConCola时No出esteuno排.  */
  relatedLimit: number;
  helpers: ItemDetailHelpers;
  actions: ItemDetailActions;
  /** "Continuar viendo"eseuno排卡片:  y DirectorioCuadrícula同uno助手y动作.  */
  grid: { helpers: MediaCardHelpers; actions: MediaCardActions };
  layout: MediaCardLayout;
  selectMode: boolean;
  selected: ReadonlySet<number>;
  seekSeconds: number;
}

/* ── 身区 ── */

/** 出镜者超过este数就收起: BEST 合集实测Con 41 , Todo铺开会Etiqueta y Comentarios按钮挤出puede视区.  */
export const CAST_SHOWN = 8;

export interface IdentityGroups {
  cast: DetailEntityRef[];
  studios: DetailEntityRef[];
  makers: DetailEntityRef[];
  creators: DetailEntityRef[];
  series: DetailEntityRef[];
  /** 判据 y  `owner=none` ese SQL uno样: Sin出镜者, Sin创作者实体, 扁平 creator 也空. Sello y 
   *  SerieNo算归属—两边说必须es同uno批Obras, 否则卡片arriba写着"no归属"este点进集合会NoEndentro面.  */
  unowned: boolean;
}

/** 身按CategoríaAgrupar, 同uno名字Solo出现uno次(先到eseuno类Dejaabajo). 共演ObrasActriz逐列出; 
 *  非NormalizarSelloSoloCon扁平 `studio`, 它标识puede用性单独abajo发En `has_studio_logo`.  */
export function identityGroups(item: DetailItem): IdentityGroups {
  const refs = item.entity_refs || {};
  const seen = new Set<string>();
  const fresh = (ref: DetailEntityRef) => {
    const key = foldName(ref.name);
    if (!ref.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  };
  const performers: DetailEntityRef[] = refs.performer?.length
    ? refs.performer : (item.performers || []).map((name) => ({ id: null, name }));
  const cast = performers.filter(fresh);
  const studioRef = refs.studio?.[0];
  const studioFallback: DetailEntityRef[] = studioRef || !item.studio
    ? [] : [{ id: null, name: item.studio, has_logo: !!item.has_studio_logo,
      ...(item.studio_logo_version ? { logo_version: item.studio_logo_version } : {}) }];
  const studios = [...(refs.studio || []), ...studioFallback].filter(fresh);
  const makers = studios.flatMap((ref) => ref.makers || []).filter(fresh);
  const creators = (refs.creator || []).filter(fresh);
  const series = (refs.series || []).filter(fresh);
  return { cast, studios, makers, creators, series, unowned: !cast.length && !creators.length && !String(item.creator || '').trim() };
}

/* ── Puntuación ──
   Puntuación落En `asset.rating`, 量纲es 0–100: esteuno列es Stash  rating100 直continuar导进来, taste_history
   也按 rating/20 折算成 0–5 分. 所以No. n 星送出es n*20, Noes n. 再点当anterioreseuno表示Deshacer, 
   送 0, posterior端写回 NULL—"没评过" y "评uno星"EnOrdenararriba必须es两件事.  */
export const RATING_STEP = 20;
export const clampRating = (value: number | null | undefined) => Math.min(Math.max(value || 0, 0), 100);
export const ratingStars = (value: number | null | undefined) => Math.round(clampRating(value) / RATING_STEP);
export const ratingText = (value: number | null | undefined) => {
  const stars = ratingStars(value);
  return stars ? `${stars} 星` : 'NoPuntuación';
};
/** 点No. `star` 之posterior要送值: 点就es当anterioreseunoesDeshacer.  */
export const nextRating = (before: number | null | undefined, star: number) => {
  const picked = star * RATING_STEP;
  return picked === (before || 0) ? 0 : picked;
};

/* ── Etiqueta ── */

/** Detallesdentro列Etiqueta: 去掉Duración分档, 按显示名去pesado(改过显示名puede能y另uno同名, 优先Deja本身就es
 *  Normalizar显示名ese), 最más 40 .  */
export function detailTags(item: DetailItem, helpers: Pick<ItemDetailHelpers, 'tagLabel' | 'isDurationTag'>): DetailTag[] {
  const byDisplay = new Map<string, DetailTag>();
  (item.tags || []).filter((tag) => !helpers.isDurationTag(tag.k)).forEach((tag) => {
    const key = foldName(helpers.tagLabel(tag.k));
    const previous = byDisplay.get(key);
    if (!previous || (foldName(tag.k) === key && foldName(previous.k) !== key)) byDisplay.set(key, tag);
  });
  return [...byDisplay.values()].slice(0, 40);
}

export const hasTag = (item: DetailItem, tag: string) => (item.tags || []).some((own) => foldName(own.k) === foldName(tag));
export const withoutTag = (item: DetailItem, tag: string): DetailItem =>
  ({ ...item, tags: (item.tags || []).filter((own) => foldName(own.k) !== foldName(tag)) });
export const withTag = (item: DetailItem, tag: DetailTag): DetailItem =>
  (hasTag(item, tag.k) ? item : { ...item, tags: [...(item.tags || []), tag] });

const RECENT_TAGS = 'peach.recentTags';
export function recentTags(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_TAGS) || '[]');
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}
export function rememberTag(tag: string): void {
  try {
    const rest = recentTags().filter((name) => foldName(name) !== foldName(tag));
    localStorage.setItem(RECENT_TAGS, JSON.stringify([tag, ...rest].slice(0, 12)));
  } catch {
    // 存储满或被禁用: Reciente使用Soloes便利, No影响添加本身. 
  }
}

export interface PickerSections { recent: TagCount[]; results: TagCount[]; create: string }

/** EtiquetaSeleccionarDispositivodentroesteuno刻列什么: 没Introducir时esReciente使用加Todo(anterior 120 ), Introducires命en procesoese几; 
 *  Introducir词Sin完Todo命en proceso, último尾másuno格"Nuevo".  */
export function pickerSections(query: string, candidates: readonly TagCount[], recent: readonly string[]): PickerSections {
  const q = foldName(query);
  const byName = new Map(candidates.map((tag) => [foldName(tag.k), tag]));
  const results = candidates.filter((tag) => !q || foldName(tag.k).includes(q)).slice(0, 120);
  const recentRows = q ? [] : recent.map((name) => byName.get(foldName(name)) || { k: name, n: 0 })
    .filter((tag, index, all) => all.findIndex((other) => foldName(other.k) === foldName(tag.k)) === index).slice(0, 12);
  const exact = results.some((tag) => foldName(tag.k) === q);
  return { recent: recentRows, results, create: q && !exact ? query.trim() : '' };
}

/* ── Cola ── */

/** 版次徽章配色跟卡片Títuloen laese套走. másuno `Con码`: 卡片arriba正片No加角标es对(没角标就es
 *  正片), peroColadentro两y排时"什么都No写"etc.于让人自己猜哪es哪.  */
export const EDITION_TONE: Record<string, string> = { en proceso字: 'subtitle', Sin码: 'uncensored', Sin码破解: 'cracked', Con码: 'censored' };

const QUEUE_LABEL: Record<QueueKind, string> = { mix: 'Mix', parts: 'Volumen', editions: 'Versión', playlist: 'Lista de reproducción' };

/** Cola头ese两行: Categoríay摘要. 版次ColaTítuloes"Versión · Código JAV", 而Código JAV就印En正arriba方DetallesTítulodentro, 
 *  Título栏又ya经写着"Versión"—tres处说同uno件事, aquíSoloDejaCantidad. 别ColaTítulo带真Información(ReproducirLista名, 
 *  Mix Semilla), No能uno起砍.  */
export function queueCopy(queue: DetailQueue): { title: string; summary: string } {
  const count = (queue.kind === 'editions' ? queue.versionCount ?? queue.items.length : queue.items.length).toLocaleString();
  const countLabel = queue.kind === 'parts' ? `${count} Volumen` : queue.kind === 'editions' ? `${count}  versión(es)` : `${count}  video(s)`;
  return { title: QUEUE_LABEL[queue.kind], summary: queue.kind === 'editions' ? countLabel : `${queue.title} · ${countLabel}` };
}

/** 同uno部片几卷共用Archivo名, Título, Actriz, Sello逐字相同: DetallesTítuloNo写卷号话, EnColadentro换uno卷, 
 *  derecha侧Completo栏verarriba去纹丝No动. 卷号说es"No.几Archivo"而Noes版次, 用en proceso性灰. 数字卷写"No. 2 卷", 
 *  字母卷照Código JAV分卷posterior缀写法grande写成"A 卷".  */
export const partLabel = (label = '') => /^\d+$/.test(label) ? `No. ${label} Volumen`
  : /^[a-h]$/i.test(label) ? `${label.toUpperCase()} Volumen` : label;
export const partLabelHtml = (item: DetailItem, queue: DetailQueue | null) =>
  ((queue?.kind === 'parts' || queue?.kind === 'editions') && item.part_label ? `<small class="javedition partlabel">${esc(partLabel(item.part_label))}</small>` : '');

/** 拖动之posteriorNuevo顺序: `from` 挪到 `target` anterior面或posterior面.  */
export function movedOrder(ids: readonly number[], from: number, target: number, after: boolean): number[] {
  const rest = ids.filter((id) => id !== from);
  const at = rest.indexOf(target);
  rest.splice(at + (after ? 1 : 0), 0, from);
  return rest;
}

export const sameOrder = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/* ── Reproducir区 ── */

export type MediaGate = 'offline' | 'online' | 'metered' | 'disc' | '';

/** Reproducir区此刻挡En视频anterior面es哪unoDescripción: 来源没挂载, En线Obras反查No到关注Entrada, 计费来源要
 *  点unoabajo才拉流. Guardar过En线Obras照常播(壳En取数时ya经它转去关注Detalles).  */
export function mediaGate(item: DetailItem, offline: boolean): MediaGate {
  if (offline) return 'offline';
  if (String(item.name || '').toLowerCase().endsWith('.iso')) return 'disc';
  if (item.location === 'online' && !item.follow_item_id) return 'online';
  if (item.cost === 'metered' && item.location !== 'online') return 'metered';
  return '';
}

/** 真实观verese初值: ver过秒数占Duración. Duraciónno知(0 或 -1 哨兵)时No画.  */
export function realWatched(item: DetailItem): number | null {
  const duration = Number(item.duration) > 0 ? Number(item.duration) : 0;
  if (!item.play_seconds || !duration) return null;
  return Math.min(Number(item.play_seconds) / duration, 1) * 100;
}

/* ── 写完之posterior ── */

/** ComentariosClave回执.  */
export function feedbackReceipt(kind: string, result: { feedback?: string | null; disposal?: string | null }): string {
  if (kind === 'dislike') return result.feedback === 'dislike' ? 'MarcadoNo es de mi gusto' : 'YaCancelarNo es de mi gusto';
  if (kind === 'seen') return result.feedback === 'seen' ? 'Marcado como visto' : 'YaCancelarVisto';
  if (kind === 'dispose') return result.disposal === 'trash' ? 'YaMover a papelera' : 'Ya移出Papelera';
  return 'YaRegistrouno次Orgasmo';
}
