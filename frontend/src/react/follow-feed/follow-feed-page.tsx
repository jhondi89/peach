/* 关注página `/follow`: página头, 创作者y题材两排, 两排Filtrar玻璃, 交集, 卡片Listay底栏(ADR-0031 No. 10g 步). 
 *
 * Datos形状, 取数Claveyesteunopágina判定En `./follow-feed.ts`, 卡片En `./follow-card.tsx`. 换Filtrar或Ordenar时
 * Consulta换Clave: Lista区按NuevoClavepesado挂, 铺unoLista骨架, página头, 两排y玻璃照Original样No动—它们此刻
 * 就能给出最终样子, Completo铺骨架代价es浮层连同arriba面两排uno起先消失再出现, 而真En cursoetc.SoloConListadentro
 * 摆哪些东西. 
 *
 * 地址栏归壳: 点Filtrar, Ordenar, 换媒体都Solo调 `actions.route`, 壳写bien地址再Nuevo `view` 推回来. 
 * esteunopágina唯uno联网动作es"VerificarActualizar"y"抓更早unopágina", 两者起es同uno趟posteriorTarea, Progreso由
 * `helpers.jobProgress` 盯着, 跑完InválidoesteunopáginaConsultapesado取.  */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useInfiniteQuery, useMutation, useQuery, type InfiniteData } from '@tanstack/react-query';
import { icon, leadingGraphemes, requestErrorMessage } from '@peach/legacy/core';
import { tagLabel } from '@peach/legacy/tags';
import { emptyStateHtml, spinnerHtml } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';

import { apiGet, apiSend } from '../../api';
import { LoadMore } from '../catalog-grid/catalog-grid-page';
import { FilterGlassRows, FilterPill } from '../components/filter-glass';
import { LibraryShortcuts } from '../library-shortcuts/shortcut-controls';
import { RetryNote, useSkeletonReveal } from '../components/grid-reveal';
import { spriteGlyph } from '../components/sprite-glyph';
import { useViewGlide } from '../components/use-view-glide';
import { useMasonryGrid } from '../components/use-masonry-grid';
import { Segments, Shuffle } from '../entity-filter/entity-filter-page';
import type { SegmentOption } from '../entity-filter/entity-filter';
import { checkSummary, FOLLOW_CHECK_URL, FOLLOW_STATUS_URL, sourceIconUrl } from '../follow-manage/follow-manage';
import { Note } from '../components/note';
import { sidebarTagCounts } from '../../sidebar';
import { queryClient } from '../query';
import { FollowAuthorLink, FollowCard } from './follow-card';
import { authorAvatarHtml, followAuthorEntity, followAuthorName, sourceMark } from './follow-marks';
import {
  FOLLOW_AUTO_LOAD_LIMIT, FOLLOW_CREDENTIALS_KEY, FOLLOW_FEED_SORTS, FOLLOW_FILTERS, FOLLOW_TAGS_FIRST,
  FOLLOW_WORKS_FIRST,
  collectionItems, dropCondition, fetchFollowCredentials, followConditions, followFeedQuery, groupMediaKinds, groupTagType, itemForMedia,
  mergedPage, nextSort, randomOrder, sortAriaLabel, backfillState, withStatus,
  type FollowCondition, type FollowContext, type FollowDrawer, type FollowFeedProps, type FollowGroup, type FollowPage, type FollowSource,
  type FollowJobState, type FollowView, type FollowWorkRow,
} from './follow-feed';

const Sep = () => <span data-entity-sep="" aria-hidden="true" />;
const SETTINGS = spriteGlyph('settings');
const CHEVRON_DOWN = spriteGlyph('chevron-down');
const HISTORY = spriteGlyph('history');

/** 照片Muroeseuno排Imagen片Diseño两档, 同壳dentro `PHOTO_LAYOUTS`.  */
export const FOLLOW_PHOTO_LAYOUTS: readonly SegmentOption[] = [
  ['fixed', 'Proporción fija', 'layout-grid'], ['masonry', 'Cascada', 'columns-2'],
];

