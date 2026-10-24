/* 实体资料página交集, 玻璃Filtrar浮层ycontenido区头(ADR-0031 No. 10d 步): Datos形状. 
 *
 * entity-page y应用域控制Dispositivo提供Filtrar, 计数, 读数 y Ordenar项, 本模Solo绘制este些 props. 
 * Filtrar地址由控制Dispositivo写入, 再经 updateManagedRoute 推进Nuevo值, Nopesado挂; 按abajo态先于contenidoPor favor求Actualizar. 
 * 动作通过Interfaz交回página面y控制Dispositivo, 本模No拼Por favor求.  */

/** esteunopágina此刻摆es哪uno类东西.  */
export type EntityView = 'people' | 'videos' | 'photos' | 'online';

/** izquierda端eseuno组视ImagenClave. SoloConuno类东西时壳No给(`null`): uno孤ceroceroClaveSinpuede切对象.  */
export interface EntityViewKeys {
  /** esteuno组Sin障碍名: Con名册时es"página面视Imagen", 否则es"媒体Tipo".  */
  label: string;
  /** 名册Clave: Agenciapáginaes艺人, 片商páginaes旗abajoSello.  */
  people: { label: string; count: number; icon: string } | null;
  /** 本地uno部视频都Sin, SoloCon关注来源时No出: ese时Obras视Imagendentro什么也Sin, 进página就落EnEn线.  */
  videos: { count: number } | null;
  photos: { count: number } | null;
  /** 关注dentro绑Eneste创作者名abajoActualizar(ADR-0096), `count` 同资料卡eseuno句"N 项Actualizar".  */
  online: { count: number } | null;
}

/** unoEtiqueta胶囊. `label` ya按壳 `tagLabel` 译bien, `n` esesteunopáginadentro带esteEtiqueta视频数.  */
export interface EntityFilterTag {
  k: string;
  label: string;
  n: number;
  selected: boolean;
}

/** 交集en launo: `clear` 撤掉创作者/Sello/归属eseuno, `untag` 撤掉unoEtiqueta.  */
export interface EntityComboItem {
  kind: 'clear' | 'untag';
  key: string;
  label: string;
}

/** unoOrdenarClave. `ariaLabel` 播报es点abajo去会得到什么(同primeropáginaeseuno排), `dir` SoloEn选en procesoesearribaCon值.  */
export interface EntitySortKey {
  key: string;
  label: string;
  pressed: boolean;
  dir: 'asc' | 'desc' | '';
  ariaLabel: string;
}

/** 分段开关uno格: 值, 名字 y 雪碧Imagenen la字形.  */
export type SegmentOption = readonly [value: string, label: string, symbol: string];

/** Obras视Imagen表头: OrdenarClave, JAV 语境abajomásuno组卡片版.  */
export interface EntityVideoHead {
  sorts: EntitySortKey[];
  jav: { layout: string; options: readonly SegmentOption[] } | null;
}

/** 照片视Imagen表头. `back` Como真esEnunoImagen集dentro: izquierda边uno"Todo照片", derecha边más两源ArchivoClave.  */
export interface EntityPhotoHead {
  back: boolean;
  /** 本地Imagen片Con几; SoloCon样时es 0, 换uno批eseClaveNo出.  */
  shuffle: boolean;
  layout: string;
  layouts: readonly SegmentOption[];
  /** Imagen集 id, 源ArchivoClave按它定; Completopágina照片Muro时Como 0.  */
  setId: number;
}

/** En线视Imagenese几样, 同关注páginaese浮层: 视频/Imagen片两圆Clave, Estadouno排, 来源站标yEtiqueta, abajo排换uno批, 
 *  Imagen片MuroDiseñoy"仅显示Imagen片", OrdenarClave. 来源yEtiquetaSolo数esteuno名abajoEntrada(`author_facets`).  */
export interface EntityOnlineHead {
  media: 'videos' | 'images';
  /** 两档各Con几组; uno组Imagen片都Sin时No出este两Clave, 同关注página.  */
  mediaCounts: { videos: number; images: number } | null;
  photoLayout: string;
  photoLayouts: readonly SegmentOption[];
  imagesOnly: boolean;
  status: string;
  statuses: readonly (readonly [key: string, label: string])[];
  provider: string;
  providers: readonly (readonly [key: string, label: string])[];
  /** `cat` es来源记EtiquetaTipo, 药丸按它取Tipo色(`data-tag-cat`).  */
  tags: readonly { k: string; label: string; n: number; selected: boolean; cat: string }[];
  sorts: EntitySortKey[];
}

export interface EntityFilterActions {
  /** 换视Imagen(名册/视频/照片).  */
  setView(view: EntityView): void;
  /** cuatro观verEstadoen launo.  */
  setState(state: string): void;
  toggleTag(tag: string): void;
  /** 撤掉交集en launo创作者/Sello/归属.  */
  clearFilter(key: string): void;
  /** 交集último尾"TodoBorrar".  */
  clearAll(): void;
  setSort(key: string): void;
  /** 换uno批. 视频视Imagen由读数骨架说"Enetc.", 照片视ImagenClave自己转圈, etc.到este Promise 落定.  */
  reshuffle(): Promise<void>;
  setJavLayout(layout: string): void;
  setPhotoLayout(layout: string): void;
  /** Imagen集en la"Todo照片".  */
  photoBack(): void;
  /** En线视Imagen: 换媒体, 换Estado, 按abajo或抬起uno来源, unoEtiqueta, 换Ordenar, 换uno批, Imagen片Muro两样偏bien.  */
  onlineMedia(media: 'videos' | 'images'): void;
  onlineShuffle(): void;
  onlineImagesOnly(on: boolean): void;
  onlineStatus(status: string): void;
  onlineProvider(provider: string): void;
  onlineTag(tag: string): void;
  onlineSort(key: string): void;
}

/** 仍由遗Deja层给continuar线y HTML.  */
export interface EntityFilterHelpers {
  /** 横滚行continuararriba拖动y滚轮(`wireDrag`).  */
  wireDrag(row: Element | null): void;
  /** Solocontinuar滚轮y两端渐隐, Nocontinuar拖动(`wireHorizontalScroller`): estrecho屏abajo才溢出exterior层用它.  */
  wireScroller(row: Element | null): void;
  /** Imagen集ese两源ArchivoClave(`sourceTools`): 定yDirectorio对账, 照片Detallesdentro复用es同uno对.  */
  sourceToolsHtml(setId: number): string;
  /** arriba面ese两continuar到 `revealSource`/`syncMissing`; `done` En对账改动esteuno组之posteriorpesado开它.  */
  wireSourceTools(root: Element): void;
}

export interface EntityFilterProps {
  kind: string;
  name: string;
  view: EntityView;
  views: EntityViewKeys | null;
  /** 当anterior观verEstado: '', fresh, later, flagged.  */
  state: string;
  states: readonly { k: string; label: string }[];
  tags: EntityFilterTag[];
  combo: EntityComboItem[];
  /** 表头izquierda边eseuno句; `busy` 时换成骨架.  */
  readout: string;
  busy: boolean;
  video: EntityVideoHead | null;
  photo: EntityPhotoHead | null;
  online: EntityOnlineHead | null;
  actions: EntityFilterActions;
  helpers: EntityFilterHelpers;
}

/** SoloEnObras视Imagenarriba成立ese几样(观verEstado, Etiqueta, 交集). 照片 y 名册arriba它们数都es视频, 
 *  点abajo去还会视Imagen拨回视频, 所以ese两档SoloDeja视ImagenClave.  */
export const videoOnly = (view: EntityView): boolean => view === 'videos';
