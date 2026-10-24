/* ObrasDetalles(ADR-0031): 舞dentroeseunoCompleto—Reproducir区, derecha侧Cola, 侧栏yabajo方"Continuar viendo". 
 *
 * 舞(`<dialog id="stage">`), 它进出场, pequeño窗y Video.js 都归舞岛(`../stage/`), 关注Detalles
 * 也En用; aquíSolo画舞en lacontenido, Reproducir区媒体框画bien之posterior经 `actions.mountPlayer` 交给舞挂ReproducirDispositivo. 
 * 点身, Etiqueta, 地区回Lista或资料página, Coladentro换uno, 都经壳: 地址y顶栏arribaabajo文要换. Coladentro换时舞
 * Original地换contenido, 浮窗Nopesado开. 
 *
 * 写操作(Puntuación, Etiqueta, Comentarios, 稍posteriorver, alto清目标, 偏bien, ReproducirListaOrdenary移出)都En岛dentro发, Éxitoposterior
 * 服务端回ese几字段换进 `['item', id]`, DirectorioCuadrícula缓存en la同uno卡uno起换, Nopesado读Lista.  */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fmtDur, fmtSize, icon, requestErrorMessage } from '@peach/legacy/core';
import {
  coverUrl, mixLabel, performerLabel, queueAvatarHtml, queueThumbHtml,
} from '@peach/card-art';
import { confirmModal, dismissMenu, presentMenu, spinnerHtml } from '@peach/legacy/ui';

import { apiGet, apiSend } from '../../api';
import { Button } from '@/components/base/buttons/button';
import { RiArrowDownSLine } from '@remixicon/react';
import { CatalogGridPage } from '../catalog-grid/catalog-grid-page';
import { patchCatalogItems, replaceCatalogItem } from '../catalog-grid/catalog-grid';
import type { MediaItem } from '../catalog-grid/types';
import { RetryNote } from '../components/grid-reveal';
import { MixQueue, MixQueueRow } from '../components/mix-queue';
import { RelatedSection } from '../components/related-section';
import { DetailContinuation } from '../components/detail-continuation';
import { IdentityCell, IdentitySeries } from '../components/identity-cell';
import { useFoldedTitle } from '../components/folded-title';
import { MediaCarousel } from '../components/media-carousel';
import { CatalogPicture } from './catalog-picture';
import { fetchJavDetail, javDetailKey } from '../jav-detail/jav-detail';
import { busyProps } from '../settings/use-action';
import { ExternalPlayback } from './external-playback';
import { CoverCrop } from '../cover-crop/cover-crop-page';
import { queryClient } from '../query';
import { LibraryCompletionPrompt, missingPreviewIds } from '../library-processing/library-completion';
import {
  CAST_SHOWN, EDITION_TONE, FEEDBACK_URL, ITEM_TAG_URL, PLAYLIST_URL, PREFERENCE_URL, QUALITY_GOAL_URL,
  RELATED_URL, WATCH_LATER_URL, chooseItem, clampRating, detailTags, feedbackReceipt, fetchItem, fetchQueue,
  hasTag, identityGroups, isVanished, itemKey, mediaGate, movedOrder, nextPart, nextRating, partLabel, partLabelHtml, pickerSections, playlistQueue,
  queueCopy, queueKey, ratingStars, ratingText, realWatched, recentTags, relatedKey, rememberTag, sameOrder,
  withPartLabel, withTag, withoutTag,
  type DetailEntityRef, type DetailItem, type DetailQueue, type DetailTag, type ItemDetailActions,
  type ItemDetailHelpers, type ItemDetailProps, type MediaGate, type PlaylistPayload, type TagCount,
} from './item-detail';

/** 字形Original样取壳eseuno `icon()`: 骨架y遗DejaDetalles画就es它, 换成别字形continuar管eseuno拍会跳.  */
const Glyph = ({ name }: { name: string }) => (
  <span className="contents" dangerouslySetInnerHTML={{ __html: icon(name) }} />
);
const Html = ({ html }: { html: string }) => <span className="contents" dangerouslySetInnerHTML={{ __html: html }} />;

/** ArchivoTamaño: 没记abajo或记成 0 写"Tamaño desconocido", 同卡片arribaeseuno格.  */
const sizeText = (size: unknown) => (Number(size) > 0 ? fmtSize(Number(size)) : 'Tamaño desconocido');

export function ItemDetailPage(props: ItemDetailProps) {
  const { queue: ref, actions } = props;
  const queueResult = useQuery({
    queryKey: ref ? queueKey(ref) : ['item-queue', 'none'],
    queryFn: ({ signal }) => fetchQueue(ref!, props.helpers, signal),
    enabled: !!ref,
  });
  const queue = ref ? queueResult.data || null : null;
  const id = queue ? chooseItem(queue, props.id) : ref ? null : props.id;
  const result = useQuery({
    queryKey: itemKey(id ?? 0),
    queryFn: ({ signal }) => fetchItem(id!, signal),
    enabled: id != null,
  });
  if (!result.data || (ref && !queue)) {
    const error = result.error || queueResult.error;
    return (
      <div data-stage-grid="" data-item-detail="">
        <div data-stage-media="" data-item-media="none">
          <CloseStage onClose={actions.close} />
          <div data-item-placeholder="">
            {error ? <RetryNote message={requestErrorMessage(error)}
              onRetry={() => { if (queueResult.error) void queueResult.refetch(); if (result.error) void result.refetch() }} /> : null}
          </div>
        </div>
      </div>
    );
  }
  return <Detail key={result.data.id} {...props} item={withPartLabel(result.data, queue)} queue={queue} />;
}

/** CerrarClave. `id` Deja着: Escape, 点浮窗exterior面y壳兜底都按 `#closeStage` 找它再点unoabajo.  */
const CloseStage = ({ onClose }: { onClose(): void }) => (
  <button type="button" data-stage-close="" id="closeStage" title="Desactivar" aria-label="Desactivar" onClick={onClose}
    dangerouslySetInnerHTML={{ __html: icon('x') }} />
);

