/* cinco索引Página: 艺人, 创作者, Sello, Agenciacuatro名册,  y Etiqueta词表. 
 *
 * 地址栏es唯uno真相. 壳从地址读出 kind/q/scope/view/category 作初值挂arriba来, página面换档
 * (Sello↔Agencia, 本地↔En线, Tipo, 视Imagen, Filtrar词)Solo改自己Estadoy经 `route` 写回地址, 
 * Nopesado挂: pesado挂会让página头连同Filtrar框dentroEn curso打字uno起被换掉, Tabs ese蓝线从头起跑. 
 *
 * página头SoloConTítulo, 读数, 版Cambiar y Filtrar框; página面级Cambiar(Sello/Agencia, 本地/En线)espágina头
 * abajo面ese排 Tabs. Etiquetapágina读数住En浮层abajo排, página头No再Repetiruno遍.  */
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Radio } from 'react-aria-components';

import { refitNativeImages } from '@peach/card-art';
import { requestErrorMessage } from '@peach/legacy/core';
import { indexSkeletonHtml } from '@peach/legacy/ui';

import { Button, ButtonLink } from '@/components/base/buttons/button';
import { InputBase, TextField } from '@/components/base/input/input';

import { IDENTITY_ROW_CLASS } from '../../identity-filter';

import { BoardTabs, type BoardTab } from '../components/board-tabs';
import { EmptyState } from '../components/empty-state';
import { LibraryShortcuts } from '../library-shortcuts/shortcut-controls';
import { LoadingDots } from '../components/loading-dots';
import { SEGMENTED_TRACK, SEGMENT_ICON, SegmentedRadioGroup as RadioGroup } from '../components/segmented';
import { spriteGlyph } from '../components/sprite-glyph';
import type { OnlineAuthor, OnlineTag } from '../follow/online-vocab';
import {
  INDEX_TITLES, IDENTITY_CATEGORIES, ONLINE_TAG_CATEGORIES, TAG_CATEGORIES, countText, flatItems, indexQuery, indexRoute, indexSource, isCompany,
  isPeople, tagGroups, type IndexKind, type IndexPage as Page, type IndexPerson, type IndexProps,
  type IndexRoute, type IndexScope, type IndexTag, type PeopleLayout,
} from './index-data';
import { OnlineAuthors, PeopleGrid } from './index-people';
import { TagAlphabet, TagCloud, TagDock, TagFilters, type TagEntry } from './index-tags';

/* SelloyAgenciaes两实体, Noes同unoDatos两Filtrar: Sello出片, Agencia出人. 所以este开关切
   es地址. 场记板归Sello, 公文包归Agencia, 字形各说各eseuno件事.  */
const MAKER_TABS: BoardTab<'studios' | 'agencies'>[] = [
  { value: 'studios', label: 'Sello', symbol: 'clapperboard' },
  { value: 'agencies', label: 'Agencia', symbol: 'briefcase' },
];
/* 本地yEn线es两套词表: 计数口径, Categoría划分 y 点开去哪儿都No同, 所以也espágina面级 Tabs.  */
const SCOPE_TABS: BoardTab<IndexScope>[] = [
  { value: 'local', label: 'Local', symbol: 'hard-drive' },
  { value: 'online', label: 'En línea', symbol: 'rss' },
];
const PEOPLE_TABS: BoardTab<'performers' | 'creators' | 'online'>[] = [
  { value: 'performers', label: 'Actriz', symbol: 'user-round' },
  { value: 'creators', label: 'Vendedor', symbol: 'user-round' },
  { value: 'online', label: 'En línea', symbol: 'rss' },
];

/* 公司eseuno格摆es标识而Noes脸, 沿用艺人ese套词就esSugerencia说着"竖幅Avatar", 屏幕arriba摆着方标识. 
   档仍es同unoConfiguración值, 分开SoloCon说法.  */
