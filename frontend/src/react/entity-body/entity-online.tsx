/* 创作者资料páginaEn线视Imagen(ADR-0096): 关注dentro绑Eneste名abajo, 还没入BibliotecaActualizar, 卡片y照片Muro就es关注páginaeseuno. 
 *
 * 取数yFiltrar(Estado, 来源, Etiqueta, Ordenar, 视频/Imagen片)归资料página(`entity-page-view.tsx`), Filtrar浮层yesteuno格
 * 读es同uno; aquíSolo画当anterior媒体eseuno档组. ConsultaClave同关注páginauno族: Detallesdentro换Estado, VerificarActualizar跑完时按
 * `['follow-feed']` anterior缀Inválidoy改写缓存, esteuno屏跟着变. 换Filtrar时资料página按ConsultaClave给esteuno格换Clave, 骨架从头铺.  */
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { requestErrorMessage } from '@peach/legacy/core';
import { emptyStateHtml } from '@peach/legacy/ui';

import { LoadMore } from '../catalog-grid/catalog-grid-page';
import { RetryNote, useSkeletonReveal } from '../components/grid-reveal';
import { FollowCard } from '../follow-feed/follow-card';
import {
  itemForMedia, type FollowContext, type FollowFeedActions, type FollowFeedHelpers, type FollowGroup, type FollowMedia,
  type FollowPage, type FollowSource, type FollowView,
} from '../follow-feed/follow-feed';
import { useFollowWrite } from '../follow-feed/follow-feed-page';
import type { PhotoLayout, PhotoSize } from './entity-body';

export interface EntityOnlineProps {
  view: FollowView;
  media: FollowMedia;
  result: UseInfiniteQueryResult<InfiniteData<FollowPage>>;
  /** 合ybien几página, yesteuno档媒体dentropuede见组.  */
  data: FollowPage | null;
  visible: readonly FollowGroup[];
  context: FollowContext;
  photoSize: PhotoSize;
  photoLayout: PhotoLayout;
  imagesOnly: boolean;
  helpers: FollowFeedHelpers;
  actions: FollowFeedActions;
  canLoadMore?: () => boolean;
}

export function EntityOnline(props: EntityOnlineProps) {
  const { result, data, media, helpers } = props;
  /* 换Filtrar时先借着AnteriorDatos(`keepPreviousData`), eseunoNo能当esteuno画出来.  */
  const pending = result.isPending || result.isPlaceholderData;
  const reveal = useSkeletonReveal(pending, () => helpers.listSkeletonHtml(media));
  if (!data && result.isError) {
    return <RetryNote message={requestErrorMessage(result.error)} onRetry={() => { void result.refetch() }} />;
  }
  return (
    <div data-follow-list-body="" data-entity-online="" data-grid-reveal={reveal.fading ? '' : undefined}>
      {reveal.layer}
      {pending || !data ? null : <Cards {...props} data={data} />}
      {!pending && data?.has_more ? (
        <LoadMore key={result.data?.pages.length} entity enabled={() => props.canLoadMore?.() !== false}
          load={async () => { await result.fetchNextPage({ throwOnError: true }) }} />
      ) : null}
    </div>
  );
}

function Cards({ view, media, data, visible, context, photoSize, photoLayout, imagesOnly, actions }:
  EntityOnlineProps & { data: FollowPage }) {
  const write = useFollowWrite({ view, revision: 0, actions });
  const sources = useMemo(() => {
    const byId = new Map((data.sources || []).map((source) => [source.id, source]));
    const byAuthor = new Map<string, FollowSource[]>();
    (data.sources || []).forEach((source) => {
      if (!source.author_key) return;
      if (!byAuthor.has(source.author_key)) byAuthor.set(source.author_key, []);
      byAuthor.get(source.author_key)!.push(source);
    });
    return { byId, byAuthor };
  }, [data.sources]);
  const images = media === 'images';
  const wall = images ? { 'data-size': photoSize, 'data-layout': photoLayout, 'data-images-only': String(imagesOnly) } : {};
  const body = visible.length ? visible.map((group) => {
    const id = itemForMedia(group, media).id;
    const authorKey = sources.byId.get(group.primary?.source_id as number)?.author_key;
    return (
      <FollowCard key={`${group.primary.id}:${media}`} group={group}
        authorSources={(authorKey && sources.byAuthor.get(authorKey)) || []} media={media} context={context}
        selected={false} selectMode={false} busy={write.busy.get(id) || ''} failure={write.failures.get(id) || ''}
        actions={actions} onStatus={write.status} onSave={write.save} />
    );
  }) : <Empty searched={!!(data.groups || []).length || !!(view.status || view.provider || view.tags.length)} />;
  return <div data-follow-list="" data-follow-wall={images ? '' : undefined} {...wall}>{body}</div>;
}

function Empty({ searched }: { searched: boolean }) {
  const html = searched
    ? emptyStateHtml('search-x', 'No hay actualizaciones con el filtro actual', 'Intenta cambiando el tipo de medio, estado, fuente o etiqueta.')
    : emptyStateHtml('rss', 'No se han encontrado actualizaciones todavía', 'Después de verificar actualizaciones, el nuevo contenido del creador aparecerá aquí.');
  return <div data-follow-empty="" className="contents" dangerouslySetInnerHTML={{ __html: html }} />;
}
