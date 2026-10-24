/* 关注Detalles `/posts/:id` Datosy判定(ADR-0031). 
 *
 * esteunoes舞岛(`../stage/`)树en la子组件; 舞本身, 进出场, pequeño窗y Video.js 归舞岛
 * (JAV Detalles也En用). Entrada归aquí: 先扫关注página岛ya缓存ese几página(`findFollowItem`)yya取过Detalles, 
 * 扫No到才单取 `GET /api/follow?item=<id>`, Respuesta形状同Listaeseunopágina, Solo含esteuno所En组.  */
import type { QueryKey } from '@tanstack/react-query';
import { apiGet } from '../../api';
import {
  FOLLOW_CREDENTIALS_KEY, collectionItems, fetchFollowCredentials, findFollowItem, videoItems,
  type FollowContext, type FollowFeedHelpers, type FollowGroup, type FollowItem, type FollowMedia,
  type FollowMediaItem, type FollowPage, type FollowSource,
} from '../follow-feed/follow-feed';
import type { LightboxSlide } from '../photo-lightbox/photo-lightbox';
import { queryClient } from '../query';

/* ── Interfaz形状(`src/peach/web_follow.py`) ── */

/** Entradadentro嵌着uno媒体: Detalles比卡片más读名字, 字节数, Tipoy网盘Agrupar.  */
export interface FollowDetailMedia extends FollowMediaItem {
  name?: string;
  size?: number;
  media_type?: string;
  resource_provider?: string;
  resource_group?: string;
  resource_group_label?: string;
}

/** Detalles读到Entrada字段; 其余Original样DejaEn `FollowItem` 索引Firmadentro.  */
export interface FollowDetailItem extends FollowItem {
  url?: string;
  summary?: string;
  author?: string;
  source_label?: string;
  media_type?: string;
  media_error?: string;
  media_needs_credential?: boolean;
  resource_urls?: string[];
  hidden_media?: FollowDetailMedia[];
  detail_tags?: string[];
  variant_kind?: string;
  variant_label?: string;
  has_media?: boolean;
  media_items?: FollowDetailMedia[];
}

/** unoDetalles要Todo: Entrada, 它所En组, 以及署名要读来源y别名.  */
export interface FollowDetailData {
  item: FollowDetailItem;
  group: FollowGroup | null;
  sources: FollowSource[];
  aliases: unknown[];
}

/* ── 取数 ── */

export const followItemKey = (id: number): QueryKey => ['follow-item', id];

export const FOLLOW_ITEM_URL = (id: number) => `/api/follow?item=${encodeURIComponent(id)}`;
export const FOLLOW_SAVE_URL = '/api/follow/save';
export const FOLLOW_MEDIA_HIDE_URL = '/api/follow/media/hide';

/** EntradayaNo存En: Reintentar也取No回来, Detalles给es"回到关注"而NoesReintentar.  */
export class FollowItemGone extends Error {
  constructor() { super('esteResultadoSeguircontenidoYaNo存En') }
}

/** 单取: RespuestaSolo含esteuno所En组. EntradayaNo存En时服务端回空组, aquí报成 `FollowItemGone`.  */
export async function fetchFollowItem(id: number, signal?: AbortSignal): Promise<FollowDetailData> {
  const page = await apiGet<FollowPage>(FOLLOW_ITEM_URL(id), signal);
  for (const group of page.groups || []) {
    const item = collectionItems(group).find((member) => member.id === id);
    if (item) return { item: item as FollowDetailItem, group, sources: page.sources || [], aliases: page.author_aliases || [] };
  }
  throw new FollowItemGone();
}

/** ya经取过Detallesdentro, 组dentroConesteunoeseuno: 合集换Versión, más媒体换到组dentro另uno, 组就es舞arriba
 *  正摆着eseuno, 单取回来也Soloes同uno组.  */
function findDetailGroupItem(id: number): FollowDetailData | null {
  for (const [, data] of queryClient.getQueriesData<FollowDetailData>({ queryKey: ['follow-item'] })) {
    if (!data?.group) continue;
    const item = collectionItems(data.group).find((member) => member.id === id);
    if (item) return { ...data, item: item as FollowDetailItem };
  }
  return null;
}