function Detail(props: ItemDetailProps & { item: DetailItem; queue: DetailQueue | null }) {
  const { item, queue, actions, helpers } = props;
  const write = useDetailWrite(item, actions, helpers.tagLabel);

  /* 画出来es哪unoSolo报uno次: 写完换进来es同unoNuevo对象, No能因此pesado推地址, pesado画顶栏.  */
  const presented = useRef(item);
  useLayoutEffect(() => { actions.present(presented.current, queue) }, [actions]);
  /* ReproducirLista记abajo续播Ubicación: 每Abriruno报uno次, FalloNo打扰(abajo次Abrir照antiguo从记abajoeseunoEmpezar).  */
  useEffect(() => {
    if (queue?.kind !== 'playlist') return;
    apiSend(PLAYLIST_URL, { action: 'progress', id: queue.playlistId, asset_id: item.id }).catch(() => {});
  }, []);

  const gate = mediaGate(item, helpers.sourceOffline(item.location || ''));
  const next = nextPart(queue, item.id);
  const continuePart = () => {
    if (next && queue) actions.openQueueItem({ kind: queue.kind, seedId: queue.seedId, autoplay: true }, next.id);
  };
  return (
    <>
      <div data-stage-grid="" data-with-queue={queue ? '' : undefined} data-item-detail="">
        <MediaFrame item={item} gate={gate} helpers={helpers} actions={actions}
          autoplay={props.queue?.autoplay} onEnded={continuePart} />
        <Side item={item} queue={queue} write={write} helpers={helpers} actions={actions} />
      </div>
      <DetailContinuation editionCards={queue?.kind === 'editions' ? queue.items.length : undefined}
        queue={queue ? <Queue queue={queue} itemId={item.id} helpers={helpers} actions={actions} /> : null}>
        {props.relatedLimit > 0 && (!queue || queue.kind === 'parts' || queue.kind === 'editions')
          ? <Related {...props} item={queue ? { ...item, id: queue.seedId ?? item.id } : item} /> : null}
      </DetailContinuation>
    </>
  );
}

/* ── Reproducir区 ── */

function MediaFrame({ item, gate, helpers, actions, autoplay, onEnded }: {
  item: DetailItem; gate: MediaGate; helpers: ItemDetailHelpers; actions: ItemDetailActions;
  autoplay?: boolean; onEnded(): void;
}) {
  /* 计费来源先挡uno层Descripción, 点才拉流; 没挂载yEn线拦截ese两No挂ReproducirDispositivo.  */
  const [started, setStarted] = useState<'auto' | 'clicked' | ''>(gate ? '' : 'auto');
  /* ReproducirDispositivo挂Eneste框dentro, `<video>` 由舞建: Video.js 会它包进自己 div, 从pequeño窗展开回来时
     Completo实例还要搬进来, eseuno截 DOM No归 React.  */
  const frameRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState(-2);
  const refreshSamples = useRef(false);
  const source = useQuery({ queryKey: javDetailKey(item.code || ''),
    queryFn: ({ signal }) => {
      const refresh = refreshSamples.current;
      refreshSamples.current = false;
      return fetchJavDetail(item.code!, signal, refresh);
    }, staleTime: 6 * 3600_000,
    enabled: !!item.is_jav && !!item.code && !item.sample_images?.length });
  const samples = item.sample_images?.length ? item.sample_images.map(sample => ({ index: sample.n, source: false }))
    : Array.from({ length: Math.min(30, Math.max(0, source.data?.preview_count || 0)) }, (_, index) => ({ index: index + 1, source: true }));
  const media = item.is_jav && item.code ? [...(item.has_cover ? [{ index: -1, label: 'Portada' }] : []),
    ...samples.map((sample, index) => ({ ...sample, label: `Vista previa ${index + 1}` })),
    { index: -2, label: 'Película completa', video: true }] : [];
  const hasPictures = media.length > 1;
  const selectImage = (index: number) => {
    if (index !== -2) frameRef.current?.querySelector('video')?.pause();
    setImage(index);
  };
  const mounting = useRef(item);
  const ended = useRef(onEnded);
  ended.current = onEnded;
  useLayoutEffect(() => {
    const node = frameRef.current;
    if (!node || !started) return;
    const complete = () => ended.current();
    node.addEventListener('ended', complete, true);
    const unmount = actions.mountPlayer(node, mounting.current, null,
      started === 'clicked' || autoplay ? { autoplay: true } : undefined);
    return () => { node.removeEventListener('ended', complete, true); unmount() };
  }, [actions, started]);
  const badge = helpers.badgeHtml(item.location || '', item.cost || '', 'srcbig');
  return (
    <div ref={frameRef} data-stage-media="" data-item-media={gate || 'video'} data-item-gallery={hasPictures ? '' : undefined}
      data-item-picture={image !== -2 ? '' : undefined}>
      <CloseStage onClose={actions.close} />
      {hasPictures ? <>
        <button type="button" data-jav-preview-toggle="" aria-pressed={image !== -2}
          onClick={() => selectImage(image === -2 ? media[0]!.index : -2)}><Glyph name={image === -2 ? 'image' : 'play'} />{image === -2 ? 'Ver imagen' : 'ReproducirPelícula completa'}</button>
        {image !== -2 ? <CatalogPicture key={image} item={item} image={image} source={samples.find(sample => sample.index === image)?.source} /> : null}
        <MediaCarousel items={media} position={Math.max(0, media.findIndex(entry => entry.index === image))} onSelect={selectImage}
          below renderThumbnail={entry => <CatalogPicture item={item} image={entry.index === -2 ? media[0]!.index : entry.index}
            source={samples.find(sample => sample.index === (entry.index === -2 ? media[0]!.index : entry.index))?.source} thumbnail />} />
      </> : null}
      {item.is_jav && item.code && !item.sample_images?.length && (source.isPending || source.error || source.data?.state === 'partial') ?
        <div data-item-samples-state="">{source.isPending ? <span data-skeleton="samples" role="status" aria-label="Cargando样Imagen" className="relative block h-12 w-20 skeleton-sheen" />
          : <Button variant="secondary" {...busyProps(source.isFetching)} title={source.data?.message || requestErrorMessage(source.error)}
            onClick={() => { refreshSamples.current = true; void source.refetch() }}>Reintentar样Imagen</Button>}</div> : null}
      {gate === 'offline' ? <OfflineGate item={item} badge={badge} helpers={helpers} actions={actions} />
        : gate === 'disc' ? (
          <div role="status" data-item-gate="disc">
            <b>ISO original</b>
            <span>Por favor使用支持Original盘exterior título(s)ReproductorAbrir. </span>
            <ExternalPlayback id={item.id} />
          </div>
        ) : gate === 'online' ? (
          <div id="onlineGate" role="status" data-item-gate="online">
            <Html html={badge} />
            <b>Obras en línea</b>
            <span>esteResultadoSin对应SeguirResultado目, MediosDirecciónNinguno从解析. </span>
            <button className="chip" id="openSavedFollow" type="button" onClick={actions.openSavedFollow}>AbrirGuardadoSeguir</button>
          </div>
        ) : gate === 'metered' && !started ? (
          <div id="gate" data-item-gate="metered" onClick={() => setStarted('clicked')}>
            <Html html={badge} />
            <span>点此Empezar拉流 · {sizeText(item.size)}</span>
          </div>
        ) : null}
    </div>
  );
}

