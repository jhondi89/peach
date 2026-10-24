/* Application 交给路由树能力, 经 Context abajo发给路由树画ese几página. 
 *
 * aquíSolo放两类东西: 换到还归壳eseuno屏(Directorio, 资料página, Detalles, 关注, 垃圾Archivo),  y SoloCon壳才Con
 * Estado或回执(Toast, 偏bien存储, uno次性arribaabajo文). 纯查表助手(`tagLabel`, `javTitleHtml`)由página面
 * 从 `@peach/legacy/*` 直continuar import; 每次Abrir才算得出值(Solo读Estado, 地址en laCategoríaypágina签, 引导Etiqueta)
 * 跟着eseuno次Abrir走, NoEnaquí.  */

import type { OverlayTarget } from '@peach/history';
import type { ConfigurationPath } from '@peach/history';

import type { LibraryProcessingProps } from '../bundle';
import type { CatalogFilterProps } from '../catalog-filter/catalog-filter';
import type { CatalogGridProps, MediaCardActions, MediaCardHelpers } from '../catalog-grid/types';
import type { EntityPageProps } from '../entity-page/entity-page';
import type { FeedNewProps } from '../feed-new/feed-new';
import type { OnlineAuthor } from '../follow/online-vocab';
import type { FollowFeedProps } from '../follow-feed/follow-feed';
import type { IndexKind, IndexPerson, IndexRoute, PeopleLayout, PersonAvatar } from '../index/index-data';
import type { JunkQueueProps } from '../junk-queue/junk-queue';
import type { SearchProps } from '../search/search';