/** primero屏: Lista缓存dentroCon就直continuar用(关掉Detalles回Lista也Nopesado取); esteuno取过, 或者就En舞arribaeseuno组dentro, 
 *  也No再问服务端—点abajo去到换过去之间SinEsperando. 都Sin才单取; Credenciales没取过才取.  */
export async function prefetchFollowDetail(props: { id: number }, signal: AbortSignal): Promise<void> {
  const key = followItemKey(props.id);
  const hit = findFollowItem(props.id);
  const credentials = queryClient.getQueryData(FOLLOW_CREDENTIALS_KEY)
    ? null
    : queryClient.fetchQuery({ queryKey: FOLLOW_CREDENTIALS_KEY, queryFn: () => fetchFollowCredentials(signal) });
  const cached = hit ? { ...hit, item: hit.item as FollowDetailItem }
    : queryClient.getQueryData<FollowDetailData>(key) ?? findDetailGroupItem(props.id);
  if (cached) queryClient.setQueryData<FollowDetailData>(key, cached);
  else await queryClient.fetchQuery({ queryKey: key, queryFn: () => fetchFollowItem(props.id, signal) });
  await credentials;
}

/* ── 壳递进来ese几样 ── */

export interface FollowDetailActions {
  /** CerrarDetalles回到来处(壳 `closeDetail`: 退场动画, 拆舞, 推回Lista地址).  */
  close(): void;
  /** 换到组en la另uno: 经壳换地址(`preserveReturn` 语义), 舞Original地换contenido.  */
  openItem(id: number, mediaIndex?: number | null): void;
  openAuthor(name: string): void;
  /** 点Detallesen launoEtiqueta: 壳CambiareseunoFiltrar, 回到带arriba它Lista.  */
  openTag(tag: string): void;
  /** esteuno, esteuno媒体画出来: 壳据此Actualizarpequeño窗Metadatos, 侧栏Etiqueta抽屉y舞氛围光, 剧场Modo.  */
  present(item: FollowDetailItem, kind: string): void;
  /** 媒体框交给舞挂ReproducirDispositivo(同ObrasDetalles: `<video>` 由舞建En框dentro). `onError` es片源报错, 
   *  Detalles据此Descripciónesteuno没放出来. 返回LimpiarEneste媒体区卸abajo时调.  */
  mountPlayer(frame: HTMLElement, item: FollowDetailItem, media: FollowDetailMedia | null,
    options: { onError(): void }): () => void;
  /** 操作回执; 给 `undo` 就带unoDeshacerClave. Fallo走 `failure`.  */
  toast(message: string, options?: { undo?: () => Promise<void> }): void;
  failure(action: string, error: unknown): void;
}

export interface FollowDetailProps {
  id: number;
  /** 进来时要verese媒体(`media_items[].index`); 空就按当anterior视Imagen挑No.uno.  */
  mediaIndex: number | null;
  /** Lista停En视频还esImagen片: más媒体帖先挑este媒体.  */
  mediaView: FollowMedia;
  relatedLimit: number;
  helpers: FollowFeedHelpers;
  actions: FollowDetailActions;
}

/* ── 媒体判定 ── */

export interface DetailMedia {
  embedded: FollowDetailMedia[];
  selected: FollowDetailMedia | null;
  kind: string;
  images: FollowDetailMedia[];
  /** 当anterioresteEnImagen片en laUbicación; NoesImagen片时es -1.  */
  position: number;
  carousel: boolean;
  /** más媒体又Noes纯Imagen轮播: derecha边摆más媒体Cola.  */
  embeddedQueue: boolean;
  /** Entrada自己Sin嵌入媒体, 组dentro却Con几puede播视频: derecha边摆合集Cola.  */
  collection: FollowGroup | null;
  /** 画框Relación跟Completo组Imagen走, No跟当anterioreste: 换Imagen时DetallesNo忽alto忽bajo, Imagen没Cargar完也先占住Ubicación. 
   *  Con尺寸Imagendentro取最altoese(anchoalto比最pequeño); uno都Sin时轮播用方框, 单Imagen由Imagen片自己撑开.  */
  frameRatio: number;
  /** 正片地址(`/follow-stream`); EntradaNopuede播时es空串.  */
  src: string;
}

