/* 关注páginauno卡: unoObras, 本站 alt y WIP, 跨站另见都折Endentro面. 
 *
 * 形状同馆藏Obras卡(`../components/media-card.tsx`): Portada格Enarriba, abajo面uno行Avatar, 两行Título, uno行署名
 * yTiempo, 再往abajoesEtiqueta y "媒体no取得". Portada格izquierdaarribaes来源y另见角标, derechaabajoesDuración, derechaarribaes合y
 * 计数; Guardar, yaver, 忽略几圆ClavePasar el ratón或Clave盘聚焦时出现En计数eseUbicación, 计数淡出, 触屏arriba常驻y排En计数abajo面. 
 *
 * 结构y样钩子沿用Obras卡 `data-media-*`(几何, Pasar el ratón面, 选en proceso描边, 勾选圆都En
 * `../components/media-card.css`), 关注卡自己más出来几格用 `data-follow-*`, 写En
 * `./follow-feed.css`. TítuloanteriorVersión字样, 另见徽章, Avatar圆框y来源Imagen标es `./follow-marks.ts` 拼
 * HTML 串, 类名沿用遗Deja样表, Detallesdentro用es同uno, esteuno格 React No拥Condentro面节点. 
 *
 * uno叠(`isMix`)Pasar el ratón时逐翻过组dentro彼此No同Imagen, 时序y门槛同 Mix 卡(`../components/use-stack-flip.ts`). 
 * 翻es卡片渲染时就En手en la缩略Imagen, Pasar el ratónNoComo动画再发Por favor求; No.unoes静止Portada本身.  */
import { memo, useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type MouseEvent } from 'react';
import { esc, fmtDur, icon, entityPath } from '@peach/legacy/core';
import { tagLabel } from '@peach/legacy/tags';

import { suppressShiftTextSelection } from '../components/row-click';
import { MIX_FLIP_FACES, useStackFlip } from '../components/use-stack-flip';
import {
  followStack, itemForMedia, videoItems, type FollowContext, type FollowFeedActions,
  type FollowGroup, type FollowMedia, type FollowSource,
} from './follow-feed';
import {
  followBadges, followCompactWhen, followIdentity, followMediaIssue, followTitle, followTitleMarks, followWhen,
  learnFollowDims, sourceMark,
} from './follow-marks';

/** DuraciónSoloEnes真Duración时写: 来源没给, 给 0 或给uno明显es占数, 都No出esteuno格.  */
const realDuration = (value: unknown) => Number(value) > 0;

export function FollowAuthorLink({ name, actions, children, ...attrs }: {
  name: string; actions: Pick<FollowFeedActions, 'openAuthor'>;
} & Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'onClick'>) {
  return <a {...attrs} href={entityPath('creator', name)} onClick={(event) => {
    event.stopPropagation();
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    actions.openAuthor(name);
  }}>{children}</a>;
}

export interface FollowCardProps {
  variant?: 'grid' | 'next';
  retryKey?: number;
  group: FollowGroup;
  /** este卡创作者名abajoese几来源: Avatary署名读它.  */
  authorSources: readonly FollowSource[];
  media: FollowMedia;
  context: FollowContext;
  selected: boolean;
  selectMode: boolean;
  /** este卡En curso写eseunoabajo(Estado或Guardar),  y 写Fallo时DejaEn卡en laeseuno句.  */
  busy: string;
  failure: string;
  actions: Pick<FollowFeedActions, 'openDetail' | 'openAuthor' | 'canFlip'> & Partial<Pick<FollowFeedActions, 'toggleSelection'>>;
  onStatus?(id: number, to: string): void;
  onSave?(id: number): void;
}

/** 卡面SinImagen时eseuno格: 来源站标居en proceso,  y 本来就没给缩略Imagen卡同uno样子.  */
const NoThumb = ({ provider }: { provider: string }) => (
  <span data-follow-nothumb="" dangerouslySetInnerHTML={{ __html: sourceMark(provider) }} />
);

/** 卡面Imagen片Fallo时尝试OriginalImagenProxy; DatosActualizar时允许FalloImagen片pesadoNuevo取Imagen.  */
function Thumb({ src, fallback, width, height, provider, onLearn, retryKey }: {
  src: string; fallback?: string; width?: number; height?: number; provider: string;
  retryKey?: number;
  onLearn?: (width: number, height: number) => void;
}) {
  const [broken, setBroken] = useState(false);
  const [proxied, setProxied] = useState(false);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => { setBroken(false) }, [retryKey]);
  if (broken) return <NoThumb provider={provider} />;
  return (
    <img src={proxied ? fallback : src} alt="" loading="lazy" referrerPolicy="no-referrer"
      width={width || natural?.width} height={height || natural?.height}
      onError={() => {
        if (fallback && fallback !== src && !proxied) setProxied(true);
        else setBroken(true);
      }}
      onLoad={onLearn ? (event) => {
        const image = event.currentTarget;
        if (image.naturalWidth && image.naturalHeight) {
          setNatural({ width: image.naturalWidth, height: image.naturalHeight });
          onLearn(image.naturalWidth, image.naturalHeight);
        }
      } : undefined} />
  );
}

