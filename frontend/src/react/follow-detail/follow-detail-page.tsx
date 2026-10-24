/* 关注Detalles(ADR-0031): 舞dentroeseunoCompleto—媒体区, derecha侧Colay侧栏. 
 *
 * 舞(`<dialog id="stage">`), 它进出场, pequeño窗y Video.js 都归舞岛(`../stage/`), JAV Detalles
 * 也En用; aquíSolo画舞en lacontenido, 视频媒体框画bien之posterior经 `actions.mountPlayer` 交给舞挂ReproducirDispositivo. 媒体区, 侧栏yCola结构照
 * JAV Detalleseseuno套(`[data-stage-grid]` / `[data-stage-media]` / `[data-stage-side]` / `[data-mix-queue]`, 两边共用, 
 * 样En `../stage/stage.css`); 关注自己más出来几样En `follow-detail.css`. 
 *
 * 换uno媒体(轮播, más媒体Cola)Solo改岛interiorEstado: 媒体区按"Entrada:媒体"换uno, ReproducirDispositivo随之拆pesado挂. 
 * 换到组dentro另uno经壳(`actions.openItem`): 地址要换; 舞取齐eseunoposteriorOriginal地换contenido, 浮窗Nopesado开.  */
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { esc, fmtDur, foldName, icon, requestErrorMessage } from '@peach/legacy/core';
import { noteHtml } from '@peach/legacy/ui';
import { pageSkeletonHtml } from '../../management-placeholder';

import { Button } from '@/components/base/buttons/button';

import { ApiError, apiSend } from '../../api';
import { RetryNote } from '../components/grid-reveal';
import { MixGroupLabel, MixQueue, MixQueueRow } from '../components/mix-queue';
import { RelatedSection } from '../components/related-section';
import { DetailContinuation } from '../components/detail-continuation';
import { MediaCarousel } from '../components/media-carousel';
import { FollowAuthorLink, FollowCard } from '../follow-feed/follow-card';
import {
  FOLLOW_CREDENTIALS_KEY, fetchFollowCredentials, replaceFollowItem, setFollowItemStatus, videoItems,
  type FollowContext, type FollowFeedHelpers, type FollowGroup,
} from '../follow-feed/follow-feed';
import {
  followBadges, followIdentity, followMediaIssue, followTitle, followTitleMarks, followWhen, sourceIcon,
} from '../follow-feed/follow-marks';
import { FOLLOW_STATUS_URL } from '../follow-manage/follow-manage';
import { openPhotoLightbox } from '../photo-lightbox/photo-lightbox-dialog';
import { queryClient } from '../query';
import { addWant, fetchFollowWant, invalidateWants, removeWants, wantFollowKey, type Want } from '../wants/wants';
import {
  FOLLOW_MEDIA_HIDE_URL, FOLLOW_SAVE_URL, FollowItemGone, authorSources, collectionCopy, detailContext, detailMedia, detailSlides,
  detailTags, fetchFollowItem, followItemKey, groupedMediaOwner, mediaName, resourceLabel, statusReceipt, tagCategory,
  type DetailMedia, type FollowDetailActions, type FollowDetailData, type FollowDetailItem, type FollowDetailMedia,
  type FollowDetailProps,
} from './follow-detail';
import { fetchFollowRelated, followRelatedGroups, followRelatedKey } from './follow-related';

const realDuration = (value: unknown) => Number(value) > 0;

/** 字形Original样取壳eseuno `icon()`: 骨架y遗DejaDetalles画就es它, 换成别字形continuar管eseuno拍会跳.  */
const Glyph = ({ name }: { name: string }) => (
  <span className="contents" dangerouslySetInnerHTML={{ __html: icon(name) }} />
);
/** exterior链eseuno: 描边由Todo站 `svg.ui-externalmark`(`core/core.css`)给, esteunopágina 18px 尺寸En `follow-detail.css`.  */
const EXTERNAL_MARK = icon('external-link', 'ui-externalmark');

