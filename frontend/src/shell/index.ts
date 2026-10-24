/* 壳自己interior存Estado(ADR-0031"壳自己interior存Estado也SoloConuno"). 
 *
 * Directorio口径, Seleccionar集ySeleccionarModo, Detallesy关注Detalles"关掉回哪dentro"来处, 跳到Configuraciónpágina某uno节y活动página预Introduceeste类
 * uno次性Por favor求, CompletopáginaSoloConesteuno: Application y React página面直continuar引用共享源码, 随 `peach-app.js` 发出. 读法就es
 * ES 模活绑定, Importar方读到永远esesteen la当anterior值; Importar方No能给绑定赋值, Completo体换掉uno值走
 * `writeShell`. 
 *
 * 对象语义照壳Original样保Deja: Completo体pesado建写点经 `writeShell` 换引用, 其余写点Original地改同uno对象字段, 
 * 改完调 `notifyShell`. `barsContext.filters` y `state` 别名关系由写点自己决定, aquíNo替谁修: 
 * `writeShell({state})` Solo换 `state`, `barsContext.filters` 仍指antiguo对象, 直到写点再 `barsContext`
 * 指回来. Seleccionar集es两常驻 `Set`, Original地增删. 
 *
 * 每次写入之posterior通知订阅者, Versión号单调递增, React 读者按 `useSyncExternalStore(subscribeShell, shellVersion)`
 * continuar. 服务端事实(来源En线Estado, DirectorioTotal数, 聚合, 实体形态, 回收站计数)NoEnaquí, 归 TanStack Query; 
 * 壳判过期代次计数Dispositivo也NoEnaquí.  */

/** DirectorioFiltrar口径: Clavey地址栏en laConsultaParámetro同名(`loc`, `creator`, `tag`, `state`, `sort`, `seed`...).  */
export type CatalogFilters = Record<string, string>;

/** 顶部tres层yFiltrar此刻画es哪uno套Filtrar: primeropáginaese `state`, 某资料página, 或ObrasDetalles.  */
export interface BarsContext {
  type: 'home' | 'entity' | 'item';
  filters: CatalogFilters;
  kind?: string;
  name?: string;
  id?: number;
}

/** 此刻开着Cola, Solo用来判"esNoes同unoColadentro换uno"; ColaEntrada归Detalles岛.  */
export interface ActiveQueue {
  kind: string;
  seedId?: number;
  playlistId?: number;
}

/** Detalles岛交回来eseunoObras; 壳Solo认 `id`, 其余字段Original样Deja着.  */
export interface PresentedItem {
  id: number;
  [key: string]: unknown;
}

/** DirectorioFiltrarEstado. 启动时由壳按启动地址yGuardar过Configuración写入, aúnno写入时Como undefined.  */
export let state: CatalogFilters | undefined;
/** 顶部tres层yFiltrar语境; 启动时由壳指向primeropáginaese `state`.  */
export let barsContext: BarsContext | undefined;
/** ObrasDetallesAbriranteriorese语境, 关掉Detalles时还Original.  */
export let detailReturnBarsContext: BarsContext | null = null;

/** Directorio(含资料página, 回收站, 垃圾Archivo)y关注página各unoSeleccionar集, Completopágina常驻, Original地增删.  */
export const selected = new Set<number>();
export const followSelected = new Set<number>();
export let selectMode = false;
/** Shift 连选起点: Directorioy关注página各uno.  */
export let lastSelectedId: number | null = null;
export let followLastSelectedId: number | null = null;
/** 进SeleccionarModo时所Eneseuno类página面(`catalog`, `follow`, `junk`); 换到别uno类就Cerrar sesiónSeleccionar.  */
export let selectSurface = '';

/** 关掉ObrasDetalles回到地址.  */
export let detailReturnPath = '/';
/** 点开Detallesese卡, 以及它当时En视口abajomedio还esarribamedio; 之posteriorAbrirDetalles没带卡片时沿用esteuno.  */
export let detailOriginAnchor: Element | null = null;
export let detailOriginAbove = false;
/** 关掉Detalles时要No要照地址pesado建来处: profundo链直continuar进Detallesabajo面没画过Lista.  */
export let detailReturnNeedsRestore = false;
export let activeQueue: ActiveQueue | null = null;
/** Cola地址anterior缀: 停En哪uno要etc.Detalles岛定abajo来, 画出来eseuno刻才推.  */
export let pendingQueueRoute: string | null = null;
/** Detalles岛Recienteuno次画出来eseuno.  */
export let presentedItem: PresentedItem | null = null;
/** 关掉关注Detalles回到地址.  */
export let followDetailReturnPath = '/follow';

/** ConfiguraciónpáginaSiguiente次Abrir要选en procesoeseuno组páginaFirma, 选en proceso之posterior清空.  */
export let configurationRequestedSection = '';
/** 本机能No能改Configuración(`/healthz`  `configurable`): null es还没问过, 问到之anterior按No能算.  */
export let runtimeConfigurable: boolean | null = null;
/** esteuno次esNoes从ConfiguraciónCompletadopágina(或Tutorial卡)进来: 口味páginaAbrir时取走, 取uno次就清.  */
export let cameFromSetup = false;

/** 壳要路由树按地址Abrirpágina面次数. 壳Empezar路由eseuno次记 1: Enese之anterior来源, Configuracióny形状名单还没读完, 路由树dentro按匹配
 *  挂en lapágina面元素Solo挂着, NoAbrir. 之posterior壳每要求uno次"按当anterior地址esteunopágina从头pesado开"(批量写回之posterior, Configuración变要pesado取, 
 *  点开正es画着eseuno)就加uno. posterior退anterior进y跨página由página面Abrir序号(`@peach/history`  `openEpoch`)管, No经aquí.  */
