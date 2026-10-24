/* 侧栏(ADR-0031 No. 11f 步): izquierda侧抽屉dentro滚动eseuno层. 
 *
 * 常驻组件 `sidebar`(`router/managed-routes.tsx` 常驻表): 路由树它画进壳常驻 `#drawerScroll`, 宿主就es
 * ese节点本身(覆盖滚动挂En它arriba面, 轨道住En `#drawer` dentro). 壳启动时先SincronizarEn宿主dentro写uno同结构导航
 * 骨架(`sidebarSkeletonHtml`); Abriresteuno面时 `place` 清掉骨架, 路由树En同unoTareadentro画出primero帧(SoloCon导航), 
 * 壳紧continuar着经 `attached` marcay开合Clave挪进Título行, 再拿到句柄, 手arribaese props 推进来. 
 *
 * 之posterior壳Solo经 `configureSidebar` 给句柄说话: `render(props)` y `navChanged()` 写本模 store 再
 * `flushSync` 通知, 返回时ya经画bien—`navChanged` 跑En壳 `route()` Sincronizar段dentro, 玻璃拿到esantiguoUbicación到NuevoUbicación. 
 * 换página, 换Filtrar, 换语境都落En同uno组件arriba, 导航eseuno列 y 它arriba面玻璃从头到尾es同uno批节点—换节点, 
 * 玻璃移就从头起跑, ver到Soloes当anterior项换地方亮起来. 
 *
 * 玻璃画En `#drawer` arriba(portal), NoEn滚动层dentro: 它要跟着eseuno列纵滚, 又No能被滚动层切掉回弹eseuno截. 
 * 移y抻largo交给 `useViewGlide` 纵轴版, 同Filtrarese几排es同uno动法. 
 *
 * Título行 `[data-sidebar-head]` 画成unoSin子节点空槽: marcay开合Clavees壳节点, 由壳挪进来, 组件No往este
 * 槽dentro画任何东西, pesado画也就No碰它们. 
 *
 * Agrupar开合走共用 Collapse  `setCollapseOpen`(同Configuraciónpágina `Disclosure`): Original生 `details` 给Clave盘y
 * Sin障碍语义, `open` No写成受控属性, 收起ese段过渡dentro它才No会被pesadoNuevo画成展开. 
 *
 * 宿主No包 `.peach-react`: esteuno列uno直En Preflight 之exterior, 按钮yTamaño de fuente继承es遗Deja层Todo局Regla, 样TodoEn
 * `sidebar.css`, No用工具类.  */
import {
  createContext, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore,
  type DragEvent, type MouseEvent, type ReactNode,
} from 'react';
import { createPortal, flushSync } from 'react-dom';

import { growCollapse, popBadges, setCollapseOpen } from '@peach/legacy/ui';

import { useViewGlide } from '../components/use-view-glide';
import { Icon } from '../settings-panel/icon';
import type {
  SidebarApi, SidebarChip, SidebarContent, SidebarDot, SidebarFacets, SidebarHost, SidebarProps,
} from './sidebar-api';
import { moveSidebarKey, useCommitSidebarOrder } from './sidebar-order';

/* primeropáginaeseuno项Clavees空串; 空串写进 dataTransfer etc.于没写, 给它uno占.  */
const HOME = '__home__';
/* "展开Todo"之anterior每组先露másmenos.  */
const LIMITS = { creator: 26, tag: 30, tech: 16 } as const;
/* Duración拉量程(分钟): derecha端拉到头es"No限".  */
const DURATION_MAX = 180;

let host: SidebarHost | null = null;
/* store en launo: 壳推来 props y导航按abajo态代次(壳说"pesado读uno遍"时加uno, 玻璃按Nuevo按abajo项落). 
   每次写入换unoNuevo对象, 订阅者按引用判断变没变.  */
let shown: { props: SidebarProps; epoch: number } = { props: { content: null, filters: {}, latest: null }, epoch: 0 };
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
}

function notify(): void {
  for (const listener of [...listeners]) listener();
}