export interface ShellActions {
  openSettings?(section: string): Promise<unknown>;
  closeSettings?(): void;
  /** AbrirObrasDetalles(舞).  */
  openItem(id: number): void;
  /** Abrir实体资料página. `kind` es `creator`/`performer` etc..  */
  openEntity(kind: string, name: string): void;
  /** 回Directorioy按esteEtiquetaFiltrar.  */
  openTag(key: string): void;
  /** 口味página点uno名次: Etiqueta回DirectorioFiltrar, 人名进资料página.  */
  openTasteSignal(kind: string, name: string): void;
  /** 换到unoRuta: push unoNo认领地址, 像posterior退anterior进uno样领unopágina面Abrir序号, 由página面组按匹配Abrireseunopágina.  */
  navigate(path: string): void;
  /** 按Gestionar区身进uno屏(路由表dentro `section` etc.于它No.uno; 认No出落到垃圾Archivo).  */
  openManage(section: string): void;
  /** Gestionar区身对应Ruta; 路由表dentroSineste身时es空串.  */
  managePath(section: string): string;
  /** 去"verActualizar"eseunopágina(`/follow`).  */
  openFollow(): void;
  /** 过去时回执(`actionReceipt`); 给 `undo` 就带unoDeshacerClave.  */
  receipt(message: string, options?: { undo?: () => Promise<void> }): void;
  /** Todo站 Toast Original样(`toast`): `sound` 选Sugerencia音.  */
  toast(message: string | { text: string }, options?: { sound?: string }): void;
  /** Fallo回执(`actionFailure`): `action` es没做成ese件事.  */
  failure(action: string, error: unknown): void;
  /** En资源GestionarDispositivodentro显示esteArchivo, Fallo回uno句Original因.  */
  revealSource(id: number): Promise<string>;
  /** 让InstalarTutorialpesadoNuevo出现.  */
  reopenTutorial(): Promise<void>;
  /** Siguiente次AbrirConfiguraciónpágina时选en procesopágina签, Solo交给eseuno次.  */
  requestConfigurationSection(section: string): void;
  /** 复核páginaCategoría写回地址栏, Nopesado开.  */
  routeReview(params: { category: string }): void;
  /** 关注Gestionarpáginapágina签, página码yOrdenar写回地址栏, Nopesado开.  */
  routeFollowManage(params: { tab: string; page: number; sort: string; dir: string }): void;
  /** 关注Gestionarpágina偏bien改, 存储归壳.  */
  saveFollowPreference(patch: { pageSize?: number; layout?: string }): void;
  /** 来源徽标(含计费Etiqueta) HTML.  */
  srcBadge(location: string, cost: string): string;
  /** 索引páginaFiltrar词, Rango, 视ImagenyTipo写回地址栏, Nopesado开. `replace` 用En打字Filtrareseuno路改写场合.  */
  routeIndex(params: IndexRoute, options?: { replace?: boolean }): void;
  /** 索引página版偏bien改, 存储归壳(资料página名册读也es它).  */
  savePeopleLayout(patch: { layout: PeopleLayout }): void;
  /** Cerrar sesión顶栏SeleccionarModo: Clave归壳.  */
  exitSelectMode(): void;
  /** 本地名册uno格Avatar(圆框dentroese段 HTML y人脸取景), 回落链En壳dentroSoloConuno.  */
  personAvatar(item: IndexPerson, entityKind: string, big: boolean): PersonAvatar;
  /** En线创作者uno格Avatar HTML: 主páginaAvatar优先, 归档兜底, 都取No到落回primero字母.  */
  authorAvatar(author: OnlineAuthor): string;
  /** 回Directorio, 按esteuno或este几本地EtiquetaFiltrar.  */
  showIndexTags(tags: string[], match: 'any' | 'all'): void;
  /** 去关注página, Soloveresteuno创作者或esteunoEn线EtiquetaActualizar.  */
  openFollowAuthor(key: string): void;
  openFollowTag(tag: string): void;
  /** AbrirunoReproducirListaReproducirCola(舞), 从 `resumeAssetId` eseunocontinuar着播.  */
  openPlaylist(id: number, resumeAssetId: number): void;
  /** 此刻能No能Pasar el ratón翻Página: 壳más选, 遮挡, 减menos动效y滚动en proceso都回 false.  */
  canFlip(): boolean;
  /** página面组换unoPágina: 路由树en lapágina面元素挂arriba, Empezar取数之anterior报uno次. 壳收起AnteriorpáginaDejaabajo面(Pasar el ratónVista previa, En途读Por favor求, 
   *  primeropáginaNuevas obras行, 别容Dispositivodentroeseunopágina), 再按类铺开: Gestionar区, 关注páginayReproducirListapágina铺 `#stats`, 索引página, 
   *  资料páginayDirectorio铺primeropáginaeseuno侧.  */
  surfaceChanged(kind: SurfaceKind, path: string): void;
  /** 清空顶栏Buscar框(带散开残影).  */
  clearSearch(): void;
  /** AbrirInmersivoModo, 从 `id` eseunoEmpezar; No给就从头. 地址由调用方负责.  */
  openImmerse(id?: number): void;
  /** Abrir覆盖地址en laeseuno(ObrasDetalles, Colaen launo或关注Detalles), 地址ya经Enesedentro, No再写.  */
  openOverlay(target: OverlayTarget): void;
  /** 取走uno次ColaAbrir意Imagen: EsperandoCola定abajo实际Entrada, primero屏确定posterior才写Detalles地址.  */
  openQueueRequest?(): void;
  /** Detalles舞开着就收起(En curso放视频照antiguo进pequeño窗), No写地址.  */
  closeStage(): void;
  /** DirectorioCuadrícula卡片助手y动作: 壳dentro各uno, 身No变(卡片按引用比较), 资料páginaObras区yDirectorio共用.  */
  readonly grid: { helpers: MediaCardHelpers; actions: MediaCardActions };

  // ── 索引páginay资料página元素用(`pages/index-entity.tsx`): 取都esSoloCon壳才ConEstado ──
  /** 本机能No能改Configuración: 壳启动时探过uno次ese值, 索引página交给página面.  */
  configurable?(): boolean;
  /** 元素Abrireseunopáginaprimero屏画arriba之posterior报uno次: 索引página让壳Sincronizar侧栏y顶栏, 排吸顶; 资料página让壳按esteunopágina语境pesado画顶部
   *  tres层.  */
  surfaceShown?(kind: 'index' | 'entity', path: string): void;
  /** 资料páginaese几样仍En壳en la东西.  */
  readonly entity?: EntityPageShell;