function FollowCardView(props: FollowCardProps) {
  const { group, authorSources, media, context, selected, selectMode, busy, failure, actions } = props;
  const item = itemForMedia(group, media);
  const imageView = media === 'images';
  const selectedMedia = imageView ? (item.media_items || []).find((entry) => entry.media_kind === 'image') : undefined;
  const thumbUrl = selectedMedia?.thumb_url || item.thumb_url || '';
  const imageFallback = imageView && item.playable
    ? `/follow-stream?id=${item.id}${selectedMedia ? `&media=${selectedMedia.index}` : ''}`
    : undefined;
  /* width/height 让Explorar dispositivoEnImagen片Llegaranterior按固ConRelación占; Imagen片视Imagen补齐尺寸, 视频卡片No回写. 
     Relación取卡面arribaesteImagen自己: 卡面es媒体清单dentroese就落Enesearriba; 
     卡面就esEntrada自己缩略Imagen时落EnEntradaarriba. 都Sin就NoGrave猜, 走Sin尺寸占ese套, yEnesteImagenCargar完posterior
     使用固Con尺寸y回写给它主人.  */
  const cardMedia = selectedMedia && selectedMedia.thumb_url === thumbUrl ? selectedMedia : null;
  const itemOwnsCard = !cardMedia || thumbUrl === item.thumb_url;
  const sized = imageView
    ? [cardMedia, itemOwnsCard ? item : null].find((owner) => Number(owner?.width) > 0 && Number(owner?.height) > 0)
    : null;
  const learn = imageView && !sized && thumbUrl
    ? (width: number, height: number) => learnFollowDims(item.id, cardMedia ? cardMedia.index : null, width, height)
    : undefined;
  const videos = media === 'videos' ? videoItems(group) : [];
  const embedded = item.media_items || [];
  const mixTarget = embedded.length > 1 ? item.id : (videos[0]?.id || item.id);
  /* 角标y翻卡都取服务端对Completo组判定(`group.stack`): 同unoImagenSolo翻uno次, 跨站Repetir算来源.  */
  const stack = followStack({
    cover: thumbUrl, coverFace: (selectedMedia?.thumb_url ? selectedMedia : item).face, stack: group.stack,
    imageView, limit: MIX_FLIP_FACES,
  });
  const faces = useRef(stack.faces);
  faces.current = stack.faces;
  const flip = useStackFlip({
    load: async () => faces.current, canFlip: () => faces.current.length > 1 && actions.canFlip(),
    referrerPolicy: 'no-referrer',
  });
  /* 壳En滚动, 换página y 开más选时按 `_stopHover` 收掉uno切Pasar el ratón动效, este卡翻página也En其en proceso.  */
  const stop = useRef(flip.onPointerLeave);
  stop.current = flip.onPointerLeave;
  const attach = useCallback((el: (HTMLElement & { _stopHover?: () => void }) | null) => {
    if (el) el._stopHover = () => stop.current();
  }, []);

  const identity = followIdentity(item, authorSources, context);
  const title = followTitle(item);
  const picProvider = item.resource_provider || item.provider;
  const tags = (item.tags || []).slice(0, 3);
  const issue = followMediaIssue(item, context);
  const badges = followBadges(group, item);
  const saved = item.status === 'saved';

  const click = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    /* EtiquetaEneste卡arribaSoloes读, 点它什么都No做, más选dentro也No算点este卡.  */
    if (target.closest('[data-media-tag]')) return;
    if (actions.toggleSelection && (selectMode || event.shiftKey || event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      actions.toggleSelection(item.id, event.shiftKey);
      return;
    }
    actions.openDetail(item.id);
  };
  const act = (event: MouseEvent, run: () => void) => { event.stopPropagation(); run() };

  return (
    <article ref={attach} data-media-card="" data-variant={props.variant || 'grid'} data-follow-item={item.id} data-status={item.status}
      data-follow-image={imageView ? '' : undefined} data-collection={stack.isMix ? '' : undefined}
      data-selected={selected ? '' : undefined} onClick={click} onMouseDown={suppressShiftTextSelection}
      onMouseEnter={flip.onPointerEnter} onMouseLeave={flip.onPointerLeave}>
      <div data-follow-visual="" data-mix-stack={stack.isMix ? '' : undefined}>
        <button type="button" data-follow-open="" aria-label={`Abrir ${title} Detalles`} />
        <div data-media-pic="">
          {thumbUrl
            ? <Thumb key={thumbUrl} src={thumbUrl} fallback={imageFallback} width={sized?.width} height={sized?.height}
                provider={picProvider} onLearn={learn} retryKey={props.retryKey} />
            : <NoThumb provider={picProvider} />}
          {stack.faces.length > 1 ? (
            <div data-mix-faces="" hidden={!flip.faces.length}>
              {flip.faces.map((src, index) => (
                <div key={src} data-mix-face={index === flip.current ? 'on' : index === flip.leaving ? 'off' : ''}>
                  <img src={src} alt="" loading="eager" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          ) : null}
          <div data-follow-sources="">
            <span data-media-badge="" title={item.provider_label || item.provider}
              aria-label={`Fuente: ${item.provider_label || item.provider}`}
              dangerouslySetInnerHTML={{ __html: sourceMark(item.provider, item.provider_label) }} />
            {badges ? <span data-follow-badges="" dangerouslySetInnerHTML={{ __html: badges }} /> : null}
          </div>
          {actions.toggleSelection ? <span data-media-check="" onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            actions.toggleSelection?.(item.id, event.shiftKey);
          }} dangerouslySetInnerHTML={{ __html: icon('check') }} /> : null}
          {realDuration(item.duration) ? <span data-media-duration="">{fmtDur(item.duration)}</span> : null}
          {!selectMode ? <div data-follow-corner="">
            {stack.isMix ? (
              <button type="button" data-follow-collection={mixTarget}
                onClick={(event) => act(event, () => actions.openDetail(mixTarget))}>
                <span className="contents" dangerouslySetInnerHTML={{ __html: icon(stack.glyph) }} />{stack.label}
              </button>
            ) : null}
            {props.variant !== 'next' ? <div data-follow-actions="">
              <button type="button" data-follow-save={item.id} title={saved ? 'Guardado' : 'Guardar en base de datos'}
                aria-label={saved ? 'Guardado' : 'Guardar en base de datos'} disabled={saved}
                aria-busy={busy === 'save' || undefined} aria-disabled={busy === 'save' || undefined}
                onClick={(event) => act(event, () => props.onSave?.(item.id))}
                dangerouslySetInnerHTML={{ __html: icon(saved ? 'check' : 'bookmark-plus') }} />
              <button type="button" data-follow-status={item.id} data-to="seen" title="Marcar como visto" aria-label="Marcar como visto"
                disabled={item.status === 'seen'} aria-busy={busy === 'seen' || undefined}
                aria-disabled={busy === 'seen' || undefined}
                onClick={(event) => act(event, () => props.onStatus?.(item.id, 'seen'))}
                dangerouslySetInnerHTML={{ __html: icon('eye') }} />
              <button type="button" data-follow-status={item.id} data-to="ignored" title="Ignorar" aria-label="Ignorar"
                disabled={item.status === 'ignored'} aria-busy={busy === 'ignored' || undefined}
                aria-disabled={busy === 'ignored' || undefined}
                onClick={(event) => act(event, () => props.onStatus?.(item.id, 'ignored'))}
                dangerouslySetInnerHTML={{ __html: icon('eye-off') }} />
              {item.status === 'seen' || item.status === 'ignored' ? (
                <button type="button" data-follow-status={item.id} data-to="new" title="Restaurar no vistos" aria-label="Restaurar no vistos"
                  aria-busy={busy === 'new' || undefined} aria-disabled={busy === 'new' || undefined}
                  onClick={(event) => act(event, () => props.onStatus?.(item.id, 'new'))}
                  dangerouslySetInnerHTML={{ __html: icon('rotate-ccw') }} />
              ) : null}
            </div> : null}
          </div> : null}
        </div>
      </div>
      <div data-media-meta="">
        {identity.entityName ? (
          <FollowAuthorLink name={identity.entityName} actions={actions} data-media-avatar="" data-follow-avatar=""
            aria-label={`ver ${identity.author} 作者página`} dangerouslySetInnerHTML={{ __html: identity.avatar }} />
        ) : <span data-media-avatar="" data-follow-avatar="" title="CreadorAvatar"
          dangerouslySetInnerHTML={{ __html: identity.avatar }} />}
        <div data-media-text="">
          <button type="button" data-media-title=""
            dangerouslySetInnerHTML={{ __html: followTitleMarks(group, item) + esc(title) }} />
          <div data-follow-byline="">
            {identity.entityName ? (
              <FollowAuthorLink name={identity.entityName} actions={actions} data-follow-author="" title={identity.author}>
                {identity.author}
              </FollowAuthorLink>
            ) : <span data-follow-author="" title={identity.author}>{identity.author}</span>}
            <time dateTime={item.published_at || ''} title={followWhen(item)}>{followCompactWhen(item)}</time>
            {identity.credited ? <span data-follow-credit="" title={`署名含 ${identity.credited}`}>{`署名含 ${identity.credited}`}</span> : null}
          </div>
          {issue ? <span data-follow-issue="">{issue}</span> : null}
        </div>
        <div data-media-tags="" data-follow-labels="">
          {tags.map((tag) => (
            <span key={tag} data-media-tag="" data-tag-cat={`r34-${item.tag_types?.[tag] || 'unknown'}`}
              data-follow-tag={tag}>
              {tagLabel(tag)}
            </span>
          ))}
        </div>
      </div>
      <span data-follow-state="" aria-live="polite">{failure}</span>
    </article>
  );
}

/** uno屏几cien, Seleccionary写操作之exteriorpesado画No该连带每uno: 比较都es引用, 壳递进来助手y动作身No变.  */
export const FollowCard = memo(FollowCardView);