/* esteuno面抛错, 被Error边界卸掉之posterior没人订阅, 推进来Solo写进 store, No画, No抛.  */
const api: SidebarApi = {
  render(next) { shown = { ...shown, props: next }; flushSync(notify) },
  navChanged() { shown = { ...shown, epoch: shown.epoch + 1 }; flushSync(notify) },
};

/** continuararriba壳给宿主, 拿回侧栏命令入口. Solo调uno次; 壳 `loadSidebar` continuar着En路由树dentroAbriresteuno面, primero帧Solo画
 *  导航, 画arriba之posterior调 `attached`, 交出句柄, 壳随即手arribaese props 推进来.  */
export function configureSidebar(next: SidebarHost): SidebarApi {
  host = next;
  shown = { ...shown, props: { content: null, filters: {}, latest: null } };
  return api;
}

/** 常驻表en laeseuno面: 读本模 store, 宿主还没continuararriba时No画.  */
export function SidebarSurface() {
  const current = useSyncExternalStore(subscribe, () => shown);
  return host ? <Sidebar host={host} props={current.props} epoch={current.epoch} /> : null;
}

/* ── Completo列 ── */

function Sidebar({ host: at, props: view, epoch }: { host: SidebarHost; props: SidebarProps; epoch: number }) {
  const version = useSyncExternalStore(at.store.subscribe, at.store.version);
  return (
    <>
      <div data-sidebar-head="" />
      <Navigation host={at} epoch={epoch} version={version} />
      {view.content ? <Groups host={at} content={view.content} filters={view.filters} latest={view.latest} /> : null}
    </>
  );
}

/* ── 导航 ── */

function Navigation({ host: at, epoch, version }: { host: SidebarHost; epoch: number; version: number }) {
  const commit = useCommitSidebarOrder(at.store);
  const order = at.store.value.sidebarOrder;
  const byKey = new Map(at.navCatalog.map((item) => [item[0], item]));
  const items = order.map((key) => byKey.get(key)).filter((item) => item !== undefined);
  const pressed = items.map(([key]) => at.navOn(key));
  const column = useRef<HTMLDivElement | null>(null);
  const pane = useRef<HTMLSpanElement | null>(null);
  const glideKey = `${epoch}:${version}:${items.map(([key], index) => pressed[index] ? key || HOME : '').join(',')}`;
  const glide = useViewGlide(pane, column, '[data-nav][aria-pressed="true"]', glideKey, { axis: 'y' });
  const { sync } = glide;

  /* 抽屉开合(桌面arribaancho度En 60 y 260 之间过渡), 滚动层改尺寸, Título行dentromarca挪进来, 都Solopesado量, 
     No动画; 开合之posteriorPasar el ratóneseuno格No算数, 回到当anterior项.  */
  useEffect(() => {
    const scroll = at.scroll, drawer = scroll.parentElement;
    const head = scroll.querySelector<HTMLElement>(':scope > [data-sidebar-head]');
    const resize = new ResizeObserver(() => sync());
    [drawer, scroll, head].forEach((node) => { if (node) resize.observe(node) });
    document.addEventListener('board:sidebar', sync);
    return () => { resize.disconnect(); document.removeEventListener('board:sidebar', sync) };
  }, [at, sync]);

  const [dragging, setDragging] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ key: string; after: boolean } | null>(null);
  const clearDrag = () => { setDragging(null); setDrop(null) };
  const drag = (key: string) => ({
    draggable: true,
    onDragStart: (event: DragEvent<HTMLButtonElement>) => {
      setDragging(key);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', key || HOME);
    },
    onDragOver: (event: DragEvent<HTMLButtonElement>) => {
      if (dragging === null || dragging === key) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const after = event.clientY > event.currentTarget.getBoundingClientRect().top + event.currentTarget.offsetHeight / 2;
      if (drop?.key !== key || drop.after !== after) setDrop({ key, after });
    },
    onDrop: (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const from = dragging, after = drop?.key === key ? drop.after : false;
      clearDrag();
      const next = from === null ? null : moveSidebarKey(order, from, key, after);
      if (next) commit(next);
    },
    onDragEnd: clearDrag,
  });

  const drawer = at.scroll.parentElement;
  return (
    <>
      <div data-sidebar-nav="" ref={column} onPointerLeave={glide.leave}>
        {items.map(([key, label, glyph], index) => (
          <button type="button" key={key || HOME} data-nav={key} aria-pressed={pressed[index]} aria-label={label}
            data-dragging={dragging === key ? '' : undefined}
            data-drop={drop?.key === key ? (drop.after ? 'after' : 'before') : undefined}
            onClick={() => at.navTo(key)} onPointerEnter={glide.hover} {...drag(key)}>
            {key === '' ? <img data-sidebar-home-logo="" src="/peach-logo.png" alt="" /> : <Icon name={glyph} />}
            <span>{label}</span>
          </button>
        ))}
      </div>
      {drawer ? createPortal(<span data-sidebar-glide="" aria-hidden="true" ref={pane} />, drawer) : null}
    </>
  );
}

