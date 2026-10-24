/* 馆藏卡片Cuadrícula对exterior契约: props, 卡片版, 壳递进来助手y动作. 
 * Entraday分página形状以 `/api/items`(`src/peach/web_router.py`)Como准.  */

import type { FaceRef } from '@peach/card-art';
/** 卡片署名行Anterior实体引用: Avatar取Imageny取景都从aquí来.  */
export interface MediaEntityRef extends FaceRef { id: number }

/** `/api/items` uno. Solo列卡片读到字段, 其余Original样带着, 壳缓存要esCompleto.  */
export interface MediaItem {
  id: number;
  name?: string;
  code?: string;
  is_jav?: boolean;
  medium?: string;
  location?: string;
  cost?: string;
  size?: number | null;
  duration?: number | null;
  release_date?: string | null;
  play_seconds?: number | null;
  play_count?: number | null;
  leave_ratio?: number | null;
  has_cover?: boolean;
  cover_key?: string;
  /** PortadaArchivocontenidoVersión, 拼进Portada地址 `&v=`.  */
  cover_version?: string;
  has_thumb?: boolean;
  has_local_poster?: boolean;
  follow_thumb_url?: string;
  follow_item_id?: number | null;
  follow_tags?: string[];
  tags?: string[];
  performers?: string[];
  performer_entities?: (MediaEntityRef | null)[];
  performer_total?: number;
  creator?: string;
  creator_entity?: MediaEntityRef | null;
  studio?: string;
  why?: string;
  feedback?: string;
  disposal?: string;
  disposal_reason?: 'manual' | 'junk' | 'duplicate' | 'missing' | null;
  watch_later?: boolean;
  part_group?: {
    key: string; seed_id: number; count: number; title?: string; total_size?: number; total_duration?: number;
  } | null;
  edition_group?: { key: string; seed_id: number; count: number; editions: string[] } | null;
  [field: string]: unknown;
}

/** `/api/items` unopágina. No.unopágina带Total数, 往posteriorpáginaSolo说还ConSin.  */
export interface MediaPage { items: MediaItem[]; total?: number; work_total?: number; has_more?: boolean }

export interface MediaPageOptions { limit: number; sort?: string; dir?: string }

/** esteuno屏卡片版. `active` esCódigo JAV版开关生效(JAV Modo或primeropágina版), `size` esgrandeImagen/pequeñoImagen, 
 *  `portrait` esesteuno屏Completo列都es竖屏(显筛竖屏), `javImage` es"Portada predeterminada JAV"Configuración.  */
export interface MediaCardLayout { active: boolean; size: 'big' | 'small'; portrait: boolean; javImage: string }

/** 卡片arriba仍由遗Deja层拼几段 HTML. Portada, AvataryPasar el ratónVista previa直continuar取 `@peach/card-art`.  */
export interface MediaCardHelpers {
  /** 来源角标(遗Deja层 `srcBadge`).  */
  badgeHtml(location: string, cost: string): string;
  /** Título HTML: Código JAV + 版次徽章 + 片名, 非Código JAVObrases转义posterior名字(遗Deja层 `javTitleHtml`).  */
  titleHtml(item: MediaItem, raw: string): string;
  /** 同unoTítulo纯文本, 用于Sin障碍名称(遗Deja层 `javDisplayName`).  */
  displayName(item: MediaItem, raw: string): string;
  /** EtiquetaClave到界面en la名称.  */
  tagLabel(tag: string): string;
}