export function detailMedia(item: FollowDetailItem, group: FollowGroup | null, mediaIndex: number | null, view: FollowMedia): DetailMedia {
  const embedded = item.media_items || [];
  const preferredKind = view === 'images' ? 'image' : 'video';
  const preferred = embedded.find((media) => media.media_kind === preferredKind) || embedded[0];
  const selected = embedded.length
    ? embedded.find((media) => media.index === (mediaIndex ?? preferred!.index)) || preferred!
    : null;
  const images = embedded.filter((media) => media.media_kind === 'image');
  const position = images.findIndex((media) => media.index === selected?.index);
  const carousel = images.length > 1 && position >= 0;
  const embeddedQueue = embedded.length > 1 && !carousel;
  const collection = !embedded.length && group && videoItems(group).length > 1 ? group : null;
  const kind = selected?.media_kind || item.media_kind || '';
  const owners = (carousel ? [...images, item] : [selected, item])
    .filter((owner): owner is FollowDetailMedia | FollowDetailItem => !!owner && (owner.width || 0) > 0 && (owner.height || 0) > 0);
  const frameRatio = kind !== 'image' ? 0
    : owners.length ? Math.min(...owners.map((owner) => owner.width! / owner.height!)) : carousel ? 1 : 0;
  const src = item.playable ? `/follow-stream?id=${item.id}${selected ? `&media=${selected.index}` : ''}` : '';
  return { embedded, selected, kind, images, position, carousel, embeddedQueue, collection, frameRatio, src };
}

/** 组dentro挂着网盘Agrupar媒体eseuno: 合集Cola改列它媒体, No列回复.  */
export const groupedMediaOwner = (group: FollowGroup): FollowDetailItem | undefined =>
  collectionItems(group).find((item) => ((item as FollowDetailItem).media_items || [])
    .some((media) => media.resource_group)) as FollowDetailItem | undefined;

/* ── 文案 ── */

const RESOURCE_HOSTS: Record<string, string> = {
  'gofile.io': 'Gofile', 'pixeldrain.com': 'Pixeldrain', 'mega.nz': 'MEGA', 'mega.io': 'MEGA',
  'mediafire.com': 'MediaFire', 'drive.google.com': 'Google Drive',
};
const RESOURCE_PROVIDERS: Record<string, string> = {
  gofile: 'Gofile', pixeldrain: 'Pixeldrain', mega: 'MEGA', mediafire: 'MediaFire', google_drive: 'Google Drive',
};

/** exterior部Archivopáginaeseuno排站名: 认得网盘写marca名, 其余写Anfitrión名.  */
export function resourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return RESOURCE_HOSTS[host] || host;
  } catch {
    return 'exterior título(s)Archivopágina';
  }
}

/** 灯箱角arribaeseuno行出处: 网盘Agrupar媒体写网盘, 其余写来源站.  */
export function mediaSourceLabel(media: FollowDetailMedia | null | undefined, item: FollowDetailItem): string {
  return RESOURCE_PROVIDERS[media?.resource_provider || ''] || item.provider_label || item.provider || 'Imagen en línea';
}

/** 合集Colauno行行primeroEtiquetay正文. 线程TítuloNo能冒充每回复正文, 行primeroDescripción它y主Entrada关系; 
 *  PublicarTiempo单独显示, No能再伪装成Versión或TipoEtiqueta.  */
export function collectionCopy(group: FollowGroup, item: FollowDetailItem, mark = ''): { label: string; title: string } {
  let label = mark;
  if (!label && group.is_release) label = item.variant_label || item.variant_kind || '';
  if (!label) label = item.variant_kind === 'wip' ? 'WIP' : (item.variant_label || item.variant_kind || 'Videos');
  const body = group.is_release ? (item.summary || (item.has_media ? '(solo adjunto)' : '(Ninguno正文)')) : item.title;
  return { label, title: group.is_release && item.author ? `${item.author}: ${body}` : body };
}