/* ── FiltrarAgrupar ── */

interface GroupSpec {
  title: string;
  kind: string;
  body: ReactNode;
  active: boolean;
}

const selectedValues = (filters: SidebarProps['filters'], key: string) =>
  String(filters[key] ?? '').split(',').filter(Boolean);

function countsOf(latest: SidebarFacets | null): Map<string, number> | null {
  if (!latest) return null;
  const counts = new Map<string, number>();
  const rows: [string, SidebarChip[]][] = [['loc', latest.locations], ['orient', latest.orientations],
    ['region', latest.regions], ['creator', latest.creators], ['tag', latest.tags], ['tag', latest.tech]];
  for (const [key, chips] of rows) for (const chip of chips) counts.set(`${key}\n${chip.value}`, chip.n ?? 0);
  return counts;
}

function Groups({ host: at, content, filters, latest }: {
  host: SidebarHost; content: SidebarContent; filters: SidebarProps['filters']; latest: SidebarFacets | null;
}) {
  const key = content.kind === 'catalog' ? content.key
    : `follow:${content.selected.join(',')}:${content.tags.map((row) => row.value).join(',')}`
      + `:${(content.providers || []).map((row) => row.value).join(',')}:${filters.provider ?? ''}`
      + `:${content.duration ? 1 : 0}:${filters.dur_min ?? ''}:${filters.dur_max ?? ''}`;
  /* 计数徽标弹No弹由 `popBadges` 按Anterior次见到值判断, No按节点esNoesNuevo判断: 每来unoNuevo聚合
     问uno次, 换unoFiltrar时Completo列计数才No会uno起弹.  */
  useLayoutEffect(() => { if (content.kind === 'catalog') popBadges(at.scroll, 'drawer') }, [at, key, content.kind]);
  const groups = content.kind === 'catalog'
    ? catalogGroups(at, content.facets, filters, latest, key)
    : followGroups(at, content, filters);
  let index = 0;
  return groups.map((group) => group && (
    <Group key={group.title} title={group.title} kind={group.kind} active={group.active} index={index++} epoch={key}>
      {group.body}
    </Group>
  ));
}

