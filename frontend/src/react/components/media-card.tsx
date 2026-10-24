/* 馆藏en launoObras卡: DirectorioCuadrícula, 资料páginaObras区, 竖屏带yDetallespáginaContinuar viendo都es它. 
 *
 * 形状: Portada格Enarriba, abajo面uno行Avatar, 两行Título, uno行署名yTamaño, 再uno行
 * Etiqueta. Portada格dentroes来源角标, 分卷/Versión计数, Duración, 观verProgreso; Pasar el ratón或Clave盘聚焦时角标淡出, 
 * derechaarriba角uno圈倒计时, derechaabajo角"稍posteriorver", 
 * 停够居en procesotresrápido退, rápido进yAbrirDetalles. 叠层纸边Descripcióneste卡代表No止uno(分卷或版次). 
 *
 * 结构y样钩子Todo用 `data-media-*`, No沿用antiguo类名: antiguo样表No分层, 排Enposterior面, 同名Regla会
 * 落到este卡arriba. 样写En `./media-card.css`. 
 *
 * Portada, AvataryPasar el ratónVista previa取自 `@peach/card-art`, 它们Eneste卡arriba做tres件 React verNo见事, Estado
 * 因此都写成属性而Noes类名(类名归 React 管, pesado画uno次就被冲掉): 
 * - Pasar el ratónVista previa(`wireHover`)往Portada格dentro插 `video.hv`/`img.ui-hvframes`, En卡arriba切
 *   `data-previewing`/`data-longhover`, yEn卡arriba挂 `_stopHover` 让滚动y换página时收掉. 
 * - Portada取景(`coverAnchor`)改esPortada格dentroeseImagen, 所以Imagen以 HTML 片段交给Portada格; 
 *   grandeImagen/pequeñoImagen也EneseImagenarribaOriginal地换, 见 `./art-slot.tsx`. 
 * - Imagen片微光(`PENDING_IMAGES`)En `[data-media-art]` arriba加 `imgwait`/`ui-imgdone`. 
 *
 * 点击分流: más选y修饰Clave优先, 然posterioresAbrir, 实体链continuar, no归属, 
 * Etiqueta, 其余落到Completo卡arriba就esAbrir.  */
import { memo, useCallback, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { cardRatio as layoutRatio } from '@peach/appearance';
import {
  cardArtwork, cardIdentity, entityAvatar, performerLabel, relayoutCovers, releaseHover, wireHover,
} from '@peach/card-art';
import { esc, fmtDur, fmtSize } from '@peach/legacy/core';
import { spinnerHtml } from '@peach/legacy/ui';

import type { MediaCardActions, MediaCardHelpers, MediaCardLayout, MediaItem } from '../catalog-grid/types';
import { ArtSlot } from './art-slot';
import { suppressShiftTextSelection } from './row-click';

/** 竖屏uno律同unoRelación, No按每视频实际anchoalto: 竖屏y竖屏Cuadrícula才altobajouno致.  */
const PORTRAIT_RATIO = 9 / 16;

export type MediaCardVariant = 'grid' | 'short' | 'next' | 'resource';

/** 片名空着时卡片Títuloy读屏名兜底, 资源卡eseuno档es"no命名资源".  */
const UNNAMED = 'Video sin nombre';

/** 雪碧Imagenen launo字形, 写法同遗Deja层 `icon()`: 尺寸y描边由 `./media-card.css` 按Ubicación给.  */
function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><use href={`#i-${name}`} /></svg>;
}

const RESOURCE_LABELS: Record<string, string> = { image: 'Imágenes', audio: 'Audio', archive: 'Archivo comprimido', other: 'Otros archivos' };
const DISPOSAL_LABELS = { manual: 'Manual', junk: 'Basura', duplicate: 'Duplicado', missing: 'Archivo faltante' };

function DisposalReason({ item }: { item: MediaItem }) {
  if (item.disposal !== 'trash') return null;
  const label = (item.disposal_reason && DISPOSAL_LABELS[item.disposal_reason]) || 'Motivo no registrado';
  return <span data-media-disposal-reason="" title={`归入Original因: ${label}`}>{label}</span>;
}

