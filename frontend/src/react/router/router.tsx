/* Cliente导航(ADR-0031"React Router exterior壳阶段continuar管"): React Router  Declarative Modocontinuar管 history. 
 * Gestionar区ese几página, ReproducirListapáginay关注página, 索引páginay资料página, DirectorioCuadrículay垃圾Cola, 以及página面en lapágina面interior组件(primeropáginaFiltrar, 
 * primeropáginaNuevas obras行, 顶栏Buscarabajo拉)y常驻组件(posteriorTarea, 底部批量, 侧栏配色卡, Gestionar区página头, InmersivoModo, Configuración面板, 
 * 侧栏, Detalles舞)(`managed-routes.tsx`)由este棵树画. 每unopágina, InmersivoModoyDetalles覆盖都由路由按匹配Abrir
 * (`pages/` abajo各元素), 壳Nocontinuar派发: 它Solo订阅HistorialSincronizarTítuloy侧栏, 换página时写地址. 
 *
 * 用底层 `<Router>`, history Sí `@peach/history` eseuno: AplicarIniciar时就要写Dirección, `<BrowserRouter>`
 * 自己建 history Solo听 `popstate`, verNo见壳 push 进去Entrada. 也No用 `unstable_HistoryRouter`: 它Actualizar
 * Predeterminado包En `startTransition` dentro, continuar连两次变化会y成uno次渲染, posterior退anterior进就menos开uno次. 
 *
 * página面宿主es两组 `<Routes>` 兄弟, 从头活到尾: 画着página面跟着登记ese几走(`@peach/history` 
 * `openManagedRoute`, 每容Dispositivouno), Detalles舞压Enarriba面, 地址换成 `/assets/:id` 时它DejaEnOriginal处. 
 *
 * 路由分两组: página面组按Entrada自己记Fondo(`usr.backgroundLocation`, 启动eseunoNo读)匹配, Detalles压En哪unopáginaarriba就还
 * 匹配eseunopágina, FondopáginaNopesado挂; 覆盖组按真实地址匹配DetallesyColaese几(`OVERLAY_PATHS`, `pages/overlay.tsx`). página面组
 * dentroGestionar区, 关注, 索引, 资料, DirectorioyInmersivo各挂按地址Abrireseunopágina元素(`pages/managed.tsx`, `pages/follow.tsx`, 
 * `pages/index-entity.tsx`, `pages/catalog.tsx`, `pages/immerse.tsx`); SinFondo覆盖地址也Enpágina面组dentro挂uno格: 
 * ObrasyCola补画DirectorioCuadrícula, 关注DetallesSolo让出 `#stats`. `path="*"` es认No出地址, 什么都NoAbrir. 
 *
 * uno处渲染ErrorSolo带走抛错eseuno面: 每uno面各套uno层Error边界(`SurfaceBoundary`), 根arribaNo套, 两组 `<Routes>` No随
 * 某uno面卸掉. Error经根 `onCaughtError` 交给 `reportError`, 每次uno.  */
