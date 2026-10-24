/* primeropáginaarriba方eseunoCompleto: 两排Avatar(Actriz, Sello), 加uno两排玻璃浮层(arriba排cuatro视ImagenyEtiqueta, abajo排读数, 
 * 换uno批, 卡片版yOrdenarClave), 再加正文dentroCuadrículaarriba面ese交集. 
 *
 * EstadoTodoEn壳dentro: Filtrar, 当anterior视Imagen, Ordenar, 成员y读数都当 props 递进来, 点abajo去动作回壳, 壳En发Por favor求之anterior
 * 先推unoNuevo按abajo态, 所以 `aria-pressed` y滑动玻璃当场就到, Noetc.esteuno趟取数. 
 *
 * 加unoFiltrarNopesado画este几排: 成员(`tiers.key` yEtiqueta顺序)No变, React Solo改按abajo态, 人横着续到No.
 * seisdiez, 停EnNo. 600 像素en laeseuno排Original样Deja着. 换口径或换uno批, 壳给Nuevo `tiers.key`, 两排从头摆. 
 * Detalles浮窗Abrir期间壳No推任何东西, 关掉回来还es同uno批节点(`buildBars` ese段Anotación讲Como什么).  */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { fitSkeleton, popBadges, popCount } from '@peach/legacy/ui';

import { FilterGlassRows, FilterPill } from '../components/filter-glass';
import { useViewGlide } from '../components/use-view-glide';
import { LibraryShortcuts } from '../library-shortcuts/shortcut-controls';
import { FolderBrowseToggle } from '../catalog-folders/catalog-folders-page';
import { useCatalogView } from '../catalog-grid/catalog-view';
import { CatalogViewToggle } from '../catalog-grid/catalog-view-toggle';
import { Combo, Segments, Shuffle, SortKeys } from '../entity-filter/entity-filter-page';
import {
  EMPTY_SLOTS, ROW_AHEAD, ROW_BATCH, ROW_FIRST, type CatalogFilterProps, type CatalogTag, type TierKind,
  type TierPerformer, type TierStudio,
} from './catalog-filter';

/* Anterior次写出去读数. 读数eseuno格每次取数都换成微光再建回来, 靠它分清"换数" y "刚出现": 
   SoloConanterior者按错峰largo出来. 跨Consulta, 跨pesado挂都要记得, 所以放En模dentro.  */
let lastReadout = '';

export function CatalogFilterPage(props: CatalogFilterProps) {
  const loading = !props.tiers;
  const combo = useComboHost(props.comboHost);
  /* 收起时(资料página, 索引páginayGestionarpágina)SoloDeja两排Avatar: 回到同uno口径primeropágina时eseuno批Original样还En, Nopesado摆, Nopesado取Imagen. 
     浮层ese两排 y 资料página, 索引página浮层es同uno组组件, 同uno组属性, 藏着unoEnpágina面arriba, 就es两套同名Controles.  */
  return (
    <div data-catalog-root="" data-loading={loading || undefined} data-refreshing={props.refreshing || undefined}
      className="contents">
      {combo ? createPortal(<Combo items={props.combo} hidden={props.comboHidden} actions={props.actions} />, combo) : null}
      <Tiers {...props} />
      {props.offscreen ? null : <Glass {...props} />}
    </div>
  );
}

