/* 垃圾ArchivoCola(`CATALOG_ROUTES['/junk-files']`)Datosy对exterior契约. 
 *
 * Colauno次取 200 (`/api/ads?limit=200&status=...[&kind=...]`, `src/peach/web_batch.py`  `q_ads`
 * 现算Puntuación), Cliente按"每批数"uno段段露出来; 换Categoría, 换视Imagen就es换ConsultaClave. 写操作SoloContres, 
 * 都走 `/api/batch`, 由壳执行(回执, Deshacerypesado读都归壳), 做完壳推进 `revision`, Consulta换Clavepesado取.  */
import { apiGet } from '../../api';
import type { JunkKind, JunkRoute, JunkView } from '../../junk-queue';

export type { JunkKind, JunkRoute, JunkView };

/** Colauno次取másmenos.  y 遗Deja层同uno数: Puntuaciónes现算, página越grande越lento.  */
export const JUNK_LIMIT = 200;

/** `/api/ads` uno. Solo列卡片读到字段, 其余Original样带着, 壳缓存要esCompleto.  */
export interface JunkItem {
  id: number;
  name?: string;
  junk_kind?: string;
  why?: string;
  size?: number | null;
  location?: string;
  cost?: string;
  [field: string]: unknown;
}

/** `/api/ads` 回话: `total` esesteuno视Imagen, esteuno类数, `all_total` esesteuno视Imagen各类合计, 
 *  `counts` 按类计数, `dismissed_total` 给Categoríaúltimo尾eseuno项徽标.  */
export interface JunkPage {
  items: JunkItem[];
  total?: number;
  all_total?: number;
  pending_total?: number;
  dismissed_total?: number;
  counts?: Partial<Record<string, number>>;
}

export type JunkOperation = 'dismiss-junk' | 'reconsider-junk' | 'dispose';

/** 卡片en laTipo名y字形. 网址eseuno类En卡arriba写Todo称.  */
export const JUNK_KIND_META: Record<string, readonly [string, string]> = {
  video: ['Videos', 'play'], image: ['Imágenes', 'pics'], archive: ['Archivo comprimido', 'file-archive'],
  audio: ['Audio', 'file-audio'], url: ['Acceso directo URL', 'globe'], other: ['Otros archivos', 'hard-drive'],
};
export const junkKindMeta = (item: JunkItem) => JUNK_KIND_META[item.junk_kind || 'other'] || JUNK_KIND_META.other!;

/** en proceso间ese判断Clave: 待判断视Imagendentroes"Noes垃圾", yaExcluir视Imagendentroes"pesadoNuevo判断".  */
export function junkDecision(view: JunkView): { operation: JunkOperation; label: string; glyph: string } {
  return view === 'dismissed'
    ? { operation: 'reconsider-junk', label: 'Reclasificar', glyph: 'rotate-ccw' }
    : { operation: 'dismiss-junk', label: 'No es basura', glyph: 'check' };
}

/** CategoríaAnterior项计数: "Todo"读esteuno视Imagen合计, 其余读各类.  */
export const junkCount = (page: JunkPage, kind: JunkKind): number =>
  Number((kind ? page.counts?.[kind] : page.all_total) || 0);

export const junkQueryKey = (route: JunkRoute, revision: number) =>
  ['junk-queue', route.view, route.kind, revision] as const;

export function junkQueryString({ kind, view }: JunkRoute): string {
  const params = new URLSearchParams({ limit: String(JUNK_LIMIT), status: view });
  if (kind) params.set('kind', kind);
  return params.toString();
}

export async function fetchJunkPage(route: JunkRoute, signal: AbortSignal): Promise<JunkPage> {
  const page = await apiGet<JunkPage>(`/api/ads?${junkQueryString(route)}`, signal);
  return { ...page, items: page.items || [] };
}

/** 卡片arriba仍由遗Deja层拼eseuno段: 来源角标(遗Deja层 `srcBadge`).  */
export interface JunkQueueHelpers {
  badgeHtml(location: string, cost: string): string;
}

/** 卡片yCategoríaen la动作. 写 ledger, AbrirDetallesy换página都归壳.  */
export interface JunkQueueActions {
  /** Categoríaen launo项被点(普通izquierdaClave): 壳收起más选, 改地址, pesado读. 修饰Claveyen procesoClave照Explorar dispositivoPredeterminado.  */
  navigate(path: string): void;
  /** Cambiaruno选en proceso; `range` es按住 Shift 连选.  */
  toggleSelection(id: number, range: boolean): void;
  /** 点TítuloAbrir: 视频进Detalles, 本地Imagen片EnNuevoEtiquetapáginaverOriginalImagen.  */
  open(item: JunkItem, anchor: HTMLElement): void;
  /** "AbrirUbicación": En资源GestionarDispositivodentro显示. 回话es要写En卡片Estado行en launo句, ÉxitoComo空.  */
  reveal(item: JunkItem): Promise<string>;
  /** tres处置Clave. 写 ledger, 做完pesado读Colay给Deshacer; Fallo由壳报, 再抛出.  */
  operate(item: JunkItem, operation: JunkOperation): Promise<void>;
}

export interface JunkQueueProps extends JunkRoute {
  helpers: JunkQueueHelpers;
  actions: JunkQueueActions;
  /** 每uno段露másmenos(Configuraciónen la"每批数").  */
  batchSize: number;
  /** Actualizar代次: 壳要求pesado读时加uno, Consulta随之换Clavepesado取. 换代时antiguounoDejaEn屏arriba, Nopesado铺骨架.  */
  revision: number;
  selectMode: boolean;
  selected: ReadonlySet<number>;
  /** 计数行(`#count`). 行本身归壳(换página时由壳清空), dentro面摘要yCategoría归esteunopágina.  */
  countRow: HTMLElement | null;
  /** Cuadrícula骨架 HTML(遗Deja层 `pageSkeletonHtml`),  y 壳primero屏铺es同uno.  */
  skeletonHtml(): string;
  /** uno次取数落定(Éxito, Como空或Fallo): `revision` eseseuno次代次, 壳据此放行etc.着它调用方.  */
  settled?(revision: number): void;
  /** 此刻能No能往abajo露Siguiente段: Gestionar区或索引página盖Enarriba面时No露.  */
  canLoadMore?(): boolean;
}