import {
  Component, createContext, memo, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode,
  type RefObject,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import type { RootOptions } from 'react-dom/client';
import { Route, Router, Routes, useLocation, useNavigate, type NavigateFunction } from 'react-router';

import {
  failManagedRoute, listenManagedEntry, managedEntries, navigationBackground, OVERLAY_PATHS, peachHistory,
  PREFERENCE_PATHS, isPreferencePath, settingsBackgroundOf, bootEntry,
  type ManagedEntry, type Navigation,
} from '@peach/history';

import { Providers } from '../providers';
import { LibraryProcessingDock } from '../library-processing/library-processing-dock';
import { SettingsMatch } from './pages/settings';
import {
  BROWSE_ROUTES, CATALOG_PATHS, CATALOG_ROUTES, ENTITY_ROUTES, IMMERSE_ROUTES, INDEX_ROUTES, MANAGED_ROUTES, REDIRECT_ROUTES,
  isManagedPath, isRoutedPath, managedPage,
} from './managed-routes';
import { FollowDetailGround, OverlayMatch, QueueRequests } from './pages/overlay';
import type { ShellActions } from './shell-actions';

/* página面Abrir序号(`@peach/history`  `openEpoch`): 没人认领Historial变化各领uno, 认领写地址No领. 地址没变
 * `popstate`(同unoEntradapesado放)No会让 Router  location 变, 代次照样变, 按它挂 key 元素照样pesado开.  */
const OpenEpoch = createContext(0);

/** 当anterioresteunopáginaesNo.几次Abrir: página面元素按它挂 key, pesado开就pesado挂, 认领写地址(páginainterior replace 写Parámetro)Nopesado挂.  */
export const useOpenEpoch = (): number => useContext(OpenEpoch);

/** 壳交进来能力, Gestionar区ese几página经它回到壳.  */
export const ShellActionsContext = createContext<ShellActions | null>(null);

/** 路由根EnHistorial变化同uno调用dentroSincronizar提交(`flushSync`): `shellNavigate` yposterior退anterior进返回时, 两组 `<Routes>`
 *  匹配ya经换成Nuevo地址, Anteriorpágina元素ya经卸掉, 壳continuar着往同uno容Dispositivodentro写骨架No会撕掉 React 还管着节点. 
 *  元素AbrirNoEnesteuno次提交dentro跑, 各自排进提交之posterior微Tarea.  */
export function PeachRouter({ children }: { children: ReactNode }) {
  const [navigation, setNavigation] = useState<Navigation>(() => peachHistory.navigation);
  useLayoutEffect(() => {
    /* 从读初值到aquí订阅之间Con过变化话, 补arriba最Nuevoeseuno次.  */
    setNavigation(peachHistory.navigation);
    return peachHistory.listen((next) => { flushSync(() => setNavigation(next)) });
  }, []);
  return (
    <OpenEpoch.Provider value={navigation.openEpoch}>
      <Router location={navigation.location} navigationType={navigation.action} navigator={peachHistory}>
        {children}
      </Router>
    </OpenEpoch.Provider>
  );
}

/* 跟着地址pesado渲染SoloConesteuno格: 它当anterior `navigate` 交给Gestionar区宿主, 宿主ypágina面No随导航pesado渲染.  */
function NavigateInto({ target }: { target: RefObject<NavigateFunction | null> }) {
  const navigate = useNavigate();
  useLayoutEffect(() => { target.current = navigate });
  return null;
}

/** Gestionar区página面en laSaltar a: 落EnGestionar区ese几páginaen la交给 React Router, 别Ruta交 `actions.navigate`. 两路都No认领, 
 * 各领unopágina面Abrir序号, Abrir次数yposterior退anterior进相同.  */
export function managedGo(path: string, actions: ShellActions, navigate: NavigateFunction): void {
  const target = new URL(path, window.location.href);
  if (!isManagedPath(target.pathname)) { actions.navigate(path); return }
  void navigate(`${target.pathname}${target.search}${target.hash}`);
}

/** página面宿主: 画壳En各容Dispositivodentro登记eseunopágina(`#stats`, `#index`, `#grid` y各página面interior组件容Dispositivo各unopágina, 互No相收). 
 *
 * 换páginay收起都由 `@peach/history` Sincronizar通知, aquí用 `flushSync` 当场画完: 壳En同unoTareadentro刚换arriba宿主
 * (或刚撤掉它), 晚uno拍画就esuno帧空白. 每次Abrir领uno代次, página面按代次pesado挂, primero屏读es刚取回缓存. 
 * 就地Actualizar(`updateManagedRoute`)Solo换eseunopágina props, 代次No变, 照常排进Siguiente次渲染: 壳开关puede能就es从
 * página面自己 effect dentro推过来, esedentroNo能 `flushSync`.  */
function ManagedSurface() {
  const actions = useContext(ShellActionsContext);
  const [entries, setEntries] = useState<readonly ManagedEntry[]>(managedEntries);
  const navigate = useRef<NavigateFunction | null>(null);
  useLayoutEffect(() => {
    setEntries(managedEntries());
    return listenManagedEntry((next, sync) => {
      if (sync) flushSync(() => setEntries(next));
      else setEntries(next);
    });
  }, []);
  const go = useMemo(() => (path: string) => {
    if (actions && navigate.current) managedGo(path, actions, navigate.current);
  }, [actions]);
  return (
    <>
      <NavigateInto target={navigate} />
      {actions ? entries.map((entry) => (
        <SurfaceBoundary key={entry.revision} entry={entry}>
          <ManagedPortal entry={entry} actions={actions} go={go} />
        </SurfaceBoundary>)) : null}
    </>
  );
}

/** uno面uno层Error边界. continuar住之posterioresteuno面画成空, y撤掉它登记y宿主(`failManagedRoute`), 壳abajo次Abrir时pesado开; 
 *  按代次挂 key, pesado开就esunoNuevo边界实例. arriba报NoEnaquí: 根 `onCaughtError` ya经报过uno次.  */
class SurfaceBoundary extends Component<{ entry: ManagedEntry; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    failManagedRoute(this.props.entry.container, this.props.entry.revision);
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

const ManagedPortal = memo(function ManagedPortal(
  { entry, actions, go }: { entry: ManagedEntry; actions: ShellActions; go: (path: string) => void },
) {
  if (!isRoutedPath(entry.path)) return null;
  return createPortal(managedPage(entry.path, entry.props, actions, go), entry.host, String(entry.revision));
});

/* página面组 `location` uno直给(SinFondo就给当anterior地址): 给yNo给之间 `<Routes>` 会más包uno层 `LocationContext`, 
 * 来回Cambiar就会página面元素拆掉pesado挂. Fondo读es当anteriorEntrada(`navigationBackground`), 启动eseuno当作Sin. 
 * 两组按página面分段, 段y段之间隔开几行.  */
function RouteGroups({ children }: { children?: ReactNode }) {
  const location = useLocation();
  // 同unoEntradapesado放时地址No变, `useLocation` No触发pesado渲染, 代次照样变: 启动eseunopesado放之posterior要Empezar读Fondo. 
  useOpenEpoch();
  const background = navigationBackground();
  const settingsBackground = isPreferencePath(location.pathname) && !bootEntry() ? settingsBackgroundOf(location.state) : null;
  return (
    <>
      <Routes location={background ?? location}>
        {/* ── Gestionar区 ── */}
        {Object.entries(MANAGED_ROUTES).map(([path, route]) => <Route key={path} path={path} element={route.element} />)}
        {/* antiguo直达地址: 元素它改写成 `/data-cleanup#resource-sync`, 由DatosGestionarpágina元素Abrir.  */}
        {Object.entries(REDIRECT_ROUTES).map(([path, route]) => <Route key={path} path={path} element={route.element} />)}



        {/* ── 关注 ── */}
        {Object.entries(BROWSE_ROUTES).map(([path, route]) => <Route key={path} path={path} element={route.element} />)}



        {/* ── 索引 ── */}
        {Object.entries(INDEX_ROUTES).map(([path, route]) => <Route key={path} path={path} element={route.element} />)}



        {/* ── 资料 ── */}
        {Object.entries(ENTITY_ROUTES).map(([path, route]) => <Route key={path} path={path} element={route.element} />)}



        {/* ── Directorio ── seisRuta挂同uno元素(`pages/catalog.tsx`), 换RutaNopesado挂, 元素按página面自己分 key.  */}
        {CATALOG_PATHS.map((path) => <Route key={path} path={path} element={CATALOG_ROUTES['/'].element} />)}



        {/* ── Inmersivo ── */}
        {Object.entries(IMMERSE_ROUTES).map(([path, route]) => <Route key={path} path={path} element={route.element} />)}



        {/* ── SinFondo覆盖地址 ── ObrasyCola挂Directorio元素, 补画Cuadrícula; 关注DetallesSolo让出 `#stats`.  */}
        {OVERLAY_PATHS.map((path) => (
          <Route key={path} path={path} element={path === '/works/:code' ? null
            : path === '/posts/:id' ? <FollowDetailGround /> : CATALOG_ROUTES['/'].element} />
        ))}
        {PREFERENCE_PATHS.map(path => <Route key={path} path={path} element={null} />)}



        {/* 认No出地址. `children` Solo给Prueba用.  */}
        <Route path="*" element={children} />
      </Routes>



      {/* ── 覆盖 ── */}
      <Routes location={settingsBackground ?? location}>
        {OVERLAY_PATHS.map((path) => <Route key={path} path={path} element={<OverlayMatch path={path} />} />)}
        <Route path="*" element={null} />
      </Routes>
      <Routes>
        {PREFERENCE_PATHS.map(path => <Route key={path} path={path} element={<SettingsMatch />} />)}
        <Route path="*" element={null} />
      </Routes>
    </>
  );
}

/** Completo棵路由树. `children` 画Enpágina面组 `path="*"` 元素dentro面, Solo给Prueba用: 跟着它挂uno次就Descripción元素没被pesado挂.  */
export function RouterRoot({ children, actions = null, background, processing = false }:
  { children?: ReactNode; actions?: ShellActions | null; background?: ReactNode; processing?: boolean }) {
  return (
    <Providers>
      {background}
      <ShellActionsContext.Provider value={actions}>
        <PeachRouter>
          <ManagedSurface />
          <QueueRequests />
          {processing && actions ? <LibraryProcessingDock toast={actions.toast} /> : null}
          <RouteGroups>{children}</RouteGroups>
        </PeachRouter>
      </ShellActionsContext.Provider>
    </Providers>
  );
}

/** 路由树ese棵根Opciones. Error边界continuar住Error交给Todo局 `reportError`,  y 没人continuar住时 React arriba报同uno路, 
 *  控制y window  `error` 事件各见uno次. 运行时才取 `reportError`: Prueba环境dentropuede能Sin它.  */
export const ROUTER_ROOT_OPTIONS: RootOptions = {
  onCaughtError: (error) => { globalThis.reportError?.(error) },
};