function catalogGroups(
  at: SidebarHost, facets: SidebarFacets, filters: SidebarProps['filters'], latest: SidebarFacets | null, epoch: string,
): (GroupSpec | null)[] {
  const counts = countsOf(latest);
  const chips = (rows: SidebarChip[], key: string, multi: boolean): GroupSpec['body'] | null => {
    if (!rows.length) return null;
    const selected = selectedValues(filters, key);
    return <ChipList rows={rows} filterKey={key} multi={multi} selected={selected} counts={counts} host={at} />;
  };
  const spec = (title: string, kind: string, rows: SidebarChip[], key: string, multi: boolean, more?: keyof typeof LIMITS) => {
    if (!rows.length) return null;
    const selected = selectedValues(filters, key);
    const active = rows.some((row) => selected.includes(row.value));
    if (!more) return { title, kind, active, body: chips(rows, key, multi) };
    const source = more === 'creator' ? latest?.creators : more === 'tag' ? latest?.tags : latest?.tech;
    return {
      title, kind, active,
      body: <MoreList epoch={epoch} title={title} rows={rows} latest={source ?? null} limit={LIMITS[more]} filterKey={key}
        selected={selected} counts={counts} host={at} expandable={more !== 'tech'} />,
    };
  };
  return [
    spec('Fuente', 'src', facets.locations, 'loc', true),
    facets.duration
      ? { title: 'Duración', kind: 'meta', active: false, body: <Duration host={at} filters={filters} /> }
      : null,
    /* 产地紧挨着来源: 两者回答都es"este批片打哪来", uno说存储, uno说Lanzamiento体系. puedemás选.  */
    spec('Origen', 'general', facets.regions, 'region', true),
    spec('Formato de imagen', 'meta', facets.orientations, 'orient', false),
    spec('Creador', 'artist', facets.creators, 'creator', false, 'creator'),
    spec('Etiquetas de contenido', 'general', facets.tags, 'tag', false, 'tag'),
    spec('Propiedades del video', 'meta', facets.tech, 'tag', false, 'tech'),
    facets.followTags.length ? {
      title: 'SeguirEtiqueta', kind: 'online', active: false,
      body: <FollowChips rows={facets.followTags} host={at} selected={null} badges />,
    } : null,
  ];
}

/* 关注páginay关注Detalles: 次序同Directorioeseuno列, 来源, DuraciónEnanterior, contenidoEtiquetaEnposterior. 来源yDuración回es关注páginaFiltrar, 
   NoesDirectorio `commitContextFilter`.  */
function followGroups(
  at: SidebarHost, content: Extract<SidebarContent, { kind: 'follow' }>, filters: SidebarProps['filters'],
): (GroupSpec | null)[] {
  const providers = content.providers || [];
  const provider = selectedValues(filters, 'provider');
  const selected = new Set(content.selected);
  return [
    providers.length ? {
      title: 'Fuente', kind: 'src', active: providers.some((row) => provider.includes(row.value)),
      body: <ChipList rows={providers} filterKey="provider" multi={false} selected={provider} counts={null} host={at}
        onToggle={(_key, value) => at.selectFollowProvider(value)} />,
    } : null,
    content.duration
      ? { title: 'Duración', kind: 'meta', active: false, body: <Duration host={at} filters={filters} commit={at.setFollowDuration} /> }
      : null,
    content.tags.length ? {
      title: 'Etiquetas de contenido', kind: 'online', active: content.tags.some((row) => selected.has(row.value)),
      body: <FollowChips rows={content.tags} host={at} selected={selected} badges={false} />,
    } : null,
  ];
}

/* uno进来SoloConEn curso生效ese几组es展开. 挑两组常驻展开etc.于替人决定他este次要按哪维度筛, 而侧栏uno屏
   就ese么largo, 展开部分别组挤到verNo见地方去. 人自己开合过组按esteuno次会话记住.  */
function wantOpen(title: string, active: boolean): boolean {
  let saved: string | null = null;
  try { saved = sessionStorage.getItem(`peach.sidebar.group.${title}`) } catch { /* 存储Nopuede用就按按abajo态 */ }
  return saved !== null ? saved === 'open' : active;
}