function OfflineGate({ item, badge, helpers, actions }: {
  item: DetailItem; badge: string; helpers: ItemDetailHelpers; actions: ItemDetailActions;
}) {
  const [checking, setChecking] = useState(false);
  const [still, setStill] = useState(false);
  const retry = async () => {
    setChecking(true);
    const online = await actions.checkSource(item.location || '').catch(() => false);
    setChecking(false);
    if (online) actions.reopen();
    else setStill(true);
  };
  return (
    <div id="offlineGate" role="status" data-item-gate="offline">
      <Html html={badge} />
      <b>Directorio de mediosNinguno法Acceso</b>
      <span>{helpers.offlineReason(item.location || '')}</span>
      <button className="chip" id="offlineRetry" type="button" disabled={checking} onClick={() => void retry()}>
        {still ? 'Aún no se puede leer · Actualizar' : 'ActualizarEstado'}
      </button>
    </div>
  );
}

/* ── Cola ── */

function Queue({ queue, itemId, helpers, actions }: {
  queue: DetailQueue; itemId: number; helpers: ItemDetailHelpers; actions: ItemDetailActions;
}) {
  const copy = queueCopy(queue);
  const list = useRef<HTMLDivElement | null>(null);
  const reorder = usePlaylistReorder(queue, itemId, actions);
  const reorderRef = useRef(reorder);
  reorderRef.current = reorder;
  const listRef = useCallback((node: HTMLDivElement | null) => {
    list.current = node;
    if (!node) return;
    helpers.wireDrag(node);
    /* 顺序直continuar拖: uno列diez几, 靠arriba移abajo移最posterioruno挪到No.dos要按diez几次, 而每uno次都esuno趟写Biblioteca
       加uno次pesado绘. 拖动en proceso行态由 `wireDragReorder` 挂En行arriba, 行es按 id 复用, pesado排之posterior监听还En.  */
    if (queue.kind === 'playlist') {
      helpers.wireDragReorder(node, {
        selector: '[data-queue-row]', attribute: 'data-queue-row',
        onMove: (from, target, after) => reorderRef.current.move(+from, +target, after),
      });
    }
  }, [helpers, queue.kind]);
  const saveMix = useSaveMix(queue, actions);
  const head = queue.kind === 'mix'
    ? <button type="button" data-save-mix="" title="Guardar como lista de reproducción" aria-label="Guardar como lista de reproducción" onClick={saveMix}
      dangerouslySetInnerHTML={{ __html: icon('playlist') }} />
    : queue.kind === 'playlist'
      ? <button type="button" data-edit-playlist="" title="EditarLista de reproducción" aria-label="EditarLista de reproducción" onClick={actions.editPlaylist}
        dangerouslySetInnerHTML={{ __html: icon('playlist') }} />
      : null;
  const ref = { kind: queue.kind, seedId: queue.seedId, playlistId: queue.playlistId };
  return (
    <MixQueue kind={queue.kind} title={copy.title} summary={copy.summary} onClose={actions.close} actions={head} listRef={listRef}>
      {queue.items.map((row) => {
        const edition = queue.kind === 'editions' && row.edition_label
          ? <i className={`javedition ${EDITION_TONE[row.edition_label] || 'censored'}`} data-queue-edition="">{row.edition_label}</i> : null;
        // ya消失Entrada照antiguo列EnReproducirListadentro, 能移出, peroArchivoNoEn盘arriba, esteuno行No能点开去Reproducir. 
        const gone = queue.kind === 'playlist' && isVanished(row);
        return (
          <MixQueueRow key={row.id} current={row.id === itemId} data-queue-item={row.id} row={{ 'data-queue-row': row.id }}
            disabled={gone} title={gone ? 'ArchivoYaNoEn盘arriba, No能Reproducir' : undefined}
            {...(gone ? { 'data-queue-vanished': '' } : {})}
            onClick={() => { if (!gone) actions.openQueueItem(ref, row.id) }}
            pic={<><Html html={queueThumbHtml(row, helpers.javImage())} /><i className="mono" data-mix-item-duration="">{fmtDur(row.duration)}</i></>}
            lead={<Html html={queueAvatarHtml(row)} />}
            after={queue.kind === 'playlist' ? (
              <span data-queue-edit="">
                <i data-queue-grip="" aria-hidden="true"><Glyph name="grip-vertical" /></i>
                <button type="button" data-queue-remove={row.id} title="Quitar de lista de reproducción" aria-label="Quitar de lista de reproducción"
                  onClick={() => reorder.remove(row.id)}><Glyph name="x" /></button>
              </span>
            ) : null}>
            <span data-queue-head="">{edition}<b data-middle-truncate="">{helpers.displayName(row)}</b></span>
            <span data-truncate-end="">{gone ? 'Ya消失 · ArchivoYaNoEn盘arriba'
              : queue.kind === 'parts' || (queue.kind === 'editions' && row.part_label)
                ? partLabel(row.part_label) : mixLabel(row, helpers.tagLabel)}</span>
          </MixQueueRow>
        );
      })}
    </MixQueue>
  );
}

/** Guardar Mix: 壳弹表单(舞esOriginal生模态, 弹层要进同uno层), Confirmar时由aquí写Biblioteca.  */
function useSaveMix(queue: DetailQueue, actions: ItemDetailActions) {
  const save = useMutation({
    mutationFn: (name: string) => apiSend<{ playlist: PlaylistPayload }>(PLAYLIST_URL, {
      action: 'create', name, asset_ids: queue.items.map((row) => row.id), source_kind: 'mix', source_seed_asset_id: queue.seedId,
    }).then((result) => result.playlist),
  });
  return () => actions.saveMix({ title: queue.title, count: queue.items.length, save: (name) => save.mutateAsync(name) });
}

/** ReproducirListaOrdenary移出. 两者写完都服务端回CompletoLista换进Cola缓存, 行Original地pesado排, Nopesado挂舞; 
 *  移出正esesteuno时才经壳换到Siguiente, Lista被移空就回Listapágina. Deshacer拿es动作之anterioreseuno完Completo顺序, 
 *  所以uno次拖动Sin论跨másmenos行都Solo需按uno次Deshacer.  */
