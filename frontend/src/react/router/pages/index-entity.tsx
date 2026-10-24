/* 索引cincopáginay资料página路由元素(ADR-0031"索引páginay资料página同样由路由树按匹配Abrir"): página面组匹配到
 * `INDEX_ROUTES` 或 `ENTITY_ROUTES` 时挂arriba, 从地址读出esteunopáginaes谁, 带什么Parámetro, 再按地址Abrireseunopágina. 
 *
 * 元素自己什么都No画: página面经 `openManagedRoute` 登记进 `#index`, 由 `ManagedSurface` 画. Abriranterior先报
 * `surfaceChanged` 让壳收起别面, 铺开primeropáginaeseuno侧, 再铺骨架, primero屏取齐eseuno刻骨架yCompletopáginauno起换掉. 
 *
 * 什么时候Abrir: 
 * - 索引元素按página面Abrir序号(`useOpenEpoch()`)挂 key: posterior退anterior进yNo认领Saltar a各领uno代次, 就pesado挂, 按地址pesado开; 
 *   páginainterior写地址(Filtrar词, página签)由壳认领, 代次No变, Nopesado挂. 
 * - 资料página元素按类y名字挂 key: 换uno就pesado挂; 同uno领Nuevo代次(posterior退anterior进到另unoFiltrar)Solo地址en laNuevoFiltrar
 *   推给画着eseunopágina, eseunopágina没画着才Completopáginapesado开. 
 * - 壳要求按当anterior地址从头pesado开(`@peach/shell`  `pageOpens` 加uno: 批量写回之posterior, 点开正es画着eseuno)时, 
 *   两元素都Completopáginapesado开. `pageOpens` 还es 0 时壳没Empezar路由, 元素Solo挂着. 
 * - 挂arriba或领代次eseuno刻esteunopágina被Detalles压着(página面组按Fondo匹配): Nopesado开. 关掉Detalles时esteunopágina要es没开过, abajo面也没画着
 *   (posterior退落到压En别处之en laDetalles才挂arriba), 按地址CompletopáginaAbrir; 画着就No动. 
 *
 * Abrir排进微Tarea: 路由根EnHistorial变化同uno次调用dentroSincronizar提交, Abrir时收起Anteriorpáginay画primero帧都要Sincronizar提交, En提交阶段dentro
 * 做会出 flushSync 告警. 壳订阅Historial早于路由根, 它写Títuloy侧栏eseuno轮排Enanterior面.  */
import { useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';

import { appSettingsStore } from '@peach/appearance';
import { isOverlayPath, managedEntry, openManagedRoute, peachHistory, shellNavigate, updateManagedRoute } from '@peach/history';
import { ROUTE_ENTITIES, entityPath } from '@peach/legacy/core';
import { apiGet } from '../../../api';
import { queryClient } from '../../query';
import type { EntityPageData } from '../../entity-page/entity-page';
import { pageOpens, selectMode, subscribeShell, writeShell } from '@peach/shell';

import { indexParams, paintIndexSkeleton, peopleLayoutOf, type IndexPageKind } from '../../../index-skeleton';
import type { EntityPageProps } from '../../entity-page/entity-page';
import { ShellActionsContext, useOpenEpoch } from '../router';
import type { EntityPageShell, EntityRoutePath, ShellActions } from '../shell-actions';

const readOpens = () => pageOpens;
const readSelectMode = () => selectMode;
const indexHost = () => document.getElementById('index');

/** `usePageOpen` 两puede选判断. `shown()`: esteunopágina此刻画着Sin, 没开过元素EnDetalles关掉时据此决定要No要Abrir. 
 *  `onCovered()`: 挂arriba或领代次eseuno刻被Detalles压着时调uno次.  */
export interface PageOpenOptions {
  readonly shown?: () => boolean;
  readonly onCovered?: () => void;
}

/** esteuno格什么时候按地址Abrir. `run(fresh, live)`: `fresh` Como真esCompletopáginaAbrir(挂arriba, 壳要求pesado开), Como假es同uno
 *  元素领Nuevo代次; `live()` En元素卸abajo或又开uno次之posterior回 false. 关注páginayReproducirListapágina元素也用它.  */
export function usePageOpen(
  epoch: number, run: (fresh: boolean, live: () => boolean) => void, options: PageOpenOptions = {},
): void {
  const opens = useSyncExternalStore(subscribeShell, readOpens);
  /* 每次导航都pesado渲染uno次, Detalles压arriba来, 撤abajo去都ver得见. página面组给esFondoeseuno地址, 压没压着ver真实地址.  */
  useLocation();
  const covered = isOverlayPath(peachHistory.navigation.location.pathname);
  const seen = useRef({ mounted: true, epoch: -1, opens: -1, run: 0, opened: false });
  const latest = useRef({ run, options });
  useLayoutEffect(() => { latest.current = { run, options } });
  useEffect(() => {
    const mark = seen.current;
    mark.mounted = true;
    return () => { mark.mounted = false };
  }, []);
  useEffect(() => {
    if (opens === 0) return;
    queueMicrotask(() => {
      const mark = seen.current;
      if (!mark.mounted) return;
      /* 读esteuno刻 `pageOpens`: 壳写地址挂arribaesteuno格, 紧continuar着要求pesado开时, 两边合成uno次Abrir.  */
      const stale = mark.epoch !== epoch || mark.opens !== pageOpens;
      let fresh = mark.opens !== pageOpens;
      mark.epoch = epoch;
      mark.opens = pageOpens;
      if (isOverlayPath(peachHistory.navigation.location.pathname)) {
        if (stale) latest.current.options.onCovered?.();
        return;
      }
      if (!stale) {
        if (mark.opened || latest.current.options.shown?.()) {
          mark.opened = true;
          return;
        }
        fresh = true;
      }
      mark.opened = true;
      const mine = ++mark.run;
      latest.current.run(fresh, () => mark.mounted && mark.run === mine);
    });
  }, [epoch, opens, covered]);
}

/* ── 索引 ── */

async function openIndex(actions: ShellActions, kind: IndexPageKind, search: string, live: () => boolean) {
  const host = indexHost();
  if (!host) return;
  const path = `/${kind}` as const;
  actions.surfaceChanged('index', path);
  const params = indexParams(kind, search);
  const layout = peopleLayoutOf(appSettingsStore().value.peopleLayout);
  paintIndexSkeleton(host, params, layout);
  /* páginainterior换档, 存版, Cerrar sesiónSeleccionar, Avatary去处都En `ShellActions` dentro, 跟着Abrir走SoloCon地址arribaesecuatro项y此刻版, 
     SeleccionarClave y ConfiguraciónPermisos.  */
  const painted = await openManagedRoute(path,
    { ...params, layout, selectMode, configurable: !!actions.configurable?.() }, { container: host, isCurrent: live });
  if (painted && live()) actions.surfaceShown?.('index', path);
}

/* `#index` dentro画着, 露着esesteunopágina索引.  */
function indexShown(path: string): boolean {
  const host = indexHost();
  const entry = host ? managedEntry(host) : null;
  return !!host && !host.hidden && !!entry && entry.path === path && entry.host.isConnected;
}

function IndexOpen({ epoch }: { epoch: number }) {
  const actions = useContext(ShellActionsContext);
  const location = useLocation();
  const kind = location.pathname.split('/').filter(Boolean)[0] as IndexPageKind;
  usePageOpen(epoch, (_fresh, live) => {
    if (actions) void openIndex(actions, kind, location.search, live);
  }, { shown: () => indexShown(`/${kind}`) });
  return null;
}

/** 索引cincopágina共用元素. SeleccionarClave归壳: 开关uno变就推给画着Etiquetapágina, página面关掉时随之清空所选.  */
export function IndexMatch() {
  const epoch = useOpenEpoch();
  const on = useSyncExternalStore(subscribeShell, readSelectMode);
  const last = useRef(on);
  useEffect(() => {
    if (last.current === on) return;
    last.current = on;
    if (window.location.pathname === '/tags') updateManagedRoute(indexHost(), { selectMode: on });
  }, [on]);
  return <IndexOpen key={epoch} epoch={epoch} />;
}

/* ── 资料 ── */

/** 地址en laesteuno: 先Completo段解码再按段切开(名字en la斜杠吃掉剩abajoTodo段, 空段No算), 同壳 `matchPath`.  */
export function entityTarget(pathname: string): { segment: string; kind: string; name: string } | null {
  let path: string;
  try { path = decodeURIComponent(pathname) } catch { return null }
  const [segment = '', ...rest] = path.split('/').filter(Boolean);
  const kind = Object.hasOwn(ROUTE_ENTITIES, segment) ? ROUTE_ENTITIES[segment] : undefined;
  const name = rest.join('/');
  return kind && name ? { segment, kind, name } : null;
}

/* 卡片助手y动作就esDirectorioeseuno, 名册uno格取Imagen同索引página, 照片Muromásuno样: 灯箱dentro定本地Imagen片源Archivo. 按壳交进来
   eseuno组记uno, 每次Abrir交出去es同uno对象.  */
const cards = new WeakMap<ShellActions, EntityPageProps['card']>();
function entityCard(actions: ShellActions): EntityPageProps['card'] {
  let card = cards.get(actions);
  if (!card) {
    card = {
      helpers: { ...actions.grid.helpers, personAvatar: actions.personAvatar },
      actions: { ...actions.grid.actions, revealSource: actions.revealSource },
    };
    cards.set(actions, card);
  }
  return card;
}

/* `#index` dentro画着es资料página.  */
function entityShown(): boolean {
  const host = indexHost();
  const entry = host ? managedEntry(host) : null;
  return !!entry && entry.path.endsWith('/*') && entry.host.isConnected;
}

async function openEntity(
  actions: ShellActions, shell: EntityPageShell, target: { segment: string; kind: string; name: string },
  pathname: string, search: string, live: () => boolean, resolvedEntity: EntityPageData,
) {
  const host = indexHost();
  if (!host) return;
  const { segment, kind, name } = target;
  actions.surfaceChanged('entity', pathname);
  await shell.loading(kind, name, live);
  if (!live()) return;
  writeShell({ entityJavLayout: false });
  /* 卡exterior面依次es交集y玻璃浮层, Nuevas obras y 正文, 顶到底uno线. cuatro宿主先EnDocumentaciónexterior排bien, primero屏取齐eseuno刻才换掉骨架
     (`place`): 换掉y画出Completopágina落En同unoTareadentro. 资料卡, 浮层y正文各带uno层 `.peach-react`(React 子树样
     Rango); Nuevas obraseseuno行es遗Deja层卡片, 宿主No进esteRango.  */
  const frame = document.createElement('template');
  frame.innerHTML = `<div data-entity-hero><div class="peach-react"></div></div>
    <div data-entity-filter><div class="peach-react"></div></div>
    <section class="feednew" data-feed-new aria-label="No入BibliotecaNuevas obras" hidden></section>
    <div data-entity-body><div class="peach-react"></div></div>`;
  const parts = [...frame.content.childNodes];
  const hero = frame.content.querySelector('[data-entity-hero]')!;
  const hosts = {
    filter: frame.content.querySelector('[data-entity-filter]>.peach-react')!,
    feed: frame.content.querySelector<HTMLElement>('[data-feed-new]')!,
    body: frame.content.querySelector('[data-entity-body]>.peach-react')!,
  };
  const open = shell.props(kind, name, search);
  /* esteunopáginaesNoes JAV 语境由página面按No.unopáginaObras推出来, 写回壳Estado: 壳Ordenar项, 侧栏取数y卡片版都读它.  */
  const props: EntityPageProps = {
    ...open, hosts, card: entityCard(actions), resolvedEntity,
    actions: { ...open.actions, javContext: (on) => { writeShell({ entityJavLayout: !!on }) } },
  };
  const painted = await openManagedRoute(`/${segment}/*` as EntityRoutePath, props, {
    container: host, isCurrent: live,
    place: (container) => { container.replaceChildren(...parts); return hero.firstElementChild as HTMLElement },
  });
  if (!painted || !live() || !entityShown()) return;
  actions.surfaceShown?.('entity', pathname);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function EntityOpen({ target }: { target: { segment: string; kind: string; name: string } }) {
  const actions = useContext(ShellActionsContext);
  const epoch = useOpenEpoch();
  const location = useLocation();
  usePageOpen(epoch, (fresh, live) => {
    const shell = actions?.entity;
    if (!actions || !shell) return;
    void (async () => {
      const params = new URLSearchParams({ kind: target.kind });
      params.set(/^[0-9]+$/.test(target.name) ? 'id' : 'name', target.name);
      const entity = await queryClient.fetchQuery({ queryKey: ['entity-route', target.kind, target.name],
        queryFn: ({ signal }) => apiGet<EntityPageData>(`/api/entity?${params}`, signal), staleTime: 0 })
        .catch(() => null);
      if (!live()) return;
      if (entity?.redirect) {
        shellNavigate(entityPath(entity.redirect.kind, entity.redirect.name, entity.redirect.id) + location.search + location.hash,
          { replace: true, state: peachHistory.navigation.location.state });
        return;
      }
      if (!entity?.id || entity.error) { shell.missing(target.kind); return }
      const name = String(entity.canonical_name || target.name);
      const path = entityPath(target.kind, name, Number(entity.id));
      if (path !== location.pathname) {
        shellNavigate(path + location.search + location.hash, { replace: true, state: peachHistory.navigation.location.state });
        return;
      }
      if (!fresh && shell.refresh(target.kind, name, location.search)) return;
      void openEntity(actions, shell, { ...target, name }, location.pathname, location.search, live, entity);
    })();
  }, { shown: () => entityShown() && !indexHost()?.hidden });
  return null;
}

/** 资料páginacincoModo共用元素: 按类y名字挂 key, 同uno换FiltrarNopesado挂.  */
export function EntityMatch() {
  const target = entityTarget(useLocation().pathname);
  return target ? <EntityOpen key={JSON.stringify([target.kind, target.name])} target={target} /> : null;
}