function Group({ title, kind, active, index, epoch, children }: {
  title: string; kind: string; active: boolean; index: number; epoch: string; children: ReactNode;
}) {
  const details = useRef<HTMLDetailsElement | null>(null);
  const body = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(() => wantOpen(title, active));
  const mounted = useRef(false);
  /* No.uno次挂arriba时初始Estado落到 DOM; 往posterior每来unoNuevo聚合, 没被人开合过组pesadoNuevo按按abajo态定.  */
  useLayoutEffect(() => {
    const node = details.current, collapse = body.current;
    if (!node || !collapse) return;
    const want = mounted.current ? wantOpen(title, active) : open;
    mounted.current = true;
    if (node.open === want) return;
    node.open = want;
    collapse.inert = !want;
    collapse.style.height = '';
    if (collapse.classList.contains('ui-fcollapse')) collapse.classList.toggle('ui-fcollapse-settled', want);
    setOpen(want);
  }, [epoch]);
  const toggle = (event?: MouseEvent) => {
    event?.preventDefault();
    if (!details.current || !body.current) return;
    const next = !open;
    setCollapseOpen(details.current, body.current, next);
    setOpen(next);
    try { sessionStorage.setItem(`peach.sidebar.group.${title}`, next ? 'open' : 'closed') } catch { /* SoloesNo记住 */ }
  };
  const collapseId = `sidebar-collapse-${index}`;
  return (
    <details ref={details} data-sidebar-group={title} data-sidebar-kind={kind}>
      <summary role="button" data-sidebar-toggle="" aria-expanded={open} aria-controls={collapseId} onClick={toggle}>
        <Icon name="chevron-right" /><span>{title}</span>
      </summary>
      <div ref={body} data-sidebar-collapse="" id={collapseId} inert={!open}>
        <div data-sidebar-collapse-body="">
          <div data-sidebar-body="" id={`sidebar-group-${encodeURIComponent(title)}`}>
            <GroupToggle.Provider value={toggle}>{children}</GroupToggle.Provider>
          </div>
        </div>
      </div>
    </details>
  );
}

/* 名单último尾ese"收起"收esCompleto组: 组开合En `Group` 手dentro, 经esteuno层递abajo去.  */
const GroupToggle = createContext<() => void>(() => {});

function Dot({ dot }: { dot?: SidebarDot }) {
  if (!dot) return null;
  if (dot.kind === 'glyph') return <Icon name={dot.name} />;
  if (dot.kind === 'image') return <img data-sidebar-source-icon="" src={dot.src} alt="" />;
  return <i data-sidebar-cost={dot.cost} />;
}

