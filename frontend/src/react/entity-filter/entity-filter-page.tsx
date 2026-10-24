/* 实体资料página资料卡abajo面eseunoCompleto: 交集, 加uno两排玻璃浮层(arriba排视ImagenClave, 观verEstadoyEtiqueta, 
 * abajo排读数yesteuno屏Ordenar, 版 y 换uno批). tres视Imagen(名册, Obras, 照片)共用esteuno, abajo排按视Imagen换contenido. 
 *
 * EstadoTodoEn壳dentro: esteunopáginaFiltrar, 当anterior视Imagen, Ordenary读数都当 props 递进来, 点abajo去动作回壳, 壳En发
 * Por favor求之anterior先推unoNuevo按abajo态, 所以 `aria-pressed` y滑动玻璃当场就到, Noetc.esteuno趟取数. 
 *
 * 两排"你En哪儿"各Conuno滑动玻璃(视ImagenClaveesees圆), 由 `use-view-glide.ts` 挪; 它们es浮层根arriba
 * 常驻节点, 换Filtrar, 换视Imagen都Solo挪Nopesado建. 源Archivoese两Clave仍由遗Deja层拼(照片Detallesdentro复用es同uno对), 
 * eseuno格用 `dangerouslySetInnerHTML`, React No拥Condentro面节点.  */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Radio, RadioGroup } from 'react-aria-components';
import { icon } from '@peach/legacy/core';

import { FilterGlassRows, FilterIconButton, FilterPill } from '../components/filter-glass';
import { LibraryShortcuts } from '../library-shortcuts/shortcut-controls';
import { SEGMENTED_GLASS_TRACK, SEGMENT_GLASS } from '../components/segmented';
import { spriteGlyph } from '../components/sprite-glyph';
import { useViewGlide } from '../components/use-view-glide';
import { useCatalogView } from '../catalog-grid/catalog-view';
import { CatalogViewToggle } from '../catalog-grid/catalog-view-toggle';
import { sourceIcon } from '../follow-feed/follow-marks';
import {
  videoOnly, type EntityComboItem, type EntityFilterActions, type EntityFilterHelpers, type EntityFilterProps, type EntityOnlineHead,
  type EntityPhotoHead, type EntitySortKey, type EntityVideoHead, type EntityView, type EntityViewKeys, type SegmentOption,
} from './entity-filter';

const Sep = () => <span data-entity-sep="" aria-hidden="true" />;

