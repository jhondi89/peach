/* 实体资料página(路由树画进 `#index`, `managed-routes.tsx`  `ENTITY_ROUTES`): 资料卡, Filtrar浮层, Nuevas obraseseuno行y正文, uno棵根, cuatro宿主. 
 *
 * 资料卡画En壳交出宿主dentro(`[data-entity-hero]` eseuno格), 浮层, Nuevas obrasy正文经 portal 画进壳排bien另exteriortres: 浮层
 * 吸顶要它父元素就es `#index`, Nuevas obraseseuno行es遗Deja层卡片, No进 React 子树样Rango, 所以cuatro各
 * 守自己宿主. páginainteriorEstado都Enaquí: 当anterior视Imagen, 名册还esObras, 照片MuroSemillay翻página; Filtrary媒体视Imagen读
 * 地址栏(壳推进来 `filters`/`media`), 改它们Solo调 `actions.route`.  */
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@peach/legacy/core';
import { tagLabel } from '@peach/legacy/tags';
import { confirmModal } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';

import { errorMessage } from '../../api';
import type { MediaCardLayout } from '../catalog-grid/types';
import { EmptyState } from '../components/empty-state';
import { RetryNote } from '../components/grid-reveal';
import { spriteGlyph } from '../components/sprite-glyph';
import type { EntityBodyActions, EntityPhotos, EntityRoster } from '../entity-body/entity-body';
import { EntityBodyPage } from '../entity-body/entity-body-page';
import { EntityOnline } from '../entity-body/entity-online';
import type {
  EntityFilterActions, EntityFilterHelpers, EntityFilterTag, EntityPhotoHead, EntityVideoHead, EntityView, EntityViewKeys,
} from '../entity-filter/entity-filter';
import { EntityFilterPage } from '../entity-filter/entity-filter-page';
import type { EntityHeroActions, EntityHeroHelpers } from '../entity-hero/entity-hero';
import { EntityHeroPage } from '../entity-hero/entity-hero-page';
import { feedNewKey, feedNewOptions, postFeedAction } from '../feed-new/feed-new';
import { queryClient } from '../query';
import {
  EMPTY_MEDIA, codeSetsOf, entityKey, entityOptions, entityPhotosKey, fetchItems, itemsOptions,
  photosOptions, tagList, tagPressed, type EntityPageData, type EntityPageProps, type PhotoPage,
} from './entity-page';
import { useEntityOnline } from './use-entity-online';

export function EntityPage(props: EntityPageProps) {
  const { kind, name } = props;
  const entity = useQuery(entityOptions(kind, name));
  /* 名字对Noarriba任何uno时 `/api/entity` 回 `{error}`: Completo换成壳dentroeseuno屏空态, 骨架NoDeja着闪. 空态es
     遗Deja层Etiqueta, No放进 React 子树样Rango.  */
  const missing = !!entity.data?.error;
  const canonical = entity.data?.canonical_name;
  const redirect = entity.data?.redirect ?? (canonical && canonical !== name ? { kind, name: canonical } : undefined);
  const { actions } = props;
  useLayoutEffect(() => { if (missing) actions.missing() }, [actions, missing]);
  /* 换到Normalizar资料página排到微Tareadentro: 壳换página会pesado排página头y选en proceso态, eseuno路puede能走到批量 `flushSync`, 
     提交阶段dentro它画No出来. esteuno代ya卸abajo就No换.  */
  useLayoutEffect(() => {
    if (!redirect) return;
    let live = true;
    queueMicrotask(() => { if (live) actions.openEntity(redirect.kind, redirect.name, true) });
    return () => { live = false };
  }, [actions, redirect?.kind, redirect?.name]);
  if (entity.isError) return <RetryNote message={errorMessage(entity.error)} onRetry={() => { void entity.refetch() }} />;
  if (!entity.data || missing || redirect) return null;
  return <EntityLoaded {...props} entity={entity.data} />;
}