/** 视频y资源共用回收站操作, FalloOriginal因DejaEn卡片arriba供Reintentar.  */
function ResourceAction({ item, actions }: { item: MediaItem; actions: MediaCardActions }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operation = item.disposal === 'trash' ? 'restore' : 'dispose';
  const label = operation === 'restore' ? 'Restaurar' : 'Mover a papelera';
  const run = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    setError('');
    void actions.resourceOperation(item, operation)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Error en la operación, por favor inténtalo de nuevo'))
      .finally(() => setBusy(false));
  };
  return <>
    <button type="button" data-media-resource-action={operation} aria-label={`${label} ${item.name || 'Recurso sin nombre'}`}
      title={label} onClick={run} aria-busy={busy || undefined} aria-disabled={busy || undefined}>
      {busy ? <><span dangerouslySetInnerHTML={{ __html: spinnerHtml(`Procesando${label}`) }} /><span>{`Procesando${label}`}</span></>
        : <span>{label}</span>}
    </button>
    {error ? <span data-media-operation-error="" role="alert">{error}</span> : null}
  </>;
}

/** unoListaen laImagen框etc.alto: 竖屏带uno律竖屏Relación, 其余按版取exterior观应用层eseuno(`@peach/appearance`
 *   `cardRatio`, 骨架读也es它).  */
export function cardRatio(_item: MediaItem, variant: MediaCardVariant, layout: MediaCardLayout): number {
  return variant === 'short' ? PORTRAIT_RATIO : layoutRatio(layout);
}

export interface MediaCardProps {
  item: MediaItem;
  variant: MediaCardVariant;
  layout: MediaCardLayout;
  selected: boolean;
  selectMode: boolean;
  seekSeconds: number;
  helpers: MediaCardHelpers;
  actions: MediaCardActions;
  /** 点este卡Abrir什么. 竖屏带点进InmersivoModo, 回收站en la资源按Tipo分流, 其余AbrirDetalles.  */
  onOpen(item: MediaItem, anchor: HTMLElement): void;
}

/** 署名: Avatar y 名字落到同uno身arriba(`cardIdentity`). 共演Solo写Primero再给Total人数.  */
function identityParts(item: MediaItem): { avatar: ReactNode; who: ReactNode } {
  const { kind, name, coStarred, performers, refs, total } = cardIdentity(item);
  const performer = performers[0] || '';
  const label = performerLabel(item);
  const avatar = coStarred
    ? (
      <div data-media-avatars="">
        {performers.slice(0, 5).map((nm, index) => (
          <button key={`${nm}:${index}`} type="button" data-media-avatar="" data-entity-kind="performer"
            data-entity-name={nm} title={`Abrir página de ${label}: ${nm}`}
            dangerouslySetInnerHTML={{ __html: entityAvatar(nm, refs[index] ?? null, 'performer') }} />
        ))}
      </div>
    )
    : kind
      ? (
        <button type="button" data-media-avatar="" data-entity-kind={kind} data-entity-name={name}
          title={`Abrir página de ${kind === 'performer' ? label : 'detalles'}`}
          dangerouslySetInnerHTML={{
            __html: entityAvatar(name, kind === 'performer' ? refs[0] ?? null : item.creator_entity ?? null, kind),
          }} />
      )
      : <span data-media-avatar="" dangerouslySetInnerHTML={{ __html: entityAvatar(name, null, '') }} />;
  const who = coStarred
    ? (
      <>
        <button type="button" data-media-who="" data-entity-kind="performer" data-entity-name={performer}><Icon name="user-round" /><span>{performer}</span></button>
        <span data-media-who-more="">{`y ${total} más`}</span>
      </>
    )
    : kind
      ? <button type="button" data-media-who="" data-entity-kind={kind} data-entity-name={name}><Icon name="user-round" /><span>{name}</span></button>
      /* Sin署名人ese批es馆藏en launo类, 点得开,  y Actriz名, Sello名uno样.  */
      : <button type="button" data-media-who="" data-open-unowned=""><Icon name="user-round" /><span>{name}</span></button>;
  return { avatar, who };
}