function usePlaylistReorder(queue: DetailQueue, itemId: number, actions: ItemDetailActions) {
  const key = queueKey({ kind: 'playlist', playlistId: queue.playlistId });
  const apply = (playlist: PlaylistPayload) => {
    queryClient.setQueryData(key, playlistQueue(playlist));
    return playlist;
  };
  const write = (body: Record<string, unknown>) =>
    apiSend<{ playlist: PlaylistPayload }>(PLAYLIST_URL, { id: queue.playlistId, ...body }).then((result) => result.playlist);
  const reorder = useMutation({
    mutationFn: (ids: number[]) => write({ action: 'reorder', asset_ids: ids }),
    onSuccess: (playlist, _ids) => { apply(playlist) },
    onError: (error) => actions.failure('调CompletoReproducir顺序', error),
  });
  const ids = queue.items.map((row) => row.id);
  return {
    move: async (from: number, target: number, after: boolean) => {
      if (queue.kind !== 'playlist') return;
      const next = movedOrder(ids, from, target, after);
      if (sameOrder(next, ids)) return;
      const before = ids;
      await reorder.mutateAsync(next);
      actions.toast('Ya调CompletoReproducir顺序', { undo: async () => { apply(await write({ action: 'reorder', asset_ids: before })) } });
    },
    remove: (assetId: number) => {
      const before = ids;
      void confirmModal({
        title: 'Quitar de lista de reproducción', body: 'este video(s)将从Lista de reproducciónQuitar, VideosArchivoConservar. ', confirmLabel: 'Quitar de lista de reproducción',
        onConfirm: async () => {
          const playlist = await write({ action: 'remove', asset_id: assetId });
          /* Deshacer要它放回它eseuno: `add` Solo会补Enúltimo尾, 所以补完再按移出之anteriorese顺序排uno次. 
             Lista被esteunoabajo清空时它ya经NoEnpágina面arriba, Deshacerposterior带回Listapágina而Noes空Cola.  */
          actions.toast('YaQuitar de lista de reproducción', {
            undo: async () => {
              await write({ action: 'add', asset_ids: [assetId] });
              const restored = apply(await write({ action: 'reorder', asset_ids: before }));
              if (!playlist.items.length || assetId === itemId) {
                actions.openQueueItem({ kind: 'playlist', playlistId: restored.id }, itemId, false);
              }
            },
          });
          if (!playlist.items.length) { actions.openPlaylists(); return }
          apply(playlist);
          if (assetId === itemId) {
            actions.openQueueItem({ kind: 'playlist', playlistId: playlist.id }, playlist.current_asset_id || playlist.items[0]!.id, false);
          }
        },
      });
    },
  };
}

/* ── 侧栏 ── */

function Side({ item, queue, write, helpers, actions }: {
  item: DetailItem; queue: DetailQueue | null; write: DetailWrite; helpers: ItemDetailHelpers; actions: ItemDetailActions;
}) {
  const online = item.location === 'online';
  const busy = write.busyAttrs;
  const [reasonOpen, setReasonOpen] = useState(false);
  return (
    <div data-stage-side="" data-item-side="">
      <div data-stage-side-content="">
        <DetailTitle item={item} queue={queue} helpers={helpers} actions={actions} onStatus={write.setSourceState} />
        {online ? null : <span data-title-state="" aria-live="polite">{write.sourceState}</span>}
        <Rating item={item} write={write} />
        <div className="mono" data-stage-meta="" data-reveal-line="">
          {item.width && item.height
            ? <span data-spec-item=""><Glyph name="monitor" /><span>{item.width}×{item.height}</span></span>
            : null}
          <span data-spec-item=""><Glyph name="hard-drive" /><span>{sizeText(item.size)}</span></span>
          {item.release_date ? <span data-spec-item=""><Glyph name="calendar" /><span>{item.release_date}</span></span> : null}
          {item.region_label ? (
            <button type="button" data-spec-item="" data-open-region={item.region || ''}
              title={item.region_settled ? 'Ya判定Origen; Abrir同OrigenObra' : '按Código JAV或Sello推断Origen, Lote判定posteriorNo再变; Abrir同OrigenObra'}
              onClick={() => actions.openRegion(item.region || '')}>
              <Glyph name="globe" /><span>{item.region_label}{item.region_settled ? '' : '(inferido)'}</span>
            </button>
          ) : null}
        </div>
        <Identity item={item} helpers={helpers} actions={actions} />
        <Tags item={item} write={write} helpers={helpers} actions={actions} />
        <LibraryCompletionPrompt assetIds={missingPreviewIds([item], helpers.javImage())}
          onComplete={() => { void queryClient.invalidateQueries({ queryKey: itemKey(item.id) }) }} />
        <Trace item={item} />
        {item.medium === 'video' && item.location !== 'online' ? <ExternalPlayback key={item.id} id={item.id} /> : null}
        <div data-stage-actions="" data-item-feedback="">
          <button type="button" id="likeBtn" data-fb="like" aria-label={item.liked ? 'CancelarMe gusta' : 'Me gusta'} title="Me gusta · RegistroPreferencias偏bien"
            aria-pressed={!!item.liked} {...busy('like')} onClick={() => write.preference({ liked: !item.liked })}><Glyph name="thumbs-up" /></button>
          <button type="button" id="preferenceToggle" data-fb="reason" aria-label="Razón del gusto" title="Razón del gusto" aria-expanded={reasonOpen}
            aria-controls="preferencePanel" data-has-reason={String(!!item.like_reason)}
            onClick={() => setReasonOpen((open) => !open)}><Glyph name="notebook-pen" /></button>
          <button type="button" data-stage-action="dislike" data-kind="dislike" aria-label="No es de mi gusto" title="No es de mi gusto · Reducir peso de recomendación"
            aria-pressed={item.feedback === 'dislike'} {...busy('dislike')} onClick={() => write.feedback('dislike')}><Glyph name="thumbs-down" /></button>
          <button type="button" data-stage-action="seen" data-kind="seen" aria-label="Ya lo vi" title="Ya lo vi · Solo降bajo近期Recomendado"
            aria-pressed={item.feedback === 'seen'} {...busy('seen')} onClick={() => write.feedback('seen')}><Glyph name="eye" /></button>
          <button type="button" data-stage-action="later" id="stageLater" aria-label="Ver más tarde" title="Ver más tarde · 加入或移出Cola"
            aria-pressed={!!item.watch_later} {...busy('later')} onClick={write.later}><Glyph name={item.watch_later ? 'check' : 'bookmark-plus'} /></button>
          <button type="button" id="addPlaylist" data-fb="playlist" aria-label="Añadir a la lista de reproducción" title="Añadir a la lista de reproducción"
            onClick={() => actions.addToPlaylist(item)}><Glyph name="playlist" /></button>
          <button type="button" id="betterVersion" data-fb="quality" aria-label="Buscar mejor versión"
            title={item.better_version ? (item.better_version_reason || 'MarcadoBuscar mejor versión') : '寻找HD, Ninguno水印或CompletadoCompleto版'}
            aria-pressed={!!item.better_version} {...busy('quality')} onClick={write.quality}><Glyph name="sparkles" /></button>
          <button type="button" data-kind="dispose" data-fb="dispose" aria-label="Mover a papelera" title="Mover a papelera · Archivo仍Conservar, puede从Papelera永久Limpiar"
            aria-pressed={item.disposal === 'trash'} {...busy('dispose')} onClick={() => write.feedback('dispose')}><Glyph name="trash" /></button>
        </div>
        <Preference item={item} open={reasonOpen} write={write} />
        <button type="button" data-kind="o" {...busy('o')} onClick={() => write.feedback('o')}>
          <Glyph name="sperm" /><span>Registrar un orgasmo</span><b className="mono" id="oCount">{item.o_count || 0}</b>
        </button>
      </div>
    </div>
  );
}