/** esteunopágina从Datosdentro推出来ese几样: 两排取样, FiltrarOpciones, puede见组. Solo随Datos, 视ImagenySemilla变.  */
function useFacets(data: FollowPage | null, view: FollowView, seed: number) {
  return useMemo(() => {
    const groups = data?.groups || [];
    const counts = data?.counts || {};
    const sources = data?.sources || [];
    /* Filtrararriba能选什么来自服务端TodoBiblioteca口径 facets, Noesesteunopágina groups. 按 groups 算话, 选en proceso
       uno创作者之posterior服务端Solo回他Entrada, 创作者栏就Solo剩他uno人, 再也切No回去.  */
    const facets = data?.facets || {};
    const activeAuthors = new Set(facets.authors || []);
    const providerLabels = new Map(sources.map((source) => [source.provider, source.provider_label || source.provider]));
    const providers = new Map((facets.providers || []).map((key) => [key, providerLabels.get(key) || key]));
    const tagCounts = new Map(facets.tags || []);
    const authorSources = new Map<string, FollowSource[]>();
    sources.forEach((source) => {
      if (!source.author_key) return;
      if (!authorSources.has(source.author_key)) authorSources.set(source.author_key, []);
      authorSources.get(source.author_key)!.push(source);
    });
    const authorKeys = [...authorSources.keys()].filter((key) => activeAuthors.has(key));
    /* 创作者行y题材行按本次进入SemillaAleatorio取样, 进uno次换uno批: 按数取anterior几话, ochodiez来题材dentro
       永远Solo露出同样esedosdiez几, este两排回答es"continuarabajo来ver什么", Noes"哪最más".  */
    const authorOrder = randomOrder(authorKeys, (key) => key, seed);
    const workRows: FollowWorkRow[] = randomOrder(facets.works || [], (row) => row[0], seed).slice(0, FOLLOW_WORKS_FIRST);
    if (view.work && !workRows.some((row) => row[0] === view.work)) workRows.push([view.work, view.work, 0]);
    const allCount = Object.values(counts).reduce((total, count) => total + (Number(count) || 0), 0);
    const tagRows = randomOrder([...tagCounts], (row) => row[0], seed).slice(0, FOLLOW_TAGS_FIRST);
    view.tags.forEach((tag) => {
      if (!tagRows.some(([key]) => key === tag)) tagRows.push([tag, tagCounts.get(tag) || allCount]);
    });
    const mediaCounts = { videos: 0, images: 0 };
    groups.forEach((group) => groupMediaKinds(group).forEach((kind) => { mediaCounts[kind === 'image' ? 'images' : 'videos'] += 1 }));
    const wanted = view.media === 'images' ? 'image' : 'video';
    const visible = groups.filter((group) => groupMediaKinds(group).has(wanted));
    return {
      groups, counts, sources, providers, tagRows, authorSources, authorOrder, workRows, allCount, mediaCounts, visible,
      /* 按abajo创作者, 来源NoEnesteuno版Opcionesdentro时(改别名, 来源撤)当作没按: página面No能停Enuno
         verNo见按abajo项Filtrardentro. Etiquetay题材从别处点进来时puede能NoEn general facets dentro, 照样生效.  */
      author: authorSources.has(view.author) && activeAuthors.has(view.author) ? view.author : '',
      provider: providers.has(view.provider) ? view.provider : '',
      workNames: new Map((facets.works || []).map((row) => [row[0], row[1]])),
      broken: sources.filter((source) => source.last_status === 'error' || source.last_status === 'unauthorized'),
      byId: new Map(sources.map((source) => [source.id, source])),
    };
  }, [data, view, seed]);
}

type Facets = ReturnType<typeof useFacets>;