export function EntityFilterPage(props: EntityFilterProps) {
  const { view, views, state, states, tags, combo, actions, helpers } = props;
  const onVideos = videoOnly(view);
  /* En线视Imagen也Con自己Estado, 来源yEtiqueta(关注páginaeseuno套), Soloes数es关注en laEntrada.  */
  const online = view === 'online' ? props.online : null;
  const filtered = onVideos || !!online;
  const stateNow = online ? online.status : state;
  const stateOptions = online ? online.statuses.map(([k, label]) => ({ k, label })) : states;
  const statePane = useRef<HTMLSpanElement>(null);
  const mediaPane = useRef<HTMLSpanElement>(null);
  const stateRow = useRef<HTMLDivElement>(null);
  const mediaRow = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const tagRow = useRef<HTMLDivElement>(null);
  const bottomRow = useRef<HTMLDivElement>(null);
  const stateGlide = useViewGlide(statePane, stateRow, '[data-entity-state][aria-pressed="true"]', `${view}:${stateNow}`);
  const mediaGlide = useViewGlide(mediaPane, mediaRow, '[data-media-view][aria-pressed="true"]', `${view}:${!!views}`);
  const onlinePane = useRef<HTMLSpanElement>(null);
  const onlineRow = useRef<HTMLDivElement>(null);
  const onlineMedia = online?.mediaCounts ? online : null;
  const onlineGlide = useViewGlide(onlinePane, onlineRow, '[data-media-view][aria-pressed="true"]',
    `${view}:${online?.media}:${!!onlineMedia}`);

  /* Etiquetaeseuno格es `overflow-x:auto` 加隐藏滚动: 能滚, pero鼠标Sinuno够得着入口, 所以登记Todo站
     横向行ese套拖动加滚轮映射. estrecho屏abajo滚esexterior面ese层(观verEstado跟着uno起走), 两层都登记: 登记En
     No滚eseuno层arribaes空转, menos登记uno层就会En某unoancho度arriba滚No动. abajo排estrecho屏abajoCompleto横滚, 同uno套.  */
  useEffect(() => {
    helpers.wireDrag(tagRow.current);
    helpers.wireScroller(scroll.current);
    helpers.wireDrag(bottomRow.current);
  }, [helpers]);

  return (
    <>
      <Combo items={combo} hidden={!onVideos} actions={actions} />
      <FilterGlassRows label="Filtrar y ordenar" topLabel="MediosyEtiqueta"
        attrs={{ 'data-filter-frame': '', 'data-entity-filter-glass': '' }}
        topClassName="gap-1.5 overflow-visible"
        bottomClassName="min-h-12" bottomRef={bottomRow} busy={props.busy}
        panes={<>
          <span ref={statePane} data-view-glide="" aria-hidden="true" />
          <span ref={mediaPane} data-view-glide="round" aria-hidden="true" />
          <span ref={onlinePane} data-view-glide="round" aria-hidden="true" />
        </>}
        top={!views && !filtered ? null : <>
          {views ? (
            <>
              <ViewKeys keys={views} view={view} row={mediaRow} glide={mediaGlide} onView={actions.setView} />
              {filtered ? <Sep /> : null}
            </>
          ) : null}
          {onlineMedia ? (
            <>
              <OnlineMediaKeys head={onlineMedia} row={onlineRow} glide={onlineGlide} onMedia={actions.onlineMedia} />
              <Sep />
            </>
          ) : null}
          <div ref={scroll} data-entity-scroll="">
            <div ref={stateRow} role="group" aria-label={online ? 'Estado' : 'VerEstado'} data-entity-states=""
              hidden={!filtered} onPointerLeave={stateGlide.leave}>
              {stateOptions.map((option) => (
                <button key={option.k} type="button" data-entity-state={option.k} data-entity-press=""
                  aria-pressed={stateNow === option.k} onPointerEnter={stateGlide.hover}
                  onClick={() => {
                    if (stateNow === option.k) return;
                    if (online) actions.onlineStatus(option.k); else actions.setState(option.k);
                  }}>
                  {option.label}
                </button>
              ))}
              {!online || online.providers.length || online.tags.length ? <Sep /> : null}
            </div>
            {/* EtiquetaSoloEnObras视Imagen出: 计数数esObras, 摆到名册或照片arriba对Noarriba号, 点unoabajo还会视Imagen拨回Obras.  */}
            <div ref={tagRow} data-entity-tags="">
              {onVideos ? tags.map((tag) => (
                <FilterPill key={tag.k} data-entity-tag={tag.k} data-entity-press="" pressed={tag.selected}
                  onPress={() => actions.toggleTag(tag.k)}>
                  {tag.label}<span data-count-badge={tag.k}>{tag.n.toLocaleString()}</span>
                </FilterPill>
              )) : online ? <OnlineFilters head={online} actions={actions} /> : null}
            </div>
          </div>
        </>}
        bottom={<Head {...props} />}
      />
    </>
  );
}

const ONLINE_MEDIA = [['videos', 'Videos', 'play', 'video'], ['images', 'Imágenes', 'pics', 'image']] as const;