/* TítuloPredeterminado折成两行, 真溢出才给展开Clave: 折叠态abajo scrollHeight 比 clientHeight alto, 就esCon行被裁掉. 
   展开y收起换字形—往abajomásveruno截es chevron-down, 收回去es chevron-up. 展开Clave排Enese排Clave最anterior面, 
   紧挨着它管Título. Título文字本身也continuaresteunoabajo: 人想verTodo文时手本来就落En字arriba. 选en proceso文字eseunoabajoNo算, 
   eseesEnCopiarTítulo. 溢出NoSoloEnAbrireseuno刻判: CineModo y 普通视Imagen之间Cambiar时Título栏ancho度差unogrande截.  */
function DetailTitle({ item, queue, helpers, actions, onStatus }: {
  item: DetailItem; queue: DetailQueue | null; helpers: ItemDetailHelpers; actions: ItemDetailActions;
  onStatus(text: string): void;
}) {
  const { text, expanded, foldable, toggle } = useFoldedTitle(String(item.title || item.name || ''));
  const html = helpers.badgeHtml(item.location || '', item.cost || '', 'srcbig') + helpers.titleHtml(item) + partLabelHtml(item, queue);
  return (
    <div data-item-title="">
      <div data-stage-title="" data-title-line="" data-reveal-line="">
        <span ref={text} data-detail-title="" data-expanded={expanded ? '' : undefined}
          data-foldable={foldable ? '' : undefined}
          onClick={() => { if (foldable && !String(getSelection() || '')) toggle() }}
          dangerouslySetInnerHTML={{ __html: html }} />
        <span data-title-tools="">
          <button type="button" data-title-fold="" hidden={!foldable} aria-expanded={expanded}
            aria-label={expanded ? 'Colapsar título' : 'Expandir título'} title={expanded ? 'Colapsar título' : 'Expandir título completo'} onClick={toggle}>
            <Glyph name={expanded ? 'chevron-up' : 'chevron-down'} />
          </button>
          {/* 取景框存es坐标NoesImagen片: 存完pesado取esteuno, Portada地址没变, 变esInterfaz给 `poster_box`. 
              背posteriorCuadrículadentro同unoCódigo JAV卡Nopesado取, 就地换arribaNuevo框, 关掉Detallesver到就es框过样子.  */}
          {item.has_cover && (item.cover_key || item.code) ? (
            <span data-cover-crop-host="">
              <CoverCrop code={item.cover_key || item.code || ''} coverUrl={coverUrl(item)} box={item.poster_box || null}
                onSaved={(box) => {
                  void queryClient.invalidateQueries({ queryKey: itemKey(item.id), exact: true });
                  patchCatalogItems((one) => (one.cover_key || one.code) === (item.cover_key || item.code), { poster_box: box });
                }} />
            </span>
          ) : null}
          {item.location === 'online' ? null : <SourceTools id={item.id} actions={actions} onStatus={onStatus} />}
        </span>
      </div>
    </div>
  );
}

/** 定源Archivoy核对Directorio. 对账删掉puede能就esesteuno, 删就没什么puede停Deja, 直continuar退回Lista.  */
function SourceTools({ id, actions, onStatus }: { id: number; actions: ItemDetailActions; onStatus(text: string): void }) {
  const [busy, setBusy] = useState('');
  const reveal = async () => {
    if (busy) return;
    setBusy('reveal');
    onStatus('');
    onStatus(await actions.reveal(id));
    setBusy('');
  };
  const sync = async () => {
    if (busy) return;
    setBusy('sync');
    onStatus('Procesando核对Directorio...');
    const result = await actions.sync(id);
    onStatus(result.text);
    setBusy('');
    if (result.removed.includes(id)) actions.close();
  };
  return (
    <>
      <button type="button" data-reveal={id} title="EnArchivoGestionarDispositivodentroAbrir源Archivo所EnDirectorio" aria-label="定 resultado(s)源Archivo"
        {...(busy === 'reveal' ? { 'aria-busy': true, 'aria-disabled': true } : {})} onClick={() => void reveal()}
        dangerouslySetInnerHTML={{ __html: busy === 'reveal' ? spinnerHtml('Localizando') : icon('folder-open') }} />
      <button type="button" data-sync={id} title="核对该Directorio: DiscoarribaYaEliminar移入 Peach Papelera, 带人Registro标ComoYa消失" aria-label="SincronizarEliminar"
        {...(busy === 'sync' ? { 'aria-busy': true, 'aria-disabled': true } : {})} onClick={() => void sync()}>
        <Glyph name="folder-sync" />
      </button>
    </>
  );
}

/* cinco星站EnTítulo y ese行规格之间: Puntuaciónes对esteunoObras判断, 属于身uno部分.  */
function Rating({ item, write }: { item: DetailItem; write: DetailWrite }) {
  const on = ratingStars(item.rating);
  return (
    <div id="detailRating" role="group" data-item-rating="" aria-label="Puntuación" data-value={clampRating(item.rating)}>
      <div data-rating-stars="">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" data-rate={star} data-on={String(star <= on)}
            title={star === on ? '再点uno次CancelarPuntuación' : `${star} 星`}
            aria-label={star === on ? `CancelarPuntuación(Actual ${star} 星)` : `评Como ${star} 星`}
            {...write.busyAttrs(`rate:${star}`)} onClick={() => write.rate(star)}><Glyph name="star" /></button>
        ))}
      </div>
      <span data-rating-value="" aria-live="polite">{ratingText(item.rating)}</span>
    </div>
  );
}

/* 身按CategoríaAgrupar: Etiqueta作Como组Título写Enarriba方, 同类横向排开. 逐行uno名字En共演Obrasarriba会Completo侧栏
   撑满. uno都Sin时, "no归属"就esesteObras所属eseuno类,  y Actriz, Selloy列: 点进去ver得到Todo.  */