/** 玻璃浮层两排: arriba排cuatro视ImagenyEtiqueta, abajo排读数, 换uno批, 版yOrdenarClave.  */
function Glass(props: CatalogFilterProps) {
  const { actions, helpers } = props;
  const pane = useRef<HTMLSpanElement>(null);
  const viewRow = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const tagRow = useRef<HTMLDivElement>(null);
  const bottomRow = useRef<HTMLDivElement>(null);
  const [singleRow, setSingleRow] = useState(false);
  const glide = useViewGlide(pane, viewRow, '[data-catalog-view][aria-pressed="true"]', props.state);

  /* Etiquetaeseuno格es `overflow-x:auto` 加隐藏滚动, 鼠标够No着, 所以登记Todo站横向行ese套拖动加滚轮. 
     estrecho屏abajo滚esexterior面ese层(视Imagen跟着uno起走), 两层都登记; abajo排estrecho屏abajoCompleto横滚, 同uno套.  */
  useEffect(() => {
    helpers.wireDrag(tagRow.current);
    helpers.wireScroller(scroll.current);
    helpers.wireDrag(bottomRow.current);
  }, [helpers]);

  const loading = !props.tiers;
  const tags = usePaged(tagRow, props.tags, props.tiers?.key ?? '', props.tagFirst);
  useLayoutEffect(() => {
    const frame = scroll.current?.closest<HTMLElement>('[data-catalog-frame]');
    if (!frame) return;
    const width = (element: HTMLElement | null) => {
      if (!element) return 0;
      const style = getComputedStyle(element);
      return [...element.children].reduce((total, child) => total + child.getBoundingClientRect().width, 0)
        + Math.max(0, element.children.length - 1) * (parseFloat(style.columnGap) || 0);
    };
    const measure = () => setSingleRow(frame.clientWidth >= width(viewRow.current) + width(tagRow.current)
      + width(bottomRow.current) + 64);
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    measure();
    return () => observer.disconnect();
  }, [tags, props.count, props.layout, props.sorts]);
  /* 计数徽标变值ese几弹unoabajo(遗Deja层 `popBadges`, 按Anterior次值判断, No按节点NuevoNoNuevo).  */
  useLayoutEffect(() => { popBadges(tagRow.current, 'tagbar') }, [tags]);

  return (
    <FilterGlassRows label="Filtrar y ordenar" topLabel="Vista y etiquetas"
      attrs={{ 'data-filter-frame': '', 'data-catalog-frame': '', ...(singleRow ? { 'data-single-row': '' } : {}) }}
      className="mx-4" topClassName="gap-1.5 overflow-visible" bottomClassName={props.trash ? 'hidden' : 'min-h-12'}
      bottomRef={bottomRow} busy={props.count === null || props.refreshing}
      panes={<span ref={pane} data-view-glide="" aria-hidden="true" />}
      top={
        <div ref={scroll} data-catalog-scroll="">
          <div ref={viewRow} role="group" aria-label="Vista" data-catalog-views="" onPointerLeave={glide.leave}>
            {props.views.map((view) => (
              <a key={view.k} href={view.href} data-catalog-view={view.k} data-entity-press=""
                aria-pressed={props.state === view.k} onPointerEnter={glide.hover}
                onClick={(event) => { event.preventDefault(); actions.setView(view.k) }}>
                {view.label}
              </a>
            ))}
            <span data-entity-sep="" aria-hidden="true" />
          </div>
          <div ref={tagRow} data-catalog-tags="">
            {props.empty || loading ? <Placeholders kind="tag" /> : null}
            {tags.map((tag) => <TagPill key={tag.k} tag={tag} onPress={actions.toggleTag} />)}
          </div>
        </div>
      }
      bottom={props.trash ? null : <Head {...props} />}
    />
  );
}

function TagPill({ tag, onPress }: { tag: CatalogTag; onPress(tag: string): void }) {
  return (
    <FilterPill data-catalog-tag={tag.k} data-entity-press="" pressed={tag.selected} onPress={() => onPress(tag.k)}>
      {tag.label}{tag.n == null ? null : <span data-count-badge={tag.k}>{tag.n.toLocaleString()}</span>}
    </FilterPill>
  );
}

