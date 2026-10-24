/* 实体资料página正文(`entity-body` island): 名册, ObrasCuadrículay照片Murotres视Imagenen launo. 
 *
 * DatosTodo由壳取bien推进来, aquíSolo挑出当anterior视Imagen画. ObrasCuadrícula按 `revision` 换Clave: 壳每发起uno次Nuevo
 * ObrasPor favor求, esteuno格先铺骨架(`items` Como `null`), Lista回来posterior骨架淡出, 卡片从Difusodentro清晰起来, 
 * 同Directorioeseuno格. 骨架还没到显示门槛就回来, 直continuar落contenido.  */
import { Fragment, useCallback, useMemo, useState } from 'react';

import { CatalogGridPage, LoadMore } from '../catalog-grid/catalog-grid-page';
import { useSkeletonReveal } from '../components/grid-reveal';
import { PAGE_SIZE } from '../index/index-data';
import { PeopleGrid } from '../index/index-people';
import { openPhotoLightbox } from '../photo-lightbox/photo-lightbox-dialog';
import type { LightboxSlide } from '../photo-lightbox/photo-lightbox';
import type {
  EntityBodyProps, EntityCodeSet, EntityPhotos, EntityRoster, EntitySamplePhoto, EntityWallPhoto,
} from './entity-body';

export function EntityBodyPage(props: EntityBodyProps) {
  if (props.view === 'people' && props.roster) return <Roster roster={props.roster} props={props} />;
  if (props.view === 'videos') return <VideoSection key={props.revision} {...props} />;
  if (props.view === 'photos' && props.photos) {
    return <PhotoSection key={props.photos.revision} photos={props.photos} props={props} />;
  }
  return null;
}

/** 名册unopágina摆几格, 同索引página名册unopágina格数.  */
const ROSTER_PAGE = PAGE_SIZE.people;

/** 名册uno格点开进este人(或esteSello)资料página, 取Imagen同索引páginaese回落链. 
 *
 *  名单随资料uno次abajo来, grandeAgenciaConarribamil人; uno次Todo画出来就esarribamilAvatar格 y arribamil次取Imagen. 先摆unopágina, 
 *  余abajo走Obras区同uno"载入更más", 滚到附近自己continuarSiguientepágina.  */
function Roster({ roster, props }: { roster: EntityRoster; props: EntityBodyProps }) {
  const { helpers, actions } = props;
  const cell = useMemo(() => ({ personAvatar: helpers.personAvatar, openEntity: actions.openEntity }),
    [helpers, actions]);
  const [shown, setShown] = useState<number>(ROSTER_PAGE);
  const people = useMemo(() => roster.people.slice(0, shown), [roster.people, shown]);
  const loadMore = useCallback(async () => { setShown((count) => count + ROSTER_PAGE) }, []);
  return (
    <>
      <PeopleGrid kind={roster.kind} items={people} layout={roster.layout} props={cell} />
      {shown < roster.people.length
        ? <LoadMore key={shown} entity load={loadMore} enabled={() => true} />
        : null}
    </>
  );
}

/** Obras区: exterior面esteuno层Solo管"壳还En取"时骨架, Lista到就es卡片Cuadrícula entity Modo, 
 *  No.unopágina由壳给, 续página经 `fetchPage` 取. `[data-entity-grid]` es壳按 Shift 连选排卡片时认eseuno格.  */
function VideoSection(props: EntityBodyProps) {
  const reveal = useSkeletonReveal(!props.items, props.skeletonHtml);
  return (
    <div data-entity-grid="" data-grid-reveal={reveal.fading ? '' : undefined}>
      {reveal.layer}
      {props.items ? (
        <CatalogGridPage mode="entity" entityKey={`${props.kind}:${props.name}`} revision={props.revision}
          initial={props.items} fetchPage={props.fetchPage} listScope={props.listScope} helpers={props.helpers} actions={props.actions}
          layout={props.layout} selectMode={props.selectMode} selected={props.selected}
          seekSeconds={props.seekSeconds} wireDrag={props.wireDrag}
          skeletonHtml={props.skeletonHtml} groupCollapse={props.groupCollapse} canLoadMore={props.canLoadMore} />
      ) : null}
    </div>
  );
}

/** uno部Obras样铺成几格. 数, 站名 y Títuloya随 `/api/photos` abajo来, No再Por favor求uno次.  */
const sampleItems = (set: EntityCodeSet): EntitySamplePhoto[] => Array.from({ length: set.n }, (_, i) => ({
  sample: true, code: set.code, position: i + 1, total: set.n, name: `${set.code} Muestra ${i + 1}`,
  source: set.site_label || 'Muestra oficial',
}));

const isSample = (item: EntityWallPhoto): item is EntitySamplePhoto => (item as EntitySamplePhoto).sample === true;

/** 样地址按Código JAVy序号由服务端查, 缩略Imageny灯箱en lagrandeImagen共用.  */
const sampleQuery = (item: EntitySamplePhoto) => `code=${encodeURIComponent(item.code)}&n=${item.position}`;

/* 缩略Imagenuno律走 `/photo-thumb`(服务端缓存), SoloCon灯箱en lagrandeImagen读OriginalImagen: PikPak es计费来源, uno屏
 * 直continuar铺OriginalImagenetc.于付几diez兆流量. 样走 `/sample-thumb`.  */