/** Pasar el ratón时derechaarriba角eseuno圈倒计时, 走完就放grande; 点它直continuarAbrir.  */
function PreviewCounter() {
  return (
    <button type="button" data-media-preview="" data-open="" title="Abrir vista previa" aria-label="Abrir vista previa">
      <svg viewBox="-18 -18 36 36" aria-hidden="true"><circle r="17" /><circle r="17" /></svg>
      <svg data-media-ring-play="" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-play" /></svg>
    </button>
  );
}

/** "稍posteriorver"写 ledger, Solo由点击触发; 做完给unoDeshacerClave, Deshacer回来时按钮跟着回去. 
 *  按abajo态先认este卡arriba刚写成Resultado, 没写过就认Entrada本身: 同uno被pesado取之posterior照Nuevo值画.  */
function LaterButton({ item, actions }: { item: MediaItem; actions: MediaCardActions }) {
  const [written, setWritten] = useState<{ id: number; on: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const on = written?.id === item.id ? written.on : !!item.watch_later;
  const click = (event: MouseEvent) => {
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    void actions.watchLater(item, (next) => setWritten({ id: item.id, on: next })).finally(() => setBusy(false));
  };
  return (
    <div data-media-later="">
      <button type="button" data-later="" aria-pressed={on} title="Ver más tarde" aria-label="Ver más tarde" onClick={click}
        aria-busy={busy || undefined} aria-disabled={busy || undefined}>
        <Icon name={on ? 'check' : 'bookmark-plus'} />
      </button>
    </div>
  );
}

/** rápido退, rápido进跳esPasar el ratónVista previaese段视频本身, NoAbrirDetalles.  */
function seekPreview(card: HTMLElement | null, delta: number) {
  const video = card?.querySelector<HTMLVideoElement & { _hop?: ReturnType<typeof setInterval> | null }>('video.hv');
  if (!video || !Number.isFinite(video.duration)) return;
  if (video._hop) { clearInterval(video._hop); video._hop = null }
  video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
}

function VideoCard({ item, variant, layout, selected, selectMode, seekSeconds, helpers, actions, onOpen }: MediaCardProps) {
  const card = useRef<HTMLElement | null>(null);
  const latest = useRef(item);
  latest.current = item;
  /* Pasar el ratónVista previaSolocontinuaruno次: `wireHover` 往卡arriba挂监听, ref 回调换身 React 就会先卸posterior挂, 
     同uno卡arriba会叠出No.dos套. Desinstalar时收掉En curso放Vista previa.  */
  const attach = useCallback((el: HTMLElement | null) => {
    const current = latest.current;
    if (card.current && card.current !== el) releaseHover(card.current);
    card.current = el;
    if (el && (!current.medium || current.medium === 'video')) wireHover(el, current);
  }, []);

  const parts = item.part_group || null;
  const editions = item.edition_group || null;
  const stacked = !!(parts || editions);
  const jav = layout.active && !!item.is_jav;
  const size = jav ? layout.size : 'small';
  const artwork = cardArtwork(item, size, false, layout.javImage);
  const identity = size === 'small' ? artwork.html : cardArtwork(item, 'small', false, layout.javImage).html;
  const rawName = parts?.title || item.name || '';
  const shownName = helpers.displayName(item, rawName).trim() || UNNAMED;
  const titleHtml = helpers.titleHtml(item, rawName).trim() || esc(UNNAMED);
  const shownSize = parts?.total_size ?? item.size;
  const shownDuration = parts?.total_duration ?? item.duration;
  const watched = !parts && Number(item.play_seconds) > 0 && Number(item.duration) > 0
    ? Math.min(Number(item.play_seconds) / Number(item.duration), 1) : 0;
  const { avatar, who } = identityParts(item);
  const tags = (item.follow_tags || item.tags || []).slice(0, 3);
  const flags = [item.feedback === 'dislike' && 'dislike', item.feedback === 'seen' && 'seen',
    item.watch_later && 'later'].filter(Boolean) as string[];

  const click = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const el = card.current;
    if (!el) return;
    if (selectMode || event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      actions.toggleSelection(item.id, event.shiftKey);
      return;
    }
    if (target.closest('[data-open]')) { onOpen(item, el); return }
    const entity = target.closest<HTMLElement>('[data-entity-kind]');
    if (entity && el.contains(entity)) {
      actions.openEntity(entity.dataset.entityKind || '', entity.dataset.entityName || '');
      return;
    }
    const unowned = target.closest('[data-open-unowned]');
    if (unowned && el.contains(unowned)) { actions.openUnowned(); return }
    const tag = target.closest<HTMLElement>('[data-tag]');
    if (tag && el.contains(tag)) { actions.toggleTag(tag.dataset.tag || ''); return }
    onOpen(item, el);
  };

  const pic = (
    <div data-media-pic="" style={{ '--card-ratio': String(cardRatio(item, variant, layout)) } as CSSProperties}>
      {artwork.html
        ? <ArtSlot artwork={artwork} identity={identity} relayout={(root) => relayoutCovers(root, size)} />
        : <span data-media-nopic="">Sin vista previa</span>}
      <div data-media-badge="" dangerouslySetInnerHTML={{ __html: helpers.badgeHtml(item.location || '', item.cost || '') }} />
      <span data-media-check=""><Icon name="check" /></span>
      <span data-media-trash-mark=""><Icon name="trash" /><b>Papelera</b></span>
      {parts && !editions ? <span data-media-group="">{`${Number(parts.count).toLocaleString()} Volumen`}</span> : null}
      {editions
        ? <span data-media-group="" title={editions.editions.join(' · ')}>{`${Number(editions.count).toLocaleString()}  versión(es)`}</span>
        : null}
      <span data-media-duration="">{fmtDur(shownDuration)}</span>
      {!selectMode && item.disposal === 'trash' ? <ResourceAction item={item} actions={actions} /> : null}
      {watched > 0
        ? (
          <div data-media-progress="" role="progressbar" aria-label="Progreso" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={Math.round(watched * 100)}>
            <i style={{ '--media-fill': `${(watched * 100).toFixed(1)}%` } as CSSProperties} />
          </div>
        )
        : item.leave_ratio != null
          ? (
            <div data-media-scrub="">
              <i style={{ '--media-fill': `${Math.round(item.leave_ratio * 100)}%` } as CSSProperties} />
            </div>
          )
          : null}
      <PreviewCounter />
      {!selectMode ? <LaterButton item={item} actions={actions} /> : null}
      {!selectMode ? <div data-media-seek="">
        <button type="button" onClick={(event) => { event.stopPropagation(); seekPreview(card.current, -seekSeconds) }}
          title={`posterior退 ${seekSeconds} segundo(s)`} aria-label={`posterior退 ${seekSeconds} segundo(s)`}><Icon name="rotate-ccw" /></button>
        <button type="button" onClick={(event) => { event.stopPropagation(); seekPreview(card.current, seekSeconds) }}
          title={`anterior进 ${seekSeconds} segundo(s)`} aria-label={`anterior进 ${seekSeconds} segundo(s)`}><Icon name="rotate-cw" /></button>
        <button type="button" data-open="" title="Abrir detalles" aria-label="Abrir detalles"><Icon name="expand" /></button>
      </div> : null}
    </div>
  );

  return (
    <article ref={attach} data-media-card="" data-id={item.id} data-variant={variant}
      data-jav-item={item.is_jav ? '' : undefined}
      data-part-seed={parts ? parts.seed_id : undefined} data-stacked={stacked ? '' : undefined}
      data-pending-delete={item.disposal === 'trash' ? '' : undefined} data-selected={selected ? '' : undefined}
      onClick={click} onMouseDown={suppressShiftTextSelection}>
      <button type="button" data-media-open="" data-open=""
        aria-label={`Abrir ${shownName}${editions ? 'Versión' : parts ? 'Volumen' : 'Detalles'}`} />
      {stacked ? <div data-media-stack="">{pic}</div> : pic}
      <div data-media-meta="">
        {avatar}
        <div data-media-text="">
          <button type="button" data-media-title="" data-open=""
            dangerouslySetInnerHTML={item.disposal === 'trash' ? undefined : { __html: titleHtml }}>
            {item.disposal === 'trash' ? <span data-media-title-text="" dangerouslySetInnerHTML={{ __html: titleHtml }} /> : null}
          </button>
          <div data-media-byline="">
            {who}
            {item.why ? <span data-media-why="">{item.why}</span> : null}
            {item.is_jav && item.release_date ? <time data-media-release="" dateTime={item.release_date}><Icon name="calendar" />{item.release_date}</time> : null}
            <span data-media-size=""><Icon name="hard-drive" />{Number(shownSize) > 0 ? fmtSize(Number(shownSize)) : 'Tamaño desconocido'}</span>
            {item.play_count ? <span data-media-watch-count="">{`Visto ${item.play_count} veces`}</span> : null}
            <span data-media-flags="">{flags.map((flag) => <i key={flag} data-flag={flag} />)}</span>
          </div>
          {tags.length || item.disposal === 'trash'
            ? (
              <div data-media-tags="">
                {tags.map((tag) => (
                  <button key={tag} type="button" data-media-tag="" disabled={!!item.follow_item_id}
                    data-tag={item.follow_item_id ? undefined : tag}>{helpers.tagLabel(tag)}</button>
                ))}
              </div>
            )
            : null}
          <DisposalReason item={item} />
        </div>
      </div>
    </article>
  );
}