function Identity({ item, actions }: { item: DetailItem; helpers: ItemDetailHelpers; actions: ItemDetailActions }) {
  const groups = useMemo(() => identityGroups(item), [item]);
  const [castOpen, setCastOpen] = useState(false);
  const overflow = Math.max(0, groups.cast.length - CAST_SHOWN);
  const cell = (kind: string, ref: DetailEntityRef, index: number) => {
    const hide = kind === 'performer' && index >= CAST_SHOWN && !castOpen;
    return <IdentityCell key={`${kind}:${ref.name}`} kind={kind} person={ref} onOpen={actions.openEntity}
      hidden={hide} overflow={kind === 'performer' && index >= CAST_SHOWN} />;
  };
  const group = (label: string, kind: string, list: DetailEntityRef[], extra: ReactNode = null) => (list.length ? (
    <section key={`${kind}:${label}`} data-id-group={kind}>
      <h5 data-id-label="">{label}</h5>
      <div data-id-row="">{list.map((ref, index) => cell(kind, ref, index))}{extra}</div>
    </section>
  ) : null);
  const primary = [
    groups.unowned ? (
      <section key="unowned" data-id-group="unowned">
        <h5 data-id-label="">Asignación</h5>
        <div data-id-row="">
          <button type="button" data-id-cell="unowned" data-open-unowned="" title="AbrirSin asignar: ColeccióndentroSin署名人Obra"
            onClick={actions.openUnowned}>
            <span data-id-face=""><Glyph name="user-round" /></span><span data-id-name="">Sin asignar</span>
          </button>
        </div>
      </section>
    ) : group(performerLabel(item), 'performer', groups.cast, overflow && !castOpen
      ? <Button variant="secondary" size="small" id="castMore" data-cast-more="" trailingIcon={RiArrowDownSLine}
        aria-expanded={false} onClick={() => setCastOpen(true)}>还Con {overflow} </Button> : null),
    group('Sello', 'studio', groups.studios),
    group('Productora', 'studio', groups.makers),
    group('Vendedor', 'creator', groups.creators.filter(ref => ref.identity_categories?.includes('seller'))),
    group('Creador', 'creator', groups.creators.filter(ref => !ref.identity_categories?.includes('seller'))),
  ].filter(Boolean);
  return (
    <div data-item-identity="">
      {primary.length ? <div data-identity-primary="">{primary}</div> : null}
      <IdentitySeries people={groups.series} onOpen={actions.openEntity} />
    </div>
  );
}

/* ── Etiqueta ── */

function Tags({ item, write, helpers, actions }: {
  item: DetailItem; write: DetailWrite; helpers: ItemDetailHelpers; actions: ItemDetailActions;
}) {
  const tags = detailTags(item, helpers);
  return (
    <div data-stage-tags="" id="detailTags" data-item-tags="">
      {tags.map((tag) => (
        <span key={tag.k} data-detail-tag="">
          <button type="button" data-tag={tag.k} title={helpers.tagLabel(tag.k)} onClick={() => actions.openTag(tag.k)}>{helpers.tagLabel(tag.k)}</button>
          <button type="button" data-remove-tag={tag.k} title="从此VideosOcultar该Etiqueta"
            aria-label={`EliminarEtiqueta ${helpers.tagLabel(tag.k)}`} {...write.busyAttrs(`tag:${tag.k}`)}
            onClick={() => write.removeTag(tag)}><Glyph name="x" /></button>
        </span>
      ))}
      <TagPicker item={item} write={write} helpers={helpers} />
    </div>
  );
}

/* EtiquetaSeleccionarDispositivo: Reciente使用 + Todo(o buscarResultado), arribaabajoClave挑, 回车加, Introducir词Sin完Todo命en proceso就másuno格
   "Nuevo". 开合走Todo站菜单eseuno对口(`presentMenu`/`dismissMenu`), `hidden` 由它们管. 
   选字过程en proceso框dentroesmedio截拼音, Filtrar按 `term` 走, 组完字才跟arriba, No拿"zhon"去筛.  */
