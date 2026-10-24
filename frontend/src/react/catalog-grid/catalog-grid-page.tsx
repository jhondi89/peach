/* 馆藏卡片Cuadrícula: Directorioy回收站(由路由树画进 `#grid`), 资料páginaObras区, DetallespáginaContinuar viendo. 
 *
 * 取数, 排法y续página都Enaquí; Abrir, Seleccionar, 稍posteriorvery回收站操作es壳递进来动作. 换Filtrar或壳要求
 * pesado读时Consulta换Clave, CompletoCuadrícula按NuevoClavepesado挂: 先铺壳ese骨架, Datos回来posterior骨架淡出, contenido从Difusodentro清晰
 * 起来(同遗Deja层 `revealSkeleton`), 骨架还没到显示门槛就取完直continuar落contenido. 
 *
 * Cuadrícula每continuarunopágina经 `onCount` 报uno次Total数y显示卡数, 读数画EnprimeropáginaFiltrar(`catalog-filter` 岛)
 * abajo排. Sin限滚动见abajo面 `LoadMore`: 哨兵进入视口 320px
 * interior自动取Siguientepágina, 点它etc.于手动取; FalloEn哨兵posterior面DejaunopuedeReintentar Note, 之posteriorSoloCon手动才Reintentar.  */
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { mixFace as mixArtwork, mixLabel, relayoutCovers, type Artwork } from '@peach/card-art';
import { requestErrorMessage } from '@peach/legacy/core';
import { emptyStateHtml, loadingDotsHtml } from '@peach/legacy/ui';

import { apiGet } from '../../api';
import { RetryNote, useSkeletonReveal } from '../components/grid-reveal';
import { cardRatio, MediaCard, type MediaCardVariant } from '../components/media-card';
import { MIX_FLIP_FACES, MixCard } from '../components/mix-card';
import {
  SHORTS_BATCH, arrangeTiles, catalogParams, catalogQuery, entityQuery, latestCatalogPages, mixHasPicture,
  shortsBoundaries, shortsParams, splitSections, type GridPage, type ShortsCut, type Tile,
} from './catalog-grid';
import type { CatalogGridProps, MediaCardLayout, MediaCardHelpers, MediaItem, MediaPage } from './types';
import { VideoWall } from '../video-wall/video-wall';
import { finiteWallFilters, wallHasCover } from '../video-wall/wall-layout';
import { LibraryCompletionPrompt, missingPreviewIds } from '../library-processing/library-completion';
import { useCatalogView } from './catalog-view';
import { CatalogListPage } from './catalog-list-page';

export function CatalogGridPage(props: CatalogGridProps) {
  const view = useCatalogView();
  if (props.mode === 'items') return <ItemsGrid {...props} />;
  const key = props.mode === 'entity'
    ? `entity:${props.entityKey || ''}:${props.revision}`
    : `catalog:${catalogParams(props.filters || {}, !!props.excludeVertical)}:${props.batchSize || 60}:${props.revision}`;
  if (view === 'list' && !props.wall) return <CatalogListPage key={key} {...props} />;
  return <GridBody key={key} {...props} />;
}

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><use href={`#i-${name}`} /></svg>;
}

/** 壳手arribayaConuno批(DetallespáginaContinuar viendo): No取数, Solo画卡. `next` eseuno排卡直continuar排进壳横排.  */
function ItemsGrid(props: CatalogGridProps) {
  const { actions } = props;
  const onOpen = useCallback((item: MediaItem, anchor: HTMLElement) => actions.open(item, anchor), [actions]);
  const variant: MediaCardVariant = props.variant === 'next' ? 'next' : 'grid';
  const cards = (props.items || []).map((item) => (
    <MediaCard key={item.id} item={item} variant={variant} layout={props.layout}
      selected={props.selected.has(item.id)} selectMode={props.selectMode} seekSeconds={props.seekSeconds}
      helpers={props.helpers} actions={actions} onOpen={onOpen} />
  ));
  if (variant === 'next') return <div data-media-next-row="">{cards}</div>;
  return <div data-media-grid="" data-select-mode={props.selectMode ? '' : undefined}>{cards}</div>;
}

