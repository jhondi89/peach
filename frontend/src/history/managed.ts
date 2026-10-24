/* 由路由画ese几páginaypágina面en lapágina面interior组件(ADR-0031"página面ypágina面en lapágina面interior组件Solo由路由树画"): 壳决定什么时候开, 
 * 什么时候收, React 路由树画. 
 *
 * página面画进壳tres容Dispositivo: Gestionar区正文 `#stats`, 索引páginay资料página共用 `#index`, DirectorioCuadrículay垃圾Cola共用
 * `#grid`. página面interior组件各Con自己容Dispositivo: primeropáginaFiltrar `#catalogFilter`, primeropáginaNuevas obras行 `#feedNew`, 
 * 顶栏Buscarabajo拉 `#searchMenu`. uno容Dispositivo同时SoloConunopágina(或uno面), 各容Dispositivo各记各: 
 * 资料página画进 `#index` 时, Gestionar区eseunopáginaSoloes被壳藏起来, 照antiguo活着(Con轮询página面照着Original节律取数), etc.壳Siguiente次
 * 认领表面(`claimSurface`)才 `#stats` y `#index` uno起收; `#grid` NoEn其en proceso, Directoriointerior换Filtrar也认领表面, Cuadrícula
 * 要uno直画着; página面interior组件由壳按各自路由判据收, Buscarabajo拉壳从No收. página面跟着aquí登记eseuno走, No跟着
 * 地址匹配走: Detalles舞压Enpágina面arriba时地址es `/assets/:id`, página面要Deja着. 
 *
 * 常驻组件(批量, 配色卡, Gestionar区página头, InmersivoModo, Configuración面板, 侧栏, 舞)No跟某unopágina走, 经 `openResidentSurface` Abrir: 
 * Sinprimero屏取数, uno直算当anteriorpágina, 宿主就esese常驻节点. 它们从No收; SoloConError边界会卸掉它组件, 而且Solo卸组件, 
 * No撤宿主. 
 *
 * 登记Clavees"面": página面用Ruta(`/stats`, `/performers/*`, `/`), página面interior组件y常驻组件用名字(`search`, 
 * `batch-dock`), 两者Nopesado叠, 路由树按Clave查同uno组表(`react/router/managed-routes.tsx`). 
 *
 * uno次Abrir: 壳铺bien骨架posterior调 `openManagedRoute`, aquí先收起同uno容Dispositivoen laAnteriorpágina, 再取primero屏; 取齐, 壳也还停En
 * esteunopágina时, En同unoTareadentro换掉骨架, 放进宿主, 再让路由树Sincronizar画出Completopágina. 路由树还没continuararriba时, Abrir先etc.它continuararriba
 * 再取数(Buscarabajo拉En壳模求值时就Abrir, 早于 `loadRouter`). 每次Abrir都领unoNuevo代次, página面按代次pesado挂, 
 * pesado取. Abrir之posterior壳开关(SeleccionarModo, 换Filtrar, 换版)经 `updateManagedRoute` 合进同unopágina props: 代次No变, 
 * página面就地pesado渲染, Nopesado挂也Nopesado取.  */

/** 画En某容Dispositivoen laeseunopágina(或uno面). `host` espágina面 portal 进去ese `.peach-react` 宿主.  */
export interface ManagedEntry {
  /** 登记Clave: página面Ruta, 或página面interior组件名字.  */
  path: string;
  props: object;
  revision: number;
  /** 壳容Dispositivo(`#stats`, `#index`, `#grid` 或某página面interior组件容Dispositivo).  */
  container: Element;
  host: HTMLElement;
  /** 常驻组件: 宿主es壳节点, 收起y抛错时Solo卸组件, No撤宿主.  */
  resident: boolean;
}

/** 路由树交给esteen laprimero屏取数: 按登记Clave取, en proceso止posterior抛 `AbortError`.  */
export type ManagedPrefetch = (path: string, props: object, signal: AbortSignal) => Promise<void>;

export interface ManagedOpenOptions {
  /** página面画进容Dispositivo.  */
  container: Element;
  /** 壳换página判据: 取数期间用户走开, 就No画.  */
  isCurrent: () => boolean;
  /** 壳自己排bien框架: 取齐primero屏eseuno刻由它框架换进容Dispositivo, 返回página面画进去宿主. No给就清空容Dispositivo, 
   *  放进unoNuevo `.peach-react`. 资料página要este: 浮层吸顶要它父盒就es `#index`, Nuevas obraseseuno行es遗Deja层
   *  卡片, No进 `.peach-react`, 所以框架cuatro由壳排, página面Solo占其en procesouno, 再经 portal 画进另exteriortres.  */
  place?: (container: Element) => HTMLElement;
  /** 常驻组件(`openResidentSurface` Abrirese几座): 宿主归壳, 收起y抛错时Solo卸组件, No撤宿主.  */
  resident?: boolean;
}