export function FollowDetailPage(props: FollowDetailProps) {
  const { id, actions } = props;
  const result = useQuery({ queryKey: followItemKey(id), queryFn: ({ signal }) => fetchFollowItem(id, signal) });
  const credentialsResult = useQuery({
    queryKey: FOLLOW_CREDENTIALS_KEY, queryFn: ({ signal }) => fetchFollowCredentials(signal),
  });
  const credentials = useMemo(() => new Set((credentialsResult.data?.providers || [])
    .filter((provider) => provider.present).map((provider) => provider.provider)), [credentialsResult.data]);
  const [mediaIndex, setMediaIndex] = useState(props.mediaIndex);

  if (!result.data) {
    return (
      <div data-stage-grid="" data-follow-detail="">
        <div data-stage-media="" data-follow-detail-media="none">
          <CloseStage onClose={actions.close} />
          <div data-follow-detail-placeholder="">
            {result.isError
              ? gone(result.error)
                ? <GoneNote onBack={actions.close} />
                : <RetryNote message={requestErrorMessage(result.error)} onRetry={() => void result.refetch()} />
              : null}
          </div>
        </div>
      </div>
    );
  }
  return (
    <Detail {...props} data={result.data} context={detailContext(result.data, credentials)}
      mediaIndex={mediaIndex} onMedia={setMediaIndex} />
  );
}

const gone = (error: unknown) => error instanceof FollowItemGone || (error instanceof ApiError && error.status === 404);

/** Entradaya经NoEn: Reintentar取No回来, Solo给uno回到关注página路.  */
function GoneNote({ onBack }: { onBack(): void }) {
  return (
    <div data-follow-detail-gone="" onClick={(event) => {
      if ((event.target as HTMLElement).closest('[data-note-action]')) onBack();
    }} dangerouslySetInnerHTML={{ __html: noteHtml('esteResultadoSeguircontenidoYaNo存En, puede能Ya被FuenteEliminar或YaLimpiar. ', { actionLabel: '回到Seguir' }) }} />
  );
}

/** CerrarClave. `id` Deja着: Escape, 点浮窗exterior面y壳兜底都按 `#closeStage` 找它再点unoabajo.  */
const CloseStage = ({ onClose }: { onClose(): void }) => (
  <button type="button" data-stage-close="" id="closeStage" title="Desactivar" aria-label="Desactivar" onClick={onClose}
    dangerouslySetInnerHTML={{ __html: icon('x') }} />
);

function Detail({ data, context, mediaIndex, onMedia, mediaView, relatedLimit, helpers, actions }: FollowDetailProps & {
  data: FollowDetailData; context: FollowContext; onMedia(index: number | null): void;
}) {
  const { item, group } = data;
  const media = detailMedia(item, group, mediaIndex, mediaView);
  const write = useDetailWrite(item, actions, onMedia);
  /* 媒体没取回ese两句SugerenciaSolo说esteuno媒体区: 换uno媒体就从头来.  */
  const frameKey = `${item.id}:${media.selected?.index ?? ''}`;
  const [issue, setIssue] = useState<{ key: string; kind: MediaIssue }>({ key: '', kind: '' });
  const issues: MediaIssues = {
    failed: () => setIssue({ key: frameKey, kind: 'failed' }),
    thumbFallback: () => setIssue({ key: frameKey, kind: 'thumb' }),
  };

  useLayoutEffect(() => { actions.present(item, media.kind) }, [actions, item, media.kind]);

  const owner = !media.embedded.length && media.collection ? groupedMediaOwner(media.collection) : undefined;
  const queue = media.embeddedQueue
    ? <MediaQueue item={item} current={media.selected!.index} helpers={helpers} actions={actions} onMedia={onMedia} />
    : media.collection
      ? owner
        ? <MediaQueue item={owner} current={null} helpers={helpers} actions={actions} onMedia={onMedia} currentId={item.id} />
        : <CollectionQueue group={media.collection} itemId={item.id} helpers={helpers} actions={actions} />
      : null;

  return (
    <>
    <div data-stage-grid="" data-with-queue={queue ? '' : undefined} data-follow-detail="">
      <MediaFrame key={frameKey} item={item} media={media}
        helpers={helpers} actions={actions} onMedia={onMedia} issues={issues} />
      <Side item={item} data={data} context={context} media={media} write={write}
        issue={issue.key === frameKey ? issue.kind : ''} helpers={helpers} actions={actions} />
    </div>
    <DetailContinuation queue={queue}>
      {relatedLimit > 0 ? <Related data={data} media={media.kind === 'image' ? 'images' : media.kind === 'video' ? 'videos' : mediaView}
        limit={relatedLimit} context={context} helpers={helpers} actions={actions} /> : null}
    </DetailContinuation>
    </>
  );
}