function ChipList({ rows, filterKey, multi, selected, counts, host: at, onToggle = at.toggleChip }: {
  rows: SidebarChip[]; filterKey: string; multi: boolean; selected: string[];
  counts: Map<string, number> | null; host: SidebarHost;
  /** 点abajo去回给谁: 缺省esDirectorioFiltrar, 关注página换成它自己.  */
  onToggle?: SidebarHost['toggleChip'];
}) {
  return (
    <div data-sidebar-chips="">
      {rows.map((row) => {
        const n = row.n === null ? null : counts ? counts.get(`${filterKey}\n${row.value}`) ?? 0 : row.n;
        return (
          <button type="button" key={row.value} data-sidebar-chip="" aria-pressed={selected.includes(row.value)}
            data-key={filterKey} data-val={row.value} data-multi={multi ? '1' : '0'}
            data-offline={row.offline ? '' : undefined} disabled={!!row.offline} title={row.offline || row.label}
            onClick={() => onToggle(filterKey, row.value, multi)}>
            <Dot dot={row.dot} />
            <span data-sidebar-chip-label="">{row.label}</span>
            {n === null ? null : <span data-sidebar-count="" data-count-badge={`${filterKey}:${row.value}`}>{n.toLocaleString()}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* 展开ClavecontinuarEn名单último尾, 它说es"este名单还没完"—ese句话要跟名单断掉地方Enuno起. 身量取排名ese
   展开药丸: uno箭头就说得完事No必再配uno句字. 摊开照最Nuevoeseuno聚合pesado排Completo组.  */
function MoreList({ epoch, title, rows, latest, limit, filterKey, selected, counts, host: at, expandable }: {
  epoch: string; title: string; rows: SidebarChip[]; latest: SidebarChip[] | null; limit: number; filterKey: string;
  selected: string[]; counts: Map<string, number> | null; host: SidebarHost; expandable: boolean;
}) {
  const toggleGroup = useContext(GroupToggle);
  const [shown, setShown] = useState<{ rows: SidebarChip[]; all: boolean } | null>(null);
  /* Nuevouno聚合到来时名单从头摊: 成员换回esteunoanterior几, 展开Clave回到"展开Todo".  */
  const [seen, setSeen] = useState(epoch);
  if (seen !== epoch) { setSeen(epoch); setShown(null) }
  const grow = useRef<{ body: HTMLElement; before: number; scroller: HTMLElement; keep: number } | null>(null);
  const button = useRef<HTMLButtonElement | null>(null);
  const expanded = !!shown?.all;
  const list = shown ? shown.rows : rows;

  /* esteuno列Ubicación归人自己管: 摊开contenidoTodoEn按abajoeste点以abajo, 他挪过去etc.于替他决定现En要verNo.几. 
     名单uno变largo, Explorar dispositivo会顺着焦点 y 锚定esteuno列推走, 所以记abajo再放回.  */
  useLayoutEffect(() => {
    const run = grow.current;
    if (!run) return;
    grow.current = null;
    const hold = () => { run.scroller.scrollTop = run.keep };
    if (expanded) {
      const details = run.body.closest('details');
      run.body.classList.add('ui-fcollapse');
      growCollapse(run.body, run.before, () => !!details?.open && !run.body.inert);
    }
    hold();
    requestAnimationFrame(hold);
  }, [shown, expanded]);

  const more = () => {
    const node = button.current;
    const body = node?.closest<HTMLElement>('[data-sidebar-collapse]');
    const scroller = at.scroll;
    if (!node || !body) return;
    grow.current = { body, before: body.getBoundingClientRect().height, scroller, keep: scroller.scrollTop };
    const source = latest ?? rows;
    setShown({ rows: source, all: !expanded });
    /* 收起收esCompleto组. 名单ya经摊到最largo, 它退回dosdiez几Soloes换uno断点, 人还站En同uno列读No完东西
       anterior面; 他按esteunoabajo要esesteuno组放回去.  */
    if (expanded) toggleGroup();
  };
  return (
    <>
      <ChipList rows={expanded ? list : list.slice(0, limit)} filterKey={filterKey} multi={false} selected={selected}
        counts={counts} host={at} />
      {expandable && rows.length > limit
        ? <button type="button" ref={button} data-sidebar-more={filterKey} aria-expanded={expanded}
            aria-label={`${expanded ? 'Colapsar' : 'ExpandirTodo'}${title}`} onClick={more}><Icon name="chevron-down" /></button>
        : null}
    </>
  );
}

function FollowChips({ rows, host: at, selected, badges }: {
  rows: SidebarChip[]; host: SidebarHost; selected: Set<string> | null; badges: boolean;
}) {
  return (
    <div data-sidebar-chips="">
      {rows.map((row) => (
        <button type="button" key={row.value} data-sidebar-chip="" data-online="" data-follow-drawer-tag={row.value}
          aria-pressed={selected ? selected.has(row.value) : undefined} title={row.label}
          onClick={() => (selected ? at.selectFollowTag(row.value) : at.openFollowTag(row.value))}>
          <span data-sidebar-chip-label="">{row.label}</span>
          <span data-sidebar-count="" data-count-badge={badges ? `follow:${row.value}` : undefined}>
            {badges ? (row.n ?? 0).toLocaleString() : row.n}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Duración ──
   DuraciónSoloConuno处读数: 手柄arriba方ese气泡. 另起uno行写"No限 — No限"es同uno件事说No.dos遍, 而且滑No动时
   它永远esese句话. 两端都常显: aquíes唯uno报数地方, 藏起来话No碰滑就verNo出当anterior筛es哪uno段.  */

const minutesOf = (seconds: unknown, fallback: number) =>
  seconds ? Math.min(DURATION_MAX, Number(seconds) / 60) : fallback;

function Duration({ host: at, filters, commit: onCommit = at.setDuration }: {
  host: SidebarHost; filters: SidebarProps['filters'];
  /** 松手时回给谁: 缺省esDirectorioFiltrar, 关注página换成它自己.  */
  commit?: SidebarHost['setDuration'];
}) {
  const source = `${filters.dur_min ?? ''}:${filters.dur_max ?? ''}`;
  const [seen, setSeen] = useState(source);
  const [range, setRange] = useState(() => [minutesOf(filters.dur_min, 0), minutesOf(filters.dur_max, DURATION_MAX)]);
  /* 刚动过ese压Enarriba面: 两端拖到uno起时它们会叠, 底abajoese报es自己停abajoUbicación.  */
  const [active, setActive] = useState<'min' | 'max'>('max');
  if (seen !== source) {
    setSeen(source);
    setRange([minutesOf(filters.dur_min, 0), minutesOf(filters.dur_max, DURATION_MAX)]);
  }
  const [lo, hi] = range;
  const group = useRef<HTMLDivElement | null>(null);
  const minInput = useRef<HTMLInputElement | null>(null);
  const maxInput = useRef<HTMLInputElement | null>(null);
  const latest = useRef(range);
  latest.current = range;

  const move = (end: 'min' | 'max', value: number) => {
    let [nextLo, nextHi] = end === 'min' ? [value, hi] : [lo, value];
    if (nextLo > nextHi) { if (end === 'min') nextHi = nextLo; else nextLo = nextHi }
    setActive(end);
    setRange([nextLo, nextHi]);
    return [nextLo, nextHi];
  };

  /* 拖动Solo改读数, 松手(`change`)才提交: React  onChange continuares每uno步 input.  */
  useEffect(() => {
    const commit = () => onCommit(latest.current[0], latest.current[1]);
    const inputs = [minInput.current, maxInput.current];
    inputs.forEach((input) => input?.addEventListener('change', commit));
    return () => inputs.forEach((input) => input?.removeEventListener('change', commit));
  }, [onCommit]);

  /* ya选eseuno截y两气泡Ubicación写En样变量y `left` arriba. 气泡对着手柄居en proceso, 伸出轨道eseuno截按实测
     溢出量收回来: 侧栏Solo比轨道ancho出uno点点, 越界medio截被侧栏裁掉, 读数就Solo剩unomedio. 量之anterior先Anterior次
     移清掉, 否则量到esya经收过uno次Ubicación, 越拖越偏.  */
  useLayoutEffect(() => {
    const node = group.current;
    if (!node) return;
    node.style.setProperty('--lo', `${lo / DURATION_MAX * 100}%`);
    node.style.setProperty('--hi', `${hi / DURATION_MAX * 100}%`);
    const bounds = node.getBoundingClientRect();
    node.querySelectorAll<HTMLElement>('[data-sidebar-range-tip]').forEach((tip) => {
      const value = tip.dataset.rangeEnd === 'max' ? hi : lo;
      tip.style.left = `${value / DURATION_MAX * 100}%`;
      tip.style.setProperty('--range-tip-shift', '0px');
      const box = tip.getBoundingClientRect();
      const shift = box.right > bounds.right ? bounds.right - box.right : box.left < bounds.left ? bounds.left - box.left : 0;
      if (shift) tip.style.setProperty('--range-tip-shift', `${Math.round(shift)}px`);
    });
  }, [lo, hi]);

  const tip = (end: 'min' | 'max', value: number) => (
    <output data-sidebar-range-tip="" data-range-end={end} data-range-active={active === end ? '' : undefined} aria-hidden="true">
      {end === 'max' && value >= DURATION_MAX ? 'Sin límite' : `${value} minuto(s)`}
    </output>
  );
  return (
    <div data-sidebar-duration="">
      <div data-sidebar-range="" id="durationRange" ref={group}>
        <span data-sidebar-range-base="" />
        <span data-sidebar-range-fill="" />
        <input id="durMin" type="range" min="0" max={DURATION_MAX} step="5" value={lo} aria-label="最cortoDuración(minuto(s))"
          ref={minInput} onChange={(event) => move('min', Number(event.currentTarget.value))} />
        <input id="durMax" type="range" min="0" max={DURATION_MAX} step="5" value={hi} aria-label="El más largoDuración(minuto(s))"
          ref={maxInput} onChange={(event) => move('max', Number(event.currentTarget.value))} />
        {tip('min', lo)}
        {tip('max', hi)}
      </div>
    </div>
  );
}