export function FollowFeedPage(props: FollowFeedProps) {
  const { view, seed, revision, actions } = props;
  const query = followFeedQuery(view, revision);
  const result = useInfiniteQuery(query);
  const credentialsResult = useQuery({
    queryKey: FOLLOW_CREDENTIALS_KEY, queryFn: ({ signal }) => fetchFollowCredentials(signal),
  });
  const data = useMemo(() => mergedPage(result.data), [result.data]);
  const credentials = useMemo(() => new Set((credentialsResult.data?.providers || [])
    .filter((provider) => provider.present).map((provider) => provider.provider)), [credentialsResult.data]);
  const context = useMemo<FollowContext>(() => ({
    sources: data?.sources || [], aliases: data?.author_aliases || [], credentials,
  }), [data, credentials]);
  const facets = useFacets(data, view, seed);
  const listPending = result.isPending || result.isPlaceholderData;

  /* 侧栏仍En壳dentro: 每取到本Clave自己Datos就puede见EntradaEtiqueta计数, TodoBiblioteca口径来源yDuraciónConSin交回去, 
     换Clave时暂借占DatosNo交. 来源按TodoBiblioteca列: 选en procesouno之posterior别还En, 才切得回去. 
     交回排到微Tareadentro: 壳收到posterior画侧栏, 侧栏句柄interior部 `flushSync`, En提交阶段dentro画No出来. 
     esteuno次抽屉ya被Siguiente次取代或página面ya卸abajo就No交.  */
  const settled = !listPending && !!data;
  const drawer = useMemo<FollowDrawer>(() => ({
    tags: sidebarTagCounts(facets.visible.flatMap(collectionItems).map((item) => ({ tags: item.tags || [] }))),
    providers: [...facets.providers].map(([key, label]) => [key, label, sourceIconUrl(key)] as const),
    duration: !!data?.facets?.duration,
  }), [facets.visible, facets.providers, data]);
  useEffect(() => {
    if (!settled) return;
    let live = true;
    queueMicrotask(() => { if (live) actions.loaded(drawer) });
    return () => { live = false };
  }, [settled, drawer, actions]);

  const job = useFollowJob(props, !!data);

  if (!data) {
    /* 取No到Lista时página头照画: este时候最用得en la就es去Gestionarpáginaver来源出什么事.  */
    if (result.isError) {
      return (
        <div data-follow-feed="">
          <Head onManage={actions.openManage} />
          <RetryNote message={requestErrorMessage(result.error)} onRetry={() => void result.refetch()} />
        </div>
      );
    }
    return null;
  }
  const route = (patch: Partial<FollowView>) => actions.route({ ...view, ...patch });
  const conditions = followConditions({ ...view, author: facets.author, provider: facets.provider }, {
    authors: new Map([...facets.authorSources].map(([key, list]) => [key, followAuthorName(list, context)])),
    providers: facets.providers,
    works: facets.workNames,
  });
  const total = view.status ? facets.counts[view.status] || 0 : facets.allCount;
  const canBackfill = facets.sources.some((source) => source.can_backfill);

  return (
    <>
      {/* Progresoeseuno格归 `followJobProgress`: 它自己往dentro插面板, 自己开合, React Solo给uno空节点.  */}
      <div key={job.generation} ref={job.host} data-follow-progress="" />
      {!job.busy && job.report ? <Note tone="neutral" title="Resultado de verificación">{job.report}</Note> : null}
      <div data-follow-feed="" data-select-mode={props.selectMode ? '' : undefined}>
        <Head onManage={actions.openManage}>
          {facets.sources.length ? (
            <Button variant="primary" data-follow-recheck="" aria-label="Verificar每 fuente(s)Actualizar"
              aria-busy={job.busy || undefined}
              onClick={() => void job.start(false)}>
              {job.starting === 'check'
                ? <span className="contents" dangerouslySetInnerHTML={{ __html: spinnerHtml('Verificando') }} />
                : 'Comprobar actualizaciones'}
            </Button>
          ) : null}
        </Head>
        <Authors facets={facets} pressed={facets.author} context={context} props={props}
          onPick={(key) => route({ author: facets.author === key ? '' : key })} />
        <Works rows={facets.workRows} pressed={view.work} props={props}
          onPick={(key) => route({ work: view.work === key ? '' : key })} />
        <Glass facets={facets} view={view} total={total} busy={listPending} props={props} route={route} />
        <Combo conditions={conditions} onDrop={(row) => actions.route(dropCondition(view, row))}
          onClear={() => route({ author: '', provider: '', work: '', tags: [], durMin: 0, durMax: 0 })} />
        {facets.broken.length ? <BrokenNote count={facets.broken.length} onManage={actions.openManage} /> : null}
        <List key={query.queryKey.join('\u0000')} retryKey={result.dataUpdatedAt} pending={listPending} facets={facets} data={data} context={context}
          props={props} />
        {data.has_more || canBackfill ? (
          <div data-follow-pagination="">
            {data.has_more ? (
              <span data-follow-page-action="">
                {data.groups.length < FOLLOW_AUTO_LOAD_LIMIT ? (
                  <LoadMore key={result.data?.pages.length} entity enabled={() => !job.busyRef.current}
                    load={async () => { await result.fetchNextPage({ throwOnError: true }) }}>
                    <CHEVRON_DOWN className="size-3.5" />Cargar更más
                  </LoadMore>
                ) : (
                  <ManualMore busy={result.isFetchingNextPage}
                    error={result.isFetchNextPageError ? requestErrorMessage(result.error) : ''}
                    load={() => { if (!job.busyRef.current && !result.isFetchingNextPage) void result.fetchNextPage() }} />
                )}
              </span>
            ) : null}
            {canBackfill ? (
              <span data-follow-page-action="">
                <Button variant="secondary" leadingIcon={job.olderBusy ? undefined : HISTORY} data-follow-older=""
                  aria-busy={job.busy || undefined}
                  onClick={() => void job.start(true)}>
                  {job.olderBusy
                    ? <><span className="contents" dangerouslySetInnerHTML={{ __html: spinnerHtml('ObtenerEn proceso') }} /><span>ObtenerEn proceso...</span></>
                    : 'Obtener página anterior'}
                </Button>
                <span data-follow-backfill="">{backfillState(facets.sources)}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

/** página头: Títuloy"Gestionar关注"恒En, VerificarActualizareseClave要etc.来源读到才摆(`children`).  */
function Head({ onManage, children }: { onManage(): void; children?: ReactNode }) {
  return (
    <div data-follow-head="">
      <h2 data-follow-title="">Seguir</h2>
      <span data-follow-head-actions="">
        <Button variant="secondary" leadingIcon={SETTINGS} data-follow-manage="" onClick={onManage}>
          Gestionar关注
        </Button>
        {children}
      </span>
    </div>
  );
}

/** 摆满 `FOLLOW_AUTO_LOAD_LIMIT` 组以posterior"Cargar更más": exterior观同 `LoadMore` ese, Soloes滚到它No会自己continuar, 
 *  要点unoabajo. Fallo时OriginalDejaOriginal因yReintentar.  */
function ManualMore({ busy, error, load }: { busy: boolean; error: string; load(): void }) {
  return (
    <>
      <button type="button" data-entity-more="" aria-busy={busy || undefined} aria-disabled={busy || undefined} onClick={load}>
        <CHEVRON_DOWN className="size-3.5" />Cargar更más
      </button>
      {error ? <RetryNote message={error} onRetry={load} /> : null}
    </>
  );
}

/* ── VerificarActualizary往回抓 ──
 * uno次Solo往回unoPágina: 追更常规Verificar永远SoloverNo.unopágina, 往回抓esunoIndependiente, 显动作, 点uno次走unopágina, 
 * No自动, No连翻. 两Clave起es同uno趟Tarea, TareaEn跑时两uno起忙, 续página也停abajo.  */
function useFollowJob(props: FollowFeedProps, ready: boolean) {
  const { helpers, actions } = props;
  const [generation, setGeneration] = useState(0);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState<'' | 'check' | 'older'>('');
  const [report, setReport] = useState('');
  /* 往回抓eseClaveEn它起eseuno趟跑完之anterioruno直写"抓取en proceso", 同遗Deja层: VerificarActualizareseuno趟Solo让它忙, No换字.  */
  const [olderRun, setOlderRun] = useState(false);
  const busyRef = useRef(false);
  const node = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ helpers, actions });
  latest.current = { helpers, actions };

  useEffect(() => {
    const host = node.current;
    if (!host) return undefined;
    let alive = true;
    latest.current.helpers.jobProgress({
      host,
      active: () => alive,
      read: (signal) => apiGet<FollowJobState>(FOLLOW_CHECK_URL, signal),
      busy: (on) => {
        if (!alive) return;
        busyRef.current = on;
        setRunning(on);
      },
      complete: (state) => {
        if (!alive) return;
        const report = state.status === 'failed' ? { results: [{ ok: false, error: state.error }] } : state;
        latest.current.actions.checkReport(report);
        setReport(checkSummary({ ...report, status: state.status || 'done' }));
        busyRef.current = false;
        setRunning(false);
        setOlderRun(false);
        void queryClient.invalidateQueries({ queryKey: ['follow-feed'] });
        /* 跟完eseuno路No再盯: pesadoNuevo挂uno路, 别处再起Siguiente趟也continuar得arriba.  */
        setGeneration((value) => value + 1);
      },
    });
    return () => { alive = false };
    /* primero屏取数Fallo时Progresoeseuno格还没画出来, ReintentarÉxitoposterior `ready` 翻过来再continuararriba.  */
  }, [generation, ready]);

  const start = useCallback(async (older: boolean) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setStarting(older ? 'older' : 'check');
    setReport('');
    let started = false;
    try {
      const job = await apiSend<{ job_id: string }>(FOLLOW_CHECK_URL, older ? { older: true, background: true } : { background: true });
      sessionStorage.setItem('peach-follow-job', job.job_id);
      started = true;
      setRunning(true);
      if (older) setOlderRun(true);
      setGeneration((value) => value + 1);
    } catch (error) {
      latest.current.actions.checkReport({ results: [{ ok: false, error: requestErrorMessage(error) }] });
      if (older) void queryClient.invalidateQueries({ queryKey: ['follow-feed'] });
    } finally {
      busyRef.current = started;
      setStarting('');
    }
  }, []);

  return {
    generation, host: node as RefObject<HTMLDivElement | null>, busyRef, starting, start, report,
    busy: running || starting !== '',
    olderBusy: starting === 'older' || (olderRun && running),
  };
}

/* ── 两排 ── */

function Authors({ facets, pressed, context, props, onPick }: {
  facets: Facets; pressed: string; context: FollowContext; props: FollowFeedProps; onPick(key: string): void;
}) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => { props.helpers.wireDrag(row.current) }, [props.helpers]);
  const nameOf = (key: string) => followAuthorName(facets.authorSources.get(key) || [], context);
  if (!facets.authorOrder.length) return null;
  return (
    <div data-follow-authors-bar="">
      <div ref={row} data-follow-authors="" aria-label="Creador">
        {facets.authorOrder.map((key) => {
          const list = facets.authorSources.get(key) || [];
          const entity = followAuthorEntity(list);
          const content = <>
            <span data-follow-ring="" dangerouslySetInnerHTML={{ __html: authorAvatarHtml(list, nameOf(key)) }} />
            <span data-follow-name="">{nameOf(key)}</span>
          </>;
          return entity ? (
            <FollowAuthorLink key={key} name={entity} actions={props.actions} data-follow-author={key}
              aria-label={`ver ${nameOf(key)} 作者página`}>{content}</FollowAuthorLink>
          ) : (
            <button key={key} type="button" data-follow-author={key} aria-pressed={pressed === key} onClick={() => onPick(key)}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 创作者行abajo面esteuno排es题材, Ubicación y 形状对着primeropáginaese排Sello: Solo收来源自己记成 copyright y character 
   Etiqueta, 词形猜No得. 圆标dentroes服务端按este题材挑bien代表Imagen, 挑No出就写两字母.  */
function Works({ rows, pressed, props, onPick }: {
  rows: readonly FollowWorkRow[]; pressed: string; props: FollowFeedProps; onPick(key: string): void;
}) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => { props.helpers.wireDrag(row.current) }, [props.helpers]);
  if (!rows.length) return null;
  return (
    <div ref={row} data-follow-works="" aria-label="按Género/TemáticaFiltrar">
      {rows.map((work) => (
        <button key={work[0]} type="button" data-follow-work={work[0]} aria-pressed={pressed === work[0]}
          onClick={() => onPick(work[0])}>
          <span data-follow-mark="" data-fallback={leadingGraphemes(work[1], 2)}
            dangerouslySetInnerHTML={{ __html: props.helpers.workMark(work) }} />
          {work[1]}
        </button>
      ))}
    </div>
  );
}

/* ── Filtrar玻璃 ──
 * arriba排由粗到细,  y 资料páginaese同uno次序: 最izquierda端es视频/Imagen片—esteunopágina现En摆es哪uno类东西; 隔uno道
 * 竖线escuatroEstado, 恒Conuno生效, 滑动ese玻璃跟着它走; 再隔uno道才es来源 y Etiquetaeste些puede加puedeNo加
 * Filtrar. 媒体eseuno档另Conuno圆玻璃: 它 y Estado问Noes同uno件事, 共用uno话, 点unoabajoImagen片, 玻璃会从
 * "nover"ese儿飞过来. abajo排izquierda端读数, derecha端换uno批, Imagen片Muroen laDiseñoy"仅显示Imagen片", 然posterioresOrdenarClave.  */
function Glass({ facets, view, total, busy, props, route }: {
  facets: Facets; view: FollowView; total: number; busy: boolean; props: FollowFeedProps;
  route(patch: Partial<FollowView>): void;
}) {
  const { helpers, actions } = props;
  const statePane = useRef<HTMLSpanElement>(null);
  const mediaPane = useRef<HTMLSpanElement>(null);
  const stateRow = useRef<HTMLDivElement>(null);
  const mediaRow = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const tagRow = useRef<HTMLDivElement>(null);
  const showMedia = !!facets.mediaCounts.images || view.media === 'images';
  const stateGlide = useViewGlide(statePane, stateRow, '[data-follow-filter][aria-pressed="true"]', view.status);
  const mediaGlide = useViewGlide(mediaPane, mediaRow, '[data-media-view][aria-pressed="true"]', `${view.media}:${showMedia}`);
  useEffect(() => {
    helpers.wireDrag(scroll.current);
    helpers.wireDrag(tagRow.current);
    helpers.wireScroller(tagRow.current);
  }, [helpers]);
  const providers = [...facets.providers];
  const extras = providers.length + facets.tagRows.length > 0;
  const images = view.media === 'images';
  return (
    <FilterGlassRows label="Filtrar y ordenar" topLabel={showMedia ? 'MediosySeguirFiltrar' : 'SeguirFiltrar'}
      attrs={{ 'data-filter-frame': '', 'data-follow-filter-glass': '' }}
      topClassName="gap-1.5 overflow-visible" busy={busy}
      panes={<>
        <span ref={statePane} data-view-glide="" aria-hidden="true" />
        <span ref={mediaPane} data-view-glide="round" aria-hidden="true" />
      </>}
      top={<>
        {showMedia ? (
          <>
            <div ref={mediaRow} role="group" aria-label="Tipo de medio" data-entity-media="" onPointerLeave={mediaGlide.leave}>
              {([['videos', 'Videos', facets.mediaCounts.videos, 'play', 'video'],
                ['images', 'Imágenes', facets.mediaCounts.images, 'pics', 'image']] as const).map(([value, text, count, symbol, kind]) => {
                const title = `${text} ${Math.max(0, count || 0).toLocaleString()}`;
                return (
                  <button key={value} type="button" data-media-view={value} data-media-icon={kind}
                    aria-pressed={view.media === value} aria-label={title} title={title}
                    onPointerEnter={mediaGlide.hover} onClick={() => { if (view.media !== value) route({ media: value }) }}
                    dangerouslySetInnerHTML={{ __html: icon(symbol) }} />
                );
              })}
            </div>
            <Sep />
          </>
        ) : null}
        <div ref={scroll} data-entity-scroll="">
          <div ref={stateRow} role="group" aria-label="Estado" data-entity-states="" onPointerLeave={stateGlide.leave}>
            {FOLLOW_FILTERS.map(([key, label]) => (
              <button key={key} type="button" data-entity-state={key} data-follow-filter={key} data-entity-press=""
                aria-pressed={view.status === key} onPointerEnter={stateGlide.hover}
                onClick={() => { if (view.status !== key) route({ status: key }) }}>
                {label}
              </button>
            ))}
            {extras ? <Sep /> : null}
          </div>
          <div ref={tagRow} data-entity-tags="">
            {providers.map(([key, label]) => (
              <button key={key} type="button" data-follow-provider={key} data-entity-press=""
                aria-pressed={facets.provider === key} title={label} aria-label={`Fuente: ${label}`}
                onClick={() => route({ provider: facets.provider === key ? '' : key })}
                dangerouslySetInnerHTML={{ __html: sourceMark(key, label) }} />
            ))}
            {providers.length && facets.tagRows.length ? <Sep /> : null}
            {facets.tagRows.map(([tag, n]) => (
              <FilterPill key={tag} data-follow-tag={tag} data-entity-press=""
                data-tag-cat={`r34-${groupTagType(facets.groups, tag)}`} pressed={view.tags.includes(tag)}
                onPress={() => route({ tags: view.tags.includes(tag) ? view.tags.filter((key) => key !== tag) : [...view.tags, tag] })}>
                {tagLabel(tag)}
                {n ? <span data-count-badge={tag}>{String(n)}</span> : null}
              </FilterPill>
            ))}
          </div>
        </div>
      </>}
      bottom={<>
        <h3 data-entity-readout="" data-follow-readout="">
          {`${total.toLocaleString()}  actualización(es) · Mostrar ${facets.visible.length.toLocaleString()}`}
        </h3>
        <LibraryShortcuts currentHref={() => location.pathname + location.search} kind="creator" />
        <span data-entity-sorts="">
          <Shuffle onPress={actions.shuffle} />
          {images ? (
            <>
              <Segments label="Diseño de imágenes" value={props.photoLayout} options={FOLLOW_PHOTO_LAYOUTS}
                onChange={(value) => actions.setPhotoLayout(value === 'fixed' ? 'fixed' : 'masonry')} />
              <button type="button" data-follow-images-only="" aria-pressed={props.imagesOnly} title="Solo mostrar imágenes"
                aria-label="Solo mostrar imágenes" onClick={() => actions.setImagesOnly(!props.imagesOnly)}>
                {props.imagesOnly ? <span data-view-glide="" aria-hidden="true" /> : null}
                <span className="contents" dangerouslySetInnerHTML={{ __html: icon('captions-off') }} />
              </button>
            </>
          ) : null}
          {FOLLOW_FEED_SORTS.map(([key, label]) => {
            const pressed = view.sort === key;
            const Arrow = spriteGlyph(view.dir === 'asc' ? 'arrow-up' : 'arrow-down');
            return (
              <button key={key} type="button" data-entity-sort={key} data-follow-sort={key} data-entity-press=""
                aria-pressed={pressed} aria-label={sortAriaLabel(key, label, view.sort, view.dir) || undefined}
                onClick={() => {
                  const next = nextSort(key, view.sort, view.dir);
                  if (next) route(next);
                }}>
                {label}{pressed ? <Arrow className="size-3.5" /> : null}
              </button>
            );
          })}
        </span>
      </>}
    />
  );
}

/* 生效Filtrar摊En浮层正abajo方, 跟primeropágina y 资料página同uno交集Filtrar. 放En浮层abajo面: esteuno从Sin到Con会它
   abajo面东西Completo推abajocuatrodiez像素, 放Enarriba面话被推esese吸顶玻璃 y 它arriba面两排Avatar. Etiquetaeseuno档
   No写anterior缀, Etiqueta名自己就Descripción它es什么.  */
function Combo({ conditions, onDrop, onClear }: {
  conditions: FollowCondition[]; onDrop(row: FollowCondition): void; onClear(): void;
}) {
  return (
    <div data-entity-combo="" data-follow-combo="">
      {conditions.length ? (
        <>
          {conditions.map((row) => {
            const text = `${row.kind === 'Etiqueta' ? '' : `${row.kind} `}${row.label}`;
            return (
              <span key={`${row.kind}:${row.key}`} data-combo-chip="">
                {text}
                <button type="button" aria-label={`撤掉 ${text}`} data-follow-drop={row.key} data-follow-drop-kind={row.kind}
                  onClick={() => onDrop(row)}>✕</button>
              </span>
            );
          })}
          <button type="button" data-combo-clear="" onClick={onClear}>Limpiar todo</button>
        </>
      ) : null}
    </div>
  );
}

/** Con来源Última vezVerificarFallo: esteunopáginaNo摊Original因, 指到Gestionarpágina去ver. Note 边界yImagen标取Todo站eseuno.  */
function BrokenNote({ count, onManage }: { count: number; onManage(): void }) {
  return (
    <div data-follow-broken="" onClick={(event) => {
      if ((event.target as HTMLElement).closest('[data-follow-manage]')) onManage();
    }} dangerouslySetInnerHTML={{
      __html: `<div class="geist-note geist-note-error fwarn" role="alert">${icon('alert')}<span>${count}  fuente(s)Última vezError de verificación, 去<button type="button" class="flink" data-follow-manage>GestionarSeguir</button>Ver motivo.</span></div>`,
    }} />
  );
}

/* ── Lista ── */

function List({ pending, facets, data, context, props, retryKey }: {
  pending: boolean; facets: Facets; data: FollowPage; context: FollowContext; props: FollowFeedProps;
  retryKey: number;
}) {
  const { view, helpers } = props;
  const images = view.media === 'images';
  const reveal = useSkeletonReveal(pending, () => helpers.listSkeletonHtml(view.media));
  return (
    <div data-follow-list-body="" data-grid-reveal={reveal.fading ? '' : undefined}>
      {reveal.layer}
      {pending ? null : (
        <Cards facets={facets} data={data} context={context} props={props} images={images} retryKey={retryKey} />
      )}
    </div>
  );
}

function Cards({ facets, data, context, props, images, retryKey }: {
  facets: Facets; data: FollowPage; context: FollowContext; props: FollowFeedProps; images: boolean;
  retryKey: number;
}) {
  const { view, actions } = props;
  const write = useFollowWrite(props);
  const wall = images ? { 'data-size': props.photoSize, 'data-layout': props.photoLayout, 'data-images-only': String(props.imagesOnly) } : {};
  const wallRef = useMasonryGrid(images && props.photoLayout === 'masonry',
    `${props.photoSize}:${facets.visible.map((group) => group.primary.id).join(',')}`);
  let body: ReactNode;
  if (facets.visible.length) {
    body = facets.visible.map((group) => {
      const source = facets.byId.get(group.primary?.source_id as number);
      const siblings = (source?.author_key && facets.authorSources.get(source.author_key)) || [];
      const id = group.primary.id;
      return (
        <FollowCard key={`${id}:${view.media}`} group={group} authorSources={siblings} media={view.media} retryKey={retryKey}
          context={context} selected={props.selected.has(cardId(group, view))} selectMode={props.selectMode}
          busy={write.busy.get(cardId(group, view)) || ''} failure={write.failures.get(cardId(group, view)) || ''}
          actions={actions} onStatus={write.status} onSave={write.save} />
      );
    });
  } else {
    body = <Empty data={data} filtered={!!(view.status || facets.author || facets.provider || view.work || view.tags.length)} />;
  }
  return (
    <div ref={wallRef} data-follow-list="" data-follow-wall={images ? '' : undefined} {...wall}>
      {body}
    </div>
  );
}

/** 卡arribaeseuno id: 卡面换成组dentro含当anterior媒体ese时, Seleccionary写操作认es它.  */
function cardId(group: FollowGroup, view: FollowView): number {
  return itemForMedia(group, view.media).id;
}

/** 空Lista分cuatro: esteunopáginaCon组Soloes媒体Tipo没对arriba; 设Filtrar没筛出东西; Con来源perouno都还没抓到; 
 *  uno来源都Sin. 没设Filtrar时No叫人去改Filtrar.  */
function Empty({ data, filtered }: { data: FollowPage; filtered: boolean }) {
  const html = (data.groups || []).length
    ? emptyStateHtml('search-x', 'No hay actualizaciones con el filtro actual', 'CambiarTipo de medio, Creador, Fuente, Duración或Etiquetaposterior再试. ')
    : (data.sources || []).length
      ? filtered
        ? emptyStateHtml('rss', 'Sinque cumple los criterios de resultado deActualizar', 'CambiarEstado或FuenteFiltrarposterior再试. ')
        : emptyStateHtml('rss', '还No hay actualizaciones disponibles', '点"Comprobar actualizaciones"去各 fuente(s)取uno遍; FuenteConNuevocontenido时会集En procesoMostrarEnaquí. ')
      : emptyStateHtml('rss', 'Aún no haySeguir任何Fuente', 'AñadirCreador或SuscribirseFuenteposterior, Actualizar会集En procesoMostrarEnaquí. ',
        { actions: '<a class="geist-button primary" href="/subscriptions?tab=add">Agregar seguimiento</a>' });
  return <div data-follow-empty="" className="contents" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ── 写操作 ──
 * Estadoy稍posteriorver(Guardar到DatosBiblioteca)都En岛dentro发. ÉxitoposteriorEn缓存dentro换局部: EntradaEstado, Estado计数, 筛着某uno档
 * 而NuevoEstadoNoEnesteuno档时Completo组移出; 再Enposteriorpesado读uno遍, 拿服务端口径校正. 回执带unoDeshacerClave, Guardar
 * 进DatosBibliotecaNo给Deshacer—esees另uno件事. Solo读端写入必然 409, esees正常Estado, 照实写En卡arriba. 资料páginaEn线
 * 视Imagen用es同uno钩子, `view` es它eseunoSolo按创作者筛视Imagen.  */
const STATUS_RECEIPTS: Record<string, string> = { new: 'YaRestaurar no vistos', seen: 'YaMarcar como visto', ignored: 'Ignorado' };

export function useFollowWrite(props: Pick<FollowFeedProps, 'view' | 'revision' | 'actions'>) {
  const { view, revision, actions } = props;
  const [busy, setBusy] = useState<Map<number, string>>(() => new Map());
  const [failures, setFailures] = useState<Map<number, string>>(() => new Map());
  const key = followFeedQuery(view, revision).queryKey;
  const mark = (id: number, value: string, into: typeof setBusy) => into((now) => {
    const next = new Map(now);
    if (value) next.set(id, value); else next.delete(id);
    return next;
  });
  const apply = (id: number, to: string) => {
    queryClient.setQueryData<InfiniteData<FollowPage>>(key, (current) => (current ? withStatus(current, view, id, to) : current));
  };
  /* Solopesado读esteuno版Lista: Credencialeseseuno y 别Filtrarabajo缓存Lista都No因Comouno次Etiqueta而变.  */
  const refresh = () => void queryClient.invalidateQueries({ queryKey: key, exact: true });
  const before = (id: number) => {
    const page = mergedPage(queryClient.getQueryData<InfiniteData<FollowPage>>(key));
    for (const group of page?.groups || []) {
      for (const item of [group.primary, ...group.variants, ...group.duplicates]) if (item.id === id) return item.status;
    }
    return 'new';
  };
  /* 回调写En钩子arriba而Noes每次 `mutate` arriba: 连点两卡时, `mutate` en la回调SoloCon最posterioreseuno次会跑.  */
  const statusMutation = useMutation({
    mutationFn: ({ id, to }: { id: number; to: string; was: string }) => apiSend(FOLLOW_STATUS_URL, { item: id, to }),
    onSuccess: (_result, { id, to, was }) => {
      apply(id, to);
      refresh();
      actions.toast(STATUS_RECEIPTS[to] || 'Estado de seguimiento actualizado', {
        undo: was !== 'saved' ? async () => {
          await apiSend(FOLLOW_STATUS_URL, { item: id, to: was });
          apply(id, was);
          refresh();
        } : undefined,
      });
    },
    onError: (error, { id }) => {
      mark(id, requestErrorMessage(error), setFailures);
      actions.failure('Actualizar estado de seguimiento', error);
    },
    onSettled: (_result, _error, { id }) => mark(id, '', setBusy),
  });
  const saveMutation = useMutation({
    mutationFn: (id: number) => apiSend('/api/follow/save', { item: id }),
    onSuccess: (_result, id) => {
      apply(id, 'saved');
      refresh();
      actions.toast('Guardado en la base de datos');
    },
    onError: (error, id) => {
      mark(id, requestErrorMessage(error), setFailures);
      actions.failure('Guardar en base de datos', error);
    },
    onSettled: (_result, _error, id) => mark(id, '', setBusy),
  });
  const latest = useRef({ statusMutation, saveMutation, before });
  latest.current = { statusMutation, saveMutation, before };
  /* 两ProcesarDispositivo身No变: 卡片按引用比较, 每次pesado画都换Nuevo函数话uno屏几cien卡跟着pesado画.  */
  const status = useCallback((id: number, to: string) => {
    mark(id, to, setBusy);
    mark(id, '', setFailures);
    latest.current.statusMutation.mutate({ id, to, was: latest.current.before(id) });
  }, []);
  const save = useCallback((id: number) => {
    mark(id, 'save', setBusy);
    mark(id, '', setFailures);
    latest.current.saveMutation.mutate(id);
  }, []);
  return { busy, failures, status, save };
}
