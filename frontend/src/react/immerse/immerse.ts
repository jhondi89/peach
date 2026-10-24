/* InmersivoModoDatosy判据: 片单怎么抽, Detalles按哪Clave取, 署名怎么念, Imagen铺满还es完Completo显示. 
 * No碰 DOM, `immerse-island.tsx` 控制Dispositivoy组件都从aquí取.  */
import type { QueryKey } from '@tanstack/react-query';

import { apiGet } from '../../api';
import { queryClient } from '../query';
import { fetchItem, itemKey, type DetailEntityRef, type DetailItem } from '../item-detail/item-detail';

/** 片单en launo(`/api/items` 卡片eseuno).  */
export interface ImmerseItem {
  id: number;
  name?: string;
  title?: string;
  location?: string;
  cost?: string;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  ctx_orient?: string;
  [field: string]: unknown;
}

/** 片单按"esteuno次Abrir"y"No.几次续取"分Clave: 每次Abrir都esuno次TodoNuevoAleatorio抽样, 续取eseuno批
 *  也No能读到Anterior批缓存.  */
export const immerseListKey = (filters: string, seed: number, draw: number): QueryKey => ['immerse-list', filters, seed, draw];

/** 抽样用Consulta串: primeropáginaFiltrar去掉画幅(横竖都进), Aleatorio取 60 . 
 *
 *  Sin offset puede翻: `sort=rand` En服务端esno加Semilla `RANDOM()`(web_contract.py), 每次Por favor求
 *  都esuno次TodoNuevoAleatorio抽样, 翻página偏移En它arriba面Sin意义—带arriba去Solo会AleatorioOmitir若干行. 续取靠es
 *  调用点按 id 去pesado, Noes偏移量.  */
export function immerseQuery(filters: Record<string, string | number | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, String(value));
  params.delete('orient');
  params.set('sort', 'rand');
  params.set('limit', '60');
  params.set('offset', '0');
  params.set('thumb', '');
  return params.toString();
}

/** 能直continuar进片单: No按流量计费, ConDuración, 来源没脱盘. 脱盘来源片子拉No到流, 进片单就es
 *  uno黑屏Cargaren proceso; DetallespáginaCon门挡着, aquíSolo能En入口筛掉.  */
export const playable = (item: ImmerseItem, offline: (location: string) => boolean): boolean =>
  item.cost !== 'metered' && !!item.duration && !offline(String(item.location ?? ''));

export function shuffle<T>(list: T[], random: () => number = Math.random): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  return list;
}

export async function fetchImmerseList(query: string, offline: (location: string) => boolean): Promise<ImmerseItem[]> {
  const page = await apiGet<{ items?: ImmerseItem[] }>(`/api/items?${query}`);
  return shuffle((page.items || []).filter((item) => playable(item, offline)));
}

/** esteunoDetalles:  y ObrasDetalles同unoClave, 动作Clave写回之posteriorDetallesyDirectorio卡读到es同uno. 缓存dentroyaCon就No再
 *  取(切回ver过eseuno, 起播eseunoEnAbrir时ya经取过).  */
export const ensureDetail = (id: number): Promise<DetailItem> =>
  queryClient.ensureQueryData({ queryKey: itemKey(id), queryFn: ({ signal }) => fetchItem(id, signal) });

/** yaConeseuno批之posteriorcontinuararribaNuevo抽uno批, 按 id 去pesado.  */
export function extendList(list: ImmerseItem[], more: ImmerseItem[]): ImmerseItem[] {
  const seen = new Set(list.map((item) => item.id));
  return list.concat(more.filter((item) => !seen.has(item.id)));
}

/** 作者eseuno行: 共演Obras念Todo出镜者(最mástres, más出来写人数), 点击进Primero资料página; Sin演员
 *  就es创作者, 再Sin就es"no归属".  */
export interface Owner {
  who: string;
  kind: 'performer' | 'creator' | '';
  name: string;
  ref: DetailEntityRef | null;
}