/** uno次ConsultaCompleto生命周期: 骨架, primero屏, 续página, 竖屏带y读数.  */
function GridBody(props: CatalogGridProps) {
  const { helpers, actions, layout } = props;
  const entity = props.mode === 'entity';
  const trash = !entity && props.filters?.state === 'trash';
  const query = entity ? entityQuery(props) : catalogQuery(props);
  /* 资料páginaNo.unopágina由壳 y página头uno起取来: Sincronizar落进esteuno代缓存, primero帧就es卡片, No再发uno遍.  */
  const [retained] = useState(() => props.wall ? latestCatalogPages(query.queryKey) : undefined);
  const initialData = retained || (entity && props.initial
    ? { pages: [{ ...props.initial, items: props.initial.items || [], offset: 0 }], pageParams: [0] }
    : undefined);
  const result = useInfiniteQuery<GridPage, Error, InfiniteData<GridPage, number>, QueryKey, number>({
    queryKey: query.queryKey,
    queryFn: ({ pageParam, signal }) => query.queryFn({ pageParam, signal }),
    initialPageParam: 0,
    getNextPageParam: query.getNextPageParam,
    initialData,
    refetchOnMount: entity && retained ? 'always' : false,
  });

  /* uno次取数落定就告诉壳uno次, Éxito, Como空, Fallo都算: 壳dentro `await` este次pesado读调用方据此放行.  */
  const settledOnce = useRef(false);
  useEffect(() => {
    if (result.isPending || settledOnce.current) return;
    settledOnce.current = true;
    props.settled?.(props.revision);
  }, [result.isPending]);

  const { tiles, pageStarts } = useMemo(() => arrangeTiles(result.data?.pages || [], {
    collapse: props.groupCollapse !== false, mix: !!props.mix && !trash, javImage: layout.javImage,
  }), [result.data, props.groupCollapse, props.mix, trash, layout.javImage]);
  const shown = tiles.reduce((count, tile) => count + (tile.kind === 'card' ? 1 : 0), 0);
  const total = Number(result.data?.pages[0]?.total || 0);
  const finiteWall = entity || finiteWallFilters(props.filters);
  const wallAvailable = !trash && !props.selectMode && !!actions.wallPlayer && !!actions.wallDetails;
  const wallItems = tiles.flatMap(tile => tile.kind === 'card' && wallHasCover(tile.item) ? [tile.item] : []);
  const wallPool = wallItems;
  const missing = trash ? [] : missingPreviewIds(
    tiles.flatMap(tile => tile.kind === 'card' ? [tile.item] : []), layout.javImage);

  const reveal = useSkeletonReveal(result.isPending, props.skeletonHtml);
  const body = useRef<HTMLDivElement | null>(null);
  const cuts = useShortsStrips(props, result.data, tiles, pageStarts, body);

  /* 读数排到微Tareadentro报: 壳画读数会顺带pesado排página头y选en proceso态, eseuno路puede能走到批量 `flushSync`, 
     提交阶段dentro它画No出来. 微TareaEnExplorar dispositivo绘制anterior跑完; esteuno代ya卸abajo就No报.  */
  useLayoutEffect(() => {
    if (!result.data) return;
    let live = true;
    queueMicrotask(() => { if (live) props.onCount?.(total, shown) });
    return () => { live = false };
  }, [result.data, total, shown]);
  const failed = !result.isPending && !result.data;
  useLayoutEffect(() => {
    if (!failed) return;
    let live = true;
    queueMicrotask(() => { if (live) props.onCountFailed?.() });
    return () => { live = false };
  }, [failed]);

  const open = useCallback((item: MediaItem, anchor: HTMLElement) => actions.open(item, anchor), [actions]);
  const openResource = useCallback(
    (item: MediaItem, anchor: HTMLElement) => actions.openResource(item, anchor), [actions]);
  const openShort = useCallback((item: MediaItem) => actions.openShort(item), [actions]);

  const loadNext = useCallback(async () => {
    const next = await result.fetchNextPage({ cancelRefetch: false });
    if (next.isFetchNextPageError) throw next.error;
  }, [result.fetchNextPage]);

  const card = (tile: Tile) => tile.kind === 'mix'
    ? <HomeMix key={`mix:${tile.seed.id}`} seed={tile.seed} layout={layout} helpers={helpers} actions={actions} />
    : (
      <MediaCard key={tile.item.id} item={tile.item}
        variant={trash && tile.item.medium && tile.item.medium !== 'video' ? 'resource' : 'grid'} layout={layout}
        selected={props.selected.has(tile.item.id)} selectMode={props.selectMode} seekSeconds={props.seekSeconds}
        helpers={helpers} actions={actions} onOpen={trash ? openResource : open} />
    );

  const content = () => {
    if (wallAvailable && props.wall) return <VideoWall
      key={finiteWall ? 'finite' : 'explore'}
      sessionKey={entity ? `entity:${props.entityKey || ''}` : `catalog:${catalogParams(props.filters || {}, !!props.excludeVertical)}`}
      items={wallPool} finite={finiteWall} hasMore={!!result.hasNextPage} busy={result.isFetchingNextPage}
      loading={result.isPending || (!result.data && result.isFetching)}
      error={!result.data && !result.isPending ? requestErrorMessage(result.error) : ''}
      retry={() => void result.refetch()}
      emptyHtml={result.data && !wallPool.length ? tiles.length
        ? emptyStateHtml('image', 'este批ObraSinPortada', result.hasNextPage ? 'Cargar másObraposteriorContinuarExplorar. ' : '换FiltrarRango再试. ')
        : props.emptyHtml?.({ trash, libraryEmpty:!!result.data.pages[0]?.libraryEmpty }) : ''}
      loadMore={loadNext} actions={actions} helpers={helpers} javImage={layout.javImage} />;
    if (result.isPending) return null;
    if (!result.data) {
      return <RetryNote message={requestErrorMessage(result.error)} onRetry={() => void result.refetch()} />;
    }
    if (!tiles.length) {
      const html = props.emptyHtml?.({ trash, libraryEmpty: !!result.data.pages[0]?.libraryEmpty }) || '';
      return <div data-media-empty="" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return (
      <>
        <div data-media-sections="" data-select-mode={props.selectMode ? '' : undefined}>
          {splitSections(tiles, cuts).map((section) => (
            <Fragment key={section.start}>
              <div data-media-grid="" data-catalog-view-mode="cards">{section.tiles.map(card)}</div>
              {section.strip ? <ShortsStrip cut={section.strip} props={props} onOpen={openShort} /> : null}
            </Fragment>
          ))}
        </div>
        {result.hasNextPage
          ? <LoadMore key={result.data.pages.length} entity={entity} load={loadNext}
            enabled={() => props.canLoadMore?.() !== false} />
          : null}
      </>
    );
  };

  return (
    <div ref={body} data-media-body="" data-grid-reveal={reveal.fading ? '' : undefined}>
      {!props.wall && reveal.layer}
      <LibraryCompletionPrompt assetIds={missing} />
      {content()}
    </div>
  );
}

/** 续página. Directorioesuno滚到附近就自己取哨兵, 资料páginaesuno"载入更más"Clave, 两者判据相同. 
 *  每continuarAnteriorpágina就按NuevoClavepesado挂uno次, FalloEstadoNo跨página. 资料página照片Muroy关注página翻página也用esteuno; 关注páginaeseClave
 *  带字形, `children` 换掉Claveen la字.  */
export function LoadMore({ entity, load, enabled, children }: {
  entity: boolean; load: () => Promise<void>; enabled: () => boolean; children?: ReactNode;
}) {
  const node = useRef<HTMLElement | null>(null);
  const busy = useRef(false);
  const failed = useRef(false);
  const [state, setState] = useState<{ busy: boolean; error: string }>({ busy: false, error: '' });
  const latest = useRef({ load, enabled });
  latest.current = { load, enabled };
  const run = useCallback(async (manual: boolean) => {
    const el = node.current;
    if (busy.current || !el?.isConnected || (!manual && failed.current) || !latest.current.enabled()) return;
    busy.current = true;
    failed.current = false;
    setState({ busy: true, error: '' });
    try {
      await latest.current.load();
      if (node.current) setState({ busy: false, error: '' });
    } catch (error) {
      failed.current = true;
      if (node.current) setState({ busy: false, error: requestErrorMessage(error) });
    } finally {
      busy.current = false;
    }
  }, []);
  const attach = useCallback((el: HTMLElement | null) => { node.current = el }, []);
  useEffect(() => {
    const el = node.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void run(false);
    }, { rootMargin: '320px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [run]);
  const aria = state.busy ? { 'aria-busy': true, 'aria-disabled': true } as const : {};
  return (
    <>
      {entity
        ? <button ref={attach} type="button" data-entity-more="" {...aria} onClick={() => void run(true)}>{children ?? 'Cargar más'}</button>
        /* Fallo时SoloDejaabajo面eseReintentar: 哨兵收起peroNo卸abajo, Reintentarcontinuararriba之posterior照antiguo由它续página.  */
        : <div ref={attach} data-load-more="" {...aria} hidden={Boolean(state.error)} onClick={() => void run(true)}
          dangerouslySetInnerHTML={{ __html: loadingDotsHtml('Cargando más...') }} />}
      {state.error ? <RetryNote message={state.error} onRetry={() => void run(true)} /> : null}
    </>
  );
}

/** 竖屏带: 每continuarunopáginaPor favor求uno, 落点EnesteunopáginaAgregarese几行之间行边界arribaAleatorio取uno. 
 *  Por favor求跟着主ListaFiltraryOrdenar走; uno都Sin, 或esteunopágina剪No出行边界, 偏移量按遗Deja层归cero或No动.  */
function useShortsStrips(
  props: CatalogGridProps, data: InfiniteData<GridPage, number> | undefined,
  tiles: readonly Tile[], pageStarts: readonly number[], body: RefObject<HTMLElement | null>,
): ShortsCut[] {
  const [cuts, setCuts] = useState<ShortsCut[]>([]);
  const [arrived, setArrived] = useState<{ page: number; total: number; items: MediaItem[]; more: boolean } | null>(null);
  const offset = useRef(0);
  const handled = useRef(0);
  const controllers = useRef<AbortController[]>([]);
  useEffect(() => () => controllers.current.forEach((controller) => controller.abort()), []);
  useEffect(() => {
    const pages = data?.pages.length || 0;
    if (!props.shorts || handled.current >= pages) return;
    handled.current = pages;
    const controller = new AbortController();
    controllers.current.push(controller);
    const page = pages - 1;
    apiGet<MediaPage>(`/api/items?${shortsParams(props.filters || {}, offset.current)}`, controller.signal)
      .then((strip) => {
        const items = strip.items || [];
        if (!items.length) { offset.current = 0; return }
        setArrived({ page, total: Number(strip.total || 0), items, more: strip.has_more !== false });
      })
      /* 竖屏带es穿插进来附加contenido, 取No到就No插, 主Lista照常.  */
      .catch(() => {});
  }, [data]);
  useLayoutEffect(() => {
    if (!arrived) return;
    setArrived(null);
    const start = cuts.reduce((at, cut) => Math.max(at, cut.at), 0);
    const sections = body.current?.querySelectorAll<HTMLElement>('[data-media-sections] > [data-media-grid]');
    const last = sections?.[sections.length - 1];
    const columns = last ? Math.max(1, getComputedStyle(last).gridTemplateColumns.split(' ').length) : 1;
    const addedFrom = Math.max(0, (pageStarts[arrived.page] ?? 0) - start);
    const boundaries = shortsBoundaries(tiles.length - start, addedFrom, columns);
    if (!boundaries.length) return;
    const at = start + (boundaries[Math.floor(Math.random() * boundaries.length)] ?? 0);
    offset.current = arrived.more ? offset.current + SHORTS_BATCH : 0;
    setCuts((current) => [...current, { at, total: arrived.total, items: arrived.items }]);
  }, [arrived]);
  return cuts;
}

function ShortsStrip({ cut, props, onOpen }: {
  cut: ShortsCut; props: CatalogGridProps; onOpen: (item: MediaItem) => void;
}) {
  const row = useRef<HTMLDivElement | null>(null);
  const { wireDrag } = props;
  useEffect(() => { if (row.current) wireDrag(row.current) }, [wireDrag]);
  return (
    <section data-shorts-strip="">
      <h2>
        竖屏 <span data-shorts-count="">{`${cut.total.toLocaleString()} `}</span>
        <button type="button" data-shorts-enter="" onClick={() => props.actions.openShorts()}>
          <Icon name="gallery-vertical-end" /><span>进入Modo inmersivo</span>
        </button>
      </h2>
      <div ref={row} data-shorts-row="">
        {cut.items.map((item) => (
          <MediaCard key={item.id} item={item} variant="short" layout={props.layout}
            selected={props.selected.has(item.id)} selectMode={props.selectMode} seekSeconds={props.seekSeconds}
            helpers={props.helpers} actions={props.actions} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

/** Mix unoImagen: Código JAV版开着时Código JAVObras按esteuno屏grandeImagen/pequeñoImagen取, 其余uno律按pequeñoImagen.  */
function mixFace(item: MediaItem, layout: MediaCardLayout, eager: boolean): Artwork {
  return mixArtwork(item, layout.active && item.is_jav ? layout.size : 'small', eager, layout.javImage);
}

/** Directorio每unopáginaNo. 8 ese Mix: 以SemillaComoprimero相似Obras. Completo卡es点击区, Pasar el ratón逐翻过eseuno叠.  */
function HomeMix({ seed, layout, helpers, actions }: {
  seed: MediaItem; layout: MediaCardLayout; helpers: MediaCardHelpers; actions: CatalogGridProps['actions'];
}) {
  const faces = useRef(new Map<string, string>());
  const latest = useRef(layout);
  latest.current = layout;
  const label = mixLabel(seed, helpers.tagLabel);
  const flipImages = useCallback(async () => {
    const current = latest.current;
    const related = await actions.mixRelated(seed.id);
    const list = [seed, ...related].filter((item) => mixHasPicture(item, current.javImage)).slice(0, MIX_FLIP_FACES);
    faces.current = new Map(list.map((item) => [String(item.id), mixFace(item, current, true).html]));
    return list.map((item) => String(item.id));
  }, [seed, actions]);
  const jav = layout.active && !!seed.is_jav;
  const size = jav ? layout.size : 'small';
  const artwork = mixFace(seed, layout, false);
  return (
    <MixCard data-mix-seed={String(seed.id)} name={`Mix · ${label}`}
      caption={`${helpers.displayName(seed, seed.name || '')}及相似Obra`} count={0} badge="Mix" glyph wholeCard
      poster={null} artwork={artwork}
      artworkIdentity={size === 'small' ? artwork.html : mixFace(seed, { ...layout, size: 'small' }, false).html}
      relayoutArt={(root) => relayoutCovers(root, size)}
      ratio={cardRatio(seed, 'grid', layout)}
      flipImages={flipImages} faceHtml={(id) => faces.current.get(id) || ''} canFlip={actions.canFlip}
      faces={[]} onOpenEntity={actions.openEntity}
      onOpen={(anchor) => actions.openMix(seed.id, anchor)} openLabel={`Abrir Mix · ${label}`} />
  );
}
