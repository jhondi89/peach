/* Todo站唯unoExplorar dispositivoHistorial(`@peach/history`). 
 *
 * Application y React 路由树直continuar引用本模, 随 peach-app.js 发出同unoHistorial实例. 
 * 启动地址Limpiarypesado定向使用 shellNavigate, Router  navigator 也读esteuno. 
 *
 * 实现es React Router 自己 `createBrowserHistory`(`v5Compat` 档: push / replace 也通知监听者), 
 *  y 它 `<Router>` 读写es同uno `{usr, key, idx}` HistorialEntrada, No另引uno history Biblioteca. 它Solo收uno
 * 监听者, 而且要Con监听者才挂 `popstate`: aquíuno建bien就由本模continuararriba, 再分发给各订阅者, 所以página面
 * unoCargar就En数posterior退yanterior进, Noetc.谁来订阅. 
 *
 * 每uno次Historial变化(壳写, React 子树写, posterior退anterior进)都领uno递增序号 `seq`. 壳写地址走 `shellNavigate`, 
 * eseuno次当场认领(`claimed`): página面元素保持代次, 覆盖元素continuar走esteuno次AbrirPor favor求. posterior退anterior进, React
 * 子树写y壳经 `peachHistory` 直continuar写ese几次没人认领, 另领unopágina面Abrir序号(`openEpoch`): 每uno次都要eseunopágina
 * 按地址pesado开uno遍. 代次En通知订阅者之anterior就定, 路由根Sincronizar提交eseuno次渲染dentro读到ya经esNuevo代次, página面按它挂 key, 
 * uno次AbrirSolo挂uno次. 判据用序号y代次No用地址: 同unoEntradapesado放 `popstate` 地址No变, eseunopágina照样要pesado开.  */
import { UNSAFE_createBrowserHistory, type Location, type NavigationType, type Navigator, type To } from 'react-router';

import { backgroundOf, type BackgroundLocation } from './overlay';
import { canonicalPath } from './canonical-path';
import { settingsBackgroundOf, isPreferencePath } from './settings-route';
export * from './settings-route';
export { canonicalPath } from './canonical-path';

/** uno次Historial变化: 动作, 变化之posterior地址, 它领到序号, 到esteuno次Como止página面Abrir序号,  y esteuno次esNoes壳认领写.  */
export interface Navigation {
  action: NavigationType;
  location: Location;
  seq: number;
  openEpoch: number;
  claimed: boolean;
}

export type NavigationListener = (navigation: Navigation) => void;

/** 给 `<Router navigator>` 用eseuno, exterior加当anterioresteuno次变化y订阅.  */
export interface PeachHistory extends Navigator {
  readonly navigation: Navigation;
  listen(listener: NavigationListener): () => void;
}

const browser = UNSAFE_createBrowserHistory({ v5Compat: true });
let seq = 0;
let openEpoch = 0;
let current: Navigation = { action: browser.action, location: browser.location, seq, openEpoch, claimed: true };
const listeners = new Set<NavigationListener>();
/* `claiming` SoloEn `shellNavigate` 写地址eseunoabajoComo真.  */
let claiming = false;
/* 还停Enpágina面Cargar时eseunoarriba: 之posteriorSolo经 replace 改写过(Limpiar启动地址, páginainterior写Parámetro), 没 push, 没posterior退anterior进.  */
let onBootEntry = true;

browser.listen(({ action, location }) => {
  const path = location.pathname + location.search + location.hash;
  const canonical = canonicalPath(path);
  if (canonical !== path) {
    window.history.replaceState(window.history.state, '', canonical);
    location = browser.location;
  }
  seq += 1;
  if (!claiming) openEpoch += 1;
  if (action !== 'REPLACE') onBootEntry = false;
  current = { action, location, seq, openEpoch, claimed: claiming };
  for (const listener of [...listeners]) listener(current);
});

function canonicalTo(to: To): To {
  if (typeof to === 'string') return canonicalPath(new URL(to, window.location.href).href);
  const source = new URL(`${to.pathname ?? window.location.pathname}${to.search || ''}${to.hash || ''}`, window.location.href);
  const canonical = canonicalPath(source.href);
  if (canonical === source.pathname + source.search + source.hash) return to;
  const target = new URL(canonical, window.location.origin);
  return { ...to, pathname: target.pathname, search: target.search, hash: target.hash };
}

export const peachHistory: PeachHistory = {
  get navigation() { return current },
  listen(listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener) };
  },
  createHref: (to) => browser.createHref(to),
  createURL: (to) => browser.createURL(to),
  encodeLocation: (to) => browser.encodeLocation(to),
  go: (delta) => browser.go(delta),
  push: (to, state) => browser.push(canonicalTo(to), state),
  replace: (to, state) => browser.replace(canonicalTo(to), state),
};

export interface ShellNavigateOptions {
  replace?: boolean;
  /** NuevoEntrada `usr` Estado. Limpiar地址时传 `peachHistory.navigation.location.state`, Original样保住当anterioreseuno.  */
  state?: unknown;
}

/** 壳写地址: push 或 replace uno, 当场认领. 
 *
 * Ruta先按当anterior地址解析成绝对: 壳传进来Con相对Ruta, ConSolo带Consulta串, 也ConCompleto href, 
 * `history.pushState` 本来就eseste样解析; React Router  `To` Solo认Ruta, `#x` este会丢掉Consulta串.  */
export function shellNavigate(path: string | URL, { replace = false, state }: ShellNavigateOptions = {}): void {
  const url = new URL(path, window.location.href);
  const to: To = canonicalPath(`${url.pathname}${url.search}${url.hash}`);
  claiming = true;
  try {
    if (replace) browser.replace(to, state);
    else browser.push(to, state);
  } finally {
    claiming = false;
  }
}

/** 当anteriorEntradaesNoespágina面Cargar时eseuno(Actualizar, NuevoEtiquetapágina, profundo链).  */
export const bootEntry = (): boolean => onBootEntry;

/** página面组按它匹配Fondo: 当anteriorEntradaEn `usr` dentro记eseunopágina. 启动eseunoNo读(ADR-0031"DetallesEntrada记abajo压En哪unopágina
 *  arriba"): `usr` 跨Actualizar仍En, abajo面eseunopágina却从没画过, Actualizar, NuevoEtiquetapáginayprofundo链落EnDetallesAnterior律当作SinFondo.  */
export function navigationBackground(): BackgroundLocation | null {
  if (isPreferencePath(current.location.pathname)) {
    const settings = onBootEntry ? null : settingsBackgroundOf(current.location.state);
    return settings ? backgroundOf(settings.state) || settings : null;
  }
  return onBootEntry ? null : backgroundOf(current.location.state);
}

export {
  adoptOverlayState, backgroundOf, clearOverlayBackground, holdOverlayBackground, isOverlayPath, OVERLAY_PATHS,
  overlayState, overlayTarget, takeOverlayReturn,
  type BackgroundLocation, type OverlayKind, type OverlayPath, type OverlayState, type OverlayTarget,
} from './overlay';
export { ROUTE_META, routeMetaOf, type RouteMeta } from './route-meta';
export {
  connectManagedRoutes, failManagedRoute, listenManagedEntry, managedEntries, managedEntry, managedTaken, openManagedRoute,
  openResidentSurface, preloadManagedRoutes, releaseAllManagedRoutes, releaseManagedRoute, updateManagedRoute,
  type ManagedEntry, type ManagedOpenOptions, type ManagedPrefetch,
} from './managed';