export function ownerOf(item: Pick<DetailItem, 'performers' | 'creator' | 'entity_refs'>): Owner {
  const cast = item.performers || [];
  const who = cast.length
    ? cast.slice(0, 3).join(', ') + (cast.length > 3 ? ` etc. ${cast.length} 人` : '')
    : (item.creator || 'Sin asignar');
  const kind = cast.length ? 'performer' : (item.creator ? 'creator' : '');
  const name = cast.length ? cast[0]! : (item.creator || 'Sin asignar');
  const ref = kind ? (item.entity_refs?.[kind]?.[0] || null) : null;
  return { who, kind, name, ref };
}

/** InmersivoModoPredeterminado cover 铺满, peroeseSoloEn片源 y 视口Relacióncontinuar近时才成立. 
 *
 *  判据es两者Relación差másmenos, Noes"片源esNoes竖屏": ese样 16:9 横屏进竖屏视口照样 cover, 按alto度
 *  放grande到两边各裁掉unograndemedio. 容差取得很紧(1.05)es刻意: 对竖屏片源用 contain es"No裁掉En cursover
 *  Imagen"Con意Seleccionar. 放ancho到 1.25 会顺手 9:16 片源En 9:19.5 Teléfonoarriba改成 cover, 裁掉约 18%
 *  alto度. 现EnSoloConRelación几乎uno致时才 cover(省掉取Completo产生 1px 黑边), 其余uno律完Completo显示. 
 *  视口Relación会随Rotar y 窗口尺寸改变, 所以必须跟着pesado算, No能SoloEn loadedmetadata 算uno次.  */
export const FIT_TOLERANCE = 1.05;

/** `null` es还量No出来(Metadatos没到或框Sin尺寸), este时No改现状.  */
export function fitMode(sourceWidth: number, sourceHeight: number, box: number): 'cover' | 'contain' | null {
  if (!sourceWidth || !sourceHeight || !box || !Number.isFinite(box)) return null;
  const source = sourceWidth / sourceHeight;
  const mismatch = source > box ? source / box : box / source;
  return mismatch > FIT_TOLERANCE ? 'contain' : 'cover';
}

/** 舞形状(竖 9:16/横 16:9): Metadatos到按Imagen, 没到按Entrada登记anchoalto, 都Sin算竖.  */
export function isWide(video: { videoWidth: number; videoHeight: number }, item: Pick<ImmerseItem, 'width' | 'height'>): boolean {
  if (video.videoWidth && video.videoHeight) return video.videoWidth >= video.videoHeight;
  return !!(item.width && item.height && item.width > 0 && item.height > 0 && item.width >= item.height);
}

/* ── 手势几数 ── */
/** 同unomedio区两abajo之间No超过este么久算双击.  */
export const DOUBLE_TAP_MS = 280;
/** 触屏抬手之posteriorExplorar dispositivo合成eseunoabajo click No再切Reproducir: eseunoabajoya经由单击/双击判定continuar管.  */
export const SYNTHETIC_CLICK_MS = 700;
/** 移超过este么más才定方向; 方向uno旦定abajo就No再改, 否则斜着划会又切片又跳Progreso.  */
export const AXIS_LOCK_PX = 12;
/** 竖划超过este么más换.  */
export const SWIPE_PX = 60;
/** 两方向都No超过este么más算uno次点击.  */
export const TAP_SLOP_PX = 14;
/** 滚轮换节流.  */
export const WHEEL_GAP_MS = 260;
/** No喜欢之posterior停este么久再换Siguiente: 回执先Llegar.  */
export const DISLIKE_ADVANCE_MS = 260;
/** 切片动画Duración加uno帧余量; 动画帧没跑到(página面Enposterior)也按este时刻落.  */
export const SLIDE_MS = 210;
/** etc.uno格puede以出画arriba限.  */
export const READY_TIMEOUT_MS = 15_000;