/** 回收站dentroNoes视频ese些: Imagen片, 音频, Comprimir包 y 网址rápido捷Método. 卡arribaSoloConuno"还Original"或
 *  "移入回收站", 点就写 ledger, 做完给unoDeshacerClave.  */
function ResourceCard({ item, selected, selectMode, helpers, actions, onOpen }: MediaCardProps) {
  const card = useRef<HTMLElement | null>(null);
  const image = item.medium === 'image' && item.location !== 'online';
  const name = String(item.name || '');
  const label = name.toLowerCase().endsWith('.url') ? 'Acceso directo URL' : RESOURCE_LABELS[item.medium || ''] || 'Otros archivos';
  const glyph = image ? 'pics' : label === 'Acceso directo URL' ? 'globe' : 'hard-drive';
  const click = (event: MouseEvent<HTMLElement>) => {
    if (!card.current) return;
    if (selectMode || event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      actions.toggleSelection(item.id, event.shiftKey);
      return;
    }
    onOpen(item, card.current);
  };
  return (
    <article ref={card} data-media-card="" data-id={item.id} data-variant="resource" data-medium={item.medium || 'other'}
      data-pending-delete={item.disposal === 'trash' ? '' : undefined} data-selected={selected ? '' : undefined}
      onClick={click} onMouseDown={suppressShiftTextSelection}>
      <div data-media-pic="" style={{ '--card-ratio': String(16 / 9) } as CSSProperties}>
        <span data-media-glyph=""><Icon name={glyph} /><b>{label}</b></span>
        {image
          ? <span data-media-art="thumb" dangerouslySetInnerHTML={{
            __html: `<img class="poster" src="/photo-thumb?id=${item.id}" width="640" height="360" alt="" loading="lazy" data-drop="self">`,
          }} />
          : null}
        <div data-media-badge="" dangerouslySetInnerHTML={{ __html: helpers.badgeHtml(item.location || '', item.cost || '') }} />
        <span data-media-check=""><Icon name="check" /></span>
        <span data-media-trash-mark=""><Icon name="trash" /><b>Papelera</b></span>
        {!selectMode ? <ResourceAction item={item} actions={actions} /> : null}
      </div>
      <div data-media-meta="">
        <span data-media-avatar="" data-media-kind-glyph="" aria-hidden="true"><Icon name={glyph} /></span>
        <div data-media-text="">
          <span data-media-title="" data-middle-truncate="" title={name}
            dangerouslySetInnerHTML={{ __html: esc(name || 'Recurso sin nombre') }} />
          <div data-media-byline="">
            <span data-media-who="">{label}</span>
            {item.why ? <span data-media-why="">{item.why}</span> : null}
            <span data-media-size="">{Number(item.size) > 0 ? fmtSize(Number(item.size)) : 'Tamaño desconocido'}</span>
          </div>
          {item.disposal === 'trash' ? <div data-media-tags="" /> : null}
          <DisposalReason item={item} />
        </div>
      </div>
    </article>
  );
}

function MediaCardView(props: MediaCardProps) {
  if (props.variant === 'resource') return <ResourceCard {...props} />;
  return <VideoCard {...props} />;
}

/** uno屏几diezarribacien, Seleccionary版之exteriorpesado画No该连带每uno: 比较都es引用, 壳递进来
 *  助手y动作身No变.  */
export const MediaCard = memo(MediaCardView);