/** 订阅者收到es此刻各容Dispositivoen lapágina面. `sync` Como真时要当场画完: 壳En同unoTareadentro刚换arriba或撤掉宿主, 
 *  晚uno拍就esuno帧空白. Como假es就地Actualizar, 照常排进Siguiente次渲染.  */
type ManagedListener = (entries: readonly ManagedEntry[], sync: boolean) => void;

interface Pending { revision: number; controller: AbortController }

/* 路由树continuararriba取数之anterior, Abrir都etc.Enaquí; continuaren laeseuno装载Fallo时, etc.着Abrir跟着Fallo.  */
let connect: (ready: Promise<ManagedPrefetch>) => void = () => {};
const prefetcher = new Promise<ManagedPrefetch>((resolve) => { connect = resolve });
prefetcher.catch(() => {});
/* primero次Abrir时调用应用登记就绪入口, 让Buscarabajo拉yprimero屏FiltrarEsperando路由树Conectarposterior取数. 
 * página面代码yaEn主包en proceso, 就绪入口Solo调用uno次.  */
let preload: (() => void) | null = null;
export function preloadManagedRoutes(load: () => void): void {
  preload = load;
}
const entries = new Map<Element, ManagedEntry>();
const pending = new Map<Element, Pending>();
let revision = 0;
const listeners = new Set<ManagedListener>();

/** 路由树装载时continuararriba取数. Solo认No.uno次.  */
export function connectManagedRoutes(ready: Promise<ManagedPrefetch>): void {
  connect(ready);
}

/** 此刻画Eneste容Dispositivoen laeseunopágina; 还En取primero屏或ya经收起时es null.  */
export function managedEntry(container: Element): ManagedEntry | null {
  return entries.get(container) ?? null;
}
/** este容Dispositivo归路由树: ya经画着, 或primero屏还En取. 壳据此判断要No要再开uno次: En途时再开会eseuno趟en proceso止, 
 *  pesado取uno遍, 画着时再开会先收起再pesado画, contenido根本没变时eseunoabajoSoloesuno次白白Diseño塌陷.  */
export function managedTaken(container: Element | null): boolean {
  return !!container && (entries.has(container) || pending.has(container));
}
/** 此刻画着Todopágina面, 路由树按它画 portal.  */
export const managedEntries = (): readonly ManagedEntry[] => [...entries.values()];

/** 路由树订阅: 每次换página, 收起或就地Actualizar都Sincronizar通知.  */
export function listenManagedEntry(listener: ManagedListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
}

function notify(sync: boolean): void {
  const shown = managedEntries();
  for (const listener of [...listeners]) listener(shown, sync);
}

/** Abrirunopáginayetc.primero屏Llegar. 画arriba回 true; 期间被收起, 被pesado开或壳ya换página回 false.  */
export async function openManagedRoute(path: string, props: object, options: ManagedOpenOptions): Promise<boolean> {
  const { container } = options;
  releaseManagedRoute(container);
  if (!options.isCurrent()) return false;
  revision += 1;
  const mine: Pending = { revision, controller: new AbortController() };
  pending.set(container, mine);
  const load = preload;
  preload = null;
  load?.();
  const prefetch = await prefetcher;
  if (pending.get(container) !== mine) return false;
  try {
    await prefetch(path, props, mine.controller.signal);
  } catch {
    // en proceso止就es用户ya经走开. 其余Fallo照画: Original因 y Reintentar节律都Enpágina面自己手dentro. 
    if (mine.controller.signal.aborted) return false;
  }
  if (pending.get(container) !== mine) return false;
  pending.delete(container);
  if (!options.isCurrent()) return false;
  const host = options.place ? options.place(container) : defaultHost(container);
  entries.set(container, { path, props, revision: mine.revision, container, host, resident: !!options.resident });
  notify(true);
  return true;
}