/** 两排Avatar. 空uno排仍占 28px, 画出来就esuno什么都Sin空带, 所以没人就No画eseuno排.  */
function Tiers(props: CatalogFilterProps) {
  const { actions, helpers } = props;
  const tiers = props.tiers ?? { key: '', performers: [], studios: [] };
  const empty = props.empty || !props.tiers;
  const performers = useRef<HTMLDivElement>(null);
  const studios = useRef<HTMLDivElement>(null);
  const more = useCallback((kind: TierKind) => () => actions.moreTops(kind), [actions]);
  /* 占ese几排SinSiguientepáginapuede要.  */
  const shownPerformers = usePaged(performers, tiers.performers, tiers.key, ROW_FIRST,
    empty ? undefined : more('performers'));
  const shownStudios = usePaged(studios, tiers.studios, tiers.key, ROW_FIRST, empty ? undefined : more('studios'));
  const hasPerformers = empty || tiers.performers.length > 0;
  const hasStudios = empty || tiers.studios.length > 0;
  useEffect(() => {
    helpers.wireDrag(performers.current);
    helpers.wireDrag(studios.current);
  }, [helpers, hasPerformers, hasStudios]);
  return (
    <div data-catalog-tiers="" hidden={!hasPerformers && !hasStudios}>
      {hasPerformers ? (
        <div ref={performers} data-catalog-tier="performers">
          {empty ? <Placeholders kind="performer" /> : (shownPerformers as TierPerformer[]).map((person) => (
            <button key={person.name} type="button" data-tier-performer="" data-entity-kind="performer"
              data-entity-name={person.name} onClick={() => actions.openEntity('performer', person.name)}>
              <span data-tier-ring="" dangerouslySetInnerHTML={{ __html: person.ringHtml }} />
              <span data-tier-name="">{person.name}</span>
            </button>
          ))}
        </div>
      ) : null}
      {hasStudios ? (
        <div ref={studios} data-catalog-tier="studios">
          {empty ? <Placeholders kind="studio" /> : (shownStudios as TierStudio[]).map((studio) => (
            <button key={studio.name} type="button" data-tier-studio="" data-entity-kind="studio"
              data-entity-name={studio.name} onClick={() => actions.openEntity('studio', studio.name)}>
              <StudioMark studio={studio} />{studio.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Sello标识. 兜底Solo剩"装pero读No出来"esteuno: Archivo坏, 或归uno漏掉, Imagenpequeño到verNo出es什么; 
 *  没装标识壳根本No给地址, No出esteImagen.  */
function StudioMark({ studio }: { studio: TierStudio }) {
  const [broken, setBroken] = useState(false);
  return (
    <span data-tier-mark="">
      {studio.logo && !broken ? (
        <img src={studio.logo} alt="" onError={() => setBroken(true)}
          onLoad={(event) => { if (event.currentTarget.naturalWidth < 32) setBroken(true) }} />
      ) : studio.fallback}
    </span>
  );
}

/** 空馆藏占: 每排seisdiezcuatro格, 由容Dispositivo裁到puede用ancho度. 它NoesControles, Nocontinuar指针.  */
function Placeholders({ kind }: { kind: 'performer' | 'studio' | 'tag' }) {
  const slots = Array.from({ length: EMPTY_SLOTS }, (_, index) => index);
  if (kind === 'tag') {
    return <span data-catalog-placeholder="tag" aria-hidden="true">{slots.map((i) => <span key={i} />)}</span>;
  }
  return (
    <>
      {slots.map((i) => (kind === 'performer' ? (
        <span key={i} data-catalog-placeholder="performer" aria-hidden="true"><span /><span>&nbsp;</span></span>
      ) : (
        <span key={i} data-catalog-placeholder="studio" aria-hidden="true"><span /><span>&nbsp;</span></span>
      )))}
    </>
  );
}

/** abajo排: 读数, 换uno批, 版yOrdenar. 回收站No出esteuno排.  */
function Head({ count, refreshing, layout, sorts, actions }: CatalogFilterProps) {
  const view = useCatalogView();
  const [shuffling, setShuffling] = useState(false);
  const shuffle = () => {
    setShuffling(true);
    actions.reshuffle().finally(() => setShuffling(false));
  };
  return (
    <>
      <span data-catalog-summary=""><Readout count={count} /><LibraryShortcuts currentHref={actions.currentHref} /></span>
      <span data-entity-sorts="">
        <Shuffle onPress={shuffle} busy={shuffling || refreshing} />
        {/* 按名字换Clave: JAV yprimeropágina各uno组, React Aria 单选组挂arriba之posteriorNo改 `name`.  */}
        {layout && view === 'cards' ? <Segments key={layout.name} name={layout.name} label={layout.label} value={layout.value} options={layout.options}
          onChange={actions.setLayout} /> : null}
        <CatalogViewToggle />
        <FolderBrowseToggle />
        {view === 'cards' ? <SortKeys sorts={sorts} onSort={actions.setSort} /> : null}
      </span>
    </>
  );
}


/** 读数: `1,234 que cumple · 显示 24`. etc.esteuno趟取数时换成unoancho度定死微光, 180ms interior就到手uno帧都No露.  */
function Readout({ count }: { count: CatalogFilterProps['count'] }) {
  const readout = useRef<HTMLSpanElement>(null);
  const skeleton = useRef<HTMLSpanElement>(null);
  const text = count ? `${count.total.toLocaleString()} que cumple · Mostrar ${count.shown.toLocaleString()}` : '';
  useLayoutEffect(() => {
    if (count === false) return;
    if (!count) { fitSkeleton(skeleton.current); return }
    const el = readout.current;
    if (!el) return;
    if (lastReadout && el.dataset.popCount === undefined) el.dataset.popCount = lastReadout;
    lastReadout = text;
    popCount(el, text);
  }, [count, text]);
  if (count === false) return <span key="failed" data-catalog-readout="" />;
  return count
    ? <span key="readout" ref={readout} data-catalog-readout="" data-count-readout="" role="status" />
    : (
      <span key="skeleton" data-catalog-readout="">
        <span ref={skeleton} data-skeleton="count" aria-hidden
          className="relative inline-block h-3.5 w-37.5 rounded-md align-middle skeleton-sheen" />
      </span>
    );
}

/** 交集宿主: `#combo` dentro另建uno层 `.peach-react`, 样作用域要它. Desinstalar时撤掉, 行本身还给壳.  */
function useComboHost(row: Element | null): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!row) return undefined;
    const el = row.ownerDocument.createElement('div');
    el.className = 'peach-react';
    row.replaceChildren(el);
    setHost(el);
    return () => { el.remove(); setHost(null) };
  }, [row]);
  return host;
}

interface Page<T> { key: string; limit: number; fetched: T[]; drained: boolean }

/** uno排先摆 `first` , 横滚到离derecha端 320px 就再续 12 , 续到esteuno排真溢出Como止: ancho屏Anterior批puede能
 *  还IntroduceNo满uno行, 而没溢出就滚No动, 滚No动就再SinNo.dos次 `scroll` 来continuar着续. 手arribaeste用完再经
 *  `more` 要Siguientepágina, 要回空就es到底. `key` 变从头摆.  */
function usePaged<T>(row: RefObject<HTMLElement | null>, items: T[], key: string, first: number,
  more?: () => Promise<unknown[]>): T[] {
  const initial = (): Page<T> => ({ key, limit: first, fetched: [], drained: !more });
  const [page, setPage] = useState(initial);
  const current = page.key === key ? page : initial();
  if (current !== page) setPage(current);
  const all = useMemo(() => (current.fetched.length ? items.concat(current.fetched) : items),
    [items, current.fetched]);
  const fetching = useRef<string | null>(null);
  const state = useRef({ current, all, more });
  state.current = { current, all, more };
  const fill = useCallback(() => {
    const el = row.current;
    const { current: now, all: list, more: next } = state.current;
    if (!el || !el.clientWidth || el.scrollLeft + el.clientWidth < el.scrollWidth - ROW_AHEAD) return;
    if (now.limit < list.length) {
      setPage((p) => (p.key === now.key ? { ...p, limit: p.limit + ROW_BATCH } : p));
      return;
    }
    if (now.drained || !next || fetching.current === now.key) return;
    fetching.current = now.key;
    /* 要Siguientepáginaeste段Tiempodentro人还En滚, `fetching` 挡住同uno名单pesado入, 免得同unopágina要两遍. 按 `key` 记: 
     * antiguo名单eseunopágina还En路arriba时名单换, Nuevo名单照样续página, No然antiguoPor favor求回来被丢掉posterioresteuno排就停EnNo.unopágina.  */
    void next().catch(() => []).then((rows) => {
      if (fetching.current === now.key) fetching.current = null;
      setPage((p) => {
        if (p.key !== now.key) return p;
        return rows.length ? { ...p, fetched: p.fetched.concat(rows as T[]) } : { ...p, drained: true };
      });
    });
  }, [row]);
  useLayoutEffect(fill);
  useEffect(() => {
    const el = row.current;
    el?.addEventListener('scroll', fill, { passive: true });
    return () => el?.removeEventListener('scroll', fill);
  });
  return all.slice(0, current.limit);
}
