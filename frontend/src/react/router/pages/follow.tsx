/* 关注páginayReproducirListapágina路由元素(ADR-0031): página面组匹配到 `BROWSE_ROUTES` este两时挂arriba, 按地址Abrireseunopágina, 
 * 画进 `#stats`. 元素自己什么都No画: página面经 `openManagedRoute` 登记进 `#stats`, 由 `ManagedSurface` 画. 
 *
 * 什么时候Abrir同索引página(`usePageOpen`): 挂arriba, 领página面Abrir序号(posterior退anterior进yNo认领Saltar a), 壳要求按当anterior地址pesado开
 * (`@peach/shell`  `pageOpens` 加uno)各uno次; `pageOpens` 还es 0 时壳没Empezar路由, 元素Solo挂着; eseuno刻被Detalles压着
 * (página面组按Fondo匹配)就No动, 关掉Detalles时esteunopágina没画着才Abrir. 
 *
 * 关注páginaNo按代次挂 key, "回到"y"pesadoNuevo进入"都es同uno元素再开uno次, 交壳按地址读uno遍Filtrar(`refresh`): 
 * - 关注página还画En `#stats` dentro(资料página压过来时壳Solo藏起它)就铺开它, 就地推Filtrar, 取样SemillayunoNuevoActualizar代次: Lista
 *   pesado取, 回到顶arriba, página头, 两排yese玻璃No撤. 
 * - 没画着才CompletopáginaAbrir: 铺骨架, 取齐primero屏posterior照离开时记abajoUbicación滚回去(`followScrollY`), 没记就回到顶arriba. Actualizar代次
 *   没变时primero屏命en proceso缓存, ListaNopesado取. 
 * pesadoNuevo进入(yaEn关注página再点侧栏, VerificarActualizar之posterior去ver)由壳决定: pesado掷取样Semilla, 滚动清cero, 回到干净 `/follow`, 再
 * 要求pesado开. 关掉关注Detalles回Lista由壳认领写地址, Solo推Filtrar, 元素No动. profundo链直continuar进关注Detalles时página面组SinFondo, No挂este
 * 元素, Listaetc.关掉Detalles才Abrir. posterior退anterior进落到压EnListaen la关注Detalles, Lista却没画着(en proceso间去过别página)时, 交壳让出
 * `#stats`(`ShellActions.follow.ground`), No画Lista. 
 *
 * ReproducirListapágina每次Abrir都Completopáginapesado开, 取最Nuevoeseuno. 停Enesteunopágina时壳要求pesado读(顶栏"换uno批")就写unoNuevoActualizar代次
 * (`playlistsRevision`), 元素推给画着eseunopágina, página面pesado取, Nopesado挂. 
 *
 * 两元素卸abajo时都No收página面: 换到Gestionar区, 索引página时由它们认领表面收掉; 资料página压过来时壳Solo藏起 `#stats`, 回来还要
 * continuar着用.  */
import { useContext, useEffect, useRef, useSyncExternalStore } from 'react';

import { managedEntry, openManagedRoute, peachHistory, updateManagedRoute } from '@peach/history';
import { revealSkeleton } from '@peach/legacy/ui';
import { followScrollY, playlistsRevision, subscribeShell } from '@peach/shell';

import { managementSkeletonHtml, paintManagementPlaceholder } from '../../../management-placeholder';
import { ShellActionsContext, useOpenEpoch } from '../router';
import type { ShellActions } from '../shell-actions';
import { usePageOpen } from './index-entity';

const statsHost = () => document.getElementById('stats');
const readPlaylistsRevision = () => playlistsRevision;

/* 取齐primero屏时骨架Nouno次清空: 骨架抬成uno层淡出, Nuevo宿主同时从Difusodentro清晰起来, 同DirectorioCuadrícula. 宿主放进去之posteriorpágina面
   当场画进去, 仍En同unoTareadentro, 骨架yCompletopágina之间Sin空帧.  */
function reveal(container: Element): HTMLElement {
  const host = document.createElement('div');
  host.className = 'peach-react';
  revealSkeleton(container, () => { container.textContent = ''; container.append(host) });
  return host;
}

/* ── 关注 ── */

async function openFollow(actions: ShellActions, live: () => boolean) {
  const stats = statsHost();
  const shell = actions.follow;
  if (!stats || !shell) return;
  if (shell.refresh()) return;
  const restoreY = followScrollY;
  actions.surfaceChanged('follow', '/follow');
  paintManagementPlaceholder(stats, shell.skeleton());
  await openManagedRoute('/follow', shell.props(), { container: stats, isCurrent: live, place: reveal });
  if (live()) window.scrollTo(restoreY ? { top: restoreY, behavior: 'instant' } : { top: 0, behavior: 'smooth' });
}

/* `#stats` dentro画着, 露着es关注página.  */
function followShown(): boolean {
  const stats = statsHost();
  const entry = stats ? managedEntry(stats) : null;
  return !!stats && !stats.hidden && !!entry && entry.path === '/follow' && entry.host.isConnected;
}

/** 关注página元素.  */
export function FollowMatch() {
  const actions = useContext(ShellActionsContext);
  usePageOpen(useOpenEpoch(), (_fresh, live) => {
    if (actions) void openFollow(actions, live);
  }, {
    shown: followShown,
    onCovered: () => {
      if (peachHistory.navigation.location.pathname.startsWith('/posts/')) actions?.follow?.ground();
    },
  });
  return null;
}

/* ── ReproducirLista ── */

/* `#stats` dentro画着esReproducirListapágina.  */
function playlistsShown(stats: HTMLElement | null): stats is HTMLElement {
  const entry = stats ? managedEntry(stats) : null;
  return !!entry && entry.path === '/playlists' && entry.host.isConnected;
}

async function openPlaylists(actions: ShellActions, live: () => boolean) {
  const stats = statsHost();
  if (!stats) return;
  actions.surfaceChanged('playlists', '/playlists');
  paintManagementPlaceholder(stats, managementSkeletonHtml('/playlists', { followLayout: '', followSort: '', followDir: '' }));
  await openManagedRoute('/playlists', { revision: playlistsRevision }, { container: stats, isCurrent: live });
  if (live()) window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** ReproducirListapágina元素.  */
export function PlaylistsMatch() {
  const actions = useContext(ShellActionsContext);
  const revision = useSyncExternalStore(subscribeShell, readPlaylistsRevision);
  const last = useRef(revision);
  useEffect(() => {
    if (last.current === revision) return;
    last.current = revision;
    const stats = statsHost();
    if (playlistsShown(stats)) updateManagedRoute(stats, { revision });
  }, [revision]);
  usePageOpen(useOpenEpoch(), (_fresh, live) => {
    if (actions) void openPlaylists(actions, live);
  }, { shown: () => { const stats = statsHost(); return playlistsShown(stats) && !stats.hidden } });
  return null;
}