  // ── 关注yReproducirLista用(`pages/follow.tsx`)──
  /** 关注páginaese几样仍En壳en la东西.  */
  readonly follow?: FollowFeedShell;

  // ── Directorio用(`pages/catalog.tsx`): 来源En线表, Buscar框, 顶部tres层y取数都还En壳dentro ──
  /** primeropágina, tresFiltrar态, 回收站y垃圾ArchivoAbrirypesado取时回到壳ese几步.  */
  readonly catalog?: CatalogShell;
}

/** 关注página元素Abrir时回到壳ese几步. Filtrareseuno由壳从地址读进自己变量(回到关注página时按它写地址, 侧栏, Etiqueta
 *  抽屉y关注Detalles也读它), Seleccionar集, 照片Muro偏bienypágina面借用助手 y 动作也都En壳dentro; 进página骨架y冷启动铺es同uno.  */
export interface FollowFeedShell {
  /** 按地址读uno遍Filtrar. 关注página还画En `#stats` dentro(资料página压过来时Solo藏起来)就铺开它, Filtrar, 取样SemillayunoNuevo
   *  Actualizar代次推过去, 照片Muro跟arriba, 回到顶arriba, 回 true; 没画着回 false, 由元素CompletopáginaAbrir.  */
  refresh(): boolean;
  /** 进página骨架.  */
  skeleton(): string;
  /** CompletopáginaAbrir交给página面 props: Filtrar, 取样SemillayActualizar代次, Seleccionar集, 照片Muro偏bien, 以及壳dentroeseuno助手y动作.  */
  props(): FollowFeedProps;
  /** 关注Detallesabajo面eseuno层(profundo链, 或posterior退anterior进落到关注Detallesarriba时Lista没画着): 舞arriba开着Noes关注Detalles就先收起, 再铺开
   *  Gestionar区eseuno侧; Lista还画En `#stats` dentro就Original样Deja着, 没画着就清空 `#stats`, Listaetc.关掉Detalles才Abrir.  */
  ground(): void;
}

/** Directorio元素回到壳ese几步. Filtrar由元素按地址写进 `@peach/shell`  `state`, 之posterior事归壳.  */
export interface CatalogShell {
  /** 地址没写 `loc` 时来源: 缺省ese几dentro摘掉此刻脱盘(壳En启动ypesadoNuevo检测时记abajoeseuno).  */
  defaultLoc(): string;
  /** 按刚写bien `state` AbriresteunoPágina: 从别处回到primeropágina(`entering`)先作废顶部tres层缓存; 回收站清空Buscar框y铺开primeropágina
   *  eseuno侧, 其余páginaBuscar框对齐 `state.q`; 再Sincronizar侧栏y顶栏, pesado画顶部tres层, 取Directorio. `retitle`: 地址刚由元素改写, 
   *  TítuloyTutorialEstado跟着pesado读.  */
  open(path: string, options?: { entering?: boolean; retitle?: boolean }): void;
  /** Filtrary地址ya经由壳写bien: 按它们pesado取Directorio.  */
  load(): void;
  /** SinFondoObrasDetallesyCola地址(profundo链, Actualizar)abajo面补画DirectorioCuadrícula: Cuadrícula没被占着, 又es启动eseuno或还铺着Directorio骨架时, 
   *  按当anterior地址取uno次(Noesprimeropágina口径, No写Filtrar).  */
  fill(): void;
  /** 离开Directorio: 收起 `#grid` eseunopáginayprimeropáginaNuevas obras行.  */
  release(): void;
}