/** En线视Imagenizquierda端ese两圆Clave, 同关注Página: esteuno屏摆视频还esImagen片.  */
function OnlineMediaKeys({ head, row, glide, onMedia }: {
  head: EntityOnlineHead;
  row: RefObject<HTMLDivElement | null>;
  glide: ReturnType<typeof useViewGlide>;
  onMedia(media: 'videos' | 'images'): void;
}) {
  return (
    <div ref={row} role="group" aria-label="En líneaTipo de medio" data-entity-media="" data-online-media=""
      onPointerLeave={glide.leave}>
      {ONLINE_MEDIA.map(([value, text, symbol, kind]) => {
        const title = `${text} ${Math.max(0, head.mediaCounts?.[value] || 0).toLocaleString()}`;
        return (
          <button key={value} type="button" data-media-view={value} data-media-icon={kind}
            aria-pressed={head.media === value} aria-label={title} title={title} onPointerEnter={glide.hover}
            onClick={() => { if (head.media !== value) onMedia(value) }} dangerouslySetInnerHTML={{ __html: icon(symbol) }} />
        );
      })}
    </div>
  );
}

/** En线视Imagen来源站标yEtiqueta药丸, 同关注páginaese浮层: 站标按abajoesSolovereste来源, Etiquetaes交集.  */
function OnlineFilters({ head, actions }: { head: EntityOnlineHead; actions: EntityFilterActions }) {
  return (
    <>
      {head.providers.map(([key, label]) => (
        <button key={key} type="button" data-follow-provider={key} data-entity-press=""
          aria-pressed={head.provider === key} title={label} aria-label={`Fuente: ${label}`}
          onClick={() => actions.onlineProvider(key)} dangerouslySetInnerHTML={{ __html: sourceIcon(key) }} />
      ))}
      {head.providers.length && head.tags.length ? <Sep /> : null}
      {head.tags.map((tag) => (
        <FilterPill key={tag.k} data-follow-tag={tag.k} data-entity-press="" data-tag-cat={`r34-${tag.cat}`}
          pressed={tag.selected} onPress={() => actions.onlineTag(tag.k)}>
          {tag.label}{tag.n ? <span data-count-badge={tag.k}>{tag.n.toLocaleString()}</span> : null}
        </FilterPill>
      ))}
    </>
  );
}

/** 名册, 视频, 照片yEn线es互斥视Imagen, 共用uno组圆Clave: 它们回答es同uno问题. Clave名带arriba数目, Pasar el ratón读得到. 
 *  anteriortres样es本地DatosBibliotecaen la东西, En线es关注dentro还没入BibliotecaActualizar, 所以排En最último.  */
function ViewKeys({ keys, view, row, glide, onView }: {
  keys: EntityViewKeys;
  view: EntityView;
  row: RefObject<HTMLDivElement | null>;
  glide: ReturnType<typeof useViewGlide>;
  onView(view: EntityView): void;
}) {
  const buttons: { value: EntityView; text: string; count: number; symbol: string; kind: string }[] = [];
  if (keys.people) buttons.push({ value: 'people', text: keys.people.label, count: keys.people.count, symbol: keys.people.icon, kind: 'people' });
  if (keys.videos) buttons.push({ value: 'videos', text: 'Videos', count: keys.videos.count, symbol: 'play', kind: 'video' });
  if (keys.photos) buttons.push({ value: 'photos', text: 'Foto', count: keys.photos.count, symbol: 'pics', kind: 'image' });
  if (keys.online) buttons.push({ value: 'online', text: 'En línea', count: keys.online.count, symbol: 'rss', kind: 'online' });
  return (
    <div ref={row} role="group" aria-label={keys.label} data-entity-media="" onPointerLeave={glide.leave}>
      {buttons.map(({ value, text, count, symbol, kind }) => {
        const title = `${text} ${Math.max(0, count || 0).toLocaleString()}`;
        return (
          <button key={value} type="button" data-media-view={value} data-media-icon={kind}
            aria-pressed={view === value} aria-label={title} title={title} onPointerEnter={glide.hover}
            onClick={() => onView(value)} dangerouslySetInnerHTML={{ __html: icon(symbol) }} />
        );
      })}
    </div>
  );
}

/** 生效ObrasFiltrar. 跟浮层分开摆En它arriba面: 它说es"现En加哪些", unouno撤得掉. primeropáginaese
 *  (`catalog-filter`)es同uno.  */