function Related({ data, media, limit, context, helpers, actions }: {
  data: FollowDetailData; media: FollowDetailProps['mediaView']; limit: number; context: FollowContext;
  helpers: FollowFeedHelpers; actions: FollowDetailActions;
}) {
  const result = useQuery({ queryKey: followRelatedKey(data.item.id, media, limit),
    queryFn: ({ signal }) => fetchFollowRelated(data, media, limit, signal) });
  const [skeleton] = useState(() => pageSkeletonHtml('Cargando recomendaciones', { cards: true, className: 'related-skeleton' }));
  const cardActions = useMemo(() => ({
    openDetail: actions.openItem, openAuthor: actions.openAuthor, canFlip: () => false,
  }), [actions]);
  const groups = followRelatedGroups(result.data?.pages || [], data, media, limit);
  const sources = result.data?.pages.at(-1)?.sources || data.sources;
  const relatedContext = { ...context, sources, aliases: result.data?.pages.at(-1)?.author_aliases || context.aliases };
  return <RelatedSection data-follow-related="" wireDrag={helpers.wireDrag} busy={result.isPending}
    empty={!!result.data && !groups.length}
    error={result.isError ? `读取Continuar viendoFallido: ${requestErrorMessage(result.error)}` : undefined}
    onRetry={() => { void result.refetch() }}>
    {result.data ? groups.map(group => <FollowCard key={group.primary.id} variant="next" group={group} media={media}
      authorSources={authorSources(group.primary, sources)} context={relatedContext} selected={false} selectMode={false}
      busy="" failure="" actions={cardActions} />)
      : <div className="contents" dangerouslySetInnerHTML={{ __html: skeleton }} />}
  </RelatedSection>;
}

/* ── 媒体区 ── */

function MediaFrame({ item, media, actions, onMedia, issues }: {
  item: FollowDetailItem; media: DetailMedia; helpers: FollowFeedHelpers; actions: FollowDetailActions;
  onMedia(index: number | null): void; issues: MediaIssues;
}) {
  const { kind, selected, src, images, position, carousel, frameRatio } = media;
  const frame = useRef<HTMLDivElement>(null);
  const slides = detailSlides(item, media);
  /* OriginalImagen经Proxy取, 缩略Imagen由Explorar dispositivo直continuar读公开Anfitrión: 归档站OriginalArchivoAnfitrión会拦abajo服务端(pawchive 
     file. 子域挂着 ddos-guard, uno律 403), 缩略ImagenAnfitrión照常给.  */
  const thumb = selected?.thumb_url || item.thumb_url || '';
  const playable = item.playable && kind === 'video';
  const imageSrc = item.playable && kind === 'image' ? src : item.thumb_url || '';
  const fallback = item.playable && kind === 'image' && thumb && thumb !== src ? thumb : '';
  const [shown, setShown] = useState(imageSrc);

  /* ReproducirDispositivoSolo随esteuno媒体区挂uno次, 卸uno次: 写完Estado换es同unoNuevo对象, No能因此拆pesado挂. 
     esteuno本身按"Entrada:媒体"换, 换Entrada或换媒体时Completopesado建, Limpiar就Eneseuno刻跑. `<video>` 由舞
     建Eneste框dentro(同ObrasDetalles), 报错时回到aquíDescripción.  */
  const mounting = useRef({ item, selected });
  const failed = useRef(issues.failed);
  failed.current = issues.failed;
  useLayoutEffect(() => {
    const node = frame.current;
    if (!node || !playable) return;
    return actions.mountPlayer(node, mounting.current.item, mounting.current.selected, { onError: () => failed.current() });
  }, [actions, playable]);

  return (
    <div ref={frame} data-stage-media="" data-follow-detail-media={kind || 'none'} data-framed={frameRatio ? '' : undefined}
      // oxlint-disable-next-line shadcn/no-inline-styles -- 画框Relación取esteuno组Imagen尺寸
      style={{ '--follow-frame-ratio': frameRatio ? frameRatio.toFixed(4) : undefined } as CSSProperties}>
      <CloseStage onClose={actions.close} />
      {playable ? null : imageSrc ? (
        <img data-follow-detail-poster="" data-zoomable={slides.length ? '' : undefined} src={shown} alt={item.title}
          referrerPolicy="no-referrer"
          onClick={slides.length ? () => void openPhotoLightbox(Math.max(0, position), slides) : undefined}
          onError={() => {
            if (fallback && shown !== fallback) { setShown(fallback); issues.thumbFallback(); return }
            issues.failed();
          }} />
      ) : (
        <div data-follow-detail-placeholder="">
          <span className="contents" dangerouslySetInnerHTML={{ __html: sourceIcon(item.resource_provider || item.provider) }} />
          <span>SinDisponibleVista previa</span>
        </div>
      )}
      {carousel ? <MediaCarousel items={images} position={position} onSelect={onMedia} below renderThumbnail={entry => {
        const image = images.find(image => image.index === entry.index)!;
        const thumbnail = image.thumb_url || (item.playable ? `/follow-stream?id=${item.id}&media=${entry.index}` : item.thumb_url);
        return thumbnail ? <img src={thumbnail} alt="" referrerPolicy="no-referrer" /> : <span>Vista previa no disponible</span>;
      }} /> : null}
    </div>
  );
}