function TagPicker({ item, write, helpers }: { item: DetailItem; write: DetailWrite; helpers: ItemDetailHelpers }) {
  const plus = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(-1);
  const close = useCallback(() => {
    if (picker.current) dismissMenu(picker.current);
    setOpen(false);
  }, []);
  /* 点exterior面就收起. 延uno拍再挂: Abrir它esteuno次 pointerdown 还En冒泡, 立刻挂arriba会自己自己关掉.  */
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!picker.current?.contains(target) && target !== plus.current) close();
    };
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler, true), 0);
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', handler, true) };
  }, [open, close]);
  const sections = open ? pickerSections(term, helpers.tagCandidates(), recentTags()) : { recent: [], results: [], create: '' };
  const options = [...sections.recent, ...sections.results, ...(sections.create ? [{ k: sections.create, n: -1 }] : [])];
  const pick = (tag: TagCount, selected: boolean) => {
    close();
    if (!selected) write.addTag(tag.k);
  };
  const keydown = (event: KeyboardEvent<HTMLInputElement>) => {
    /* 选字eseunoabajo回车es定字, Noes"NuevoesteEtiqueta"—medio截拼音会真建成Etiqueta.  */
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); plus.current?.focus(); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!options.length) return;
      const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      setActive(next);
      picker.current?.querySelectorAll('[data-pick]')[next]?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = active >= 0 ? options[active] : null;
      if (chosen) pick(chosen, chosen.n !== -1 && hasTag(item, chosen.k));
      else if (query.trim()) { close(); write.addTag(query.trim()) }
    }
  };
  let index = -1;
  const button = (tag: TagCount) => {
    index += 1;
    const at = index;
    const selected = hasTag(item, tag.k);
    return (
      <button key={`${at}:${tag.k}`} type="button" data-pick={tag.k} data-active={at === active ? '' : undefined}
        aria-pressed={selected} onClick={() => pick(tag, selected)}>
        <Glyph name={selected ? 'check' : 'tags'} /><span data-pick-name="">{helpers.tagLabel(tag.k)}</span>
        <span data-pick-count="">{(tag.n || 0).toLocaleString()}</span>
      </button>
    );
  };
  return (
    <>
      <button ref={plus} type="button" id="tagPlus" data-tag-plus="" title="AñadirEtiqueta" aria-label="AñadirEtiqueta" aria-expanded={open}
        onClick={() => {
          if (!picker.current) return;
          presentMenu(picker.current);
          setOpen(true); setQuery(''); setTerm(''); setActive(-1);
          requestAnimationFrame(() => search.current?.focus());
        }}><Glyph name="plus" /></button>
      <div ref={picker} id="tagPicker" data-tag-picker="" role="dialog" aria-label="AñadirEtiqueta" hidden>
        <label data-tag-search="">
          <Glyph name="search" />
          <input ref={search} id="tagPickSearch" maxLength={80} placeholder="Buscar或IntroducirNuevoEtiqueta" autoComplete="off" value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(-1); if (!composing.current) setTerm(event.target.value) }}
            onCompositionStart={() => { composing.current = true }}
            onCompositionEnd={(event) => { composing.current = false; setTerm(event.currentTarget.value) }} onKeyDown={keydown} />
        </label>
        <div id="tagPickBody" data-tag-body="">
          {open && sections.recent.length ? (
            <section data-tag-section=""><h4>Reciente使用</h4><div data-tag-grid="">{sections.recent.map(button)}</div></section>
          ) : null}
          {open ? (
            <section data-tag-section="">
              <h4>{term.trim() ? 'Resultados de búsqueda' : 'TodoEtiqueta'}</h4>
              <div data-tag-grid="">
                {sections.results.map(button)}
                {sections.create ? (() => {
                  index += 1;
                  const at = index;
                  return (
                    <button key="create" type="button" data-pick={sections.create} data-active={at === active ? '' : undefined}
                      onClick={() => { close(); write.addTag(sections.create) }}>
                      <Glyph name="plus" /><span data-pick-name="">Nuevo“{sections.create}”</span>
                    </button>
                  );
                })() : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ── 观ver轨迹 ──
   两读数 id Deja给壳: Video.js 挂arriba之posterior, 离开Ubicación由 `wireTelemetry` 随Reproducir写, 真实观verEn每次
   arriba报之posterior回Introduce. aquíSolo画初值, 之posteriorNo再改它们.  */
function Trace({ item }: { item: DetailItem }) {
  const real = realWatched(item);
  return (
    <div data-item-trace="">
      <div data-trace-metric="">
        <div data-trace-label=""><span>离开Posición</span><span id="ratioTxt">0%</span></div>
        <div data-trace-bar=""><u id="watched" /><b id="mark" /></div>
      </div>
      <div data-trace-metric="">
        <div data-trace-label=""><span>Visualización real</span><span id="realTxt">{real == null ? '0%' : `${real.toFixed(0)}%`}</span></div>
        {/* oxlint-disable-next-line shadcn/no-inline-styles -- ancho度esesteunover过Relación, 之posterior由壳遥测随arriba报改写 */}
        <div data-trace-bar=""><u id="realBar" data-trace-real="" style={real == null ? undefined : { width: `${real.toFixed(1)}%` }} /></div>
      </div>
    </div>
  );
}

function Preference({ item, open, write }: { item: DetailItem; open: boolean; write: DetailWrite }) {
  const [reason, setReason] = useState(item.like_reason || '');
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (open) field.current?.focus() }, [open]);
  /* 服务端回来理由(Guardar, Deshacer)换进Introducir框; En curso打字时本地esteunoNo被覆盖, 因Como它SoloEn写完才变.  */
  useEffect(() => { setReason(item.like_reason || '') }, [item.like_reason]);
  const saving = write.busy.has('preference');
  return (
    <div id="preferencePanel" data-item-preference="" hidden={!open}>
      <textarea ref={field} id="likeReason" maxLength={2000} placeholder="¿Por qué te gusta?" value={reason}
        onChange={(event) => setReason(event.target.value)} />
      <div data-preference-foot="">
        <span id="preferenceState" aria-live="polite">{write.preferenceState}</span>
        <button type="button" className="geist-button primary" id="savePreference" data-save-preference="" title="EnviarRazón del gusto" aria-label="EnviarRazón del gusto"
          {...write.busyAttrs('preference')} onClick={() => write.preference({ reason })}
          dangerouslySetInnerHTML={{ __html: saving ? `${spinnerHtml('EnviandoRazón del gusto')}<span>EnviarEn proceso...</span>` : '<span>Enviar</span>' }} />
      </div>
    </div>
  );
}

/* ── Continuar viendo ──
   esteuno排卡esDirectorioCuadrícula items Modo: 取数Enaquí, 卡Solo画. 空ResultadoyFalloDejaEnRecomendado区, 
   拖动y滚轮都靠壳 `wireDrag`.  */
function Related(props: ItemDetailProps & { item: DetailItem }) {
  const { item, relatedLimit, helpers, grid } = props;
  const result = useQuery({
    queryKey: relatedKey(item.id, relatedLimit),
    queryFn: async ({ signal }) => {
      const page = await apiGet<{ items?: MediaItem[] }>(RELATED_URL(item.id, relatedLimit), signal);
      return page.items || [];
    },
  });
  const [skeleton] = useState(() => helpers.relatedSkeletonHtml());
  return (
    <RelatedSection wireDrag={helpers.wireDrag} busy={result.isPending} empty={result.data?.length === 0}
      error={result.isError ? `读取Continuar viendoFallido: ${requestErrorMessage(result.error)}` : undefined}
      onRetry={() => { void result.refetch() }}>
        {result.data ? (
          <CatalogGridPage mode="items" variant="next" items={result.data} helpers={grid.helpers} actions={grid.actions}
            layout={props.layout} selectMode={props.selectMode} selected={props.selected} seekSeconds={props.seekSeconds}
            revision={0} wireDrag={helpers.wireDrag} skeletonHtml={() => ''} />
        ) : <Html html={skeleton} />}
    </RelatedSection>
  );
}

/* ── 写操作 ──
 * 每unoClave各Con自己忙态(`aria-busy` + `aria-disabled`, Controles仍puede聚焦, Repetir触发由壳
 * `wireBusyActions` 拦住). Éxitoposterior服务端回ese几字段换进 `['item', id]` yDirectorio缓存dentro同uno卡; 
 * Deshacer也esuno次真实写回, 写完同样换进去.  */
type DetailWrite = ReturnType<typeof useDetailWrite>;
type Patch = Partial<DetailItem>;

function useDetailWrite(item: DetailItem, actions: ItemDetailActions, label: (tag: string) => string) {
  const id = item.id;
  const key = itemKey(id);
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());
  const [sourceState, setSourceState] = useState('');
  const [preferenceState, setPreferenceState] = useState('');
  const mark = (name: string, on: boolean) => setBusy((now) => {
    const next = new Set(now);
    if (on) next.add(name); else next.delete(name);
    return next;
  });
  const current = () => queryClient.getQueryData<DetailItem>(key) || item;
  const apply = (patch: Patch | ((item: DetailItem) => DetailItem)) => {
    const next = typeof patch === 'function' ? patch(current()) : { ...current(), ...patch };
    queryClient.setQueryData(key, next);
    const card = { feedback: next.feedback, disposal: next.disposal, watch_later: next.watch_later, rating: next.rating, o_count: next.o_count };
    replaceCatalogItem(id, card);
    return next;
  };
  const post = <T,>(url: string, body: Record<string, unknown>) => apiSend<T>(url, { id, ...body });

  type Run = { name: string; action: string; run(): Promise<void> };
  const task = useMutation({
    mutationFn: ({ run }: Run) => run(),
    onError: (error, { action }) => actions.failure(action, error),
    onSettled: (_result, _error, { name }) => mark(name, false),
  });
  const start = (name: string, action: string, run: () => Promise<void>) => {
    if (busy.has(name)) return;
    mark(name, true);
    task.mutate({ name, action, run });
  };

  type FeedbackResult = { feedback?: string | null; disposal?: string | null; o_count?: number; rating?: number | null };
  const sendFeedback = async (kind: string, value?: number) => {
    const result = await post<FeedbackResult>(FEEDBACK_URL, value === undefined ? { kind } : { kind, value });
    if (kind === 'rate') apply({ rating: result.rating ?? null });
    else apply({ feedback: result.feedback ?? undefined, disposal: result.disposal ?? undefined, o_count: result.o_count });
    return result;
  };

  return {
    busy, sourceState, setSourceState, preferenceState,
    busyAttrs: (name: string) => (busy.has(name) ? { 'aria-busy': true, 'aria-disabled': true } as const : {}),

    rate: (star: number) => start(`rate:${star}`, 'Puntuación', async () => {
      const before = current().rating || 0;
      const value = nextRating(before, star);
      await sendFeedback('rate', value);
      actions.toast(value ? `Ya评 ${ratingStars(value)} 星` : 'YaCancelarPuntuación', { undo: async () => { await sendFeedback('rate', before) } });
    }),

    feedback: (kind: string) => start(kind, 'Acción', async () => {
      const before = { feedback: current().feedback || null };
      const result = await sendFeedback(kind);
      actions.toast(feedbackReceipt(kind, result), {
        undo: async () => {
          if (kind === 'o') await sendFeedback('o-undo');
          else if (kind === 'dispose') await sendFeedback('dispose');
          else {
            if (result.feedback) await sendFeedback(result.feedback);
            if (before.feedback) await sendFeedback(before.feedback);
          }
          await actions.trashChanged(current().disposal || null, true);
        },
      });
      if (kind === 'dispose') await actions.trashChanged(result.disposal || null, false);
    }),

    later: () => start('later', 'ActualizarVer más tarde', async () => {
      const result = await post<{ watch_later: boolean }>(WATCH_LATER_URL, {});
      apply({ watch_later: result.watch_later });
      actions.toast(result.watch_later ? 'Ya加入Ver más tarde' : 'Ya移出Ver más tarde', {
        undo: async () => { apply({ watch_later: (await post<{ watch_later: boolean }>(WATCH_LATER_URL, {})).watch_later }) },
      });
    }),

    quality: () => start('quality', 'ActualizarVersión需求', async () => {
      const before = { wanted: !!current().better_version, reason: current().better_version_reason || '' };
      type Goal = { better_version: boolean; better_version_reason?: string };
      const paint = (goal: Goal) => apply({ better_version: goal.better_version, better_version_reason: goal.better_version_reason || '' });
      const result = await post<Goal>(QUALITY_GOAL_URL, { wanted: !before.wanted });
      paint(result);
      actions.toast(result.better_version ? 'MarcadoBuscar mejor versión' : 'YaCancelarBuscar mejor versión', {
        undo: async () => { paint(await post<Goal>(QUALITY_GOAL_URL, before)) },
      });
    }),

    /* 喜欢y理由es同uno偏bien: 点喜欢ClaveSolo改 `liked`, 提交理由时Con字就算喜欢.  */
    preference: ({ liked, reason }: { liked?: boolean; reason?: string }) => {
      const name = liked === undefined ? 'preference' : 'like';
      start(name, 'GuardarMe gusta偏bien', async () => {
        const before = { liked: !!current().liked, reason: current().like_reason || '' };
        const text = reason ?? before.reason;
        const wanted = liked ?? (before.liked || text.trim().length > 0);
        type Preference = { liked: boolean; like_reason?: string };
        const paint = (result: Preference) => apply({ liked: result.liked, like_reason: result.like_reason || '' });
        setPreferenceState('GuardarEn proceso...');
        try {
          paint(await post<Preference>(PREFERENCE_URL, { liked: wanted, reason: text }));
        } catch (error) {
          setPreferenceState('GuardarFallido · Por favorReintentar');
          throw error;
        }
        setPreferenceState('Guardado');
        setTimeout(() => setPreferenceState((now) => (now === 'Guardado' ? '' : now)), 1400);
        const saved = current();
        actions.toast(saved.liked ? 'GuardadoMe gusta偏bien' : 'YaCancelarMe gusta', {
          undo: async () => { paint(await post<Preference>(PREFERENCE_URL, before)) },
        });
      });
    },

    removeTag: (tag: DetailTag) => start(`tag:${tag.k}`, 'EliminarEtiqueta', async () => {
      const result = await post<{ ok?: boolean }>(ITEM_TAG_URL, { operation: 'remove', tag: tag.k });
      if (!result.ok) throw new Error('EtiquetaNoEliminar');
      apply((now) => withoutTag(now, tag.k));
      actions.toast(`YaEliminarEtiqueta"${label(tag.k)}"`, {
        undo: async () => {
          await post(ITEM_TAG_URL, { operation: 'add', tag: tag.k });
          apply((now) => withTag(now, tag));
        },
      });
    }),

    addTag: (raw: string) => {
      const tag = raw.trim();
      if (!tag) return;
      start(`add:${tag}`, 'AñadirEtiqueta', async () => {
        const result = await post<{ ok?: boolean; tag?: string }>(ITEM_TAG_URL, { operation: 'add', tag });
        if (!result.ok) return;
        const canonical = result.tag || tag;
        if (hasTag(current(), canonical)) {
          actions.toast(`Etiqueta"${label(canonical)}"Ya存En`);
          return;
        }
        apply((now) => withTag(now, { k: canonical, cat: 'general' }));
        rememberTag(canonical);
        actions.toast(`YaAñadirEtiqueta"${label(canonical)}"`, {
          undo: async () => {
            await post(ITEM_TAG_URL, { operation: 'remove', tag: canonical });
            apply((now) => withoutTag(now, canonical));
          },
        });
      });
    },
  };
}
