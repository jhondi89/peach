/* Directorio路由元素(ADR-0031"Directorio由路由树按匹配Abrir"): página面组匹配到 `CATALOG_PATHS`(primeropágina, tresFiltrar态, 回收站y
 * 垃圾Archivo)时挂arriba, 按地址pesado建DirectorioFiltrar(`@peach/shell`  `state`), 再交壳收舞以exterior事: Buscar框, 侧栏y顶栏, 
 * 顶部tres层 y 取数(`ShellActions.catalog`). 
 *
 * 元素按página面挂 key: primeropágina, tresFiltrar态y回收站画es同unoCuadrícula, 共用uno元素; 垃圾Archivoes另unopágina. SinFondoObrasy
 * Cola地址(profundo链, Actualizar)也挂este元素. 换Filtrar, posterior退anterior进y壳要求pesado开都Nopesado挂, 元素En每uno轮变化之posterior微Tareadentro按abajo面
 * 次序判断做哪uno件: 
 * - Detalles压Enarriba面: Entrada记Fondo(página面组按Fondo匹配)就什么都No做, abajo面eseunopáginauno直画着; SinFondo时补画uno次DirectorioCuadrícula
 *   (`ShellActions.catalog.fill`), Detallesabajo面NoDejauno永远En读骨架. 
 * - 壳要求按当anterior地址从头pesado开(`pageOpens` 加uno: 启动, profundo链Detalles关掉补画来处, 从Gestionar进回收站): CompletopáginaAbrir. 
 * - 领Nuevopágina面Abrir序号(posterior退anterior进, No认领Saltar a): CompletopáginaAbrir; posterior退anterior进从别处回到primeropágina时作废顶部tres层缓存, pesado掷取样Semilla, 
 *   EnDirectoriodentro换来换去沿用esteuno粒. 地址arriba写 `seed` 就用它. 
 * - 壳认领写地址(换Filtrar, 换Ordenar, 换uno批, 回primeropágina): Filtrarya经由壳写进 `state`, Solopesado取; 关掉Detalles回到压着eseuno
 *   地址, Filtrar也没变时Nopesado取. esteunopágina要es还没开过(posterior退落到压En别处之en laDetalles, 挂arriba时就被盖着), CompletopáginaAbrir. 
 * `pageOpens` 还es 0 时壳没Empezar路由, 元素Solo挂着. 挂arribaeseuno刻按eseuno次Historial变化认没认领分别算作posterior两; 路由根晚于
 * 壳Empezar路由才装arriba时, 挂arribaeseuno刻算No.uno. 
 *
 * `?state=ads` 落Enprimeropáginaarriba时NoAbrir, 改写成垃圾Archivo地址(No加Entrada), 由垃圾Archivoeseunopágina元素continuar着Abrir. Desinstalar时去处
 * NoesDirectorio, Detalles, Inmersivo或资料página, 就收起 `#grid` yprimeropáginaNuevas obras行: este些página面离开Directorio也Deja着它们. 判断, 改写y收起
 * 都排进微Tarea: 路由根EnHistorial变化同uno次调用dentroSincronizar提交, 壳订阅Historial早于路由根, 它写Títuloy侧栏eseuno轮排Enanterior面.  */
import { useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';

import { appSettingsStore } from '@peach/appearance';
import { isOverlayPath, navigationBackground, overlayTarget, peachHistory, shellNavigate } from '@peach/history';
import { cleanTagFilter, isCatalogPath, newSeed, ROUTE_STATES } from '@peach/legacy/core';
import { pageOpens, state, subscribeShell, writeShell, type CatalogFilters } from '@peach/shell';

import { junkPath, junkRoute } from '../../../junk-queue';
import { sortFromAddress } from '../../../sort-preferences';
import { ShellActionsContext, useOpenEpoch } from '../router';
import type { CatalogShell, ShellActions } from '../shell-actions';
import { entityTarget } from './index-entity';
import { JavLibraryHeader } from '../../jav/jav-header';
import { CatalogFolders } from '../../catalog-folders/catalog-folders-page';

const readOpens = () => pageOpens;

/* 每uno次Historial变化认没认领, 变化之anteriorEn哪unoRutaarriba. 模uno装载就听, 排En路由根之anterior: 路由根Sincronizar提交eseuno次读到
   ya经esesteuno次. `initialSeq` es装载eseuno刻序号, 挂arriba时序号还es它, Descripción路由根es装arribaeseunoabajo挂esteunopágina.  */
const initialSeq = peachHistory.navigation.seq;
let epoch = peachHistory.navigation.openEpoch;
let here = peachHistory.navigation.location.pathname;
let last = { seq: initialSeq, claimed: true, from: here };
peachHistory.listen((navigation) => {
  last = { seq: navigation.seq, claimed: navigation.openEpoch === epoch, from: here };
  epoch = navigation.openEpoch;
  here = navigation.location.pathname;
});

/* primeropáginaen la `?state=ads` 改写成垃圾Archivo地址eseunoabajo: 垃圾Archivoeseunopágina元素挂arriba时取走, CompletopáginaAbrir.  */
let junkRedirect = false;

/** 元素Anterior次Procesar到哪儿: 序号, página面Abrir序号, pesado开次数, eseuno刻ConSinDetalles压着, página面组画es哪uno地址y哪uno套Filtrar, 
 *  esteunopágina开过Sin.  */
interface Seen {
  seq: number;
  epoch: number;
  opens: number;
  covered: boolean;
  address: string;
  filters: string;
  opened: boolean;
}

function seen(opened: boolean): Seen {
  const { seq, openEpoch, location } = peachHistory.navigation;
  const covered = isOverlayPath(location.pathname);
  const shown = navigationBackground() ?? location;
  const filters = state ?? {};
  return {
    seq, epoch: openEpoch, opens: pageOpens, covered, address: `${shown.pathname}${shown.search}`,
    filters: JSON.stringify(filters, Object.keys(filters).sort()), opened,
  };
}

/** 按地址pesado建DirectorioFiltrar, 同壳启动时eseuno写法; 回收站Solo钉死Estado, 清掉别Filtrar. 产地y缩略ImagenNo随地址pesado读.  */
function filtersAt(pathname: string, search: string, entering: boolean, shell: CatalogShell): CatalogFilters {
  const previous: CatalogFilters = { ...state };
  if (pathname === '/trash') return { ...previous, creator: '', studio: '', tag: '', orient: '', state: 'trash', q: '' };
  const params = new URLSearchParams(search);
  const { defaultSort, defaultSortDirection } = appSettingsStore().value;
  return {
    ...previous,
    loc: params.get('loc') ?? shell.defaultLoc(),
    creator: params.get('creator') || '', studio: params.get('studio') || '',
    owner: params.get('owner') === 'none' ? 'none' : '',
    tag: cleanTagFilter(params.get('tag')), tag_match: params.get('tag_match') === 'any' ? 'any' : 'all',
    len: params.get('len') || '', dur_min: params.get('dur_min') || '', dur_max: params.get('dur_max') || '',
    orient: params.get('orient') || '',
    state: ROUTE_STATES[pathname] || params.get('state') || '',
    ...sortFromAddress(params.get('sort'), params.get('dir'), defaultSort, defaultSortDirection),
    seed: params.get('seed') || (entering ? newSeed() : previous.seed || newSeed()),
    q: params.get('q') || '', jav: params.get('jav') || '',
    performer: params.get('performer') || '', series: params.get('series') || '',
    browse: params.get('browse') === 'folders' || params.get('folder') ? 'folders' : '',
    folder: params.get('folder') || '', folder_recursive: params.get('folder_recursive') === '0' ? '0' : '',
  };
}

/** 判断esteuno轮做哪uno件, 做掉; `mark` 换成esteuno刻.  */
function settle(mark: Seen, actions: ShellActions): void {
  const was = { ...mark };
  const now = seen(was.opened);
  Object.assign(mark, now);
  const shell = actions.catalog;
  if (!shell || now.opens === 0) return;
  if (now.covered) {
    if (!navigationBackground()) shell.fill();
    return;
  }
  let entering = false;
  if (now.opens === was.opens) {
    if (now.epoch === was.epoch && was.opened) {
      if (now.seq === was.seq || (was.covered && now.address === was.address && now.filters === was.filters)) return;
      shell.load();
      return;
    }
    if (now.epoch !== was.epoch) entering = peachHistory.navigation.action === 'POP' && last.from !== '/';
  }
  const { pathname, search } = peachHistory.navigation.location;
  if (pathname === '/' && new URLSearchParams(search).get('state') === 'ads') {
    const { kind, view } = junkRoute(search);
    junkRedirect = true;
    shellNavigate(junkPath(kind, view), { replace: true });
    return;
  }
  const retitle = junkRedirect;
  junkRedirect = false;
  entering &&= pathname === '/';
  mark.opened = true;
  writeShell({ state: filtersAt(pathname, search, entering, shell) });
  shell.open(pathname, { entering, retitle });
}

/* 去处还画着Directorio东西就No收: Directorio几página之间换página由壳continuar着画; DetallesyInmersivo压Enarriba面; 资料página铺开时Solo藏起它们.  */
function keepsCatalog(pathname: string): boolean {
  return isCatalogPath(pathname) || pathname === '/trash' || isOverlayPath(pathname) || pathname === '/immerse'
    || !!entityTarget(pathname);
}

function CatalogOpen() {
  const actions = useContext(ShellActionsContext);
  const openEpoch = useOpenEpoch();
  const opens = useSyncExternalStore(subscribeShell, readOpens);
  const location = useLocation();
  const mark = useRef<Seen | null>(null);
  const live = useRef({ mounted: true, queued: false });
  useEffect(() => {
    const own = live.current;
    own.mounted = true;
    const now = seen(!isOverlayPath(peachHistory.navigation.location.pathname));
    /* 挂arribaesteuno刻就记abajo: 之posterior壳En同uno轮dentro要求pesado开(`pageOpens` 加uno), 微Tareadentro比得出来.  */
    if (!now.covered && now.opens > 0) {
      if (junkRedirect || last.seq === initialSeq) now.opens = -1;
      else if (!last.claimed) now.epoch = -1;
      else now.seq = -1;
    }
    mark.current = now;
    return () => {
      own.mounted = false;
      queueMicrotask(() => {
        if (actions?.catalog && !keepsCatalog(peachHistory.navigation.location.pathname)) actions.catalog.release();
      });
    };
    // 每次挂arribaSolo登记uno次; 之posterior变化由abajo面eseuno格排进微Tarea. 
  }, []);
  useEffect(() => {
    const own = live.current;
    if (own.queued || !actions) return;
    own.queued = true;
    queueMicrotask(() => {
      own.queued = false;
      if (own.mounted && mark.current) settle(mark.current, actions);
    });
  }, [openEpoch, opens, location, actions]);
  return null;
}

/** DirectorioseisRuta共用元素: primeropágina, tresFiltrar态y回收站uno key, 垃圾Archivo另uno; página面组按Fondo匹配时取Fondoeseunopágina. 
 *  覆盖地址ParámetroNoes数字(`/assets/abc`)时什么都No挂: eseNoesunoDetalles, abajo面也No补画.  */
export function CatalogMatch() {
  const { pathname, search } = useLocation();
  useLayoutEffect(() => {
    if (pathname !== '/wall') return;
    document.body.setAttribute('data-wall-open', '');
    document.documentElement.removeAttribute('data-wall-entry');
    const chrome = Array.from(document.querySelectorAll<HTMLElement>('header.top,#drawer,#main,#catalogFilter,#count,#javLibraryHeader,#feedNew'));
    const inert = chrome.map(node => node.inert);
    chrome.forEach(node => { node.inert = true });
    return () => {
      document.body.removeAttribute('data-wall-open');
      chrome.forEach((node, index) => { node.inert = inert[index] || false });
    };
  }, [pathname]);
  const actions = useContext(ShellActionsContext);
  const host = document.getElementById('javLibraryHeader');
  const jav = isCatalogPath(pathname) && new URLSearchParams(search).get('jav') === '1';
  useLayoutEffect(() => {
    if (!host) return;
    host.hidden = !jav;
    return () => { host.hidden = true };
  }, [host, jav]);
  if (isOverlayPath(pathname) && !overlayTarget(pathname)) return null;
  return <>
    <CatalogOpen key={pathname === '/junk-files' ? '/junk-files' : '/'} />
    {isCatalogPath(pathname) ? <CatalogFolders /> : null}
    {jav && host && actions ? createPortal(<JavLibraryHeader navigate={actions.navigate}
      receipt={message => actions.receipt(message)} />, host) : null}
  </>;
}