/** Claveuno变就加uno代次: ObrasCuadrículay照片Muro按它换Clave, 骨架y续página都从头Empezar.  */
function useRevision(key: string): number {
  const [seen, setSeen] = useState({ key, n: 1 });
  if (seen.key === key) return seen.n;
  const next = { key, n: seen.n + 1 };
  setSeen(next);
  return next.n;
}

const newSeed = () => String(((Date.now() ^ (Math.random() * 1e9 | 0)) >>> 0) % 99991);

/** 照片uno屏读数: 本地Imagen片y样各数各; SoloCon样时No写"0 ".  */
function photoReadout(page: PhotoPage, codeSets: number) {
  return `Foto · ${[
    page.total || !codeSets ? `${(page.total || 0).toLocaleString()}  imagen(es)` : '',
    codeSets ? `Muestra ${(page.sample_total || 0).toLocaleString()}  imagen(es) · ${codeSets.toLocaleString()}  obra(s)` : '',
  ].filter(Boolean).join(' · ')}`;
}

function EntityLoaded(props: EntityPageProps & { entity: EntityPageData }) {
  const { kind, name, entity, filters, media, helpers, actions, hosts } = props;
  const company = kind === 'agency' || kind === 'studio';
  /* Agencia名abajoeste批人No摆En资料卡底ese排pequeño圆Avatardentro: esees"同艺人", uno附注; 名册esesteunopágina
     正文. 片商página名册es旗abajo label, 同艺人ese排照antiguoDejaEn卡底.  */
  const roster = kind === 'agency' ? (entity.related_performers || []) : kind === 'studio' ? (entity.labels || []) : [];
  const entityId = Number(entity.id) || 0;

  /* ── 照片: Completo组eseuno数出照片档Con几, 出No出; Muro读es当anterioresteuno组(Completo组或unoImagen集).  ── */
  const base = useInfiniteQuery(photosOptions(kind, name, 0, ''));
  const basePage = base.data?.pages[0];
  const basePhotos = basePage && !basePage.error ? basePage : null;
  const photoCount = basePhotos ? (basePhotos.total || 0) + (basePhotos.sample_total || 0) : 0;
  const photosAvailable = (basePhotos?.total || 0) > 0 || codeSetsOf(basePhotos).length > 0;
  /* 关注dentro绑Eneste名abajo来源(ADR-0096): Con就másunoEn线视Imagen. 本地uno部视频都Sin时Obras视Imagenes空, 
     视频ClaveNo出, 进página就落EnEn线.  */
  const followKey = kind === 'creator' ? entity.follow?.key || '' : '';
  const onlineOnly = !!followKey && !entity.asset_count;
  const mediaNow = media.media === 'photos' && photosAvailable ? media
    : (media.media === 'online' || onlineOnly) && followKey ? { media: 'online' as const, set: 0 } : EMPTY_MEDIA;

  /* 名册y媒体No共用地址栏: 地址栏Solo认 `media`, 名册esAgenciapáginay片商páginaPredeterminado视Imagen, 进página就Enesedentro. 
     换Filtrar就回到Obras: EtiquetaesObrasFiltrar, DejaEn名册dentro既No生效, Etiqueta也会自相矛盾.  */
  const [rosterView, setRosterView] = useState<'people' | 'videos'>('people');
  const filterKey = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const [seenFilters, setSeenFilters] = useState(filterKey);
  if (seenFilters !== filterKey) {
    setSeenFilters(filterKey);
    setRosterView('videos');
  }
  const view: EntityView = company && rosterView === 'people' && roster.length ? 'people' : mediaNow.media;

  /* ── En线: Filtrary取数同关注página, Solo按este作者Clave筛 ── */
  const online = useEntityOnline(followKey, view === 'online', {
    photoLayout: props.photoLayout, photoLayouts: props.photoLayouts, imagesOnly: props.followImagesOnly,
    setImagesOnly: props.follow.actions.setImagesOnly,
  });
  const photoWall = view === 'photos' || (view === 'online' && online.media === 'images');

  /* 换过几次Avatar. 资料卡yObrasCuadrícula都Imagen拼进自己Estado(CuadrículaSoloEn代次变时才按NuevoNo.unopágina
     pesado建), pesado取到NuevoDatos还No够, 得换Clavepesado建, NuevoImagen地址en laVersión才落得到página面arriba.  */
  const [avatarEpoch, setAvatarEpoch] = useState(0);

  /* ── Obras ── */
  const itemsQuery = itemsOptions(props);
  const items = useQuery(itemsQuery);
  const itemsRevision = useRevision(JSON.stringify([itemsQuery.queryKey, avatarEpoch]));
  /* 直达或Actualizar资料página时 URL Sin `jav=1`: 以No.unopáginaObras真实 `is_jav` RestaurarActriz/Sello语境, 版开关
     NoesSoloEn从 JAV primeropágina点进来时才偶然存En. Solover进páginaeseuno, páginainterior换FiltrarNo改语境.  */
  const [javPage] = useState(() => (kind === 'performer' || kind === 'studio')
    && (props.jav || (items.data?.items || []).some((item) => item.is_jav)));
  useLayoutEffect(() => { actions.javContext(javPage) }, [actions, javPage]);
  const layout = useMemo<MediaCardLayout>(() => (props.layout.active === javPage ? props.layout
    : { ...props.layout, active: javPage }), [props.layout, javPage]);
  const opts = { jav: props.jav, seed: props.seed };
  const fetchPage = useCallback(
    (offset: number, signal: AbortSignal, options?: Parameters<typeof fetchItems>[6]) =>
      fetchItems(kind, name, filters, opts, offset, signal, options),
    // 续página口径就esNo.unopáginaeseuno: 代次随Clave变, Clavedentroya经带着Filtrar, Semillay JAV 开关. 
    [itemsRevision]);

  /* ── 照片Muro ── */
  const [seeds, setSeeds] = useState<Record<number, string>>({});
  const wallSet = mediaNow.set;
  const wallSeed = seeds[wallSet] || '';
  const wall = useInfiniteQuery({ ...photosOptions(kind, name, wallSet, wallSeed), enabled: view === 'photos' });
  const wallPage = wall.data?.pages[0];
  const wallRevision = useRevision(JSON.stringify(entityPhotosKey(kind, name, wallSet, wallSeed)));
  const photos = useMemo<EntityPhotos | null>(() => {
    const pages = wall.data?.pages;
    if (!pages?.[0] || pages[0].error) return null;
    const first = pages[0];
    return {
      revision: wallRevision,
      codeSets: first.id ? [] : codeSetsOf(first),
      items: pages.flatMap((page) => page.items || []),
      total: first.total || 0,
      hasMore: !!pages[pages.length - 1]?.has_more,
    };
  }, [wall.data, wallRevision]);
  const wallRefetch = wall.refetch;
  const fetchNextPhotos = wall.fetchNextPage;

  /* ── Nuevas obras ── */
  const feed = useQuery({ ...feedNewOptions(entityId, helpers.feedRowHtml), enabled: !!entityId });
  const feedRevision = useRef(props.feedRevision);
  useEffect(() => {
    if (feedRevision.current === props.feedRevision) return;
    feedRevision.current = props.feedRevision;
    void queryClient.invalidateQueries({ queryKey: feedNewKey(entityId) });
  }, [entityId, props.feedRevision]);

  /* 换视Imagen, 换uno批contenido之posterior吸顶要pesado算uno次.  */
  const hasItems = !!items.data;
  useEffect(() => { actions.painted(view, photoWall) },
    [actions, view, photoWall, itemsRevision, photos?.revision, hasItems, online.key]);

  /* ── 写操作 ── */
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false }, []);
  const refreshEntity = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['entity-route'] });
    await queryClient.invalidateQueries({ queryKey: entityKey(kind, name) });
    await queryClient.invalidateQueries({ queryKey: ['entity-items', kind, name] });
  }, [kind, name]);
  const alias = useMutation({
    mutationFn: (payload: { alias: string; remove?: boolean }) => api('/api/entity-alias',
      { method: 'POST', body: JSON.stringify({ kind, name: entity.canonical_name, ...payload }) }) as Promise<{ added?: boolean; alias?: string }>,
    onSuccess: () => refreshEntity(),
  });
  const rename = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) => api('/api/entity-name',
      { method: 'POST', body: JSON.stringify({ kind, name: from, canonical: to }) }) as Promise<{
        changed?: boolean; canonical_name?: string; previous_name?: string }>,
    onSuccess: () => refreshEntity(),
  });
  const follow = useMutation({
    mutationFn: (on: boolean) => api('/api/feeds/source',
      { method: 'POST', body: JSON.stringify({ action: 'follow', entity_id: entityId, enabled: on }) }),
    onSuccess: (_data, on) => queryClient.setQueryData<EntityPageData>(entityKey(kind, name),
      (current) => (current ? { ...current, feed: { ...current.feed, following: on } } : current)),
  });

  const bindFollow = useMutation({
    mutationFn: (key: string) => api('/api/follow/creator',
      { method: 'POST', body: JSON.stringify({ entity_id: entityId, key }) }),
  });

  const heroActions = useMemo<EntityHeroActions>(() => ({
    openEntity: actions.openEntity,
    /* 换统称要pesado写Completo实体扁平投影, 先代价说清再问. ConfirmarClave, Título y Éxito回执共用"更改统称"esteuno
       动词; 写入Fallo时弹层DejaEnOriginal地, Original因写En正文abajo方etc.Reintentar. 地址换成Nuevo名字, 由壳pesado进esteunopágina.  */
    chooseName: (chosen) => {
      const current = entity.canonical_name;
      if (chosen === current) return;
      void confirmModal({
        title: 'Cambiar nombre general',
        body: `"${chosen}"将成Comoeste档案MostrarNombre, "${current}"Deja作Alias. Obraen la署名, Buscar y Etiqueta都会跟着改写. `,
        confirmLabel: 'Cambiar nombre general',
        onConfirm: () => rename.mutateAsync({ from: current, to: chosen }),
      }).then(({ confirmed, result }) => {
        const done = result as { changed?: boolean; canonical_name?: string; previous_name?: string } | undefined;
        if (!confirmed || !done?.changed) return;
        helpers.receipt(`Ya统称更改Como ${done.canonical_name}`, { undo: async () => {
          await rename.mutateAsync({ from: done.canonical_name || '', to: done.previous_name || '' });
          actions.openEntity(kind, done.previous_name || '');
        } });
        actions.openEntity(kind, done.canonical_name || '');
      });
    },
    addAlias: () => { void helpers.aliasForm(entity.user_aliases || [], (payload) => alias.mutateAsync(payload)) },
    follow: async (on) => {
      try {
        await follow.mutateAsync(on);
      } catch (error) {
        helpers.failure(on ? 'Suscribirse a nuevas obras' : 'CancelarSuscribirse a nuevas obras', error);
        throw error;
      }
    },
    /* "订阅Nuevas obras"Abrir时服务端当场Enposterior拉uno轮: etc.eseuno轮跑完再Nuevas obraseseuno行pesado取uno次. etc.arriba限es
       eseuno轮自己Duración量级, página面换走就No再etc..  */
    refreshFeedAfterCheck: () => {
      void (async () => {
        for (let tries = 0; tries < 40 && alive.current; tries += 1) {
          await new Promise((resolve) => { setTimeout(resolve, 3000) });
          const job = await (api('/api/feeds/check') as Promise<{ status?: string }>).catch(() => null);
          if (!job || job.status !== 'running') break;
        }
        if (alive.current) await queryClient.invalidateQueries({ queryKey: feedNewKey(entityId) });
      })();
    },
    feedAction: postFeedAction,
    /* 圆框角arribaese加号: Avatar索引En服务端ya经换过. 资料yObrasListauno起pesado取(Obras卡署名dentro也es
       este脸), 回来posterior资料卡yObrasCuadrícula都按NuevoDatospesado建; 壳缓存着顶部tres也unoy作废.  */
    avatarPicked: () => {
      actions.avatarChanged();
      void refreshEntity().then(() => {
        if (alive.current) setAvatarEpoch((epoch) => epoch + 1);
      });
    },
    /* 资料卡ese句"N 项Actualizar": este名abajo就EnesteunopáginaEn线视Imagendentro, No离开; 别作者Clave才去关注página.  */
    openFollowAuthor: (key) => {
      if (key && key === followKey) actions.route(filters, { media: 'online', set: 0 });
      else actions.openFollowAuthor(key);
    },
    /* 认过之posteriorese组来源Actualizar都记到este名abajo: 资料pesado取, 读数ySugerencia跟着换.  */
    confirmFollowAuthor: async (key, author) => {
      try {
        await bindFollow.mutateAsync(key);
      } catch (error) {
        helpers.failure('VincularSeguir作者', error);
        throw error;
      }
      helpers.receipt(`YaSeguiren la ${author} 记到 ${entity.canonical_name} 名abajo`);
      await refreshEntity();
    },
  }), [actions, alias, bindFollow, entity, entityId, filters, follow, followKey, helpers, kind, name, refreshEntity, rename]);
  const heroHelpers = useMemo<EntityHeroHelpers>(() => ({
    portraitImg: () => helpers.portraitImg(kind, entity),
    wireScroller: helpers.wireDrag,
    wireFeedRow: helpers.wireFeedRow,
    receipt: helpers.receipt,
  }), [entity, helpers, kind]);

  /* ── 浮层 ── */
  const filterActions = useMemo<EntityFilterActions>(() => ({
    /* 按abajo去eseunoabajo视ImagenClave就换过去, 玻璃跟着滑, Noetc.换视Imagen活干完.  */
    setView: (next) => {
      if (next === view && !mediaNow.set) return;
      setRosterView(next === 'people' ? 'people' : 'videos');
      actions.route(filters, next === 'photos' || next === 'online' ? { media: next, set: 0 } : EMPTY_MEDIA);
    },
    setState: (value) => actions.route({ ...filters, state: value }, EMPTY_MEDIA),
    toggleTag: actions.toggleTag,
    clearFilter: actions.clearFilter,
    clearAll: actions.clearAll,
    setSort: actions.setSort,
    /* 换uno批: 照片换uno粒Semillaesteuno屏pesado排uno遍, Completo组或单Imagen集都es, NuevoMuro取回来再换arriba, etc.esteunoabajo
       Clavearriba转圈; Obraseseuno粒esTodo站Semilla, 交给壳.  */
    reshuffle: async () => {
      if (view !== 'photos') {
        const seed = actions.reshuffleVideos();
        const next = itemsOptions({ kind, name, filters: { ...filters, sort: 'seed' }, jav: props.jav, seed,
          revision: props.revision });
        await queryClient.fetchQuery(next).catch(() => null);
        return;
      }
      const seed = newSeed();
      const next = await queryClient.fetchInfiniteQuery(photosOptions(kind, name, wallSet, seed)).catch(() => null);
      if (!alive.current || !next?.pages[0] || next.pages[0].error) return;
      setSeeds((current) => ({ ...current, [wallSet]: seed }));
    },
    setJavLayout: actions.setJavLayout,
    setPhotoLayout: actions.setPhotoLayout,
    photoBack: () => actions.route(filters, { media: 'photos', set: 0 }),
    ...online.actions,
  }), [actions, filters, kind, mediaNow.set, name, online.actions, props.jav, props.revision, view, wallSet]);
  const filterHelpers = useMemo<EntityFilterHelpers>(() => ({
    wireDrag: helpers.wireDrag,
    wireScroller: helpers.wireScroller,
    sourceToolsHtml: helpers.sourceToolsHtml,
    wireSourceTools: (root) => helpers.wireSourceTools(root, () => { void wallRefetch() }),
  }), [helpers, wallRefetch]);

  /* Etiqueta按资料en la顺序摆, 选en procesoNo往anterior挪: 刚点ese就En指针底abajo, esteunoabajo它抽走反倒es替人决定
     现En该ver哪儿. 数eseste人/Sello名abajo带esteEtiqueta视频.  */
  const tags: EntityFilterTag[] = (entity.tags || []).map((tag) => ({
    k: tag.k, label: tagLabel(tag.k), n: tag.n, selected: tagPressed(filters.tag, tag.k) }));
  /* 艺人名册, 视频, 照片yEn线esesteunopágina互斥视Imagen, 共用uno组圆Clave; SoloConuno类东西时No出esteuno组.  */
  const viewKinds = [roster.length, !onlineOnly, photoCount, followKey].filter(Boolean).length;
  const views: EntityViewKeys | null = viewKinds > 1 ? {
    label: roster.length ? 'Vista de página' : 'Tipo de medio',
    people: roster.length ? { label: kind === 'studio' ? 'Sello' : 'Actriz', count: roster.length,
      icon: kind === 'studio' ? 'clapperboard' : 'user-round' } : null,
    videos: onlineOnly ? null : { count: entity.asset_count || 0 },
    photos: photoCount ? { count: photoCount } : null,
    online: followKey ? { count: entity.follow?.n || 0 } : null,
  } : null;
  const video: EntityVideoHead = {
    sorts: helpers.sortKeys(filters.sort || 'new', filters.dir || '', javPage),
    jav: javPage ? { layout: props.javLayout, options: props.javLayouts } : null,
  };
  /* 照片esteuno排No给OrdenarClave: DatosBibliotecadentroImagen片SoloConArchivo名, 体积 y 来源tres样. EnunoImagen集dentromás两源ArchivoClave.  */
  const inSet = !!wallPage?.id && !wallPage.error;
  const photo: EntityPhotoHead | null = wallPage && !wallPage.error ? {
    back: inSet, shuffle: !!wallPage.total, layout: props.photoLayout, layouts: props.photoLayouts,
    setId: inSet ? Number(wallPage.id) : 0,
  } : null;
  /* 名Siguiente部Obras都Sin(或筛完uno部No剩)时正文es空态, abajo排ese排OrdenarClavey换uno批Sin东西puede排, No出.  */
  const combo = helpers.comboItems(filters);
  const filtered = combo.length > 0 || !!filters.state;
  const worksEmpty = view === 'videos' && !!items.data && !(items.data.items || []).length;
  const showAll = () => actions.route(
    // Clave名y壳 `clearAll` 同uno组, exterior加观verEstado. 
    { ...filters, state: '', tag: '', creator: '', studio: '', owner: '' }, EMPTY_MEDIA);
  let readout = '';
  let busy = false;
  if (view === 'people') readout = `${kind === 'studio' ? 'Sello' : 'Actriz'} · ${roster.length.toLocaleString()}`;
  else if (view === 'online') {
    busy = online.busy;
    readout = `En línea · ${(online.total ?? entity.follow?.n ?? 0).toLocaleString()}  actualización(es)`;
  }
  else if (view === 'videos') {
    busy = !items.data;
    /* 选哪几Etiqueta由arriba面ese交集unouno列着, 读数Solo报数: Etiqueta名再列uno遍, 几largoEtiqueta
       就能esteuno行撑出página面.  */
    const picked = tagList(filters.tag).length;
    readout = `Videos · ${(items.data?.work_total ?? items.data?.total ?? 0).toLocaleString()}${picked ? ` · Ya选 ${picked.toLocaleString()} Etiqueta` : ''}`;
  } else if (wallPage && !wallPage.error) {
    readout = inSet ? `${wallPage.title} · ${(wallPage.total || 0).toLocaleString()}  imagen(es)`
      : photoReadout(wallPage, codeSetsOf(wallPage).length);
  } else busy = wall.isPending;

  /* ── 正文 ── */
  const bodyActions = useMemo<EntityBodyActions>(() => ({
    ...props.card.actions,
    /* 本地Imagen片Siguientepágina; 取No到就抛错, Claveabajo出Reintentar.  */
    loadMorePhotos: async () => {
      const result = await fetchNextPhotos();
      if (result.isError) throw result.error;
    },
  }), [fetchNextPhotos, props.card.actions]);
  const rosterProps = useMemo<EntityRoster | null>(() => (roster.length
    ? { kind: kind === 'studio' ? 'studios' : 'performers', people: roster, layout: props.peopleLayout } : null),
  [kind, props.peopleLayout, roster]);

  return (
    <>
      <EntityHeroPage key={avatarEpoch} kind={kind} name={name} entity={entity} feedNew={feed.data ?? null}
        feedHost={entityId ? hosts.feed : null} jav={javPage} actions={heroActions} helpers={heroHelpers} />
      {createPortal(
        <EntityFilterPage kind={kind} name={name} view={view} views={views} state={filters.state || ''}
          states={props.states} tags={tags} combo={combo} readout={readout} busy={busy}
          video={worksEmpty ? null : video} photo={photo} online={view === 'online' ? online.head : null} actions={filterActions}
          helpers={filterHelpers} />,
        hosts.filter)}
      {createPortal(
        view === 'online'
          ? <EntityOnline key={online.key} view={online.view} media={online.media} result={online.result}
            data={online.data} visible={online.visible} context={online.context} photoSize={props.photoSize}
            photoLayout={props.photoLayout} imagesOnly={props.followImagesOnly} helpers={props.follow.helpers}
            actions={props.follow.actions} canLoadMore={props.canLoadMore} />
          : view === 'videos' && items.isError
          ? <RetryNote message={errorMessage(items.error)} onRetry={() => { void items.refetch() }} />
          : worksEmpty ? <WorksEmpty filtered={filtered} onShowAll={showAll} />
          : (
            <EntityBodyPage kind={kind} name={name} view={view} roster={rosterProps} items={items.data ?? null}
              revision={itemsRevision} fetchPage={fetchPage}
              listScope={JSON.stringify([kind, name, filters, props.jav, filters.sort === 'seed' ? props.seed : ''])}
              photos={photos} photoSize={props.photoSize}
              photoLayout={props.photoLayout} helpers={props.card.helpers} actions={bodyActions} layout={layout}
              selectMode={props.selectMode} selected={props.selected} seekSeconds={props.seekSeconds}
              wireDrag={props.wireDrag} skeletonHtml={props.skeletonHtml} groupCollapse={props.groupCollapse}
              canLoadMore={props.canLoadMore} />
          ),
        hosts.body)}
    </>
  );
}

/** Obras区uno部也Sin. 筛完uno部No剩时给uno回到Todo视频路: 观verEstadoy交集en laFiltraruno起撤掉.  */
function WorksEmpty({ filtered, onShowAll }: { filtered: boolean; onShowAll(): void }) {
  return filtered ? (
    <EmptyState icon={spriteGlyph('search')} title="Sinque cumple los criterios de resultado deVideos"
      actions={<Button variant="secondary" onClick={onShowAll}>verTodoVideos</Button>}>
      BorrarFiltrarposteriorver名abajoTodo视频. 
    </EmptyState>
  ) : (
    <EmptyState icon={spriteGlyph('film')} title="Sin videos todavía">
      署arribaeste名字视频入Bibliotecaposterior会显示Enaquí. 
    </EmptyState>
  );
}