/* ── Cola ── */

/** ColadentroSinImageneseuno格放en proceso性Imagen形, No放站点Imagen标: 格子en laImagenuno律按Imagen铺满, 48px  favicon
 *  会被拉成Completo格, verarriba去就像este视频缩略Imagen.  */
const NoThumb = ({ kind }: { kind: string }) => (
  <span data-follow-nothumb="" dangerouslySetInnerHTML={{ __html: icon(kind === 'image' ? 'image-off' : 'play') }} />
);

/** 缩略Imagen取No到就撤掉, 同遗Deja层 `data-drop="self"`.  */
function QueueThumb({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
}

function useDragRow(helpers: FollowFeedHelpers) {
  return useCallback((node: HTMLDivElement | null) => { if (node) helpers.wireDrag(node) }, [helpers]);
}

function CollectionQueue({ group, itemId, helpers, actions }: {
  group: FollowGroup; itemId: number; helpers: FollowFeedHelpers; actions: FollowDetailActions;
}) {
  const items = videoItems(group) as FollowDetailItem[];
  const listRef = useDragRow(helpers);
  return (
    <MixQueue kind="collection" data-follow-queue="" title="VideosColección" onClose={actions.close} listRef={listRef}
      summary={`${followTitle(group.primary)} · ${items.length}  video(s)`}>
      {items.map((member) => {
        const duplicate = group.duplicates.includes(member);
        const copy = collectionCopy(group, member, duplicate ? member.provider_label : '');
        /* 另uno站同uno由站点Imagen标报出处, Imagen标 alt 就es站名; 没登记Imagen标站仍写站名.  */
        const siteIcon = duplicate ? sourceIcon(member.provider, member.provider_label) : '';
        return (
          <MixQueueRow key={member.id} current={member.id === itemId} data-follow-queue-item={member.id}
            onClick={() => actions.openItem(member.id)}
            pic={<>
              {member.thumb_url ? <QueueThumb src={member.thumb_url} /> : <NoThumb kind="video" />}
              {realDuration(member.duration) ? <i className="mono" data-mix-item-duration="">{fmtDur(member.duration)}</i> : null}
            </>}>
            <b data-truncate-end="">{copy.title}</b>
            <span data-follow-queue-meta="">
              {siteIcon
                ? <span data-follow-queue-source="" dangerouslySetInnerHTML={{ __html: siteIcon }} />
                : <i data-follow-variant={member.variant_kind || ''}>{copy.label}</i>}
              <time dateTime={member.published_at || ''}>{followWhen(member)}</time>
            </span>
          </MixQueueRow>
        );
      })}
    </MixQueue>
  );
}

/** más媒体Cola: uno帖子en laTodoImageny视频, 按网盘Agrupar. `currentId` es舞arriba正ver着eseuno—
 *  合集改列组dentro挂着网盘Agrupareseuno时, 它 y Cola主人Noes同uno.  */
function MediaQueue({ item, current, currentId = item.id, helpers, actions, onMedia }: {
  item: FollowDetailItem; current: number | null; currentId?: number; helpers: FollowFeedHelpers;
  actions: FollowDetailActions; onMedia(index: number | null): void;
}) {
  const items = item.media_items || [];
  const listRef = useDragRow(helpers);
  const groups: { key: string; label: string; items: FollowDetailMedia[] }[] = [];
  items.forEach((media) => {
    const key = media.resource_group || 'ungrouped';
    let row = groups.find((entry) => entry.key === key);
    if (!row) { row = { key, label: media.resource_group_label || '', items: [] }; groups.push(row) }
    row.items.push(media);
  });
  const pick = (media: FollowDetailMedia) => (item.id === currentId ? onMedia(media.index) : actions.openItem(item.id, media.index));
  return (
    <MixQueue kind="media" data-follow-queue="" title="Multimedia" onClose={actions.close} listRef={listRef}
      summary={`${followTitle(item)} · ${items.length}  medio(s)`}>
      {groups.map((row) => [
        row.label ? <MixGroupLabel key={`label:${row.key}`} label={row.label} count={row.items.length} /> : null,
        ...row.items.map((media) => (
          <MixQueueRow key={media.index} current={media.index === current} data-follow-media-owner={item.id}
            data-follow-media-item={media.index} data-media-kind={media.media_kind || ''} onClick={() => pick(media)}
            pic={media.thumb_url ? <QueueThumb src={media.thumb_url} /> : <NoThumb kind={media.media_kind || ''} />}>
            <b data-middle-truncate="">{mediaName(media)}</b>
            <span data-truncate-end="">{media.media_kind === 'image' ? 'Imágenes' : 'Videos'}</span>
          </MixQueueRow>
        )),
      ])}
    </MixQueue>
  );
}

/* ── 侧栏 ── */

function Side({ item, data, context, media, write, issue, helpers, actions }: {
  item: FollowDetailItem; data: FollowDetailData; context: FollowContext; media: DetailMedia;
  write: DetailWrite; issue: MediaIssue; helpers: FollowFeedHelpers; actions: FollowDetailActions;
}) {
  const { kind, selected, src } = media;
  const single: FollowGroup = { primary: item, variants: [], duplicates: [], has_wip: item.variant_kind === 'wip' };
  const badges = followBadges(single, item);
  const identity = followIdentity(item, authorSources(item, data.sources), context);
  const postedBy = identity.credited ? ''
    : item.author && foldName(item.author) !== foldName(identity.author) ? item.author : '';
  const mediaIssue = followMediaIssue(item, context);
  const tags = detailTags(item, helpers.tagLabel);
  const saved = item.status === 'saved';
  const { busy } = write;
  const busyAttrs = (key: string) => (busy.has(key) ? { 'aria-busy': true, 'aria-disabled': true } as const : {});
  return (
    <div data-stage-side="" data-follow-detail-side="">
      <div data-stage-side-content="">
        <div data-follow-detail-title="">
          <div data-stage-title="" data-follow-detail-name="" data-reveal-line=""
            dangerouslySetInnerHTML={{ __html: followTitleMarks(single, item) + esc(followTitle(item)) }} />
          {item.url ? (
            <a data-follow-origin="" href={item.url} target="_blank" rel="noreferrer noopener"
              title="Abrir página de fuente" aria-label="Abrir página de fuente"
              dangerouslySetInnerHTML={{ __html: EXTERNAL_MARK }} />
          ) : null}
        </div>
        <div className="mono" data-stage-meta="" data-reveal-line="">
          <span>{followWhen(item)}</span>
          {realDuration(item.duration) ? <span>{fmtDur(item.duration)}</span> : null}
          {badges ? <span data-follow-badges="" dangerouslySetInnerHTML={{ __html: badges }} /> : null}
        </div>
        <div data-item-identity="" data-follow-detail-identity="">
          <section data-id-group="creator">
            <h5 data-id-label="">Creador</h5>
            <div data-id-row="">
              {identity.entityName ? <FollowAuthorLink name={identity.entityName} actions={actions}
                data-id-cell="creator" data-entity-kind="creator" data-follow-source-avatar=""
                title={identity.author} aria-label={`ver ${identity.author} 作者página`}>
                <span data-id-face="" dangerouslySetInnerHTML={{ __html: identity.avatar }} />
                <span data-id-name="">{identity.author}</span>
              </FollowAuthorLink> : <span data-id-cell="creator" data-follow-source-avatar="">
                <span data-id-face="" dangerouslySetInnerHTML={{ __html: identity.avatar }} />
                <span data-id-name="">{identity.author}</span>
              </span>}
            </div>
          </section>
          {postedBy || identity.credited ? <div data-follow-detail-credit="">
            {postedBy ? <span>Publicar者 {postedBy}</span> : null}
            {identity.credited ? <span>署名含 {identity.credited}</span> : null}
          </div> : null}
        </div>
        {item.summary ? <Summary key={item.id} text={item.summary} /> : null}
        {mediaIssue ? <p data-follow-media-issue="">{mediaIssue}</p> : null}
        {/* arriba游没给出媒体时, ProxySolo会回unoNo含缘由Fallo. Con缩略Imagen就换arriba缩略ImagenyDescripciónestees缩略Imagen; 
            连缩略Imagen也取No到, 才说"este次没取到, másmedioes限流"—别让人对着uno空画布猜.  */}
        <p data-follow-media-issue="" data-media-load-issue="" hidden={issue !== 'failed'}>
          媒体no取回: arriba游esteuno次Sin返回contenido, másmedioes站点限流, 过uno阵再Abrir. 
        </p>
        <p data-follow-media-issue="" data-media-thumb-fallback="" hidden={issue !== 'thumb'}>
          OriginalImagenno取回, 先显示缩略Imagen: arriba游拦abajoesteuno次Por favor求. 
        </p>
        {item.resource_urls?.length ? (
          <div data-follow-resources="">
            {item.resource_urls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer noopener">
                {resourceLabel(url)}<span className="contents" dangerouslySetInnerHTML={{ __html: EXTERNAL_MARK }} />
              </a>
            ))}
          </div>
        ) : null}
        <div data-stage-actions="" data-follow-detail-actions="">
          <button type="button" data-stage-action="later" data-follow-detail-save="" aria-label={saved ? 'Guardado' : 'Guardar en base de datos'}
            title={saved ? 'Guardado' : 'Guardar en base de datos'} disabled={saved} {...busyAttrs('save')}
            onClick={write.save} dangerouslySetInnerHTML={{ __html: icon(saved ? 'check' : 'bookmark-plus') }} />
          <button type="button" data-stage-action="later" data-follow-detail-want="" aria-pressed={!!write.want}
            aria-label={write.want ? 'Quitar de deseados' : 'Deseado'} title={write.want ? 'Quitar de deseados' : 'Deseado'}
            {...busyAttrs('want')} onClick={write.toggleWant} dangerouslySetInnerHTML={{ __html: icon('star') }} />
          <button type="button" data-stage-action="seen" data-follow-detail-status="seen" aria-label="Marcar como visto" title="Marcar como visto"
            aria-pressed={item.status === 'seen'} {...busyAttrs('seen')} onClick={() => write.status('seen')}
            dangerouslySetInnerHTML={{ __html: icon('eye') }} />
          <button type="button" data-stage-action="dislike" data-follow-detail-status="ignored" aria-label="Ignorar" title="Ignorar"
            aria-pressed={item.status === 'ignored'} {...busyAttrs('ignored')} onClick={() => write.status('ignored')}
            dangerouslySetInnerHTML={{ __html: icon('eye-off') }} />
          {item.status === 'seen' || item.status === 'ignored' ? (
            <button type="button" data-follow-detail-status="new" aria-label="Restaurar no vistos" title="Restaurar no vistos"
              {...busyAttrs('new')} onClick={() => write.status('new')}
              dangerouslySetInnerHTML={{ __html: icon('rotate-ccw') }} />
          ) : null}
          {kind === 'image' && selected ? (
            <button type="button" data-stage-action="dislike" data-follow-media-hide={selected.index} aria-label="Ocultar esta(s) imagen(es)"
              title="Ocultar esta(s) imagen(es)" {...busyAttrs(`hide:${selected.index}`)} onClick={() => write.hide(selected.index)}
              dangerouslySetInnerHTML={{ __html: icon('image-off') }} />
          ) : null}
          {src ? (
            <a data-stage-action-link="" data-follow-download="" href={`${src}${src.includes('?') ? '&' : '?'}download=1`} download=""
              aria-label="Descargar localmente" title="Descargar localmente" dangerouslySetInnerHTML={{ __html: icon('download') }} />
          ) : null}
        </div>
        {/* 被隐藏Imagen退到esteRestaurar带arriba: 缩略Imagen加unoDeshacerClave, 点就回到轮播. No占媒体Cola, 也No进
            角标数—它们ya经es"NoEnver"ese部分.  */}
        {item.hidden_media?.length ? (
          <div data-follow-hidden-media="">
            <span data-follow-hidden-label="">ya隐藏 {item.hidden_media.length} </span>
            <div data-follow-hidden-thumbs="">
              {item.hidden_media.map((hidden) => (
                <button type="button" key={hidden.index} data-follow-media-restore={hidden.index}
                  title={`RestaurarMostrar ${hidden.name || ''}`} aria-label={`RestaurarMostrar ${hidden.name || ''}`}
                  {...busyAttrs(`restore:${hidden.index}`)} onClick={() => write.restore(hidden.index)}>
                  {hidden.thumb_url ? <QueueThumb src={hidden.thumb_url} /> : <Glyph name="image-off" />}
                  <i dangerouslySetInnerHTML={{ __html: icon('rotate-ccw') }} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <span data-follow-state="" aria-live="polite">{write.failure}</span>
        {tags.length ? (
          <div data-stage-tags="" data-follow-detail-tags="">
            {tags.map((tag) => (
              <button type="button" key={tag} data-tag-cat={tagCategory(item, tag)} data-follow-tag={tag}
                onClick={() => actions.openTag(tag)}>{helpers.tagLabel(tag)}</button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** 摘要Predeterminado收Enocho行interior, 量出来确实被截才给"展开"; 展开posterior同unoClave收回.  */
function Summary({ text }: { text: string }) {
  const node = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const box = node.current;
    if (!box || open) return undefined;
    const measure = () => setOverflows(box.scrollHeight > box.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text, open]);
  return (
    <>
      <p ref={node} data-follow-detail-summary="" data-clamped={open ? undefined : ''}>{text}</p>
      {overflows || open ? (
        <Button variant="ghost" size="small" data-follow-summary-toggle="" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Colapsar' : 'Expandir'}
        </Button>
      ) : null}
    </>
  );
}

/* ── 写操作 ──
 * Guardar, Estado, 想要, 隐藏yRestauraresteImagen都En岛dentro发. EstadoyGuardarÉxitoposteriorEn两处缓存dentro换同uno(Detallesestey
 * 关注páginaListadentroeseuno, 卡面Estadouno起变), Nopesado读Lista: 关掉Detalles回ListaNo该再etc.uno网络往返. 
 * 隐藏yRestaurar换掉esCompleto媒体清单, pesado取uno次esteuno, 服务端投影给出Nuevopuede见集合y缩略Imagen.  */
type MediaIssue = '' | 'failed' | 'thumb';
type MediaIssues = { failed(): void; thumbFallback(): void };
type DetailWrite = ReturnType<typeof useDetailWrite>;

function useDetailWrite(item: FollowDetailItem, actions: FollowDetailActions, onMedia: (index: number | null) => void) {
  const id = item.id;
  const key = followItemKey(id);
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());
  const [failure, setFailure] = useState('');
  const mark = (name: string, on: boolean) => setBusy((now) => {
    const next = new Set(now);
    if (on) next.add(name); else next.delete(name);
    return next;
  });
  const apply = (to: string) => {
    queryClient.setQueryData<FollowDetailData>(key, (data) => (data ? { ...data, item: { ...data.item, status: to } } : data));
    setFollowItemStatus(id, to);
  };
  const failed = (error: unknown) => {
    setFailure(requestErrorMessage(error) || 'Operación fallida');
    actions.failure('Actualizar estado de seguimiento', error);
  };
  const statusMutation = useMutation({
    mutationFn: ({ to }: { to: string; was: string }) => apiSend(FOLLOW_STATUS_URL, { item: id, to }),
    onSuccess: (_result, { to, was }) => {
      apply(to);
      setFailure('');
      // 忽略会esteuno从想要dentro撤掉(两者互斥), 想要eseClave要跟着弹起. 
      if (to === 'ignored') void invalidateWants();
      actions.toast(statusReceipt(to), {
        undo: was !== 'saved' ? async () => { await apiSend(FOLLOW_STATUS_URL, { item: id, to: was }); apply(was) } : undefined,
      });
    },
    onError: failed,
    onSettled: (_result, _error, { to }) => mark(to, false),
  });
  const saveMutation = useMutation({
    mutationFn: () => apiSend(FOLLOW_SAVE_URL, { item: id }),
    onSuccess: () => { apply('saved'); setFailure(''); actions.toast('Guardado en la base de datos') },
    onError: failed,
    onSettled: () => mark('save', false),
  });
  const mediaMutation = useMutation({
    mutationFn: async ({ index, hidden }: { index: number; hidden: boolean; next: number | null }) => {
      await apiSend(FOLLOW_MEDIA_HIDE_URL, { item: id, media: index, hidden });
      await queryClient.invalidateQueries({ queryKey: key, exact: true });
    },
    onSuccess: (_result, { hidden, next }) => {
      const data = queryClient.getQueryData<FollowDetailData>(key);
      if (data) replaceFollowItem(data.item);
      onMedia(next);
      setFailure('');
      actions.toast(hidden ? 'YaOcultar esta(s) imagen(es)' : 'YaRestaurarMostrar');
    },
    onError: failed,
    onSettled: (_result, _error, { index, hidden }) => mark(`${hidden ? 'hide' : 'restore'}:${index}`, false),
  });
  /* 想要按Entrada问uno次服务端: 同unoEn关注Gestionar"想要"página签dentroQuitarposterior, esteClave也要弹起.  */
  const wantKey = wantFollowKey(id);
  const wanted = useQuery({ queryKey: wantKey, queryFn: ({ signal }) => fetchFollowWant(id, signal) });
  const want = wanted.data?.want ?? null;
  const wantMutation = useMutation({
    mutationFn: async (current: Want | null) => {
      if (current) await removeWants([current.id]);
      else await addWant({ follow: id });
      return !current;
    },
    onSuccess: (added) => {
      setFailure('');
      actions.toast(added ? 'Añadido a deseados' : 'Quitado de deseados');
      void invalidateWants();
    },
    onError: failed,
    onSettled: () => mark('want', false),
  });
  return {
    busy, failure, want,
    toggleWant: () => { mark('want', true); wantMutation.mutate(want) },
    save: () => { mark('save', true); saveMutation.mutate() },
    status: (to: string) => { mark(to, true); statusMutation.mutate({ to, was: item.status }) },
    hide: (index: number) => {
      const next = (item.media_items || []).find((media) => media.index !== index && media.media_kind === 'image');
      mark(`hide:${index}`, true);
      mediaMutation.mutate({ index, hidden: true, next: next ? next.index : null });
    },
    restore: (index: number) => { mark(`restore:${index}`, true); mediaMutation.mutate({ index, hidden: false, next: index }) },
  };
}