export function Combo({ items, hidden, actions }: {
  items: EntityComboItem[]; hidden: boolean; actions: Pick<EntityFilterActions, 'toggleTag' | 'clearFilter' | 'clearAll'>;
}) {
  return (
    <div data-entity-combo="" hidden={hidden}>
      {items.length ? (
        <>
          {items.map((item) => (
            <span key={`${item.kind}:${item.key}`} data-combo-chip="">
              {item.label}
              <button type="button" aria-label={`撤掉 ${item.label}`}
                onClick={() => (item.kind === 'untag' ? actions.toggleTag(item.key) : actions.clearFilter(item.key))}>
                ✕
              </button>
            </span>
          ))}
          <button type="button" data-combo-clear="" onClick={actions.clearAll}>Limpiar todo</button>
        </>
      ) : null}
    </div>
  );
}

/** abajo排: 读数, 加esteuno视Imagen自己ese几Controles. 名册SoloCon读数.  */
function Head(props: EntityFilterProps) {
  const { view, readout, busy, video, photo, actions, helpers } = props;
  return (
    <>
      {view === 'photos' && photo?.back ? (
        <button type="button" data-photo-back="" onClick={actions.photoBack}>
          <span className="contents" dangerouslySetInnerHTML={{ __html: icon('chevron-left') }} /><span>TodoFoto</span>
        </button>
      ) : null}
      <Readout text={readout} busy={busy} />
      <LibraryShortcuts currentHref={() => location.pathname + location.search} />
      {view === 'videos' && video ? <VideoControls head={video} actions={actions} /> : null}
      {view === 'photos' && photo ? <PhotoControls head={photo} actions={actions} helpers={helpers} /> : null}
      {view === 'online' && props.online ? <OnlineControls head={props.online} actions={actions} /> : null}
    </>
  );
}

/** 读数: `视频 · N`, `艺人 · N`, `照片 · N `. etc.esteuno趟取数时换成uno微光, ancho度同骨架eseuno.  */
function Readout({ text, busy }: { text: string; busy: boolean }) {
  return (
    <h3 data-entity-readout="">
      {busy
        ? <span data-skeleton="count" aria-hidden className="relative inline-block h-3.5 w-24 rounded-md align-middle skeleton-sheen" />
        : text}
    </h3>
  );
}

/** 玻璃en la分段开关: 卡片版, Imagen片Diseño. 选en procesoeseuno格es浮层选en proceso态ese料. 关注páginayprimeropágina浮层用es
 *  同uno; `name` 给eseuno组单选框uno表单名(primeropáginaese组叫 `home-layout`/`jav-layout`).  */
export function Segments({ name, label, value, options, onChange }: {
  name?: string; label: string; value: string; options: readonly SegmentOption[]; onChange(value: string): void;
}) {
  return (
    <RadioGroup name={name} aria-label={label} orientation="horizontal" value={value} onChange={onChange}
      data-entity-layout="" className={SEGMENTED_GLASS_TRACK}>
      {options.map(([option, text, symbol]) => {
        const Glyph = spriteGlyph(symbol);
        return (
          <Radio key={option} value={option} aria-label={text} data-glass-segment="" className={SEGMENT_GLASS}>
            <span title={text} className="contents"><Glyph className="size-4" /></span>
          </Radio>
        );
      })}
    </RadioGroup>
  );
}

export function Shuffle({ onPress, busy = false }: { onPress(): void; busy?: boolean }) {
  return (
    <FilterIconButton data-entity-batch="" label="Cargar nuevos" busy={busy} icon={spriteGlyph('shuffle')} onPress={onPress} />
  );
}

/** Obras视Imagen: 换uno批, JAV 语境abajo卡片版, OrdenarClaveuno律排En最último, 挨着它Descripciónese批contenido.  */
function VideoControls({ head, actions }: { head: EntityVideoHead; actions: EntityFilterActions }) {
  const view = useCatalogView();
  return (
    <span data-entity-sorts="">
      <Shuffle onPress={() => void actions.reshuffle()} />
      {head.jav && view === 'cards' ? (
        <Segments label="Diseño de tarjeta JAV" value={head.jav.layout} options={head.jav.options} onChange={actions.setJavLayout} />
      ) : null}
      <CatalogViewToggle />
      {view === 'cards' ? <SortKeys sorts={head.sorts} onSort={actions.setSort} /> : null}
    </span>
  );
}