const LAYOUTS: Record<'people' | 'company', readonly (readonly [PeopleLayout, string, string])[]> = {
  people: [['big', 'Imagen grande · Avatar vertical', 'maximize'], ['compact', 'Compacto · Avatar circular', 'layout-grid']],
  company: [['big', 'Imagen grande · Logo completo', 'maximize'], ['compact', 'Compacto · Logo circular', 'layout-grid']],
};

function LayoutSwitch(
  { kind, layout, onChange }: { kind: IndexKind; layout: PeopleLayout; onChange(layout: PeopleLayout): void },
) {
  return (
    <RadioGroup aria-label={`${INDEX_TITLES[kind]}Indexar版`} orientation="horizontal" value={layout}
      onChange={(next) => onChange(next as PeopleLayout)} data-index-layout=""
      className={`flex-none max-board-narrow:order-3 ${SEGMENTED_TRACK}`}>
      {LAYOUTS[isCompany(kind) ? 'company' : 'people'].map(([value, label, symbol]) => {
        const Glyph = spriteGlyph(symbol);
        return (
          <Radio key={value} value={value} aria-label={label} className={SEGMENT_ICON}>
            <span title={label} className="contents"><Glyph className="size-4" /></span>
          </Radio>
        );
      })}
    </RadioGroup>
  );
}

const SearchGlyph = spriteGlyph('search');

/* Solo读FiltrarNo配提交按钮: 停手 300ms 就查, 回车es"别etc., 现En就查". en proceso文Introducir法选字过程en proceso
   uno样发 input, 拿还没定型拼音去筛, 筛es"zhon"estemedio截Introducir; 组完字由 compositionend
   continuar手, 组字过程en proceso回车esEn定字, 也放过去.  */
function IndexSearch({ label, value, onQuery }: { label: string; value: string; onQuery(q: string): void }) {
  const [text, setText] = useState(value);
  const composing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const later = (next: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onQuery(next.trim()), 300);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || composing.current || event.nativeEvent.isComposing) return;
    event.preventDefault();
    clearTimeout(timer.current);
    onQuery(text.trim());
  };
  return (
    <div data-index-search="" className="ml-auto min-w-35 max-w-80 flex-1 max-board-narrow:order-1 max-board-narrow:basis-40"
      onCompositionStart={() => { composing.current = true }}
      onCompositionEnd={(event) => { composing.current = false; later((event.target as HTMLInputElement).value) }}>
      <TextField aria-label={label} value={text}
        onChange={(next) => { setText(next); if (!composing.current) later(next) }}>
        <InputBase type="search" leadingIcon={SearchGlyph} spellCheck={false} autoComplete="off" enterKeyHint="search"
          onKeyDown={onKeyDown} />
      </TextField>
    </div>
  );
}

type Item = IndexPerson | IndexTag | OnlineAuthor | OnlineTag;