export let pageOpens = 0;
/** ColaAbrir意Imagen代次: 真实Entradaaúnno取齐, 地址由Detallesprimero屏确定.  */
export let queueOpens = 0;
/** 资料página按No.unopáginaObras推出来 JAV 语境(壳 `javActive` 读): página面推arriba来, 资料página每Abriruno次先清掉.  */
export let entityJavLayout = false;
/** 关注páginaesteuno次进入取样Semilla: 创作者, 题材, Etiquetatres排露出哪些由它定, Lista按它取样. pesadoNuevo进入y"换uno批"时pesado掷.  */
export let followDiscoverySeed = Math.floor(Math.random() * 0xffffffff);
/** 关注páginaActualizar代次: 画着时要求pesado读(回到esteunopágina, 批量Etiqueta之posterior)推unoNuevo代次让Listapesado取, Nopesado挂.  */
export let followRevision = 0;
/** 关注Lista停En哪: 停En `/follow` arriba滚动时随手记abajo, Lista要从头画时照它滚回去; pesadoNuevo进入时清cero.  */
export let followScrollY = 0;
/** ReproducirListapáginaActualizar代次: 停Enesteunopágina时要求pesado读(顶栏"换uno批")推unoNuevo代次, página面pesado取, Nopesado挂.  */
export let playlistsRevision = 0;

/** `writeShell` 能Completo体换掉ese几项. 两Seleccionar集es常驻实例, NoEn其en proceso.  */
export interface ShellFields {
  state: CatalogFilters | undefined;
  barsContext: BarsContext | undefined;
  detailReturnBarsContext: BarsContext | null;
  selectMode: boolean;
  lastSelectedId: number | null;
  followLastSelectedId: number | null;
  selectSurface: string;
  detailReturnPath: string;
  detailOriginAnchor: Element | null;
  detailOriginAbove: boolean;
  detailReturnNeedsRestore: boolean;
  activeQueue: ActiveQueue | null;
  pendingQueueRoute: string | null;
  presentedItem: PresentedItem | null;
  followDetailReturnPath: string;
  configurationRequestedSection: string;
  pageOpens: number;
  queueOpens: number;
  entityJavLayout: boolean;
  followDiscoverySeed: number;
  followRevision: number;
  followScrollY: number;
  playlistsRevision: number;
  runtimeConfigurable: boolean | null;
  cameFromSetup: boolean;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

/** Completo体换掉补丁dentro出现ese几项(值es undefined 也照写), 然posterior通知uno次. Solo换绑定, No碰别项.  */
export function writeShell(patch: Partial<ShellFields>): void {
  const has = (key: keyof ShellFields) => Object.prototype.hasOwnProperty.call(patch, key);
  if (has('state')) state = patch.state;
  if (has('barsContext')) barsContext = patch.barsContext;
  if (has('detailReturnBarsContext')) detailReturnBarsContext = patch.detailReturnBarsContext!;
  if (has('selectMode')) selectMode = patch.selectMode!;
  if (has('lastSelectedId')) lastSelectedId = patch.lastSelectedId!;
  if (has('followLastSelectedId')) followLastSelectedId = patch.followLastSelectedId!;
  if (has('selectSurface')) selectSurface = patch.selectSurface!;
  if (has('detailReturnPath')) detailReturnPath = patch.detailReturnPath!;
  if (has('detailOriginAnchor')) detailOriginAnchor = patch.detailOriginAnchor!;
  if (has('detailOriginAbove')) detailOriginAbove = patch.detailOriginAbove!;
  if (has('detailReturnNeedsRestore')) detailReturnNeedsRestore = patch.detailReturnNeedsRestore!;
  if (has('activeQueue')) activeQueue = patch.activeQueue!;
  if (has('pendingQueueRoute')) pendingQueueRoute = patch.pendingQueueRoute!;
  if (has('presentedItem')) presentedItem = patch.presentedItem!;
  if (has('followDetailReturnPath')) followDetailReturnPath = patch.followDetailReturnPath!;
  if (has('configurationRequestedSection')) configurationRequestedSection = patch.configurationRequestedSection!;
  if (has('pageOpens')) pageOpens = patch.pageOpens!;
  if (has('queueOpens')) queueOpens = patch.queueOpens!;
  if (has('entityJavLayout')) entityJavLayout = patch.entityJavLayout!;
  if (has('followDiscoverySeed')) followDiscoverySeed = patch.followDiscoverySeed!;
  if (has('followRevision')) followRevision = patch.followRevision!;
  if (has('followScrollY')) followScrollY = patch.followScrollY!;
  if (has('playlistsRevision')) playlistsRevision = patch.playlistsRevision!;
  if (has('runtimeConfigurable')) runtimeConfigurable = patch.runtimeConfigurable!;
  if (has('cameFromSetup')) cameFromSetup = patch.cameFromSetup!;
  notifyShell();
}

/** Original地改 `state`, `barsContext` 字段或Seleccionar集之posterior调它: Versión号加uno, 通知Todo订阅者.  */
export function notifyShell(): void {
  version += 1;
  for (const listener of [...listeners]) listener();
}

/** 订阅每uno次写入; 返回退订函数.  */
export function subscribeShell(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
}

/** 单调递增Versión号, 每次写入加uno.  */
export const shellVersion = (): number => version;