/** 卡片en la动作. Abriry换página都归壳: Detallespágina, InmersivoModo y pequeño窗es遗Deja层Completopágina视Imagen.  */
export interface MediaCardActions {
  /** ReproducirMuro复用舞单unoReproducirDispositivo; Cerrar sesión时puedeEn cursoReproducir实例交给pequeño窗.  */
  wallPlayer?(item: MediaItem, frame: HTMLElement, signal: AbortSignal): Promise<(continuePlaying?: boolean) => void>;
  /** AbrirDetalles, 认领同unoObrasEn cursoReproducir实例.  */
  wallDetails?(item: MediaItem, anchor: HTMLElement): void;
  /** AbrirunoObras卡: pequeño窗开着时Enpequeño窗dentro换片, 分卷y版次组进各自Cola, 其余AbrirDetalles.  */
  open(item: MediaItem, anchor: HTMLElement): void;
  /** 回收站en launo: 视频AbrirDetalles, 本地Imagen片EnNuevoEtiquetapáginaverOriginalImagen, 其余Cambiar选en proceso.  */
  openResource(item: MediaItem, anchor: HTMLElement): void;
  /** 竖屏带en launo: 从它Empezar进InmersivoModo.  */
  openShort(item: MediaItem): void;
  /** 竖屏带TítuloarribaeseClave: 进InmersivoModo.  */
  openShorts(): void;
  /** Abrir以esteunoComoSemilla Mix.  */
  openMix(seedId: number, anchor: HTMLElement): void;
  openEntity(kind: string, name: string): void;
  /** Abrir"no归属"eseuno批.  */
  openUnowned(): void;
  /** 卡片en laEtiqueta: SoloveresteEtiqueta, ya经En筛它就Cancelar. En哪uno屏点就En哪uno屏生效.  */
  toggleTag(tag: string): void;
  /** Cambiaruno选en proceso; `range` es按住 Shift 连选.  */
  toggleSelection(id: number, range: boolean): void;
  /** Cambiar稍posteriorver. 写 ledger; ÉxitoyDeshacer都Nuevo值回给 `onChange`, Fallo由壳报.  */
  watchLater(item: MediaItem, onChange: (on: boolean) => void): Promise<void>;
  /** 回收站卡arribaeseClave: 还Original或移入回收站. 写 ledger, 做完pesado读Directorioy给Deshacer; Fallo由壳报, 再抛出.  */
  resourceOperation(item: MediaItem, operation: 'restore' | 'dispose'): Promise<void>;
  /** Mix 翻página要相关Obras, 每SemillaSolo取uno次,  y 点开posteriorCola共用.  */
  mixRelated(seedId: number): Promise<MediaItem[]>;
  /** 此刻能No能Pasar el ratón翻Página: más选, 遮挡, 减menos动效y滚动en proceso都回 false.  */
  canFlip(): boolean;
}

/** 馆藏卡片Cuadrícula. tres取数: 
 *  - `catalog`: Directorio(`/` yFiltrar态, 回收站), Filtrar态由壳 `state` 递进; 
 *  - `entity`: 资料páginaObras区, 取数由壳给(`fetchPage`), No.unopágina随página头uno起取来(`initial`); 
 *  - `items`: 壳手arribayaConuno批(DetallespáginaContinuar viendo), No取数.  */
export interface CatalogGridProps {
  mode: 'catalog' | 'entity' | 'items';
  /** IndependientePantalla completaReproducirMuro.  */
  wall?: boolean;
  helpers: MediaCardHelpers;
  actions: MediaCardActions;
  layout: MediaCardLayout;
  selectMode: boolean;
  selected: ReadonlySet<number>;
  seekSeconds: number;
  /** Actualizar代次: 壳要求pesado读时加uno, Consulta随之换Clavepesado取, Nopesado挂.  */
  revision: number;
  /** 骨架 HTML(遗Deja层 `pageSkeletonHtml`),  y 壳primero屏铺es同uno.  */
  skeletonHtml(): string;
  /** 横排continuararriba拖动滚动(遗Deja层 `wireDrag`).  */
  wireDrag(el: HTMLElement): void;
  /** uno次取数落定(Éxito, Como空或Fallo): `revision` eseseuno次代次, 壳据此放行etc.着它调用方.  */
  settled?(revision: number): void;

  /* catalog Modo */
  filters?: Readonly<Record<string, string>>;
  batchSize?: number;
  groupCollapse?: boolean;
  /** primeropáginaPredeterminadoListaExcluir竖屏(另Con竖屏带承continuar); 判据归壳.  */
  excludeVertical?: boolean;
  /** 每unopáginaNo. 8 插uno Mix.  */
  mix?: boolean;
  /** 每continuarunopágina插uno竖屏带.  */
  shorts?: boolean;
  /** 每continuarunopágina报uno次: Total数y此刻显示卡数(Mix y竖屏带No算). 壳据此推Filtrar读数, pesado画批量, 
   *  回收站读数写EnDescripción行arriba.  */
  onCount?(total: number, shown: number): void;
  /** primero屏取数Fallo: Sin读数puede报, 壳据此Filtrarese读数微光收起.  */
  onCountFailed?(): void;
  /** 空态 HTML. `libraryEmpty` esCompleto馆藏都还SinObras.  */
  emptyHtml?(state: { trash: boolean; libraryEmpty: boolean }): string;
  /** 此刻能No能自动续Página: Gestionar区或索引página盖EnDirectorioarriba时No续.  */
  canLoadMore?(): boolean;

  /* entity Modo */
  entityKey?: string;
  listScope?: string;
  initial?: MediaPage | null;
  fetchPage?(offset: number, signal: AbortSignal, options?: MediaPageOptions): Promise<MediaPage>;

  /* items Modo */
  items?: MediaItem[];
  variant?: 'grid' | 'next';
}