export function IndexPage(props: IndexProps) {
  const [route, setRoute] = useState<IndexRoute>(() => indexRoute(
    { kind: props.kind, q: props.q, scope: props.scope, view: props.view, category: props.category },
  ));
  const [layout, setLayout] = useState<PeopleLayout>(props.layout);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [match, setMatch] = useState<'any' | 'all'>('any');
  const root = useRef<HTMLDivElement>(null);
  const { kind, q, scope, view, category } = route;
  const title = INDEX_TITLES[kind];
  const onlineTags = kind === 'tags' && scope === 'online';
  const onlineAuthors = kind === 'performers' && scope === 'online';

  /* 地址给eseuno被Normalizar过(antiguo链continuar换名册, 认No出Categoría回到Todo): 用 replace 改写地址, 
     Título, 侧栏 y HistorialRegistro都跟página面arriba真正显示eseuno走, posterior退也No会再落回antiguo地址. 
     写地址排到微Tareadentro: 壳写地址会Sincronizar画侧栏, 路由根也Sincronizar提交, 两处都用 `flushSync`, En提交阶段dentro画No出来. 
     esteunopáginaya卸abajo就No写.  */
  useEffect(() => {
    if (route.kind === props.kind && route.scope === props.scope && route.category === props.category) return;
    let live = true;
    queueMicrotask(() => { if (live) props.route(route, { replace: true }) });
    return () => { live = false };
  }, []);

  /* SeleccionarClave归壳: 关掉时所选跟着清空, abajo次Abrir从ceroEmpezar, 同Directoriopáginamás选.  */
  useEffect(() => { if (!props.selectMode) setPicked(new Set()) }, [props.selectMode]);

  /* 打字FiltraresEn同uno名单arribapesado问uno次: NuevoResultado到手anteriorDeja着Anterior, 骨架No盖arriba来. 换词表, Tipo, 
     视Imagen或公司Tipo问es另uno东西, 照常先铺骨架.  */
  const [refining, setRefining] = useState(false);
  const go = (patch: Partial<IndexRoute>, replace = false) => {
    const next = { ...route, ...patch };
    setRefining(Object.keys(patch).every((key) => key === 'q'));
    setRoute(next);
    props.route(next, { replace });
  };

  const query = indexQuery(indexSource(route));
  const result = useInfiniteQuery<Page<Item>>({
    queryKey: query.queryKey,
    queryFn: ({ pageParam, signal }) => query.queryFn({ pageParam: pageParam as number, signal }),
    initialPageParam: 0,
    getNextPageParam: query.getNextPageParam,
    placeholderData: refining ? keepPreviousData : undefined,
  });
  const items = flatItems(result.data);
  const more = !!result.hasNextPage && !result.isPlaceholderData;
  const readout = countText(items.length, !!result.hasNextPage);
  /* Categoría计数Solo随名册, 词表 y Filtrar词变, y选en proceso哪uno类Sin关. 换Categoría时Nuevounopágina还没到, 沿用同uno
     名册Anterior次拿到计数: Categoría按钮行No先塌成"Todo"加当anterior项, etc.Datos回来再弹开. 头uno回
     还Sin计数时Completo排都摆出来, 同壳铺骨架eseuno排, 计数到再收掉空ese几类.  */
  const countsKey = `${kind}:${scope}:${q}`;
  const lastCounts = useRef<{ key: string; counts: Record<string, number> } | null>(null);
  const pageCounts = result.data?.pages[0]?.categories;
  if (pageCounts && !result.isPlaceholderData) lastCounts.current = { key: countsKey, counts: pageCounts };
  const categoryCounts = pageCounts ?? (lastCounts.current?.key === countsKey ? lastCounts.current.counts : undefined);
  const waiting = result.isPending && !categoryCounts;
  const hasEntries = ([key]: readonly [string, string]) => key === 'all' || waiting || Number(categoryCounts?.[key] || 0) > 0;

  /* 框换Tamaño, "esteImagen要No要补底" y 人脸放grande都得pesado算: Imagen早Cargar完, No会再自己发uno次 load. 
     赶En绘制之anterior, 否则换版eseuno帧es按antiguo框算几何.  */
  useLayoutEffect(() => { if (root.current) refitNativeImages(root.current) }, [layout]);

  const tags = useMemo<TagEntry[]>(() => kind === 'tags'
    ? (items as IndexTag[]).map((tag) => ({ ...tag, label: props.tagLabel(tag.k) })) : [], [items, kind]);
  const groups = useMemo(() => kind === 'tags' && view === 'alphabet'
    ? tagGroups(tags, (tag) => props.tagLabel(tag)) : [], [tags, view, kind]);

  const changeLayout = (next: PeopleLayout) => { setLayout(next); props.savePreference({ layout: next }) };

  const tabs = kind === 'tags'
    ? <BoardTabs tabs={SCOPE_TABS} value={scope} label="Glosario" onChange={(next) => {
      setPicked(new Set());
      // En线EtiquetaTodoes英文, 字母表才es它形态; 切过去时顺手换arriba, No必再点uno次. 
      go({ scope: next, category: 'all', view: next === 'online' ? 'alphabet' : view });
    }} />
    : isCompany(kind)
        ? <BoardTabs tabs={MAKER_TABS} value={kind as 'studios' | 'agencies'} label="Tipo de empresa"
          onChange={(next) => go({ kind: next })} />
        : null;

  const pressTag = (tag: string) => {
    if (onlineTags) { props.openFollowTag(tag); return }
    if (!props.selectMode) {
      const identity = tags.find(item => item.k === tag);
      if (identity?.entity_id) props.openEntity('tag', tag);
      else props.showTags([tag], 'all');
      return;
    }
    setPicked((current) => {
      const next = new Set(current);
      if (!next.delete(tag)) next.add(tag);
      return next;
    });
  };

  const categories = (onlineTags ? ONLINE_TAG_CATEGORIES : TAG_CATEGORIES).filter(hasEntries);

  const body = () => {
    if (result.isPending) {
      return <div aria-busy="true" dangerouslySetInnerHTML={{ __html: indexSkeletonHtml({ kind, layout, mode: view }) }} />;
    }
    if (result.isError) {
      return (
        <EmptyState icon={spriteGlyph('alert')} title={`没能读取${title}`}
          actions={<Button variant="secondary" onClick={() => void result.refetch()}>Reintentar</Button>}>
          {requestErrorMessage(result.error)}
        </EmptyState>
      );
    }
    if (!items.length) return <IndexEmpty kind={kind} filtered={!!q || category !== 'all'}
      online={onlineTags || onlineAuthors} configurable={props.configurable} />;
    if (onlineAuthors) return <OnlineAuthors items={items as OnlineAuthor[]} layout={layout} props={props} />;
    if (isPeople(kind)) return <PeopleGrid kind={kind} items={items as IndexPerson[]} layout={layout} props={props} />;
    const actions = { online: onlineTags, picked, press: pressTag };
    return view === 'alphabet' ? <TagAlphabet groups={groups} actions={actions} /> : <TagCloud tags={tags} actions={actions} />;
  };

  return (
    <div ref={root} data-index-page={kind} className="flex min-w-0 flex-col">
      <div data-index-head="" className="mb-5 flex min-w-0 flex-wrap items-center gap-3">
        <h2 data-index-title="" className="flex items-center text-display-4-medium whitespace-nowrap text-text-primary max-board-narrow:text-title-1-medium">
          {title}
        </h2>
        {isPeople(kind) ? (
          <span data-index-count="" className="text-caption-1-regular leading-5 whitespace-nowrap text-text-secondary tabular-nums">
            {/* 没取到就Sin读数: "0 项"读起来es"名册es空",  y 报错说es两件事.  */}
            {result.isPending || result.isError ? '' : readout}
          </span>
        ) : null}
        {isPeople(kind) ? <LayoutSwitch kind={kind} layout={layout} onChange={changeLayout} /> : null}
        <LibraryShortcuts kind={kind === 'tags' ? 'tag' : kind === 'studios' ? 'studio' : kind === 'agencies' ? 'agency' : kind === 'creators' ? 'creator' : 'performer'} />
        {/* estrecho屏uno行放Noabajocuatro样东西: TítuloyFiltrar框uno行, 开关另起uno行.  */}
        <span aria-hidden className="hidden h-0 basis-full max-board-narrow:order-2 max-board-narrow:block" />
        <IndexSearch label={`Filtrar${title}`} value={q} onQuery={(next) => { if (next !== q) go({ q: next }, !!next) }} />
      </div>
      {kind === 'performers' || kind === 'creators' ? (
        <BoardTabs tabs={PEOPLE_TABS} value={onlineAuthors ? 'online' : kind} label="Lista de personas"
          onChange={(next) => {
            if (next === 'online') props.exitSelectMode();
            go({ kind: next === 'online' ? 'performers' : next,
              scope: next === 'online' ? 'online' : 'local', category: 'all' });
          }} />
      ) : null}
      {tabs}
      {kind === 'performers' && scope === 'local' ? (
        <div aria-label="Clasificación de identidad" className={IDENTITY_ROW_CLASS}>
          {IDENTITY_CATEGORIES.filter((entry) => entry[0] === category || hasEntries(entry)).map(([key, label]) => (
            <Button key={key} variant={category === key ? 'primary' : 'secondary'} size="small"
              aria-pressed={category === key} onClick={() => go({ category: key })}>{label}</Button>
          ))}
        </div>
      ) : null}
      {kind === 'tags' ? (
        <TagFilters categories={categories} category={category} online={onlineTags} readout={readout}
          letters={groups.map(([letter]) => letter)} view={view}
          onCategory={(next) => go({ category: next })}
          onView={(next) => go({ view: next })}
          onJump={(at) => root.current?.querySelector(`[data-alpha-group="${at}"]`)
            ?.scrollIntoView({ block: 'start', behavior: 'smooth' })} />
      ) : null}
      <div data-index-body="">{body()}</div>
      {more ? (
        <div className="mt-5 flex justify-center">
          {/* 按abajo去到Siguiente批画出来之间要Con东西En动: esteuno段esuno次网络往返加uno屏Avatar, 光Clave按灰
              说No出"还En走" y "点没反应"区别. 字DejaEnClavedentro, ClaveanchoNo变, abajo面contenidoNo跟着跳.  */}
          <Button variant="secondary" data-index-more="" className="min-w-31"
            disabled={result.isFetchingNextPage} aria-busy={result.isFetchingNextPage || undefined}
            onClick={() => void result.fetchNextPage()}>
            {result.isFetchingNextPage ? <LoadingDots inline label="Cargando más..." /> : 'Cargar más'}
          </Button>
        </div>
      ) : null}
      {kind === 'tags' && !onlineTags && props.selectMode ? (
        <TagDock count={picked.size} match={match} onMatch={setMatch}
          onClear={() => setPicked(new Set())}
          onApply={() => { const chosen = [...picked]; setPicked(new Set()); props.showTags(chosen, match) }} />
      ) : null}
    </div>
  );
}