/** 资料página元素Abrir时回到壳ese几步. 骨架dentropuedeConpuedeSin几按形状名单画, 名单, Directorio卡片RelaciónyNuevas obras骨架都En壳dentro; 
 *  Filtrar按地址解出要用壳Ordenar偏bien; 就地推要动壳顶部tres层y侧栏.  */
export interface EntityPageShell {
  missing(kind: string): void;
  /** 铺进página骨架: 形状名单还En路arriba时先etc.它unoabajo, `current` 回 false 就No铺; 铺完pesado取uno遍名单, 回来时补齐骨架
   *  dentroese几.  */
  loading(kind: string, name: string, current: () => boolean): Promise<void>;
  /** esteuno次Abrir交给página面 props: Filtrary视Imagen按地址en laConsulta串解出(从别处点进来eseuno次uno律从头), 展示Configuración, 
   *  助手y写操作都es壳eseuno. 卡片y宿主由元素补arriba.  */
  props(kind: string, name: string, search: string): Omit<EntityPageProps, 'card' | 'hosts'>;
  /** posterior退anterior进落En画着同uno另uno地址arriba: 地址en laFiltrary视Imagen推给画着eseunopágina, 顶部tres层y侧栏跟着就地改. 
   *  esteunopágina没画着时回 false, 由元素Completopáginapesado开.  */
  refresh(kind: string, name: string, search: string): boolean;
}

/** página面组dentrounopágina类, 壳按它决定铺哪uno侧(`surfaceChanged`).  */
export type SurfaceKind = 'management' | 'index' | 'entity' | 'catalog' | 'follow' | 'playlists';

/** Gestionar区ese几página每次Abrir时交给página面值, 由página面元素从地址, 偏bieny壳Estado算(`pages/managed.tsx`), 按página面分. 
 *  Gestionar区ese几página画进 `#stats`.  */
export interface ManagedOpenProps extends Record<ConfigurationPath, { section?: string }> {
  '/jav': { tab: string; readOnly: boolean };
  '/stats': { configurable: boolean };
  '/taste': { onboarding: boolean };
  '/review': { category: string; readOnly: boolean; readOnlyMessage: string; writerUrl: string };
  '/data-cleanup': Record<string, never>;
  '/duplicates': Record<string, never>;
  '/quality-goals': Record<string, never>;
  '/sources': Record<string, never>;
  /** `section`: primero帧选en procesoeseuno组páginaFirma, 取走 `requestConfigurationSection` 记abajoeseuno次(地址带 `#peachProxy` 时es"网络yAcceder").  */
  '/settings/library': { section?: string };
  '/tasks': Record<string, never>;
  '/subscriptions': {
    tab: string; page: number; sort: string; dir: string; pageSize: number; layout: string;
    readOnly: boolean; readOnlyMessage: string; writerUrl: string;
  };
}

export type ManagedPath = keyof ManagedOpenProps;

/** ReproducirListapáginay关注página同样画进 `#stats`, peroNoesGestionar区: 由路由树元素按匹配Abrir(`pages/follow.tsx`), 从壳dentro
 *  进来由壳认领写地址再要求pesado开(关注página回到时带arriba离开时Filtrar, pesadoNuevo进入还要pesado掷取样Semilla, 回到干净
 *  `/follow`), 所以No进 `ManagedPath`. 每次Abrir交进来值同样按página面分, 之posterior开关经 `updateManagedRoute`
 *  推进来. 关注página助手y动作es壳dentro各uno, 身No变对象(卡片按引用比较), 跟着Abrir走: 它们拼 HTML, 
 *  碰 DOM y写地址都还En壳dentro.  */
export interface BrowseOpenProps {
  '/playlists': { revision: number };
  '/follow': FollowFeedProps;
}

export type BrowseRoutePath = keyof BrowseOpenProps;