/** uno排OrdenarClave. 方向Solo画En选en procesoeseunoarriba: 箭头既es当anterior方向, 也es"再点uno次能翻"唯unoSugerencia. 
 *  Sin障碍名称播报es点abajo去会得到什么, 当anteriorEstado由 `aria-pressed` yeste箭头各自表达.  */
export function SortKeys({ sorts, onSort }: { sorts: readonly EntitySortKey[]; onSort(key: string): void }) {
  return (
    <>
      {sorts.map((sort) => {
        const Arrow = spriteGlyph(sort.dir === 'asc' ? 'arrow-up' : 'arrow-down');
        return (
          <button key={sort.key} type="button" data-entity-sort={sort.key} data-entity-press=""
            aria-pressed={sort.pressed} aria-label={sort.ariaLabel || undefined} onClick={() => onSort(sort.key)}>
            {sort.label}{sort.pressed && sort.dir ? <Arrow className="size-3.5" /> : null}
          </button>
        );
      })}
    </>
  );
}

/** En线视Imagenabajo排, 同关注Página: 换uno批, Imagen片MuroarribamásImagen片Diseñoy"仅显示Imagen片", OrdenarClave排En最último.  */
function OnlineControls({ head, actions }: { head: EntityOnlineHead; actions: EntityFilterActions }) {
  return (
    <span data-entity-sorts="">
      <Shuffle onPress={actions.onlineShuffle} />
      {head.media === 'images' ? (
        <>
          <Segments label="Diseño de imágenes" value={head.photoLayout} options={head.photoLayouts} onChange={actions.setPhotoLayout} />
          <button type="button" data-follow-images-only="" aria-pressed={head.imagesOnly} title="Solo mostrar imágenes"
            aria-label="Solo mostrar imágenes" onClick={() => actions.onlineImagesOnly(!head.imagesOnly)}>
            {head.imagesOnly ? <span data-view-glide="" aria-hidden="true" /> : null}
            <span className="contents" dangerouslySetInnerHTML={{ __html: icon('captions-off') }} />
          </button>
        </>
      ) : null}
      <SortKeys sorts={head.sorts} onSort={actions.onlineSort} />
    </span>
  );
}

/** 照片视Imagen: esteuno排No给OrdenarClave(DatosBibliotecadentroImagen片SoloConArchivo名, 体积 y 来源), Solo放换uno批, Imagen片Diseño, 
 *  EnunoImagen集dentro再加ese两源ArchivoClave. 换uno批Clave自己转圈, etc.到Nuevouno面Muro回来.  */
function PhotoControls({ head, actions, helpers }: {
  head: EntityPhotoHead; actions: EntityFilterActions; helpers: EntityFilterHelpers;
}) {
  const [shuffling, setShuffling] = useState(false);
  const tools = useRef<HTMLSpanElement>(null);
  const toolsHtml = head.back ? helpers.sourceToolsHtml(head.setId) : '';
  useEffect(() => { if (tools.current && toolsHtml) helpers.wireSourceTools(tools.current) }, [helpers, toolsHtml]);
  const shuffle = () => {
    setShuffling(true);
    actions.reshuffle().finally(() => setShuffling(false));
  };
  return (
    <span data-entity-sorts="">
      {head.shuffle ? <Shuffle onPress={shuffle} busy={shuffling} /> : null}
      <Segments label="Diseño de imágenes" value={head.layout} options={head.layouts} onChange={actions.setPhotoLayout} />
      {toolsHtml ? <span ref={tools} data-entity-srctools="" dangerouslySetInnerHTML={{ __html: toolsHtml }} /> : null}
    </span>
  );
}
