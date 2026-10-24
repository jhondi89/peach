/* 覆盖组元素(ADR-0031"DetallesEntrada记abajo压En哪unopáginaarriba"): ObrasDetalles, cuatroColay关注Detalles各unoRuta
 * (`OVERLAY_PATHS`), 覆盖组按真实地址匹配, 挂arriba就eseuno送进舞, 卸abajo去处Noes覆盖地址就收起舞. 
 *
 * 什么时候Abrir: 
 * - 启动(Actualizar, NuevoEtiquetapágina, profundo链): 壳Empezar路由(`@peach/shell`  `pageOpens` 从 0 变成 1)eseuno刻Abrir; 路由根晚于
 *   壳Empezar路由才装arriba, 地址还停En启动eseunoarriba时, 挂arriba就Abrir. 启动eseunoNo读Fondo, 关掉回各自缺省来处. 
 * - 没人认领Historial变化(posterior退anterior进, React 子树y壳经 `peachHistory` 直continuar写地址): continuararribaEntrada记Fondo
 *   (`adoptOverlayState`), 再Abrir. 元素按导航序号挂 key, 地址没变posterior退(同unoEntradapesado放, `history.state` Como空)
 *   也领unoNuevo代次, pesado挂, 再开uno次. 
 * - 壳认领写地址: 点卡片uno次性AbrirPor favor求交给覆盖元素, 挂arribaposterior取走; Cola取齐posterior写地址y转换Detalles类Solo改Entrada. 
 * Abriry收起都交壳(`ShellActions.openOverlay`, `closeStage`): 取数, 来处y舞句柄都还En壳dentro. 
 *
 * página面组eseuno侧(`router.tsx`): ConFondo时按Fondo匹配, FondopáginaNopesado挂; SinFondo覆盖地址也挂uno格, ObrasyCola补画
 * DirectorioCuadrícula(Directorio元素), 关注DetallesSolo让出 `#stats`(`FollowDetailGround`), No画Lista. 
 *
 * Abrir, 收起y让都排进微Tarea: 路由根EnHistorial变化同uno次调用dentroSincronizar提交, 壳Abrir舞要Sincronizar画, En提交阶段dentro画会
 * 出 flushSync 告警. Historial通知SincronizarActualizar壳Títuloy侧栏, página面取数随posterior领取当anterior代次.  */
import { useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';

import {
  adoptOverlayState, bootEntry, clearOverlayBackground, isOverlayPath, overlayTarget, peachHistory, type OverlayPath,
  settingsBackgroundOf, isPreferencePath,
} from '@peach/history';
import { pageOpens, queueOpens, subscribeShell } from '@peach/shell';

import { ShellActionsContext, useOpenEpoch } from '../router';

const readOpens = () => pageOpens;
const readQueueOpens = () => queueOpens;

/** Colaaúnno定abajoEntrada时Abrir意Imagen: 路由树continuar手, Esperandoprimero屏确定实际地址; NoEnHistorialdentro放临时Entrada.  */
export function QueueRequests(): ReactNode {
  const actions = useContext(ShellActionsContext);
  const requests = useSyncExternalStore(subscribeShell, readQueueOpens);
  const opens = useSyncExternalStore(subscribeShell, readOpens);
  useEffect(() => {
    if (!requests || !opens) return;
    let live = true;
    queueMicrotask(() => { if (live) actions?.openQueueRequest?.() });
    return () => { live = false };
  }, [requests, opens, actions]);
  return null;
}

/** 挂en laesteuno格要No要按地址Abrir, 什么时候Abrir. `run(boot)` Solo跑uno次: `boot` Como真es启动eseuno次(壳Empezar路由时, 
 *  或路由根晚装arriba时地址还es启动eseuno), Como假esuno次Historial变化. `claimedOpens` 允许认领写地址AbrirPor favor求. 
 *  覆盖元素按导航序号挂 key; Inmersivo元素按página面Abrir序号挂 key.  */
export function useRouteOpen(run: (boot: boolean) => void, claimedOpens = false): void {
  const opens = useSyncExternalStore(subscribeShell, readOpens);
  const pending = useRef<'boot' | 'history' | null | undefined>(undefined);
  if (pending.current === undefined) {
    const { claimed } = peachHistory.navigation;
    pending.current = pageOpens === 0 || bootEntry() ? 'boot' : claimed && !claimedOpens ? null : 'history';
  }
  const latest = useRef(run);
  useEffect(() => { latest.current = run });
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => { live.current = false };
  }, []);
  useEffect(() => {
    const origin = pending.current;
    if (!origin || opens === 0) return;
    pending.current = null;
    queueMicrotask(() => { if (live.current) latest.current(origin === 'boot') });
  }, [opens]);
}

/* uno覆盖地址元素: 挂arriba按地址Abrireseuno, 卸abajo去处No再es覆盖地址就收起舞(En curso放视频照antiguo进pequeño窗).  */
function OverlayOpen() {
  const actions = useContext(ShellActionsContext);
  const latestActions = useRef(actions);
  useLayoutEffect(() => { latestActions.current = actions }, [actions]);
  useRouteOpen((boot) => {
    const location = peachHistory.navigation.location;
    const { pathname, search } = isPreferencePath(location.pathname) ? settingsBackgroundOf(location.state) || location : location;
    const target = overlayTarget(pathname, search);
    if (!actions || !target) return;
    clearOverlayBackground();
    if (!boot) adoptOverlayState(peachHistory.navigation.location.state);
    actions.openOverlay(target);
  }, true);
  useEffect(() => () => {
    queueMicrotask(() => {
      if (!isOverlayPath(peachHistory.navigation.location.pathname)) latestActions.current?.closeStage();
    });
  }, []);
  return null;
}

/** 覆盖组unoRuta元素: 每次导航各挂uno次, 同unoEntradapesado放也能再Abrir.  */
export function OverlayMatch({ path }: { path: OverlayPath }): ReactNode {
  useOpenEpoch();
  const { location, seq, action } = peachHistory.navigation;
  const previous = isPreferencePath(location.pathname) ? settingsBackgroundOf(location.state) : null;
  const identity = (previous || location).pathname + (previous || location).search;
  const held = useRef({ identity, seq: previous?.seq ?? seq, navigationSeq: seq, settings: !!previous });
  if (previous) { held.current.settings = true; held.current.navigationSeq = seq }
  else if (held.current.settings && action === 'POP' && held.current.identity === identity) {
    held.current.settings = false; held.current.navigationSeq = seq;
  } else if (held.current.navigationSeq !== seq) held.current = { identity, seq, navigationSeq: seq, settings: false };
  return <OverlayOpen key={`${path} ${held.current.seq}`} />;
}

/* página面组dentroSinFondo关注Detalles(profundo链, Actualizary没记FondoEntrada): No画Lista, Solo让出 `#stats`; Listaetc.关掉Detalles才Abrir.  */
function FollowGroundOpen() {
  const actions = useContext(ShellActionsContext);
  useRouteOpen(() => { actions?.follow?.ground() });
  return null;
}

/** página面组 `/posts/:id` 元素, 按página面Abrir序号挂 key.  */
export function FollowDetailGround(): ReactNode {
  return <FollowGroundOpen key={useOpenEpoch()} />;
}