const thumbSrc = (item: EntityWallPhoto) => isSample(item)
  ? `/sample-thumb?${sampleQuery(item)}`
  : `/photo-thumb?id=${item.id}`;

/** MuroAnterior格换成灯箱en launo. 本地Imagen片Completo当 asset 递进去, Detalles面板读来源yTamaño, 定读 id.  */
const wallSlide = (item: EntityWallPhoto): LightboxSlide => isSample(item)
  ? { src: `/sample-image?${sampleQuery(item)}`, thumb: thumbSrc(item), name: item.name, asset: null,
    source: item.source }
  : { src: `/photo?id=${item.id}`, thumb: thumbSrc(item), name: item.name || '', asset: item };

/** 照片视Imagen: 名abajo每部ObrasOficial样按Lanzamiento日从Nuevo到antiguouno段uno段铺Enanterior面, 每段uno行段头; 本地Imagen片
 *  eseuno面MuroEnposterior面, SoloCon本地Imagen片时No出段头(ADR-0068). 
 *
 *  uno面通铺瀑布流按列往abajoIntroduce, uno部Imagen会从Anterior列底部continuar到Siguiente列顶部, 逐标Código JAV又太吵; 分段posterior
 *  uno部Solo标uno次. `data-photo-index` esuno格EnCompleto面Muroen la序号, 跨段连续, 点abajo去Completo列交给灯箱, 
 *  灯箱照antiguo跨段连续翻. 翻páginaSolo数本地Imagen片: 样uno次铺完, No走分página.  */
function PhotoSection({ photos, props }: { photos: EntityPhotos; props: EntityBodyProps }) {
  const { photoSize: size, photoLayout: layout, actions, canLoadMore } = props;
  const wall = useMemo(() => [...photos.codeSets.flatMap(sampleItems), ...photos.items], [photos]);
  /* 取No到Imagen格子. 本地Imagen片取No到DescripciónArchivo没, Completo格该走; 样取No到másmedioes来源este会儿No通, 
   * 格子Deja着空底, 序号No断, 灯箱dentro照样翻得到. 两都No改别格子序号.  */
  const [lost, setLost] = useState<ReadonlySet<number>>(() => new Set());
  const lose = useCallback((index: number) => setLost((prev) => {
    if (prev.has(index)) return prev;
    const next = new Set(prev);
    next.add(index);
    return next;
  }), []);
  const open = useCallback((index: number) => {
    void openPhotoLightbox(index, wall.map(wallSlide), { revealSource: actions.revealSource });
  }, [actions, wall]);
  const cell = (item: EntityWallPhoto, index: number) => (
    <PhotoCell key={index} item={item} index={index} lost={lost.has(index)} onLose={lose} onOpen={open} />
  );
  const wallAttrs = { 'data-photo-wall': '', 'data-size': size, 'data-layout': layout };
  let start = 0;
  const groups = photos.codeSets.map((set) => {
    const from = start;
    start += set.n;
    return { set, from };
  });
  const localStart = start;
  return (
    <>
      {groups.map(({ set, from }) => (
        <Fragment key={set.code}>
          <GroupHead label={set.code} title={set.name}
            meta={[`${set.site_label || 'Oficial'} Muestra`, set.release_date, `${set.n.toLocaleString()}  imagen(es)`].filter(Boolean).join(' · ')} />
          <div {...wallAttrs}>{wall.slice(from, from + set.n).map((item, i) => cell(item, from + i))}</div>
        </Fragment>
      ))}
      {groups.length && photos.total ? <GroupHead label="Imagen local" meta={`${photos.total.toLocaleString()}  imagen(es)`} /> : null}
      <div {...wallAttrs} data-local-wall="">
        {photos.items.map((item, i) => (lost.has(localStart + i) ? null : cell(item, localStart + i)))}
      </div>
      {photos.hasMore ? (
        <LoadMore key={photos.items.length} entity load={actions.loadMorePhotos}
          enabled={() => canLoadMore?.() !== false} />
      ) : null}
    </>
  );
}

/** 段头uno行: Código JAV, Título y derecha端"来源 样 · Lanzamiento日 · 数". Título过largo尾部省略, Todo名En title dentro.  */
function GroupHead({ label, title, meta }: { label: string; title?: string; meta: string }) {
  return (
    <div data-photo-group="">
      <b>{label}</b>
      {title ? <span data-photo-group-title="" title={title}>{title}</span> : null}
      <span data-photo-group-meta="">{meta}</span>
    </div>
  );
}

/** uno格. Imagen还没到时esuno `--sunk` 空底, Noesuno行Archivo名: `alt` Deja给读屏, 字色En样dentro调成透明.  */
function PhotoCell({ item, index, lost, onLose, onOpen }: {
  item: EntityWallPhoto; index: number; lost: boolean; onLose(index: number): void; onOpen(index: number): void;
}) {
  const name = item.name ?? '';
  return (
    <button type="button" data-photo-cell="" data-photo-index={index} title={name} onClick={() => onOpen(index)}>
      {lost ? null : (
        <img src={thumbSrc(item)} alt={name} loading="lazy" decoding="async" fetchPriority="low"
          onError={() => onLose(index)} />
      )}
    </button>
  );
}