/** Abriruno座常驻组件(常驻表 `RESIDENT_ROUTES` en la名字): uno直算当anteriorpágina, 宿主就es壳交来节点本身, 组件直continuar画成
 *  它子节点, 所以 DOM yeste座面自己建根时uno样. Sinprimero屏取数, 路由树continuararriba就画; 画arriba回 true. 
 *
 *  `place` En画primero帧同unoTareadentro宿主交给路由树, 返回仍须eseste节点本身; No给就Original样交出. 宿主dentro先Con
 *  壳启动骨架时(Gestionar区página头, 侧栏), 由它清掉骨架: 骨架uno直Deja到primero帧画en laeseuno刻, en proceso间Sinuno帧空白. 宿主es
 *  Nuevo, 还NoEnDocumentaciónen la节点时(InmersivoModo, Configuración面板), 由它挂进Documentación, 节点yprimero帧uno起出现. 
 *
 *  每座SoloEn壳启动(或No.uno次用到)时Abriruno次. 之posterior壳经它命令句柄推contenido, 组件订阅自己 store; 
 *  抛错posteriorError边界Solo卸组件, esteuno面空到ActualizarComo止, 句柄照antiguopuede调, No抛.  */
export function openResidentSurface(
  name: string, container: HTMLElement, place: (container: HTMLElement) => HTMLElement = () => container,
): Promise<boolean> {
  return openManagedRoute(name, {}, { container, isCurrent: () => true, place: () => place(container), resident: true });
}

/* token, Preflight y焦点Regla都作用En `.peach-react` arriba; 容Dispositivo归壳, 所以另建uno, 收起时连它uno起撤掉.  */
function defaultHost(container: Element): HTMLElement {
  const host = container.ownerDocument.createElement('div');
  host.className = 'peach-react';
  container.textContent = '';
  container.append(host);
  return host;
}

/** 壳开关合进此刻画着eseunoPágina: 代次No变, página面就地pesado渲染, Nopesado挂, Nopesado取. ese容Dispositivodentro还没画arriba
 *  (还En取primero屏或ya经收起)时es空操作, Abrir时交进去eseuno照antiguo.  */
export function updateManagedRoute(container: Element | null, patch: object): void {
  const shown = container ? entries.get(container) : undefined;
  if (!shown) return;
  entries.set(shown.container, { ...shown, props: { ...shown.props, ...patch } });
  notify(false);
}

/** 收起este几容Dispositivoen lapágina面: en proceso止En途primero屏取数, 卸掉página面y撤掉宿主, uno次通知. Sinpágina面容Dispositivoes空操作. 
 *  容Dispositivo逐点名, Sin"Todo收起": 壳换página认领表面时收 `#stats` y `#index`, `#grid` EnDirectorio各Rutay回收站
 *  之间uno直画着, SoloEn离开Directorio时由壳单独收; página面interior组件由壳按各自路由判据收. 常驻组件宿主es壳节点, 
 *  aquíSolo卸组件, No撤宿主.  */
export function releaseManagedRoute(container: Element, ...more: Element[]): void {
  const removed: ManagedEntry[] = [];
  for (const target of new Set([container, ...more])) {
    const inflight = pending.get(target);
    if (inflight) {
      inflight.controller.abort();
      pending.delete(target);
    }
    const shown = entries.get(target);
    if (shown) {
      entries.delete(target);
      removed.push(shown);
    }
  }
  if (!removed.length) return;
  notify(true);
  for (const shown of removed) if (!shown.resident) shown.host.remove();
}

/** 应用Desinstalar收起Todo登记, yen proceso止aúnno成Comopágina面primero屏Por favor求.  */
export function releaseAllManagedRoutes(): void {
  const [first, ...rest] = new Set([...entries.keys(), ...pending.keys()]);
  if (first) releaseManagedRoute(first, ...rest);
}

/** 某uno面渲染抛错, 路由树Error边界continuar住之posterior调: Solo撤esteuno面登记y宿主, 别面照画. 之posterior
 *  `managedTaken` 回 false, `updateManagedRoute` 对它es空操作, 壳Siguiente次Abrir就pesado开. 代次对Noarriba(esteuno格
 *  ya经收起或pesado开过)es空操作: 过期eseuno面No能撤掉壳刚开Nuevouno面. 常驻组件宿主es壳节点, Solo卸组件, 
 *  No撤宿主; 壳No会再Abrir它, esteuno面空到ActualizarComo止. 
 *
 *  删登记y撤宿主当场做, 通知延到微Tarea: aquíEn React 提交阶段dentro(Error边界 `componentDidCatch`), 
 *  通知会让路由树pesado渲染. 抛错出EnAbrireseuno次primero帧时, Abrir照样回 true, Soloes回来eseuno刻登记ya经撤, 
 *  壳紧continuar着推补丁es空操作.  */
export function failManagedRoute(container: Element, failed: number): void {
  const shown = entries.get(container);
  if (shown?.revision !== failed) return;
  entries.delete(container);
  if (!shown.resident) shown.host.remove();
  queueMicrotask(() => { notify(false) });
}