/** DirectorioCuadrículay垃圾Cola画进 `#grid`, 同样No算Gestionar区: Directorio元素(`pages/catalog.tsx`)按地址Filtrar写进壳
 *  `state`, 进primeropágina还要pesado掷Semilla, 回收站Filtrar钉成 `trash`; 作废顶部tres层缓存, 摆Buscar框y取数经
 *  `ShellActions.catalog` 回到壳. 表按página面分Clave, No按
 *  地址: Directorio各Rutay回收站画都es `/` esteunopágina, CuadrículaEn `/trash` Abrir之posterior去 `/` es就地推; `/junk-files`
 *  es垃圾Colaeseunopágina, `?state=ads` 落En `/` arriba时画也es它. Abrir时交进来es壳eseunoCompleto props(Filtrar或
 *  Categoría, 版, Seleccionar态y卡片助手 y 动作), 之posterior换Filtrar, 换版, SeleccionarModoyActualizar代次经
 *  `updateManagedRoute` 推进来. 卡片助手y动作es壳dentro各uno, 身No变对象(卡片按引用比较), 
 *  DirectorioCuadrículaeseuno资料páginaObras区yDetallesContinuar viendo也En用, 所以跟着Abrir走, No进 `ShellActions`.  */
export interface CatalogOpenProps {
  '/': CatalogGridProps;
  '/junk-files': JunkQueueProps;
}

export type CatalogPagePath = keyof CatalogOpenProps;

/** 索引página每次Abrir交进来值: 地址栏en laese几项(壳从地址读出), esteExplorar dispositivo版偏bien, 顶栏SeleccionarClave
 *  现值,  y 本机能No能改Configuración. SeleccionarClave之posterior开关经 `updateManagedRoute` 推进来.  */
export interface IndexOpenProps extends IndexRoute {
  layout: PeopleLayout;
  selectMode: boolean;
  configurable: boolean;
}

/** 索引cincopágina画进 `#index`, uno名册unoRuta.  */
export type IndexRoutePath = `/${IndexKind}`;
export type IndexOpenPropsTable = { [Path in IndexRoutePath]: IndexOpenProps };

/** 资料página画进 `#index`, 每实体unoModo(名字dentropuede能带斜杠, 吃掉剩abajoTodo段). 类y名字跟着Abrir走, 
 *  名字es壳从地址解码出来eseuno.  */
export type EntityRoutePath = '/performers/*' | '/studios/*' | '/creators/*' | '/series/*' | '/agencies/*' | '/tags/*';

/** página面en lapágina面interior组件, 按名字登记, 各画进壳uno容Dispositivo: primeropáginaFiltrar(`#catalogFilter`), primeropáginaNuevas obras行(`#feedNew`), 
 *  顶栏Buscarabajo拉(`#searchMenu`). props 由壳算bien, Completo交进来, 
 *  之posterior经 `updateManagedRoute` 推补丁.  */
export interface SurfaceOpenProps {
  'catalog-filter': CatalogFilterProps;
  'feed-new': FeedNewProps;
  'library-processing': LibraryProcessingProps;
  search: SearchProps;
}

export type SurfaceName = keyof SurfaceOpenProps;

/** 常驻组件, 按名字登记, 宿主就esese常驻节点: 底部批量(`[data-batch-dock]`), 侧栏配色卡(`#boardGlowMenu`), 
 *  Gestionar区página头(`[data-manage-header]`), InmersivoModo(body último尾 `[data-immerse-host]`), Configuración面板
 *  (`[data-settings-host]`, No.uno次Abrir时放进 body último尾), 侧栏(`#drawerScroll`)y舞(body último尾
 *  `[data-stage-host]`, No.uno次AbrirDetalles时放进去). Abrir时No带 props(`openResidentSurface`), contenido由壳经各自
 *  命令句柄推进组件自己 store.  */
export interface ResidentOpenProps {
  'batch-dock': Record<string, never>;
  'glow-picker': Record<string, never>;
  'manage-header': Record<string, never>;
  immerse: Record<string, never>;
  'settings-panel': Record<string, never>;
  sidebar: Record<string, never>;
  stage: Record<string, never>;
}

export type ResidentName = keyof ResidentOpenProps;