const LABELS: Record<IndexKind, string> = {
  tags: 'Etiqueta', performers: 'Actriz', creators: 'Vendedor', studios: 'Sello', agencies: 'Agencia',
};

/** 空馆藏, FiltrarSinResultadoyEn线来源还Sincontenido分别给出puede执行去处. 文案同Directoriopágina空态
 *  (`frontend/src/catalog-onboarding.ts`  `catalogEmptyHtml`).  */
function IndexEmpty(
  { kind, filtered, online, configurable }: { kind: IndexKind; filtered: boolean; online: boolean; configurable: boolean },
) {
  if (filtered) {
    return (
      <EmptyState icon={spriteGlyph('search')} title="Sin contenido que coincida"
        actions={<ButtonLink variant="primary" href="/?loc=&thumb=0">Ver todo el contenido</ButtonLink>}>
        BorrarFiltraro buscarCondiciónposteriorverTodocontenido. 
      </EmptyState>
    );
  }
  // En线eseuno档数es来源en la东西, 名字也跟着来源说法: 艺人páginaEn线摆es关注来源en la创作者. 
  const label = online && kind === 'performers' ? 'Creador' : LABELS[kind];
  const follow = (
    <ButtonLink variant={!configurable || online ? 'primary' : 'secondary'} href="/subscriptions?tab=add">Agregar seguimiento</ButtonLink>
  );
  return (
    <EmptyState icon={spriteGlyph(kind === 'tags' ? 'tags' : 'user-round')} title={`Aún no hay${label}`}
      actions={online ? follow : <>
        {configurable ? <Button variant="primary" data-empty-settings="">Añadir contenido</Button> : null}
        {follow}
      </>}>
      {online ? `Agregar seguimiento de fuente y obtener contenido, luego, esto mostrará el contenido de la fuente${label}. ` : 'Añade contenido y completa los datos para ver la información aquí.'}
    </EmptyState>
  );
}
