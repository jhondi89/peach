/* Gestionar区diezunopáginay `/resource-sync` página面元素: página面组按匹配挂arriba它们, 挂arriba就Abrireseunopágina(ADR-0031"Gestionar区página面由
 * 路由树按匹配Abrir"). 
 *
 * uno次Abrir: etc.壳Empezar路由(`@peach/shell`  `pageOpens` grande于 0), 经 `surfaceChanged` 让壳收起别面, 铺开Gestionar区, 铺esteunopágina
 * 骨架(y壳冷启动铺es同uno, Clave相同就Nopesado画), 按需问uno次 `/healthz`, 再走 `openManagedRoute` 取齐primero屏, 
 * En同unoTareadentro换成Completopágina. primero帧 props 由元素自己从地址, 偏bieny壳Estado算. 
 *
 * 按página面Abrir序号挂 key: 没人认领Historial变化uno次就esAbriruno次, 同unoRuta再Abrir就pesado挂pesado取; 认领写地址(复核página换Categoría, 
 * 关注Gestionar换página签)代次No变, Nopesado开. Detalles压Enarriba面时página面组还匹配esteunoPágina: key 停En压arriba来之anterioreseuno次, página面No拆; 经Fondo
 * 匹配挂en la(posterior退落到压Enesteunopáginaen laDetalles)先NoAbrir, Detalles撤abajo时按eseuno刻代次挂 key Abrir. 
 *
 * Desinstalar时esteunopágina还画En `#stats` dentro, 壳也没藏起它, 才收起; 资料página, primeropágina压过来时壳Solo藏起 `#stats`, página面照antiguo活着, 
 * etc.Siguiente次认领表面才收. 收起排进微Tarea: Desinstalar发生En路由根Sincronizar提交eseuno次dentro.  */
import { useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';

import { appSettingsStore } from '@peach/appearance';
import {
  isOverlayPath, managedEntry, openManagedRoute, peachHistory, releaseManagedRoute, shellNavigate,
  configurationSection, updateManagedRoute,
} from '@peach/history';
import { api, isAbort } from '@peach/legacy/core';
import {
  cameFromSetup, configurationRequestedSection, pageOpens, runtimeConfigurable, state, subscribeShell, writeShell,
} from '@peach/shell';

import { managementSkeletonHtml, paintManagementPlaceholder } from '../../../management-placeholder';
import { isReviewCategory } from '../../review/review';
import { javLibraryPath, javTab } from '../../jav/jav';
import { ShellActionsContext, useOpenEpoch } from '../router';
import type { ManagedOpenProps, ManagedPath, ShellActions } from '../shell-actions';

/** uno次Abrir存活Estado: 元素卸掉就No再画, No再滚动, No再写地址.  */
interface Run {
  live: boolean;
  /** 画arriba之posterioreseunopágina代次; 还En取primero屏时es 0.  */
  revision: number;
  /** esteuno次读Por favor求(`/healthz`), 卸掉时en proceso止.  */
  controller: AbortController;
}

/** 本机写入Estado(`/healthz`).  */
interface Runtime {
  ledger_read_only?: boolean;
  ledger_read_only_message?: string;
  ledger_writer_origin?: string;
}

const FOLLOW_MANAGE_TABS = ['list', 'add', 'feeds'];

const readStarted = () => pageOpens > 0;
/** 壳Empezar路由Sin(`pageOpens` grande于 0).  */
const useRoutingStarted = (): boolean => useSyncExternalStore(subscribeShell, readStarted);

/* `/resource-sync` 改写过来eseuno次DatosGestionarpágina, Abrirposterior滚到资源Sincronizareseuno; 取uno次就清.  */
let resourceSyncPending = false;

const followLayout = (): string => (appSettingsStore().value.followLayout === 'table' ? 'table' : 'default');
const search = (): URLSearchParams => new URLSearchParams(window.location.search);

/** esteunopágina骨架: 关注Gestionar照偏bienen la视Imageny地址en laOrdenar画.  */
function placeholder(path: ManagedPath): string {
  const params = search();
  return managementSkeletonHtml(path, {
    followLayout: followLayout(), followSort: params.get('sort') || '', followDir: params.get('dir') || '',
  });
}

/** Solo读态: en proceso止回 null, 照Solo能Explorar以exterior缺省Procesar.  */
function readRuntime(run: Run): Promise<Runtime | null> {
  return (api('/healthz', { signal: run.controller.signal }) as Promise<Runtime>)
    .catch((error: unknown) => { if (isAbort(error)) return null; throw error });
}

function writerProps(runtime: Runtime | null, path: string) {
  return {
    readOnly: !!runtime?.ledger_read_only,
    readOnlyMessage: runtime?.ledger_read_only_message || 'Esta máquinaActualSolo能Explorar',
    writerUrl: runtime?.ledger_writer_origin ? new URL(path, runtime.ledger_writer_origin).href : '',
  };
}

/** esteuno次Abrir交给página面值, 从地址, 偏bieny壳Estado算. etc. `/healthz` 期间走开回 null.  */
async function openProps(path: ManagedPath, run: Run): Promise<object | null> {
  if (path === '/jav') {
    const runtime = await readRuntime(run);
    if (!run.live) return null;
    return { tab: javTab(search().get('tab')), readOnly: !!runtime?.ledger_read_only } satisfies ManagedOpenProps['/jav'];
  }
  if (path === '/stats') return { configurable: !!runtimeConfigurable } satisfies ManagedOpenProps['/stats'];
  if (path === '/taste') {
    const onboarding = cameFromSetup;
    writeShell({ cameFromSetup: false });
    return { onboarding } satisfies ManagedOpenProps['/taste'];
  }
  if (path.startsWith('/settings/')) {
    if (window.location.hash === '#peachProxy') writeShell({ configurationRequestedSection: 'Red y acceso' });
    const section = search().get('section') || configurationRequestedSection || configurationSection(path);
    return (section ? { section } : {}) satisfies ManagedOpenProps['/settings/library'];
  }
  if (path === '/review') {
    const category = search().get('category') || '';
    const runtime = await readRuntime(run);
    if (!run.live) return null;
    return { category: isReviewCategory(category) ? category : '', ...writerProps(runtime, '/review') } satisfies ManagedOpenProps['/review'];
  }
  if (path === '/subscriptions') {
    const params = search(), tab = params.get('tab') || '';
    const route = {
      tab: FOLLOW_MANAGE_TABS.includes(tab) ? tab : 'list',
      page: Math.max(1, Math.floor(Number(params.get('page'))) || 1),
      sort: params.get('sort') || '', dir: params.get('dir') || '',
    };
    const runtime = await readRuntime(run);
    if (!run.live) return null;
    const preferences = appSettingsStore().value;
    return {
      ...route, pageSize: Number(preferences.followPageSize) || 20, layout: followLayout(), ...writerProps(runtime, '/subscriptions'),
    } satisfies ManagedOpenProps['/subscriptions'];
  }
  return {};
}

const scrollTop = (): void => { window.scrollTo({ top: 0, behavior: 'smooth' }) };
const scrollToBlock = (id: string): void => { document.getElementById(id)?.scrollIntoView({ block: 'start' }) };

/* Estadísticaspáginay口味página取完就回顶, No论esteunopágina还EnNoEn; 其余几páginaSoloEn还停Enesteunopágina时滚.  */
const SCROLL_ALWAYS = new Set<ManagedPath>(['/stats', '/taste']);
const SCROLL_WHEN_CURRENT = new Set<ManagedPath>(['/review', '/quality-goals', '/tasks', '/subscriptions']);

async function openPage(path: ManagedPath, actions: ShellActions, run: Run): Promise<void> {
  if (path === '/jav' && javTab(search().get('tab')) === 'library') {
    peachHistory.replace(javLibraryPath(window.location.search)); return;
  }
  if (path === '/subscriptions' && search().get('tab') === 'wants') {
    shellNavigate('/jav?tab=wants', { replace: true }); return;
  }
  if (path === '/subscriptions' && search().get('tab') === 'source') {
    shellNavigate('/settings/subscriptions', { replace: true }); return;
  }
  const stats = document.getElementById('stats');
  if (!stats) return;
  if (path === '/jav') window.scrollTo({ top: 0, behavior: 'instant' });
  actions.surfaceChanged('management', path);
  if (path === '/taste') {
    writeShell({
      state: {
        ...state, creator: '', studio: '', tag: '', tag_match: 'all', len: '', dur_min: '', dur_max: '', orient: '',
        region: '', state: '', q: '', jav: '',
      },
    });
    actions.clearSearch();
  }
  const syncAnchor = path === '/data-cleanup' && resourceSyncPending;
  if (syncAnchor) resourceSyncPending = false;
  paintManagementPlaceholder(stats, placeholder(path));
  const props = await openProps(path, run);
  if (!props) return;
  const opened = await openManagedRoute(path, props, { container: stats, isCurrent: () => run.live });
  if (opened) run.revision = managedEntry(stats)?.revision ?? 0;
  /* Configuraciónpágina选en procesopágina签Solo交给画en laeseuno次: 没画arriba(取数途en proceso走开)就Deja给Siguiente次Abrir.  */
  if (path.startsWith('/settings/') && opened) writeShell({ configurationRequestedSection: '' });
  if (SCROLL_ALWAYS.has(path)) scrollTop();
  if (run.live) {
    const { hash } = window.location;
    if (SCROLL_WHEN_CURRENT.has(path)) scrollTop();
    if (path === '/settings/library') {
      /* ProcesarProgresoeseuno搬到DatosGestionarPágina: 改写地址(No加Entrada, No改Título), 由DatosGestionarpágina元素continuar着Abrir.  */
      if (hash === '#libraryProcessing') {
        queueMicrotask(() => { if (run.live) shellNavigate('/data-cleanup#libraryProcessing', { replace: true, state: null }) });
      } else if (hash === '#peachProxy') scrollToBlock('peachProxy');
      else scrollTop();
    }
    if (path === '/data-cleanup' && hash === '#libraryProcessing') scrollToBlock('libraryProcessing');
  }
  if (syncAnchor) scrollToBlock('resource-sync');
}

/** Gestionar区unopágina元素.  */
export function ManagedMatch({ path }: { path: ManagedPath }) {
  const epoch = useOpenEpoch();
  // 每次导航都pesado渲染uno次: Detalles撤abajoeseuno次认领写地址No领代次, 也要ver得见. 
  useLocation();
  const covered = isOverlayPath(peachHistory.navigation.location.pathname);
  const opening = useRef<number | null>(covered ? null : epoch);
  const wasCovered = useRef(covered);
  // yaAbrirFondopáginaEnDetalles撤abajo时保Deja代次; profundo链abajoFondoEsperandoprimero次Abrir. 
  if (!covered && (!wasCovered.current || opening.current === null)) opening.current = epoch;
  wasCovered.current = covered;
  // Ruta也进 key: 认领写地址从unopágina换到另unopágina(Configuraciónpágina改写到DatosGestionarpágina)时代次No变, página面组En同unoUbicación换路由. 
  const group = path.startsWith('/settings/') ? '/settings/configuration' : path;
  return <ManagedPage key={`${group} ${opening.current ?? 'covered'}`} path={path} covered={opening.current === null} />;
}

function ManagedPage({ path, covered }: { path: ManagedPath; covered: boolean }) {
  const actions = useContext(ShellActionsContext);
  const started = useRoutingStarted();
  const run = useRef<Run | null>(null);
  useEffect(() => {
    if (path.startsWith('/settings/')) {
      updateManagedRoute(document.getElementById('stats'), { section: configurationSection(path) });
    }
  }, [path]);
  useEffect(() => {
    if (covered || !actions || !started || run.current) return;
    const current: Run = { live: true, revision: 0, controller: new AbortController() };
    run.current = current;
    queueMicrotask(() => { if (current.live) void openPage(path, actions, current) });
    // 每次挂arribaSoloAbriruno次: 壳Empezar路由eseuno刻, 或挂arriba时ya经Empezar. 
  }, [started]);
  useEffect(() => () => {
    const current = run.current;
    if (!current) return;
    current.live = false;
    current.controller.abort();
    const stats = document.getElementById('stats');
    queueMicrotask(() => {
      if (stats && current.revision && !stats.hidden && managedEntry(stats)?.revision === current.revision) releaseManagedRoute(stats);
    });
  }, []);
  return null;
}

/** antiguo直达地址 `/resource-sync`: 改写成DatosGestionarpágina资源Sincronizar锚点, No加HistorialEntrada, 再由DatosGestionarpágina元素Abrir.  */
export function ResourceSyncRedirect() {
  const started = useRoutingStarted();
  const done = useRef(false);
  useEffect(() => {
    if (!started || done.current || isOverlayPath(peachHistory.navigation.location.pathname)) return undefined;
    done.current = true;
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      resourceSyncPending = true;
      shellNavigate('/data-cleanup#resource-sync', { replace: true });
    });
    return () => { live = false };
  }, [started]);
  return null;
}