/** más媒体Colauno行名字: 关注媒体Noes JAV, Solo去掉primero尾空白(同遗Deja层 `javDisplayName` 非 JAV 分支).  */
export const mediaName = (media: FollowDetailMedia) => String(media.name || '').trim();

/** 来源记abajoEtiquetaTipo; 没记es `unknown`, 保持en proceso性色—No按词形猜Tipoes关注Etiqueta既Con门槛.  */
export const tagType = (item: FollowDetailItem, tag: string) => item.tag_types?.[tag] || 'unknown';

/** Etiqueta着色eseuno档(`data-tag-cat`, 色板En `../styles.css`): 来源认得cinco类各ConColor, 没记Tipo
 *  esen proceso性色, 其余Tipo(booru 各站自己más出来)按 general 着色.  */
const COLORED_TYPES = new Set(['artist', 'character', 'copyright', 'metadata', 'unknown']);
export function tagCategory(item: FollowDetailItem, tag: string): string {
  const type = tagType(item, tag);
  return `r34-${COLORED_TYPES.has(type) ? type : 'general'}`;
}

/* DetallesEtiqueta按 rule34.xxx 帖子página `#tag-sidebar` Tipo顺序Agrupar, 组interior按名升序—证据见
   docs/reference-snapshots/rule34-follow-tags-and-collections.md, 缺Tipo直continuarOmitirNo占. 
   卡片Solo消费 general contenido投影; Detalles保Deja来源RegistroTodoTipo.  */
const TAG_ORDER = ['copyright', 'character', 'artist', 'general', 'metadata'];
export function detailTags(item: FollowDetailItem, label: (tag: string) => string): string[] {
  const tags = item.detail_tags || item.tags || [];
  const rank = (tag: string) => {
    const at = TAG_ORDER.indexOf(tagType(item, tag));
    return at < 0 ? TAG_ORDER.length : at;
  };
  return [...tags].sort((a, b) => rank(a) - rank(b) || label(a).localeCompare(label(b)));
}

/** 署名eseuno组来源: 同uno创作者Todo来源, 认No出创作者时SoloConesteuno自己来源.  */
export function authorSources(item: Pick<FollowItem, 'source_id'>, sources: readonly FollowSource[]): FollowSource[] {
  const source = sources.find((row) => row.id === item.source_id);
  const group = sources.filter((row) => source?.author_key && row.author_key === source.author_key);
  if (!group.length && source) group.push(source);
  return group;
}

export const detailContext = (data: FollowDetailData, credentials: ReadonlySet<string>): FollowContext => ({
  sources: data.sources, aliases: data.aliases, credentials,
});

/* ── 灯箱 ──
   Detallesdentro点Imagen开grandeImagen, 跟Actrizpágina同uno灯箱. másImagen时Completo组交进去, izquierdaderecha翻página就能ver完uno帖子所ConImagen; 
   取No到正片就退而用缩略Imagen—verpequeñoImagenTotal比点没反应强.  */
const sized = (media: FollowDetailMedia | null) => (media?.size ? { size: media.size } : {});

export function detailSlides(item: FollowDetailItem, media: DetailMedia): LightboxSlide[] {
  const { images, kind, src, selected } = media;
  if (images.length) {
    return images.map((image) => ({
      src: `/follow-stream?id=${item.id}&media=${image.index}`,
      thumb: image.thumb_url || item.thumb_url || `/follow-stream?id=${item.id}&media=${image.index}`,
      name: image.name || item.title, source: mediaSourceLabel(image, item), ...sized(image),
    }));
  }
  if (kind === 'image' && src) {
    return [{ src, thumb: item.thumb_url || src, name: item.title, source: mediaSourceLabel(selected, item),
      ...sized(selected) }];
  }
  return item.thumb_url ? [{ src: item.thumb_url, thumb: item.thumb_url, name: item.title,
    source: item.provider_label || item.provider || 'Imagen en línea' }] : [];
}

/* ── 写完之posterior ── */

/** Estado回执说法yDeshacer: Guardar进DatosBibliotecaNo给Deshacer, esees另uno件事.  */
export const statusReceipt = (to: string) => (to === 'seen' ? 'Marcado como visto' : 'Estado de seguimiento actualizado');
