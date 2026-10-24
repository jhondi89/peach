/* primeropáginaFiltrar(`catalog-filter` página面interior组件, ADR-0031 No. 11b 步): Datos形状. 
 *
 * 壳(`Application`  `buildBars` uno族)拥ConDirectorioFiltrar, 路由y取数: 两排Avatar, Etiqueta成员y
 * 按abajo态, cuatro视Imagen, 读数, OrdenarClave y 版都由壳算bien当 props 递进来, 岛Solo画. Filtraruno变壳就用
 * `updateManagedRoute` 推unoNuevo, Nopesado挂; 按abajo去Comentarios(`aria-pressed` y滑动玻璃)靠壳En发Por favor求之anterior
 * 先推uno次. 动作Todo回壳, 岛No自己拼Por favor求: Ordenar, 换uno批y版回壳posterior走 `loadCatalog`, 也就es
 * `catalog-grid` yaConesepesado取入口. 
 *
 * 交集yOrdenarClave, 换uno批, 版开关 y 资料páginaeseuno(`entity-filter`)es同uno清单, 同uno组组件.  */
import type { EntityComboItem, EntitySortKey, SegmentOption } from '../entity-filter/entity-filter';

export type { EntityComboItem, EntitySortKey, SegmentOption };

/** Avataren launoActriz. 圆框dentroese两层(primero字母yAvatarImagen)由遗Deja层 `entityFaceImg` 拼: 取景, 
 *  回落Imageny异步解码都Enesedentro, React No拥Condentro面节点.  */
export interface TierPerformer {
  name: string;
  ringHtml: string;
}

/** Selloeseuno排uno. `logo` es方形Imagen标地址, 没装标识时Como空, Solo画primero两字.  */
export interface TierStudio {
  name: string;
  logo: string;
  fallback: string;
}

export type TierKind = 'performers' | 'studios';

/** 两排Avatar. 每排手arribaestees壳esteuno趟取回Completopágina; 岛先摆uno屏, 横滚到derecha端再往abajo续, 手en la用完
 *  再经 `actions.moreTops` 要Siguientepágina. `key` 变(换口径或换uno批)两排从头摆.  */
export interface CatalogTiers {
  key: string;
  performers: TierPerformer[];
  studios: TierStudio[];
}

/** Etiquetaen launo. `n` Como空Descripcióneste生效EtiquetaNoEnesteuno批dentro, No印数字: 印 0 会说成
 *  "esteEtiquetaabajo什么都Sin", 而它此刻正筛着uno屏contenido.  */
export interface CatalogTag {
  k: string;
  label: string;
  n: number | null;
  selected: boolean;
}

/** izquierda端cuatro视Imagen: Todo, 没ver过, 稍posteriorver, yaEtiqueta. `href` es它自己地址, React 包没到时照常换página.  */
export interface CatalogView {
  k: string;
  label: string;
  href: string;
}

/** 读数derecha边ese组分段开关: primeropáginay JAV 各存uno卡片版.  */
export interface CatalogLayout {
  name: 'home-layout' | 'jav-layout';
  label: string;
  value: string;
  options: readonly SegmentOption[];
}

export interface CatalogFilterActions {
  currentHref?(): string;
  /** Avataren launo格: Abrireseuno资料página.  */
  openEntity(kind: 'performer' | 'studio', name: string): void;
  /** cuatro视Imagenen launo.  */
  setView(view: string): void;
  toggleTag(tag: string): void;
  /** 撤掉交集en launo创作者/Sello/归属.  */
  clearFilter(key: string): void;
  /** 交集último尾"TodoBorrar".  */
  clearAll(): void;
  setSort(key: string): void;
  /** 换uno批: Cuadrículaytres层成员uno起换, 换批Clave转圈到este Promise 落定.  */
  reshuffle(): Promise<void>;
  setLayout(value: string): void;
  /** 某uno排手arribaeste摆完, 要Siguientepágina. 返回空数组就es到底.  */
  moreTops(kind: TierKind): Promise<TierPerformer[] | TierStudio[]>;
}

/** 仍由遗Deja层给continuar线.  */
export interface CatalogFilterHelpers {
  /** 横滚行continuararriba拖动y滚轮(`wireDrag`).  */
  wireDrag(row: Element | null): void;
  /** Solocontinuar滚轮y两端渐隐, Nocontinuar拖动(`wireHorizontalScroller`): estrecho屏abajo才溢出exterior层用它.  */
  wireScroller(row: Element | null): void;
}

export interface CatalogFilterProps {
  /** 两排Avatar. primero屏还Enetc.两聚合Consulta时Como空: 两排yEtiqueta摆占加uno道微光, cuatro视Imagenyabajo排照常.  */
  tiers: CatalogTiers | null;
  /** 空馆藏: 两排yEtiqueta摆uno行占, 说es"aquí将来会Con东西".  */
  empty: boolean;
  /** Etiqueta成员, ya选排En最anterior; anterior `tagFirst` 先摆, 其余横滚到derecha端再续.  */
  tags: CatalogTag[];
  tagFirst: number;
  views: readonly CatalogView[];
  /** 当anterior视Imagen: '', fresh, later, flagged, trash.  */
  state: string;
  /** 读数. 取数期间Como空, 换成uno微光; `false` esesteuno趟取数Fallo, 读数收起, FalloyReintentar由CuadrículaeseSugerencia说.  */
  count: { total: number; shown: number } | null | false;
  /** 回收站es待LimpiarCola: 读数挂EnDescripción行arriba, aquíSinabajo排.  */
  trash: boolean;
  sorts: EntitySortKey[];
  layout: CatalogLayout | null;
  /** 换uno批esteuno趟: tres层yEtiqueta铺uno层微光, 换批Clave转圈.  */
  refreshing: boolean;
  /** Filtrar被收起(资料página, 索引páginayGestionarpágina): 浮层两排No画, SoloDeja两排Avatar.  */
  offscreen: boolean;
  combo: EntityComboItem[];
  /** 交集SoloEnDirectorio铺En屏幕arriba时Con所指; 索引página, 资料páginayGestionarpágina盖住Directorio时收起.  */
  comboHidden: boolean;
  /** 交集宿主(`#combo`): 它住En正文dentro, Cuadrículaarriba面, No y Filtrar挨着.  */
  comboHost: Element | null;
  actions: CatalogFilterActions;
  helpers: CatalogFilterHelpers;
}

/** primero屏先摆másmenos, 往posterioruno次续másmenos. uno排dentro每Avatar都esuno要解码Imagen, 手arribaesteTodo画出来
 *  etc.于让primero屏替unomásmedioNo会滚到ese么远人买单.  */
export const ROW_FIRST = 24;
export const ROW_BATCH = 12;
/** 离derecha端还剩este么más就续: 滚到eseuno刻才Empezar画, 手底abajoya经esuno段空白.  */
export const ROW_AHEAD = 320;
/** 空馆藏占每排摆másmenos格, 由容Dispositivo裁到puede用ancho度.  */
export const EMPTY_SLOTS = 64;
